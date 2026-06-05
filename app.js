"use strict";

/* ==========================================================
   IITJ Mess Menu — App Logic
   ========================================================== */

/* ── CONFIG ─────────────────────────────────────────────── */
const MENU_CONFIG = {
  veg:    { label: "Veg Mess",     file: "mess-menu-veg.json" },
  nonveg: { label: "Non-Veg Mess", file: "mess-menu-nonveg.json" }
};

const DAY_ORDER  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MEAL_ORDER = ["BREAKFAST","LUNCH","SNACKS","DINNER"];

const MEAL_META = {
  BREAKFAST: { icon: "🍳", cls: "breakfast", label: "Breakfast" },
  LUNCH:     { icon: "🍛", cls: "lunch",     label: "Lunch"     },
  SNACKS:    { icon: "☕", cls: "snacks",    label: "Snacks"    },
  DINNER:    { icon: "🌙", cls: "dinner",    label: "Dinner"    },
};

/* ── STATE ──────────────────────────────────────────────── */
let currentMess = "veg";
let menuData    = {};
let activeDay   = null;

/* ── DOM REFS ───────────────────────────────────────────── */
const $dayStrip   = document.getElementById("dayStrip");
const $mealsGrid  = document.getElementById("mealsGrid");
const $mealsTitle = document.getElementById("mealsTitle");
const $dayBadge   = document.getElementById("dayBadge");
const $statusText = document.getElementById("statusText");

/* ── UTILS ──────────────────────────────────────────────── */
function today() {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
}

/* ── INIT ───────────────────────────────────────────────── */
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("messType");
  if (saved && MENU_CONFIG[saved]) currentMess = saved;

  document.querySelectorAll(".mess-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mess === currentMess);
    btn.addEventListener("click", () => {
      currentMess = btn.dataset.mess;
      localStorage.setItem("messType", currentMess);
      document.querySelectorAll(".mess-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.mess === currentMess)
      );
      loadMess();
    });
  });

  loadMess();
});

/* ── LOAD MENU ──────────────────────────────────────────── */
function loadMess() {
  $statusText.textContent = "Loading " + MENU_CONFIG[currentMess].label + "…";

  fetch(MENU_CONFIG[currentMess].file)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      menuData  = data;
      renderDayStrip();
      activeDay = Object.keys(menuData).includes(today()) ? today() : Object.keys(menuData)[0];
      renderMeals();
      $statusText.textContent = MENU_CONFIG[currentMess].label + " — menu loaded";
    })
    .catch(() => {
      $statusText.textContent = "Could not load menu data";
    });
}

/* ── RENDER: DAY STRIP ──────────────────────────────────── */
function renderDayStrip() {
  $dayStrip.innerHTML = "";

  const days = Object.keys(menuData).sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );

  days.forEach(day => {
    const isToday = day === today();
    const btn = document.createElement("button");
    btn.className = "day-btn" + (day === activeDay ? " active" : "");
    btn.dataset.day = day;
    btn.innerHTML = `
      <span class="day-abbr">${day.slice(0, 3)}</span>
      <span class="day-full">${day}</span>
      ${isToday ? '<span class="today-pip"></span>' : ""}
    `;
    btn.addEventListener("click", () => {
      activeDay = day;
      document.querySelectorAll(".day-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.day === day)
      );
      renderMeals();
    });
    $dayStrip.appendChild(btn);
  });
}

/* ── RENDER: MEALS ──────────────────────────────────────── */
function renderMeals() {
  if (!activeDay || !menuData[activeDay]) return;

  const isToday = activeDay === today();
  $mealsTitle.textContent  = activeDay + " Menu";
  $dayBadge.textContent    = isToday ? "Today" : activeDay.slice(0, 3);
  $dayBadge.style.display  = "inline-block";
  $mealsGrid.innerHTML     = "";

  const meals = Object.keys(menuData[activeDay]).sort(
    (a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b)
  );

  meals.forEach(meal => {
    const data = menuData[activeDay][meal];
    const meta = MEAL_META[meal] || { icon: "🍽️", cls: "dinner", label: meal };

    const card = document.createElement("div");
    card.className = "meal-card";

    card.innerHTML = `
      <div class="meal-card-top">
        <div class="meal-identity">
          <div class="meal-icon ${meta.cls}">${meta.icon}</div>
          <div>
            <div class="meal-name">${meta.label}</div>
            <div class="meal-sub">${data.items.length} items</div>
          </div>
        </div>
        <span class="meal-time-tag">${data.time || "—"}</span>
      </div>
      <div class="meal-divider"></div>
      <div class="meal-items">
        ${data.items.map(item => `<span class="item-chip">${item}</span>`).join("")}
      </div>
    `;

    $mealsGrid.appendChild(card);
  });
}

/* ── SERVICE WORKER ─────────────────────────────────────── */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
