/* =========================================================
   🕉️ OM NAMAH SHIVAY JAAP COUNTER
   Complete JavaScript
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const STORAGE_KEY = "om_namah_shivay_jaap_v5";
const TARGET_DEFAULT = 1100000000;

const $ = (id) => document.getElementById(id);

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN");

const clamp = (n, min, max) =>
  Math.max(min, Math.min(max, n));

/* =========================================================
   DEFAULT DATA
   ========================================================= */

const DEFAULT_DATA = {
  version: 5,

  records: {},

  settings: {
    mainTarget: TARGET_DEFAULT,
    dailyTarget: 108,
    weeklyTarget: 756,
    monthlyTarget: 3240,
    yearlyTarget: 40000,

    volume: 0.55,
    speed: 1,
    autoAudio: true,

    notify108: true,
    notify1000: true,
    notifyDaily: true,
    notifyMilestone: true,

    theme: "mahadev",

    userName: "",
    userId: "",

    pin: ""
  },

  deletedRecord: null,

  lastSession: 0,

  achievements: {},

  notificationPermission: false
};

/* =========================================================
   LOAD / SAVE DATA
   ========================================================= */

let data = loadData();

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return structuredClone(DEFAULT_DATA);
    }

    const saved = JSON.parse(raw);

    return {
      ...structuredClone(DEFAULT_DATA),
      ...saved,
      settings: {
        ...structuredClone(DEFAULT_DATA.settings),
        ...(saved.settings || {})
      }
    };
  } catch (err) {
    console.error("Data load error:", err);
    return structuredClone(DEFAULT_DATA);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Save error:", err);
  }
}

/* =========================================================
   RECORD FUNCTIONS
   ========================================================= */

function getDayCount(date) {
  return Number(data.records[date] || 0);
}

function addJaap(date, count) {
  count = Number(count);

  if (!date || !Number.isFinite(count) || count <= 0) {
    return false;
  }

  if (!data.records[date]) {
    data.records[date] = 0;
  }

  // IMPORTANT:
  // Same date = ADD, not REPLACE
  data.records[date] += Math.floor(count);

  saveData();

  updateAll();

  checkMilestones();
  checkNotifications(date);

  return true;
}

function deleteRecord(date) {
  if (!data.records[date]) return;

  data.deletedRecord = {
    date,
    count: data.records[date]
  };

  delete data.records[date];

  saveData();
  updateAll();
}

function restoreDeleted() {
  if (!data.deletedRecord) {
    alert("Recover કરવા માટે કોઈ deleted record નથી.");
    return;
  }

  const { date, count } = data.deletedRecord;

  data.records[date] =
    Number(data.records[date] || 0) + Number(count);

  data.deletedRecord = null;

  saveData();
  updateAll();

  alert("છેલ્લો deleted record recover થઈ ગયો. ✅");
}

/* =========================================================
   TOTAL
   ========================================================= */

function getTotal() {
  return Object.values(data.records)
    .reduce((sum, value) => sum + Number(value || 0), 0);
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function getDateObject(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateString) {
  if (!dateString) return "";

  const d = getDateObject(dateString);

  return d.toLocaleDateString("gu-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function monthName(month, year) {
  return new Date(year, month, 1).toLocaleDateString("gu-IN", {
    month: "long",
    year: "numeric"
  });
}

/* =========================================================
   HEADER
   ========================================================= */

function updateHeader() {
  const total = getTotal();
  const target = Number(data.settings.mainTarget || TARGET_DEFAULT);

  const progress =
    target > 0 ? (total / target) * 100 : 0;

  if ($("total")) {
    $("total").textContent = formatNumber(total);
  }

  if ($("progress")) {
    $("progress").textContent =
      progress.toFixed(11) + "%";
  }

  if ($("totalLine")) {
    $("totalLine").style.width =
      `${clamp((total / Math.max(target, 1)) * 100, 0, 100)}%`;
  }

  if ($("progressLine")) {
    $("progressLine").style.width =
      `${clamp(progress, 0, 100)}%`;
  }
}

/* =========================================================
   SMART TARGET
   ========================================================= */

function updateSmartTarget() {
  const total = getTotal();
  const target = Number(data.settings.mainTarget || 0);

  const remain = Math.max(target - total, 0);

  const progress =
    target > 0 ? (total / target) * 100 : 0;

  if ($("sideTarget"))
    $("sideTarget").textContent = formatNumber(target);

  if ($("sideDone"))
    $("sideDone").textContent = formatNumber(total);

  if ($("sideRemain"))
    $("sideRemain").textContent = formatNumber(remain);

  if ($("sideProgress"))
    $("sideProgress").textContent =
      progress.toFixed(11) + "%";

  if ($("sideBar"))
    $("sideBar").style.width =
      `${clamp(progress, 0, 100)}%`;

  const eta = calculateETA();

  if ($("sideEta"))
    $("sideEta").textContent = eta;

  if ($("statRemain"))
    $("statRemain").textContent = formatNumber(remain);

  if ($("statEta"))
    $("statEta").textContent = eta;
}

/* =========================================================
   ETA
   ========================================================= */

function calculateETA() {
  const target = Number(data.settings.mainTarget || 0);
  const total = getTotal();

  const remain = Math.max(target - total, 0);

  if (remain <= 0) {
    return "પૂર્ણ થયું 🎉";
  }

  const dates = Object.keys(data.records).sort();

  if (dates.length < 2) {
    return "વધુ data જરૂરી";
  }

  const first = getDateObject(dates[0]);
  const now = new Date();

  const days =
    Math.max(
      1,
      Math.ceil((now - first) / 86400000)
    );

  const average = total / days;

  if (average <= 0) {
    return "—";
  }

  const daysLeft = Math.ceil(remain / average);

  if (daysLeft > 3650) {
    return `${Math.floor(daysLeft / 365)} વર્ષ`;
  }

  if (daysLeft > 365) {
    return `${Math.floor(daysLeft / 365)} વર્ષ ${daysLeft % 365} દિવસ`;
  }

  return `${daysLeft} દિવસ`;
}

/* =========================================================
   QUICK STATS
   ========================================================= */

function calculateCurrentStreak() {
  let date = new Date();
  let streak = 0;

  while (true) {
    const iso = toISO(date);

    if (getDayCount(iso) > 0) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateLongestStreak() {
  const dates = Object.keys(data.records)
    .filter(d => getDayCount(d) > 0)
    .sort();

  if (!dates.length) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const a = getDateObject(dates[i - 1]);
    const b = getDateObject(dates[i]);

    const diff =
      Math.round((b - a) / 86400000);

    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function getBestDay() {
  const values = Object.values(data.records)
    .map(Number);

  return values.length ? Math.max(...values) : 0;
}

function updateQuickStats() {
  const total = getTotal();

  const activeDays =
    Object.values(data.records)
      .filter(v => Number(v) > 0)
      .length;

  const avg =
    activeDays > 0 ? total / activeDays : 0;

  const streak = calculateCurrentStreak();
  const best = getBestDay();

  if ($("quickStreak"))
    $("quickStreak").textContent = streak;

  if ($("quickBest"))
    $("quickBest").textContent = formatNumber(best);

  if ($("quickActive"))
    $("quickActive").textContent = activeDays;

  if ($("quickAvg"))
    $("quickAvg").textContent =
      formatNumber(Math.round(avg));
}

/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {
  const total = getTotal();

  const activeDays =
    Object.values(data.records)
      .filter(v => Number(v) > 0)
      .length;

  const average =
    activeDays ? total / activeDays : 0;

  if ($("statTotal"))
    $("statTotal").textContent =
      formatNumber(total);

  if ($("statStreak"))
    $("statStreak").textContent =
      `${calculateCurrentStreak()} Days`;

  if ($("statLongest"))
    $("statLongest").textContent =
      `${calculateLongestStreak()} Days`;

  if ($("statBest"))
    $("statBest").textContent =
      formatNumber(getBestDay());

  if ($("statActive"))
    $("statActive").textContent =
      activeDays;

  if ($("statAverage"))
    $("statAverage").textContent =
      formatNumber(Math.round(average));
}

/* =========================================================
   CALENDAR
   ========================================================= */

let calendarDate = new Date();

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  if ($("month")) {
    $("month").textContent =
      monthName(month, year);
  }

  const container = $("days");

  if (!container) return;

  container.innerHTML = "";

  const firstDay =
    new Date(year, month, 1).getDay();

  const totalDays =
    new Date(year, month + 1, 0).getDate();

  const previousMonthDays =
    new Date(year, month, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const div = document.createElement("div");
    div.className = "day muted";

    div.textContent =
      previousMonthDays - firstDay + i + 1;

    container.appendChild(div);
  }

  for (let day = 1; day <= totalDays; day++) {
    const iso =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const count = getDayCount(iso);

    const div = document.createElement("button");

    div.className = "day";

    if (count > 0) {
      div.classList.add("has-jaap");

      if (count >= 1000)
        div.classList.add("high");

      else if (count >= 108)
        div.classList.add("medium");

      else
        div.classList.add("low");
    }

    if (iso === todayISO()) {
      div.classList.add("today");
    }

    div.innerHTML = `
      <span>${day}</span>
      ${count > 0
        ? `<small>${formatNumber(count)}</small>`
        : ""}
    `;

    div.addEventListener("click", () => {
      showDayDetail(iso);
    });

    container.appendChild(div);
  }

  renderLegend();
}

function renderLegend() {
  if (!$("legend")) return;

  $("legend").innerHTML = `
    <span><i class="legend-low"></i> 1+</span>
    <span><i class="legend-medium"></i> 108+</span>
    <span><i class="legend-high"></i> 1000+</span>
  `;
}

function showDayDetail(date) {
  const count = getDayCount(date);

  const box = $("dayDetail");

  if (!box) return;

  box.classList.remove("hidden");

  box.innerHTML = `
    <h3>📅 ${formatDate(date)}</h3>
    <p>🕉️ કુલ જાપ:
      <strong>${formatNumber(count)}</strong>
    </p>

    <div class="day-actions">
      <button data-detail-add="108">+108</button>
      <button data-detail-add="1000">+1000</button>
      <button data-detail-delete>🗑 Delete Day</button>
    </div>
  `;

  box.querySelectorAll("[data-detail-add]")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        addJaap(
          date,
          Number(btn.dataset.detailAdd)
        );
        showDayDetail(date);
      });
    });

  const del =
    box.querySelector("[data-detail-delete]");

  if (del) {
    del.addEventListener("click", () => {
      if (confirm(
        `${formatDate(date)} નો Jaap delete કરવો છે?`
      )) {
        deleteRecord(date);
        box.classList.add("hidden");
      }
    });
  }
}

