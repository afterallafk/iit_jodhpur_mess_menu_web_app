"use strict";

/* ---------------------------------------------------------
   CONFIG
---------------------------------------------------------- */
const MENU_CONFIG = {
  veg: { label: "Veg Mess", file: "mess-menu-dec-veg.json" },
  nonveg: { label: "Non-Veg Mess", file: "mess-menu-dec-nonveg.json" }
};

let currentMessKey = "veg";

const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MEAL_ORDER = ["BREAKFAST","LUNCH","SNACKS","DINNER"];

let menuData = {};
let availableDays = [];
let activeDay = null;

/* ---------------------------------------------------------
   DOM
---------------------------------------------------------- */
const dayButtonsContainer = document.getElementById("dayButtonsContainer");
const mealsGrid = document.getElementById("mealsGrid");
const mealsTitle = document.getElementById("mealsTitle");
const mealsSubtitle = document.getElementById("mealsSubtitle");
const dataStatusText = document.getElementById("dataStatusText");
const lastUpdatedBadge = document.getElementById("lastUpdatedBadge");
const currentDayLabel = document.getElementById("currentDayLabel");

/* ---------------------------------------------------------
   INIT
---------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  currentDayLabel.textContent = getTodayName();
  initMessSwitching();
});

/* ---------------------------------------------------------
   UTIL
---------------------------------------------------------- */
function getTodayName() {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
}

function formatMealName(m) {
  return m.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function mealIcon(type) {
  return {
    BREAKFAST: "🍳",
    LUNCH: "🍛",
    SNACKS: "☕",
    DINNER: "🍽️"
  }[type] || "🍽️";
}

/* ---------------------------------------------------------
   Mess switching
---------------------------------------------------------- */
function initMessSwitching() {
  const saved = localStorage.getItem("messType");
  if (saved && MENU_CONFIG[saved]) currentMessKey = saved;

  document.querySelectorAll(".mess-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentMessKey = btn.dataset.mess;
      localStorage.setItem("messType", currentMessKey);
      updateMessToggleUI();
      loadCurrentMess();
    });
  });

  updateMessToggleUI();
  loadCurrentMess();
}

function updateMessToggleUI() {
  document.querySelectorAll(".mess-toggle-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mess === currentMessKey);
  });
}

/* ---------------------------------------------------------
   Load menu
---------------------------------------------------------- */
function loadCurrentMess() {
  const cfg = MENU_CONFIG[currentMessKey];
  // dataStatusText.textContent = "Loading " + cfg.label + " menu…";
  dataStatusText.textContent = "Loaded: " + cfg.file;

  fetch(cfg.file)
    .then(r => r.json())
    .then(data => {
      menuData = data;
      availableDays = Object.keys(data);
      renderDayButtons();
      activeDay = availableDays.includes(getTodayName()) ? getTodayName() : availableDays[0];
      renderMealsForActiveDay();
      dataStatusText.textContent = "Loaded: " + cfg.file;
      // lastUpdatedBadge.textContent = "Updated: " + new Date().toLocaleString();
    });
}

/* ---------------------------------------------------------
   Days
---------------------------------------------------------- */
function renderDayButtons() {
  dayButtonsContainer.innerHTML = "";

  availableDays
    .sort((a,b)=>DAY_ORDER.indexOf(a)-DAY_ORDER.indexOf(b))
    .forEach(day => {
      const btn = document.createElement("button");
      btn.className = "day-btn";
      btn.dataset.day = day;

      btn.innerHTML = `
        <div class="day-btn-main">${day}</div>
        <div class="day-btn-sub">${day === getTodayName() ? "Today" : "Tap to view"}</div>
      `;

      btn.onclick = () => {
        activeDay = day;
        renderMealsForActiveDay();
      };

      dayButtonsContainer.appendChild(btn);
    });
}

/* ---------------------------------------------------------
   Meals
---------------------------------------------------------- */
function renderMealsForActiveDay() {
  mealsTitle.textContent = activeDay + " Menu";
  mealsSubtitle.textContent = "Complete meal plan for " + activeDay;
  mealsGrid.innerHTML = "";

  Object.keys(menuData[activeDay])
    .sort((a,b)=>MEAL_ORDER.indexOf(a)-MEAL_ORDER.indexOf(b))
    .forEach(meal => {
      const entry = menuData[activeDay][meal];

      const card = document.createElement("div");
      card.className = "meal-card";

      card.innerHTML = `
        <div class="meal-header-line">
          <div class="meal-name">${mealIcon(meal)} ${formatMealName(meal)}</div>
          <div class="meal-tag">${entry.time || "N/A"}</div>
        </div>
      `;

      const items = document.createElement("div");
      items.className = "meal-items";

      entry.items.forEach(i => {
        const span = document.createElement("span");
        span.className = "meal-item";
        span.textContent = i;
        items.appendChild(span);
      });

      card.appendChild(items);
      mealsGrid.appendChild(card);
    });

  document.querySelectorAll(".day-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.day === activeDay)
  );
}

/* ---------------------------------------------------------
   Service worker
---------------------------------------------------------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}