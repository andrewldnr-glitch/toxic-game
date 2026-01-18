/* Toxic Game — Telegram Mini App friendly build */
console.log("ENGINE LOADED");

const el = {
  loadingScreen: document.getElementById("loadingScreen"),
  levelScreen: document.getElementById("levelScreen"),
  prepScreen: document.getElementById("prepScreen"),
  gameScreen: document.getElementById("gameScreen"),
  toast: document.getElementById("toast"),
  playfield: document.getElementById("playfield"),
  resultScreen: document.getElementById("resultScreen"),

  startGameBtn: document.getElementById("startGameBtn"),
  backToLevelsBtn: document.getElementById("backToLevelsBtn"),
  retryBtn: document.getElementById("retryBtn"),
  chooseLevelBtn: document.getElementById("chooseLevelBtn"),

  scoreText: document.getElementById("scoreText"),
  timerText: document.getElementById("timerText"),
  levelText: document.getElementById("levelText"),
  selectedLevelText: document.getElementById("selectedLevel"),
  resultText: document.getElementById("resultText"),
};

// ===== Telegram integration (optional) =====
const tg = window.Telegram?.WebApp;

function applyTelegramTheme() {
  if (!tg) return;

  const tp = tg.themeParams || {};
  // Это не полный набор, но достаточно, чтобы подстроиться под тему.
  if (tp.bg_color) document.documentElement.style.setProperty("--tg-bg", tp.bg_color);
  if (tp.text_color) document.documentElement.style.setProperty("--tg-text", tp.text_color);
  if (tp.hint_color) document.documentElement.style.setProperty("--tg-hint", tp.hint_color);

  // Мягко подстраиваем базовый градиент под фон Telegram, если возможно.
  if (tp.bg_color) document.documentElement.style.setProperty("--bg1", tp.bg_color);
}

function haptic(type = "light") {
  // type: 'light' | 'medium' | 'heavy'
  try {
    tg?.HapticFeedback?.impactOccurred?.(type);
  } catch (_) {
    // ignore
  }
}

let currentView = "loading";
function setView(view) {
  const allScreens = [el.loadingScreen, el.levelScreen, el.prepScreen, el.resultScreen];
  allScreens.forEach(s => s.classList.remove("is-active"));
  el.gameScreen.classList.remove("is-active");

  if (view === "game") el.gameScreen.classList.add("is-active");
  else {
    const map = {
      loading: el.loadingScreen,
      level: el.levelScreen,
      prep: el.prepScreen,
      result: el.resultScreen,
    };
    map[view]?.classList.add("is-active");
  }

  currentView = view;
  syncTelegramBackButton();
}

function syncTelegramBackButton() {
  if (!tg?.BackButton) return;
  if (currentView === "game" || currentView === "prep" || currentView === "result") tg.BackButton.show();
  else tg.BackButton.hide();
}

if (tg) {
  tg.ready();
  tg.expand();
  applyTelegramTheme();

  // В некоторых версиях доступно: tg.onEvent('themeChanged', ...)
  try {
    tg.onEvent?.("themeChanged", applyTelegramTheme);
  } catch (_) {}

  try {
    tg.BackButton.onClick(() => {
      if (currentView === "game") {
        stopGame({ showResult: false });
        setView("level");
        return;
      }
      if (currentView === "prep" || currentView === "result") {
        setView("level");
        return;
      }
      // если мы на уровне/загрузке — просто закрываем мини-апп
      tg.close();
    });
  } catch (_) {}
}

// ===== Game config =====
const levelConfig = {
  easy:   { label: "Лёгкий",   fakeMax: 2, moveChance: 0.40, sizeScale: 1.10 },
  medium: { label: "Средний", fakeMax: 3, moveChance: 0.60, sizeScale: 1.00 },
  hard:   { label: "Сложный", fakeMax: 4, moveChance: 0.75, sizeScale: 0.90 },
  insane: { label: "Безумие", fakeMax: 5, moveChance: 0.90, sizeScale: 0.80 },
};

let selectedLevelKey = "easy";
let selectedLevel = levelConfig[selectedLevelKey];

// ===== State =====
let gameActive = false;
let realButton = null;
let fakeButtons = [];
let score = 0;

let gameStartTime = 0;
let lastClickTime = 0;
let reactionTimesMs = [];
let timerInterval = null;

// ===== Demotivators =====
// Подхватываем библиотеку из demotivators.js (1500 фраз)
const DM = window.TOXIC_DEMOTIVATORS;

// Фолбэк, если библиотека не загрузилась (чтобы игра не падала)
const DM_FALLBACK = {
  tiers: [
    { during: ["Мимо. Вселенная записала."], end: ["Мимо. Попробуй ещё раз."] },
    { during: ["Окей. Дышим."], end: ["Неплохо. Почти."] },
    { during: ["Уже похоже на игру."], end: ["Есть прогресс."] },
    { during: ["Вот это скорость."], end: ["Кнопка нервничает."] },
    { during: ["Я почти горжусь."], end: ["Солидно." ] },
  ],
};