/* =========================================================
   ADD JAAP
   ========================================================= */

function setupAddJaap() {
  if ($("addDate")) {
    $("addDate").value = todayISO();
  }

  if ($("save")) {
    $("save").addEventListener("click", () => {
      const date = $("addDate").value;
      const count = Number($("addCount").value);

      if (!date) {
        setMessage("addMsg", "તારીખ પસંદ કરો.", true);
        return;
      }

      if (!count || count <= 0) {
        setMessage(
          "addMsg",
          "જાપની સંખ્યા સાચી નાખો.",
          true
        );
        return;
      }

      addJaap(date, count);

      $("addCount").value = "";

      setMessage(
        "addMsg",
        `${formatNumber(count)} જાપ સફળતાપૂર્વક ઉમેરાયા. ✅`
      );

      renderRecords();
    });
  }

  renderRecords();
}

function renderRecords() {
  const box = $("records");

  if (!box) return;

  const dates =
    Object.keys(data.records)
      .sort()
      .reverse()
      .slice(0, 20);

  if (!dates.length) {
    box.innerHTML =
      `<p class="muted">હજુ કોઈ record નથી.</p>`;
    return;
  }

  box.innerHTML = dates.map(date => `
    <div class="record-row">
      <div>
        <b>${formatDate(date)}</b>
        <small>${date}</small>
      </div>

      <strong>
        🕉️ ${formatNumber(data.records[date])}
      </strong>

      <button data-record-delete="${date}">
        🗑
      </button>
    </div>
  `).join("");

  box.querySelectorAll("[data-record-delete]")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        const date =
          btn.dataset.recordDelete;

        if (confirm(
          `${formatDate(date)} નો record delete કરવો છે?`
        )) {
          deleteRecord(date);
          renderRecords();
        }
      });
    });
}

/* =========================================================
   LIVE JAAP
   ========================================================= */

let sessionCount = 0;
let sessionSeconds = 0;
let sessionRunning = false;
let sessionPaused = false;
let timerInterval = null;
let lastSessionUndo = 0;

function setupLiveJaap() {
  const start = $("start");
  const pause = $("pause");
  const end = $("end");
  const undo = $("undoSession");
  const jaap = $("jaap");

  if (start) {
    start.addEventListener("click", startSession);
  }

  if (pause) {
    pause.addEventListener("click", togglePause);
  }

  if (end) {
    end.addEventListener("click", openEndModal);
  }

  if (undo) {
    undo.addEventListener("click", undoSession);
  }

  if (jaap) {
    jaap.addEventListener("click", () => {
      if (!sessionRunning || sessionPaused) return;

      incrementSession(1);
    });
  }

  document
    .querySelectorAll(".quick-adds button")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        if (!sessionRunning || sessionPaused) return;

        incrementSession(
          Number(btn.dataset.add)
        );
      });
    });

  updateLiveUI();
}

