"use strict";

// -----------------------------------------------------------------------------
// CONFIG
// -----------------------------------------------------------------------------

// Path to your JSON file (same folder as index.html)
const JSON_URL = "mess-menu-dec-2025.json";

// Order of days and meals for consistent UI
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// Meals in your JSON are uppercase: BREAKFAST, LUNCH, SNACKS, DINNER
const MEAL_ORDER = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"];

// -----------------------------------------------------------------------------
// STATE
// -----------------------------------------------------------------------------

// { Day: { Meal: { time: string, items: string[] } } }
let menuData = {};
let availableDays = [];
let activeDay = null;

// -----------------------------------------------------------------------------
// DOM REFERENCES
// -----------------------------------------------------------------------------

const dayButtonsContainer = document.getElementById("dayButtonsContainer");
const dayEmptyState = document.getElementById("dayEmptyState");
const mealsTitle = document.getElementById("mealsTitle");
const mealsSubtitle = document.getElementById("mealsSubtitle");
const mealsGrid = document.getElementById("mealsGrid");
const mealsEmptyState = document.getElementById("mealsEmptyState");
const mealsError = document.getElementById("mealsError");
const currentDayLabel = document.getElementById("currentDayLabel");
const dataStatusText = document.getElementById("dataStatusText");
const lastUpdatedBadge = document.getElementById("lastUpdatedBadge");
const todayBadge = document.getElementById("todayBadge");
const todayText = document.getElementById("todayText");

// -----------------------------------------------------------------------------
// BOOTSTRAP
// -----------------------------------------------------------------------------

window.addEventListener("DOMContentLoaded", () => {
  currentDayLabel.textContent = getTodayName();

  if (!JSON_URL) {
    showError("No JSON_URL configured.");
    return;
  }

  dataStatusText.textContent = "Loading menu from JSON…";
  loadMenuFromJson(JSON_URL);
});

// -----------------------------------------------------------------------------
// LOAD FROM JSON
// -----------------------------------------------------------------------------

function loadMenuFromJson(url) {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      if (!data || typeof data !== "object") {
        throw new Error("Invalid JSON structure");
      }
      menuData = data;
      availableDays = Object.keys(menuData || {});
      updateUIAfterLoad(url);
    })
    .catch((err) => {
      console.error(err);
      showError("Could not load menu JSON from " + url + ".");
    });
}

// -----------------------------------------------------------------------------
// UI UPDATE AFTER LOAD
// -----------------------------------------------------------------------------

function updateUIAfterLoad(label) {
  if (!availableDays.length) {
    showError("Menu JSON loaded, but no days were found.");
    return;
  }

  renderDayButtons();

  // Select today's day if available, otherwise the first day in order
  activeDay = chooseInitialActiveDay();
  renderMealsForActiveDay();

  dataStatusText.textContent = "Loaded: " + label;

  const now = new Date();
  lastUpdatedBadge.textContent =
    "Updated: " +
    now.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

  dayEmptyState.style.display = "none";
  mealsEmptyState.style.display = "none";
}

function showError(message) {
  mealsError.textContent = message;
  mealsError.style.display = "block";
  mealsTitle.textContent = "Could not load menu";
  mealsSubtitle.textContent =
    "Ensure mess-menu-dec-2025.json is present and follows the expected structure.";
  dataStatusText.textContent = "Error loading data";

  mealsGrid.innerHTML = "";
  if (dayButtonsContainer) dayButtonsContainer.innerHTML = "";
  currentDayLabel.textContent = getTodayName();
  dayEmptyState.style.display = "flex";
  mealsEmptyState.style.display = "flex";
  todayBadge.style.display = "none";
}

// -----------------------------------------------------------------------------
// DAY BUTTONS + TODAY HIGHLIGHT
// -----------------------------------------------------------------------------