const dmLib = (DM && DM.tiers && DM.tiers.length) ? DM : DM_FALLBACK;

let toastTimer = null;
function showToast(message) {
  if (!el.toast) return;
  el.toast.textContent = message;
  el.toast.classList.add("is-show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast?.classList.remove("is-show");
  }, 1350);
}

function pickRandom(arr) {
  if (!arr || !arr.length) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSofteningTier({ score, totalSeconds }) {
  // Прогресс: очки + маленький бонус за то, что просто живёшь
  const p = score + totalSeconds * 0.25;

  // Пороги под уровень (чтобы на сложном не зависать в самом жёстком тире навсегда)
  const thresholds = {
    easy:   [4, 10, 18, 28],
    medium: [3,  8, 14, 22],
    hard:   [3,  7, 12, 18],
    insane: [2,  6, 10, 15],
  }[selectedLevelKey] || [4, 10, 18, 28];

  if (p < thresholds[0]) return 0;
  if (p < thresholds[1]) return 1;
  if (p < thresholds[2]) return 2;
  if (p < thresholds[3]) return 3;
  return 4;
}

function getDemotivatorLine(type, { score, totalSeconds }) {
  const tier = getSofteningTier({ score, totalSeconds });
  const pool = dmLib.tiers[tier] || dmLib.tiers[0];
  const list = (type === "end") ? pool.end : pool.during;
  return pickRandom(list) || pickRandom(dmLib.tiers[0]?.end) || "";
}

// ===== UI flow =====
setView("loading");
setTimeout(() => setView("level"), 1200);

// выбор уровня
document.querySelectorAll("[data-level]").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.level;
    if (!levelConfig[key]) return;

    selectedLevelKey = key;
    selectedLevel = levelConfig[selectedLevelKey];

    el.selectedLevelText.textContent = selectedLevel.label;
    el.levelText.textContent = `Уровень: ${selectedLevel.label}`;

    setView("prep");
  });
});

el.backToLevelsBtn.addEventListener("click", () => setView("level"));

el.startGameBtn.addEventListener("click", () => {
  startGame();
});

el.retryBtn.addEventListener("click", () => {
  startGame();
});

el.chooseLevelBtn.addEventListener("click", () => {
  stopGame({ showResult: false });
  setView("level");
});

// промах — клик/тап по пустому месту
el.playfield.addEventListener("pointerdown", (e) => {
  if (!gameActive) return;
  if (e.target !== el.playfield) return;
  endGame();
});

// ===== Game =====
function startGame() {
  cleanupPlayfield();

  // убрать старый тост (если остался)
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  if (el.toast) {
    el.toast.classList.remove("is-show");
    el.toast.textContent = "";
  }

  score = 0;
  reactionTimesMs = [];
  gameActive = true;

  gameStartTime = performance.now();
  lastClickTime = gameStartTime;

  el.scoreText.textContent = `Очки: ${score}`;
  el.timerText.textContent = `Время: 0.00s`;
  el.levelText.textContent = `Уровень: ${selectedLevel.label}`;

  setView("game");

  spawnRealButton();
  spawnFakeButtons();
  startTimer();
}

function stopGame({ showResult } = { showResult: false }) {
  gameActive = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  cleanupPlayfield();
  if (!showResult) {
    // просто стоп без экрана результатов
    // (вид переключается снаружи)
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    const elapsed = (performance.now() - gameStartTime) / 1000;
    el.timerText.textContent = `Время: ${elapsed.toFixed(2)}s`;
  }, 33);
}

function cleanupPlayfield() {
  // remove all children (and old listeners)
  el.playfield.innerHTML = "";
  realButton = null;
  fakeButtons = [];
}

function spawnRealButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--real";
  btn.textContent = "ЖМИ";

  const w = 120 * selectedLevel.sizeScale;
  const h = 60 * selectedLevel.sizeScale;
  const fz = 18 * selectedLevel.sizeScale;
  styleButton(btn, w, h, fz);

  el.playfield.appendChild(btn);
  moveButton(btn);

  const onPress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!gameActive) return;

    score++;
    const now = performance.now();
    reactionTimesMs.push(now - lastClickTime);
    lastClickTime = now;

    el.scoreText.textContent = `Очки: ${score}`;
    btn.textContent = `ЖМИ (${score})`;

    // Демотиватор во время игры (реже, чтобы не раздражал)
    const totalSeconds = (now - gameStartTime) / 1000;
    if (score === 1 || score % 3 === 0 || Math.random() < 0.22) {
      const line = getDemotivatorLine("during", { score, totalSeconds });
      if (line) showToast(line);
    }

    haptic("light");

    spawnFakeButtons();
    if (Math.random() < selectedLevel.moveChance) moveButton(btn);
  };

  btn.addEventListener("pointerdown", onPress);
  btn.addEventListener("click", onPress);

  realButton = btn;
}