function startSession() {
  if (sessionRunning) return;

  sessionRunning = true;
  sessionPaused = false;

  $("start").disabled = true;

  if ($("pause"))
    $("pause").disabled = false;

  if ($("end"))
    $("end").disabled = false;

  if ($("jaap"))
    $("jaap").disabled = false;

  document
    .querySelectorAll(".quick-adds button")
    .forEach(b => b.disabled = false);

  $("liveMsg").textContent =
    "જાપ ચાલુ છે... 🕉️";

  timerInterval = setInterval(() => {
    if (!sessionPaused) {
      sessionSeconds++;
      updateTimer();
    }
  }, 1000);

  if (
    data.settings.autoAudio &&
    $("audio")
  ) {
    playAudio();
  }
}

function togglePause() {
  if (!sessionRunning) return;

  sessionPaused = !sessionPaused;

  $("pause").textContent =
    sessionPaused ? "▶ Resume" : "Ⅱ Pause";

  $("liveMsg").textContent =
    sessionPaused
      ? "જાપ Pause છે."
      : "જાપ ચાલુ છે... 🕉️";

  if (sessionPaused) {
    pauseAudio();
  } else if (data.settings.autoAudio) {
    playAudio();
  }
}

function incrementSession(amount) {
  sessionCount += Number(amount);

  updateLiveUI();

  checkSessionNotifications();
}

function updateLiveUI() {
  if ($("session"))
    $("session").textContent =
      formatNumber(sessionCount);

  updateTimer();
}

function updateTimer() {
  if (!$("timer")) return;

  const h =
    Math.floor(sessionSeconds / 3600);

  const m =
    Math.floor((sessionSeconds % 3600) / 60);

  const s =
    sessionSeconds % 60;

  $("timer").textContent =
    `${String(h).padStart(2, "0")}:` +
    `${String(m).padStart(2, "0")}:` +
    `${String(s).padStart(2, "0")}`;
}

function openEndModal() {
  if (!sessionCount) {
    alert("પહેલા ઓછામાં ઓછો 1 જાપ કરો.");
    return;
  }

  if ($("endDate")) {
    $("endDate").value = todayISO();
  }

  $("modal").classList.remove("hidden");
}

function closeEndModal() {
  $("modal").classList.add("hidden");
}

function confirmSession() {
  const date =
    $("endDate").value || todayISO();

  addJaap(date, sessionCount);

  lastSessionUndo = sessionCount;

  data.lastSession = sessionCount;

  saveData();

  stopSession();

  closeEndModal();

  $("liveMsg").textContent =
    `${formatNumber(lastSessionUndo)} જાપ ${formatDate(date)} માટે save થયા. ✅`;
}

function stopSession() {
  clearInterval(timerInterval);

  timerInterval = null;

  sessionRunning = false;
  sessionPaused = false;

  sessionCount = 0;
  sessionSeconds = 0;

  if ($("start"))
    $("start").disabled = false;

  if ($("pause")) {
    $("pause").disabled = false;
    $("pause").textContent = "Ⅱ Pause";
  }

  if ($("end"))
    $("end").disabled = true;

  if ($("jaap"))
    $("jaap").disabled = true;

  document
    .querySelectorAll(".quick-adds button")
    .forEach(b => b.disabled = true);

  pauseAudio();

  updateLiveUI();
}

function undoSession() {
  if (!lastSessionUndo) {
    alert("Undo કરવા માટે કોઈ completed session નથી.");
    return;
  }

  const amount = lastSessionUndo;

  const dates =
    Object.keys(data.records).sort().reverse();

  if (!dates.length) return;

  const lastDate = dates[0];

  data.records[lastDate] =
    Math.max(
      0,
      Number(data.records[lastDate]) - amount
    );

  if (data.records[lastDate] === 0) {
    delete data.records[lastDate];
  }

  lastSessionUndo = 0;

  saveData();
  updateAll();

  alert("છેલ્લો session undo થયો. ↶");
}

/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModal() {
  if ($("cancel")) {
    $("cancel").addEventListener(
      "click",
      closeEndModal
    );
  }

  if ($("confirm")) {
    $("confirm").addEventListener(
      "click",
      confirmSession
    );
  }

  if ($("modal")) {
    $("modal").addEventListener("click", e => {
      if (e.target === $("modal")) {
        closeEndModal();
      }
    });
  }
}

/* =========================================================
   AUDIO
   ========================================================= */

function setupAudio() {
  const audio = $("audio");

  if (!audio) return;

  audio.loop = true;

  audio.volume =
    Number(data.settings.volume ?? 0.55);

  audio.playbackRate =
    Number(data.settings.speed ?? 1);

  updateSoundUI();

  if ($("soundCard")) {
    $("soundCard").addEventListener(
      "click",
      toggleAudio
    );
  }

  if ($("volume")) {
    $("volume").value =
      data.settings.volume;

    $("volume").addEventListener("input", e => {
      data.settings.volume =
        Number(e.target.value);

      audio.volume =
        data.settings.volume;

      saveData();
    });
  }

  if ($("speed")) {
    $("speed").value =
      data.settings.speed;

    $("speed").addEventListener("change", e => {
      data.settings.speed =
        Number(e.target.value);

      audio.playbackRate =
        data.settings.speed;

      saveData();
    });
  }

  if ($("autoAudio")) {
    $("autoAudio").checked =
      data.settings.autoAudio;

    $("autoAudio").addEventListener(
      "change",
      e => {
        data.settings.autoAudio =
          e.target.checked;

        saveData();
      }
    );
  }
}

function playAudio() {
  const audio = $("audio");

  if (!audio) return;

  audio.volume =
    Number(data.settings.volume);

  audio.playbackRate =
    Number(data.settings.speed);

  audio.loop = true;

  audio.play().catch(() => {
    // Browser autoplay protection
  });

  updateSoundUI(true);
}

function pauseAudio() {
  const audio = $("audio");

  if (!audio) return;

  audio.pause();

  updateSoundUI(false);
}

function toggleAudio() {
  const audio = $("audio");

  if (!audio) return;

  if (audio.paused) {
    playAudio();
  } else {
    pauseAudio();
  }
}

function updateSoundUI(force = null) {
  const audio = $("audio");

  const on =
    force !== null
      ? force
      : audio && !audio.paused;

  if ($("soundText")) {
    $("soundText").textContent =
      on ? "ON" : "OFF";
  }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
  document
    .querySelectorAll(".nav")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        const page =
          btn.dataset.page;

        showPage(page);

        document
          .querySelectorAll(".nav")
          .forEach(n =>
            n.classList.remove("active")
          );

        btn.classList.add("active");
      });
    });
}

function showPage(page) {
  document
    .querySelectorAll(".page")
    .forEach(section => {
      section.classList.remove("active");
    });

  const target = $(page);

  if (target) {
    target.classList.add("active");
  }

  if (page === "calendar") {
    renderCalendar();
  }

  if (page === "graph") {
    setTimeout(renderGraphs, 100);
  }

  if (page === "stats") {
    updateStatistics();
  }

  if (page === "achievements") {
    renderAchievements();
  }

  if (page === "reports") {
    renderReports();
  }

  if (page === "yoga") {
    renderYoga();
  }
}