function renderDayButtons() {
  if (!dayButtonsContainer) return;

  dayButtonsContainer.innerHTML = "";

  const orderedDays = [...availableDays].sort((a, b) => {
    const ia = DAY_ORDER.indexOf(a);
    const ib = DAY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const todayName = getTodayName();
  const hasToday = availableDays.includes(todayName);

  if (hasToday) {
    todayBadge.style.display = "inline-flex";
    todayText.textContent = "Today: " + todayName;
  } else {
    todayBadge.style.display = "none";
  }

  orderedDays.forEach((day) => {
    const btn = document.createElement("button");
    btn.className = "day-btn";
    btn.dataset.day = day;

    const main = document.createElement("div");
    main.className = "day-btn-main";
    main.textContent = day;

    const sub = document.createElement("div");
    sub.className = "day-btn-sub";
    sub.textContent = day === todayName ? "Today" : "Tap to view menu";

    btn.appendChild(main);
    btn.appendChild(sub);

    btn.addEventListener("click", () => {
      activeDay = day;
      renderMealsForActiveDay();
    });

    dayButtonsContainer.appendChild(btn);
  });
}

function chooseInitialActiveDay() {
  const todayName = getTodayName();
  if (availableDays.includes(todayName)) {
    return todayName;
  }

  const orderedAvailable = [...availableDays].sort((a, b) => {
    const ia = DAY_ORDER.indexOf(a);
    const ib = DAY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return orderedAvailable[0];
}

// -----------------------------------------------------------------------------
// RENDER MEALS FOR ACTIVE DAY
// -----------------------------------------------------------------------------

function renderMealsForActiveDay() {
  if (!activeDay || !menuData[activeDay]) {
    mealsTitle.textContent = "No day selected";
    mealsSubtitle.textContent = "Pick a day from the left panel.";
    mealsGrid.innerHTML = "";
    mealsEmptyState.style.display = "flex";
    currentDayLabel.textContent = getTodayName();
    setActiveDayButton(null);
    return;
  }

  mealsTitle.textContent = activeDay + " Menu";
  mealsSubtitle.textContent = "Complete meal plan for " + activeDay + ".";

  const todayName = getTodayName();
  currentDayLabel.textContent = todayName;

  mealsGrid.innerHTML = "";
  mealsError.style.display = "none";
  mealsEmptyState.style.display = "none";

  const mealsForDay = menuData[activeDay];
  const mealTypes = Object.keys(mealsForDay || {});

  const orderedMeals = [...mealTypes].sort((a, b) => {
    const ia = MEAL_ORDER.indexOf(a);
    const ib = MEAL_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  orderedMeals.forEach((mealType) => {
    const entry = mealsForDay[mealType];
    if (!entry) return;

    const card = document.createElement("div");
    card.className = "meal-card";

    const headerLine = document.createElement("div");
    headerLine.className = "meal-header-line";

    const name = document.createElement("div");
    name.className = "meal-name";
    name.textContent = formatMealName(mealType);

    const tag = document.createElement("div");
    tag.className = "meal-tag";
    tag.textContent = entry.time ? entry.time : "Time: N/A";

    headerLine.appendChild(name);
    headerLine.appendChild(tag);
    card.appendChild(headerLine);

    // const time = document.createElement("div");
    // time.className = "meal-time";
    // time.textContent = entry.time
    //   ? "Serving time: " + entry.time
    //   : "Serving time not specified.";

    // card.appendChild(time);

    const itemsContainer = document.createElement("div");
    itemsContainer.className = "meal-items";

    if (Array.isArray(entry.items) && entry.items.length) {
      entry.items.forEach((itemText) => {
        const span = document.createElement("span");
        span.textContent = itemText;
        itemsContainer.appendChild(span);
      });
    } else {
      itemsContainer.textContent = "No items listed for this meal.";
    }

    card.appendChild(itemsContainer);
    mealsGrid.appendChild(card);
  });

  setActiveDayButton(activeDay);
}

function setActiveDayButton(dayName) {
  if (!dayButtonsContainer) return;
  const buttons = dayButtonsContainer.querySelectorAll(".day-btn");
  buttons.forEach((btn) => {
    if (btn.dataset.day === dayName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// -----------------------------------------------------------------------------
// UTIL
// -----------------------------------------------------------------------------

function getTodayName() {
  const jsDay = new Date().getDay(); // 0 = Sunday
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[jsDay];
}

function formatMealName(mealType) {
  // Convert "BREAKFAST" -> "Breakfast", "SPECIAL LUNCH" -> "Special Lunch"
  return String(mealType)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}