function spawnFakeButtons() {
  // remove old fakes
  fakeButtons.forEach(b => b.remove());
  fakeButtons = [];

  const count = Math.min(selectedLevel.fakeMax, Math.floor(score / 2) + 1);
  const texts = ["ЖМИ", "ЖМи", "ЖМИ!", "ЖМИ?"];

  for (let i = 0; i < count; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--fake";
    btn.textContent = texts[Math.floor(Math.random() * texts.length)];

    const sizeMod = selectedLevel.sizeScale * (0.80 + Math.random() * 0.40);
    const w = 120 * sizeMod;
    const h = 60 * sizeMod;
    const fz = 18 * sizeMod;
    styleButton(btn, w, h, fz);

    el.playfield.appendChild(btn);
    placeAwayFromReal(btn);

    const onFail = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!gameActive) return;
      haptic("heavy");
      endGame();
    };

    btn.addEventListener("pointerdown", onFail);
    btn.addEventListener("click", onFail);

    fakeButtons.push(btn);
  }
}

function endGame() {
  if (!gameActive) return;
  gameActive = false;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const totalSeconds = (performance.now() - gameStartTime) / 1000;

  const avgSeconds = reactionTimesMs.length
    ? (reactionTimesMs.reduce((a, b) => a + b, 0) / reactionTimesMs.length) / 1000
    : 0;

  const demotivator = getDemotivatorLine("end", { score, totalSeconds });

  // best score per level
  const bestKey = "toxic_best_v1";
  const bestByLevel = safeJsonParse(localStorage.getItem(bestKey)) || {};
  const prev = bestByLevel[selectedLevelKey];

  const current = {
    score,
    avg: avgSeconds,
    total: totalSeconds,
    at: Date.now(),
  };

  const isBetter = !prev
    || (current.score > prev.score)
    || (current.score === prev.score && current.avg < prev.avg);

  if (isBetter) bestByLevel[selectedLevelKey] = current;
  try { localStorage.setItem(bestKey, JSON.stringify(bestByLevel)); } catch (_) {}

  cleanupPlayfield();

  const best = bestByLevel[selectedLevelKey];
  const bestLine = best
    ? `<br><br><small style="opacity:.85">Лучшее на этом уровне: <b>${best.score}</b> (ср. реакция <b>${Number(best.avg).toFixed(2)}s</b>)</small>`
    : "";

  el.resultText.innerHTML =
    `Очков: <b>${score}</b>`
    + `<br>Среднее время реакции: <b>${avgSeconds.toFixed(2)}s</b>`
    + `<br>Время в игре: <b>${totalSeconds.toFixed(2)}s</b>`
    + `<br><i>${demotivator}</i>`
    + bestLine;

  setView("result");
}

// ===== Helpers =====
function styleButton(btn, w, h, fz) {
  btn.style.width = `${w}px`;
  btn.style.height = `${h}px`;
  btn.style.fontSize = `${fz}px`;
}

function moveButton(btn) {
  const rect = el.playfield.getBoundingClientRect();
  const w = parseFloat(btn.style.width) || 120;
  const h = parseFloat(btn.style.height) || 60;

  const maxX = Math.max(0, rect.width - w);
  const maxY = Math.max(0, rect.height - h);

  btn.style.left = `${Math.random() * maxX}px`;
  btn.style.top = `${Math.random() * maxY}px`;
}

function placeAwayFromReal(btn) {
  if (!realButton) {
    moveButton(btn);
    return;
  }

  const rect = el.playfield.getBoundingClientRect();
  const w = parseFloat(btn.style.width) || 120;
  const h = parseFloat(btn.style.height) || 60;

  // координаты реальной кнопки относительно playfield
  const realX = realButton.offsetLeft;
  const realY = realButton.offsetTop;
  const realW = parseFloat(realButton.style.width) || realButton.offsetWidth;
  const realH = parseFloat(realButton.style.height) || realButton.offsetHeight;

  const maxX = Math.max(0, rect.width - w);
  const maxY = Math.max(0, rect.height - h);

  let tries = 0;
  let x = 0;
  let y = 0;

  const padding = 10; // небольшой зазор

  do {
    x = Math.random() * maxX;
    y = Math.random() * maxY;
    tries++;
  } while (
    boxesOverlap(x, y, w, h, realX - padding, realY - padding, realW + padding * 2, realH + padding * 2)
    && tries < 50
  );

  btn.style.left = `${x}px`;
  btn.style.top = `${y}px`;
}

function boxesOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(
    ax + aw < bx ||
    ax > bx + bw ||
    ay + ah < by ||
    ay > by + bh
  );
}

function safeJsonParse(str) {
  try { return JSON.parse(str); } catch (_) { return null; }
}