/* =========================================================
   CALENDAR NAVIGATION
   ========================================================= */

function setupCalendarNavigation() {
  if ($("prev")) {
    $("prev").addEventListener("click", () => {
      calendarDate.setMonth(
        calendarDate.getMonth() - 1
      );

      renderCalendar();
    });
  }

  if ($("next")) {
    $("next").addEventListener("click", () => {
      calendarDate.setMonth(
        calendarDate.getMonth() + 1
      );

      renderCalendar();
    });
  }

  if ($("todayBtn")) {
    $("todayBtn").addEventListener("click", () => {
      calendarDate = new Date();
      renderCalendar();
    });
  }
}

/* =========================================================
   GRAPH
   ========================================================= */

function drawLineChart(canvas, labels, values) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const rect =
    canvas.getBoundingClientRect();

  const width =
    Math.max(rect.width, 500);

  const height = 300;

  const dpr =
    window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  canvas.style.height =
    `${height}px`;

  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!values.length) return;

  const padding = 45;

  const max =
    Math.max(...values, 1);

  /* Grid */

  ctx.font = "12px sans-serif";
  ctx.textAlign = "right";

  for (let i = 0; i <= 5; i++) {
    const y =
      height -
      padding -
      ((height - padding * 2) / 5) * i;

    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    const value =
      Math.round(max * i / 5);

    ctx.fillText(
      formatNumber(value),
      padding - 8,
      y + 4
    );
  }

  /* Line */

  const step =
    values.length > 1
      ? (width - padding * 2) /
        (values.length - 1)
      : 0;

  ctx.beginPath();

  values.forEach((value, i) => {
    const x =
      padding + step * i;

    const y =
      height -
      padding -
      (value / max) *
      (height - padding * 2);

    if (i === 0)
      ctx.moveTo(x, y);
    else
      ctx.lineTo(x, y);
  });

  ctx.strokeWidth = 3;
  ctx.stroke();

  /* Points */

  values.forEach((value, i) => {
    const x =
      padding + step * i;

    const y =
      height -
      padding -
      (value / max) *
      (height - padding * 2);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  /* X labels */

  ctx.textAlign = "center";

  const labelStep =
    Math.max(1, Math.ceil(labels.length / 8));

  labels.forEach((label, i) => {
    if (i % labelStep !== 0) return;

    const x =
      padding + step * i;

    ctx.fillText(
      label,
      x,
      height - 15
    );
  });
}

function getLastDays(days) {
  const labels = [];
  const values = [];

  const d = new Date();

  d.setDate(d.getDate() - days + 1);

  for (let i = 0; i < days; i++) {
    const iso = toISO(d);

    labels.push(
      `${d.getDate()}/${d.getMonth() + 1}`
    );

    values.push(getDayCount(iso));

    d.setDate(d.getDate() + 1);
  }

  return { labels, values };
}

function getLastMonths(months) {
  const labels = [];
  const values = [];

  const d = new Date();

  d.setDate(1);
  d.setMonth(d.getMonth() - months + 1);

  for (let i = 0; i < months; i++) {
    const y = d.getFullYear();
    const m = d.getMonth();

    const prefix =
      `${y}-${String(m + 1).padStart(2, "0")}`;

    let total = 0;

    Object.entries(data.records)
      .forEach(([date, count]) => {
        if (date.startsWith(prefix)) {
          total += Number(count);
        }
      });

    labels.push(
      d.toLocaleDateString("en", {
        month: "short"
      })
    );

    values.push(total);

    d.setMonth(d.getMonth() + 1);
  }

  return { labels, values };
}

function renderGraphs() {
  const daily = getLastDays(31);
  const monthly = getLastMonths(12);

  [
    $("daily"),
    $("daily2")
  ].forEach(canvas => {
    drawLineChart(
      canvas,
      daily.labels,
      daily.values
    );
  });

  [
    $("monthly"),
    $("monthly2")
  ].forEach(canvas => {
    drawLineChart(
      canvas,
      monthly.labels,
      monthly.values
    );
  });
}

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

const ACHIEVEMENTS = [
  {
    id: "first",
    icon: "🌱",
    title: "First Jaap",
    target: 1
  },
  {
    id: "108",
    icon: "🕉️",
    title: "108 Jaap",
    target: 108
  },
  {
    id: "1000",
    icon: "🔥",
    title: "1,000 Jaap",
    target: 1000
  },
  {
    id: "10000",
    icon: "⭐",
    title: "10,000 Jaap",
    target: 10000
  },
  {
    id: "100000",
    icon: "🏆",
    title: "1 Lakh Jaap",
    target: 100000
  },
  {
    id: "1000000",
    icon: "👑",
    title: "10 Lakh Jaap",
    target: 1000000
  },
  {
    id: "10000000",
    icon: "🔱",
    title: "1 Crore Jaap",
    target: 10000000
  },
  {
    id: "100000000",
    icon: "🌌",
    title: "10 Crore Jaap",
    target: 100000000
  },
  {
    id: "target",
    icon: "🚩",
    title: "Main Target Complete",
    target: () =>
      Number(data.settings.mainTarget)
  }
];

function renderAchievements() {
  const box = $("achievementGrid");

  if (!box) return;

  const total = getTotal();

  box.innerHTML =
    ACHIEVEMENTS.map(a => {
      const target =
        typeof a.target === "function"
          ? a.target()
          : a.target;

      const unlocked =
        total >= target;

      return `
        <div class="achievement-card ${
          unlocked ? "unlocked" : "locked"
        }">

          <div class="achievement-icon">
            ${a.icon}
          </div>

          <h3>${a.title}</h3>

          <p>
            ${formatNumber(target)} Jaap
          </p>

          <div class="achievement-progress">
            <i style="width:${
              clamp(
                (total / target) * 100,
                0,
                100
              )
            }%"></i>
          </div>

          <small>
            ${
              unlocked
                ? "✅ Completed"
                : `${formatNumber(
                    Math.max(target - total, 0)
                  )} remaining`
            }
          </small>
        </div>
      `;
    }).join("");
}

function checkMilestones() {
  const total = getTotal();

  ACHIEVEMENTS.forEach(a => {
    const target =
      typeof a.target === "function"
        ? a.target()
        : a.target;

    if (
      total >= target &&
      !data.achievements[a.id]
    ) {
      data.achievements[a.id] = {
        unlocked: true,
        date: todayISO()
      };

      if (data.settings.notifyMilestone) {
        notify(
          "🕉️ Milestone Completed!",
          `${a.title} પૂર્ણ થયું.`
        );
      }
    }
  });

  saveData();
}

/* =========================================================
   REPORTS
   ========================================================= */

function renderReports() {
  renderDailyReport();
  renderMonthlyReport();
}

function renderDailyReport() {
  const box = $("dailyReport");

  if (!box) return;

  const today = todayISO();
  const count = getDayCount(today);

  const target =
    Number(data.settings.dailyTarget || 0);

  const percent =
    target > 0
      ? (count / target) * 100
      : 0;

  box.innerHTML = `
    <h3>📊 આજનો Report</h3>

    <div class="report-stat">
      <span>તારીખ</span>
      <b>${formatDate(today)}</b>
    </div>

    <div class="report-stat">
      <span>આજનો Jaap</span>
      <b>${formatNumber(count)}</b>
    </div>

    <div class="report-stat">
      <span>Daily Target</span>
      <b>${formatNumber(target)}</b>
    </div>

    <div class="report-stat">
      <span>Progress</span>
      <b>${percent.toFixed(2)}%</b>
    </div>

    <div class="report-bar">
      <i style="width:${clamp(percent, 0, 100)}%"></i>
    </div>
  `;
}

function renderMonthlyReport() {
  const box = $("monthlyReport");

  if (!box) return;

  const now = new Date();

  const prefix =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

  let total = 0;
  let active = 0;
  let best = 0;

  Object.entries(data.records)
    .forEach(([date, count]) => {
      if (date.startsWith(prefix)) {
        const n = Number(count);

        total += n;

        if (n > 0) active++;

        best = Math.max(best, n);
      }
    });

  const average =
    active ? total / active : 0;

  box.innerHTML = `
    <h3>📆 Monthly Report</h3>

    <div class="report-stat">
      <span>Month</span>
      <b>${now.toLocaleDateString("gu-IN", {
        month: "long",
        year: "numeric"
      })}</b>
    </div>

    <div class="report-stat">
      <span>Total Jaap</span>
      <b>${formatNumber(total)}</b>
    </div>

    <div class="report-stat">
      <span>Active Days</span>
      <b>${active}</b>
    </div>

    <div class="report-stat">
      <span>Daily Average</span>
      <b>${formatNumber(Math.round(average))}</b>
    </div>

    <div class="report-stat">
      <span>Best Day</span>
      <b>${formatNumber(best)}</b>
    </div>
  `;
}

function setupReportTabs() {
  if ($("dailyReportTab")) {
    $("dailyReportTab")
      .addEventListener("click", () => {
        $("dailyReport").classList.remove("hidden");
        $("monthlyReport").classList.add("hidden");

        $("dailyReportTab")
          .classList.add("active");

        $("monthlyReportTab")
          .classList.remove("active");
      });
  }

  if ($("monthlyReportTab")) {
    $("monthlyReportTab")
      .addEventListener("click", () => {
        $("monthlyReport").classList.remove("hidden");
        $("dailyReport").classList.add("hidden");

        $("monthlyReportTab")
          .classList.add("active");

        $("dailyReportTab")
          .classList.remove("active");
      });
  }
}

/* =========================================================
   YOGA / PRANAYAMA CONTENT
   ========================================================= */

const YOGA_CONTENT = {

  overview: `
    <h2>🧘 યોગ પરિચય</h2>

    <p>
      યોગનો અર્થ શરીર, શ્વાસ અને મન વચ્ચે
      સંતુલન સ્થાપિત કરવાનો અભ્યાસ તરીકે
      સમજાવી શકાય છે.
    </p>

    <h3>યોગના મુખ્ય ભાગો</h3>

    <ul>
      <li>આસન</li>
      <li>પ્રાણાયામ</li>
      <li>ધ્યાન</li>
      <li>મન અને શરીરની જાગૃતિ</li>
      <li>નિયમિત અને શાંત અભ્યાસ</li>
    </ul>

    <h3>સુરક્ષિત શરૂઆત</h3>

    <p>
      શરૂઆતમાં સરળ અભ્યાસથી શરૂ કરવો અને
      શરીરની ક્ષમતા પ્રમાણે ધીમે ધીમે આગળ વધવું.
    </p>
  `,

  pranayama: `
    <h2>🌬️ પ્રાણાયામ</h2>

    <p>
      પ્રાણાયામમાં શ્વાસ પ્રત્યે જાગૃતિ અને
      નિયંત્રિત શ્વાસના અભ્યાસનો સમાવેશ થાય છે.
    </p>

    <h3>સરળ અભ્યાસ</h3>

    <ol>
      <li>આરામદાયક સ્થિતિમાં બેસો.</li>
      <li>શ્વાસને સ્વાભાવિક રીતે આવવા-જવા દો.</li>
      <li>શ્વાસ પર ધ્યાન કેન્દ્રિત કરો.</li>
      <li>જોરથી અથવા ઝડપથી શ્વાસ ન લો.</li>
    </ol>

    <p>
      ચક્કર, દુખાવો અથવા શ્વાસ લેવામાં
      તકલીફ થાય તો અભ્યાસ બંધ કરો.
    </p>
  `,

  chakras: `
    <h2>🌈 માનવ શરીરના 7 ચક્ર</h2>

    <div class="chakra-list">

      <div>
        <h3>1. મૂળાધાર ચક્ર</h3>
        <p>સ્થિરતા અને આધાર સાથે જોડાયેલું માનવામાં આવે છે.</p>
      </div>

      <div>
        <h3>2. સ્વાધિષ્ઠાન ચક્ર</h3>
        <p>સર્જનાત્મકતા અને ભાવનાઓ સાથે જોડાયેલી પરંપરાગત સમજ છે.</p>
      </div>

      <div>
        <h3>3. મણિપુર ચક્ર</h3>
        <p>આત્મવિશ્વાસ અને આંતરિક શક્તિ સાથે જોડાયેલી ધારણા છે.</p>
      </div>

      <div>
        <h3>4. અનાહત ચક્ર</h3>
        <p>પ્રેમ, કરુણા અને ભાવનાત્મક સંતુલન સાથે જોડાય છે.</p>
      </div>

      <div>
        <h3>5. વિશુદ્ધિ ચક્ર</h3>
        <p>વાણી અને અભિવ્યક્તિ સાથે જોડાયેલી પરંપરાગત માન્યતા છે.</p>
      </div>

      <div>
        <h3>6. આજ્ઞા ચક્ર</h3>
        <p>એકાગ્રતા અને આંતરિક અવલોકન સાથે જોડાય છે.</p>
      </div>

      <div>
        <h3>7. સહસ્રાર ચક્ર</h3>
        <p>આધ્યાત્મિક ચેતના સાથે જોડાયેલી પરંપરાગત ધારણા છે.</p>
      </div>

    </div>
  `,

  siddhis: `
    <h2>✨ અષ્ટ સિદ્ધિઓ</h2>

    <p>
      ભારતીય આધ્યાત્મિક પરંપરામાં અષ્ટ સિદ્ધિઓને
      વિશેષ આધ્યાત્મિક શક્તિઓ તરીકે વર્ણવવામાં આવે છે.
    </p>

    <ol>
      <li><b>અણિમા</b> — અતિ સૂક્ષ્મ થવાની સિદ્ધિ.</li>
      <li><b>મહિમા</b> — વિશાળ થવાની સિદ્ધિ.</li>
      <li><b>ગરિમા</b> — અત્યંત ભારે થવાની સિદ્ધિ.</li>
      <li><b>લઘિમા</b> — અત્યંત હલકા થવાની સિદ્ધિ.</li>
      <li><b>પ્રાપ્તિ</b> — ઇચ્છિત વસ્તુ પ્રાપ્ત કરવાની સિદ્ધિ.</li>
      <li><b>પ્રાકામ્ય</b> — ઇચ્છાની પૂર્ણતા સાથે જોડાયેલી સિદ્ધિ.</li>
      <li><b>ઈશિત્વ</b> — નિયંત્રણ અથવા અધિપત્ય સાથે જોડાયેલી સિદ્ધિ.</li>
      <li><b>વશિત્વ</b> — પ્રભાવ અથવા નિયંત્રણ સાથે જોડાયેલી સિદ્ધિ.</li>
    </ol>

    <p>
      આ વિષય આધ્યાત્મિક પરંપરા અને માન્યતાઓના
      સંદર્ભમાં સમજવો.
    </p>
  `
};

function renderYoga() {
  const topic =
    $("yogaTopic")?.value || "overview";

  if ($("yogaContent")) {
    $("yogaContent").innerHTML =
      YOGA_CONTENT[topic] ||
      YOGA_CONTENT.overview;
  }
}

function setupYoga() {
  if ($("yogaTopic")) {
    $("yogaTopic").addEventListener(
      "change",
      renderYoga
    );
  }

  if ($("yogaFont")) {
    $("yogaFont").addEventListener(
      "input",
      e => {
        if ($("yogaContent")) {
          $("yogaContent").style.fontSize =
            `${e.target.value}px`;
        }
      }
    );
  }

  if ($("yogaBookmark")) {
    $("yogaBookmark")
      .addEventListener("click", () => {
        localStorage.setItem(
          "yogaBookmark",
          $("yogaTopic").value
        );

        alert("Topic bookmark થયો. 🔖");
      });
  }

  renderYoga();
}

/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {

  /* Theme */

  document
    .querySelectorAll("[data-theme-choice]")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        setTheme(btn.dataset.themeChoice);
      });
    });

  if ($("themeSelect")) {
    $("themeSelect").value =
      data.settings.theme;

    $("themeSelect").addEventListener(
      "change",
      e => setTheme(e.target.value)
    );
  }

  /* Targets */

  loadTargetInputs();

  if ($("saveTargets")) {
    $("saveTargets")
      .addEventListener("click", saveTargets);
  }

  /* Notifications */

  if ($("enableNotifications")) {
    $("enableNotifications")
      .addEventListener(
        "click",
        enableNotifications
      );
  }

  [
    "notify108",
    "notify1000",
    "notifyDaily",
    "notifyMilestone"
  ].forEach(id => {
    if ($(id)) {
      $(id).checked =
        Boolean(data.settings[id]);

      $(id).addEventListener(
        "change",
        e => {
          data.settings[id] =
            e.target.checked;

          saveData();
        }
      );
    }
  });

  /* Profile */

  updateProfileUI();

  if ($("changeName")) {
    $("changeName")
      .addEventListener("click", changeName);
  }

  /* PIN */

  updatePinUI();

  if ($("setPin")) {
    $("setPin")
      .addEventListener("click", setPIN);
  }

  if ($("removePin")) {
    $("removePin")
      .addEventListener("click", removePIN);
  }

  /* Share */

  if ($("shareProgress")) {
    $("shareProgress")
      .addEventListener(
        "click",
        shareProgress
      );
  }

  if ($("copyProgress")) {
    $("copyProgress")
      .addEventListener(
        "click",
        copyProgress
      );
  }

  if ($("downloadProgressCard")) {
    $("downloadProgressCard")
      .addEventListener(
        "click",
        downloadProgressCard
      );
  }

  /* Backup */

  if ($("download")) {
    $("download")
      .addEventListener(
        "click",
        downloadBackup
      );
  }

  if ($("restore")) {
    $("restore")
      .addEventListener(
        "change",
        restoreBackup
      );
  }

  /* CSV */

  if ($("exportCsv")) {
    $("exportCsv")
      .addEventListener(
        "click",
        exportCSV
      );
  }

  /* Recover */

  if ($("undoDelete")) {
    $("undoDelete")
      .addEventListener(
        "click",
        restoreDeleted
      );
  }

  /* Delete all */

  if ($("clearAll")) {
    $("clearAll")
      .addEventListener(
        "click",
        clearAllData
      );
  }

  /* PWA */

  setupPWA();
}

/* =========================================================
   TARGET SETTINGS
   ========================================================= */

function loadTargetInputs() {
  const map = {
    mainTarget: "mainTarget",
    dailyTarget: "dailyTarget",
    weeklyTarget: "weeklyTarget",
    monthlyTarget: "monthlyTarget",
    yearlyTarget: "yearlyTarget"
  };

  Object.entries(map).forEach(
    ([setting, id]) => {
      if ($(id)) {
        $(id).value =
          data.settings[setting];
      }
    }
  );
}

function saveTargets() {
  const ids = [
    "mainTarget",
    "dailyTarget",
    "weeklyTarget",
    "monthlyTarget",
    "yearlyTarget"
  ];

  ids.forEach(id => {
    if ($(id)) {
      let value =
        Number($(id).value);

      if (!Number.isFinite(value) || value < 0) {
        value = 0;
      }

      if (id === "mainTarget" && value < 1) {
        value = TARGET_DEFAULT;
      }

      data.settings[id] = Math.floor(value);
    }
  });

  saveData();

  updateAll();

  setMessage(
    "targetMsg",
    "Targets successfully save થયા. 🎯"
  );
}

/* =========================================================
   THEMES
   ========================================================= */

function setTheme(theme) {
  const allowed = [
    "mahadev",
    "blue",
    "purple",
    "saffron",
    "midnight",
    "forest"
  ];

  if (!allowed.includes(theme)) {
    theme = "mahadev";
  }

  document.body.dataset.theme = theme;

  data.settings.theme = theme;

  saveData();

  if ($("themeSelect")) {
    $("themeSelect").value = theme;
  }

  document
    .querySelectorAll(".theme-tile")
    .forEach(tile => {
      tile.classList.toggle(
        "active",
        tile.dataset.themeChoice === theme
      );
    });
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

async function enableNotifications() {
  if (!("Notification" in window)) {
    setMessage(
      "notificationStatus",
      "આ browser notifications support કરતું નથી."
    );
    return;
  }

  try {
    const permission =
      await Notification.requestPermission();

    data.notificationPermission =
      permission === "granted";

    saveData();

    updateNotificationStatus();

    if (permission === "granted") {
      notify(
        "🕉️ Notifications Enabled",
        "Jaap notifications ચાલુ થઈ ગઈ."
      );
    }

  } catch (err) {
    console.error(err);
  }
}

function updateNotificationStatus() {
  if (!$("notificationStatus")) return;

  if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    $("notificationStatus").textContent =
      "Notifications: ON";
  } else {
    $("notificationStatus").textContent =
      "Notifications: OFF";
  }
}

function notify(title, body) {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) return;

  try {
    new Notification(title, {
      body,
      icon: "icon-192.png"
    });
  } catch (err) {
    console.log(err);
  }
}

function checkSessionNotifications() {
  const n = sessionCount;

  if (
    data.settings.notify108 &&
    n > 0 &&
    n % 108 === 0
  ) {
    notify(
      "🕉️ 108 Jaap",
      `${formatNumber(n)} Jaap completed.`
    );
  }

  if (
    data.settings.notify1000 &&
    n > 0 &&
    n % 1000 === 0
  ) {
    notify(
      "🔥 1,000 Jaap",
      `${formatNumber(n)} Jaap completed.`
    );
  }
}

function checkNotifications(date) {
  const count = getDayCount(date);

  const dailyTarget =
    Number(data.settings.dailyTarget || 0);

  if (
    data.settings.notifyDaily &&
    dailyTarget > 0 &&
    count >= dailyTarget
  ) {
    notify(
      "🎯 Daily Target Completed",
      `આજે ${formatNumber(count)} Jaap થયા.`
    );
  }
}

/* =========================================================
   PROFILE
   ========================================================= */

function createUserId() {
  if (data.settings.userId) {
    return data.settings.userId;
  }

  const random =
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

  data.settings.userId =
    "JAAP-" + random;

  saveData();

  return data.settings.userId;
}

function updateProfileUI() {
  const id = createUserId();

  if ($("profileName")) {
    $("profileName").textContent =
      data.settings.userName ||
      "નામ સેટ નથી";
  }

  if ($("profileId")) {
    $("profileId").textContent = id;
  }
}

function changeName() {
  const oldName =
    data.settings.userName || "";

  const name =
    prompt(
      "તમારું નામ નાખો:",
      oldName
    );

  if (name === null) return;

  const clean =
    name.trim().slice(0, 50);

  if (!clean) {
    alert("નામ ખાલી ન રાખો.");
    return;
  }

  data.settings.userName = clean;

  createUserId();

  saveData();

  updateProfileUI();
}

/* =========================================================
   PIN LOCK
   ========================================================= */

function setupPINLock() {
  updatePinUI();

  if ($("unlockBtn")) {
    $("unlockBtn")
      .addEventListener(
        "click",
        unlockApp
      );
  }

  if ($("unlockPin")) {
    $("unlockPin")
      .addEventListener("keydown", e => {
        if (e.key === "Enter") {
          unlockApp();
        }
      });
  }

  if (data.settings.pin) {
    $("pinLock")?.classList.remove("hidden");
  }
}

function setPIN() {
  const input =
    $("pinInput");

  if (!input) return;

  const pin =
    input.value.trim();

  if (!/^\d{4,12}$/.test(pin)) {
    alert(
      "PIN 4 થી 12 digits હોવો જોઈએ."
    );
    return;
  }

  data.settings.pin = pin;

  saveData();

  input.value = "";

  updatePinUI();

  alert("PIN successfully set. 🔐");

  $("pinLock")
    ?.classList.remove("hidden");
}

function removePIN() {
  if (!data.settings.pin) {
    alert("PIN Lock પહેલેથી OFF છે.");
    return;
  }

  const pin =
    prompt("હાલનો PIN નાખો:");

  if (pin !== data.settings.pin) {
    alert("PIN ખોટો છે.");
    return;
  }

  data.settings.pin = "";

  saveData();

  updatePinUI();

  alert("PIN Lock removed. 🔓");
}

function unlockApp() {
  const entered =
    $("unlockPin")?.value || "";

  if (entered === data.settings.pin) {
    $("pinLock")
      .classList.add("hidden");

    $("unlockPin").value = "";

    $("unlockMsg").textContent = "";
  } else {
    $("unlockMsg").textContent =
      "❌ PIN ખોટો છે.";
  }
}

function updatePinUI() {
  if ($("pinStatus")) {
    $("pinStatus").textContent =
      data.settings.pin
        ? "PIN Lock: ON"
        : "PIN Lock: OFF";
  }
}

/* =========================================================
   SHARE PROGRESS
   ========================================================= */

function getShareText() {
  const total = getTotal();

  const target =
    Number(data.settings.mainTarget || 0);

  const progress =
    target
      ? ((total / target) * 100).toFixed(6)
      : "0";

  const today =
    getDayCount(todayISO());

  const name =
    data.settings.userName ||
    "મારો";

  return `
🕉️ Om Namah Shivay 🕉️

${name} Jaap Progress

📅 આજનો Jaap: ${formatNumber(today)}
🕉️ કુલ Jaap: ${formatNumber(total)}
🎯 Target: ${formatNumber(target)}
📊 Progress: ${progress}%

Har Har Mahadev 🔱
`.trim();
}

function updateSharePreview() {
  if ($("sharePreview")) {
    $("sharePreview").textContent =
      getShareText();
  }
}

async function shareProgress() {
  const text = getShareText();

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Om Namah Shivay Jaap Progress",
        text
      });
    } catch {
      // User cancelled
    }
  } else {
    await copyText(text);
    alert(
      "Share support નથી, તેથી progress copy થઈ ગયો. 📋"
    );
  }
}

async function copyProgress() {
  await copyText(getShareText());

  alert("Progress copy થયો. 📋");
}

async function copyText(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = text;

  document.body.appendChild(textarea);

  textarea.select();

  document.execCommand("copy");

  textarea.remove();
}

/* =========================================================
   PROGRESS CARD
   ========================================================= */

function downloadProgressCard() {
  const canvas =
    document.createElement("canvas");

  canvas.width = 1200;
  canvas.height = 630;

  const ctx =
    canvas.getContext("2d");

  const total = getTotal();

  const target =
    Number(data.settings.mainTarget || 0);

  const progress =
    target
      ? ((total / target) * 100)
      : 0;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "bold 70px sans-serif";

  ctx.fillText(
    "ॐ",
    600,
    120
  );

  ctx.font = "bold 48px sans-serif";

  ctx.fillText(
    "Om Namah Shivay",
    600,
    190
  );

  ctx.font = "32px sans-serif";

  ctx.fillText(
    `Total Jaap: ${formatNumber(total)}`,
    600,
    270
  );

  ctx.fillText(
    `Target: ${formatNumber(target)}`,
    600,
    325
  );

  ctx.fillText(
    `Progress: ${progress.toFixed(6)}%`,
    600,
    380
  );

  ctx.fillText(
    "Har Har Mahadev 🔱",
    600,
    470
  );

  const link =
    document.createElement("a");

  link.download =
    "om-namah-shivay-progress.png";

  link.href =
    canvas.toDataURL("image/png");

  link.click();
}

/* =========================================================
   BACKUP
   ========================================================= */

function downloadBackup() {
  const backup = {
    app: "Om Namah Shivay Jaap Counter",
    version: data.version,
    exportedAt: new Date().toISOString(),
    data
  };

  const blob =
    new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

  downloadBlob(
    blob,
    `jaap-backup-${todayISO()}.json`
  );
}

function restoreBackup(event) {
  const file =
    event.target.files?.[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = () => {
    try {
      const imported =
        JSON.parse(reader.result);

      const importedData =
        imported.data || imported;

      if (
        !importedData ||
        typeof importedData !== "object"
      ) {
        throw new Error("Invalid backup");
      }

      if (
        !confirm(
          "Backup restore કરશો? હાલનો data overwrite થઈ શકે છે."
        )
      ) {
        event.target.value = "";
        return;
      }

      data = {
        ...structuredClone(DEFAULT_DATA),
        ...importedData,
        settings: {
          ...structuredClone(DEFAULT_DATA.settings),
          ...(importedData.settings || {})
        }
      };

      saveData();

      updateAll();

      alert(
        "Backup successfully restore થયો. ✅"
      );

    } catch (err) {
      console.error(err);

      alert(
        "Backup file valid નથી."
      );
    }

    event.target.value = "";
  };

  reader.readAsText(file);
}

/* =========================================================
   CSV
   ========================================================= */

function exportCSV() {
  const rows = [
    ["Date", "Jaap Count"]
  ];

  Object.keys(data.records)
    .sort()
    .forEach(date => {
      rows.push([
        date,
        data.records[date]
      ]);
    });

  const csv =
    rows
      .map(row =>
        row
          .map(value =>
            `"${String(value)
              .replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

  const blob =
    new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8" }
    );

  downloadBlob(
    blob,
    `jaap-records-${todayISO()}.csv`
  );
}

/* =========================================================
   DELETE ALL
   ========================================================= */

function clearAllData() {
  const first =
    confirm(
      "⚠️ બધા Jaap records delete કરવા છે?"
    );

  if (!first) return;

  const second =
    confirm(
      "આ action પાછું undo કરવું મુશ્કેલ હોઈ શકે છે. ખરેખર Delete All?"
    );

  if (!second) return;

  data.deletedRecord = null;
  data.records = {};

  saveData();

  updateAll();

  alert(
    "બધા Jaap records delete થઈ ગયા."
  );
}

/* =========================================================
   PWA
   ========================================================= */

let deferredInstallPrompt = null;

function setupPWA() {

  window.addEventListener(
    "beforeinstallprompt",
    e => {
      e.preventDefault();

      deferredInstallPrompt = e;

      if ($("installMsg")) {
        $("installMsg").textContent =
          "PWA install કરી શકાય છે. 📱";
      }
    }
  );

  if ($("installApp")) {
    $("installApp")
      .addEventListener(
        "click",
        installPWA
      );
  }

  window.addEventListener(
    "appinstalled",
    () => {
      deferredInstallPrompt = null;

      if ($("installMsg")) {
        $("installMsg").textContent =
          "App installed successfully. ✅";
      }
    }
  );

  if ("serviceWorker" in navigator) {
    window.addEventListener(
      "load",
      () => {
        navigator.serviceWorker
          .register("sw.js")
          .then(() => {
            if ($("appStatus")) {
              $("appStatus").textContent =
                "Offline Ready";
            }
          })
          .catch(err => {
            console.log(
              "Service Worker:",
              err
            );
          });
      }
    );
  }
}

async function installPWA() {
  if (!deferredInstallPrompt) {
    alert(
      "Browser હાલમાં install prompt આપી રહ્યું નથી. Browser menu માં 'Install App' અથવા 'Add to Home Screen' જુઓ."
    );
    return;
  }

  deferredInstallPrompt.prompt();

  await deferredInstallPrompt.userChoice;

  deferredInstallPrompt = null;
}

/* =========================================================
   UTILITIES
   ========================================================= */

function toISO(date) {
  const y =
    date.getFullYear();

  const m =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const d =
    String(date.getDate())
      .padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function setMessage(id, message, error = false) {
  const el = $(id);

  if (!el) return;

  el.textContent = message;

  el.classList.toggle(
    "error",
    error
  );

  clearTimeout(el._timer);

  el._timer =
    setTimeout(() => {
      el.textContent = "";
    }, 5000);
}

function downloadBlob(blob, filename) {
  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/* =========================================================
   UPDATE EVERYTHING
   ========================================================= */

function updateAll() {
  updateHeader();
  updateSmartTarget();
  updateQuickStats();
  updateStatistics();
  updateSharePreview();
  updateProfileUI();
  updatePinUI();
  updateNotificationStatus();

  renderCalendar();
  renderRecords();
  renderAchievements();
  renderReports();
}

/* =========================================================
   WINDOW RESIZE
   ========================================================= */

let resizeTimer;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer =
    setTimeout(() => {
      renderGraphs();
    }, 200);
});

/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener("keydown", e => {

  /* Space = Jaap */

  if (
    e.code === "Space" &&
    !$("pinLock")?.classList.contains("hidden")
  ) {
    return;
  }

  if (
    e.code === "Space" &&
    document.activeElement?.tagName !== "INPUT" &&
    document.activeElement?.tagName !== "TEXTAREA" &&
    sessionRunning &&
    !sessionPaused
  ) {
    e.preventDefault();

    incrementSession(1);
  }

  /* Enter = Jaap */

  if (
    e.key === "Enter" &&
    document.activeElement?.tagName !== "INPUT" &&
    sessionRunning &&
    !sessionPaused
  ) {
    incrementSession(1);
  }
});

/* =========================================================
   VISIBILITY
   ========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) {
      saveData();
    }
  }
);

window.addEventListener(
  "beforeunload",
  () => {
    saveData();
  }
);

/* =========================================================
   INITIALIZATION
   ========================================================= */

function init() {

  /* Theme */

  setTheme(
    data.settings.theme || "mahadev"
  );

  /* Navigation */

  setupNavigation();

  /* Calendar */

  setupCalendarNavigation();

  /* Add */

  setupAddJaap();

  /* Live */

  setupLiveJaap();

  /* Modal */

  setupModal();

  /* Audio */

  setupAudio();

  /* Settings */

  setupSettings();

  /* Reports */

  setupReportTabs();

  /* Yoga */

  setupYoga();

  /* PIN */

  setupPINLock();

  /* First screen */

  showPage("calendar");

  document
    .querySelector(
      '.nav[data-page="calendar"]'
    )
    ?.classList.add("active");

  /* Full update */

  updateAll();

  /* Graph after layout */

  setTimeout(() => {
    renderGraphs();
  }, 300);

  console.log(
    "🕉️ Om Namah Shivay Jaap Counter initialized."
  );
}

/* =========================================================
   START
   ========================================================= */

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init
  );
} else {
  init();
}
