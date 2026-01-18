console.log("ENGINE LOADED");

const loadingScreen = document.getElementById("loadingScreen");
const levelScreen = document.getElementById("levelScreen");
const prepScreen = document.getElementById("prepScreen");
const gameContainer = document.getElementById("gameContainer");
const startGameBtn = document.getElementById("startGameBtn");
const resultScreen = document.getElementById("resultScreen");
const resultText = document.getElementById("resultText");
const retryBtn = document.getElementById("retryBtn");
const scoreText = document.getElementById("scoreText");
const timerText = document.getElementById("timerText");

let realButton = null;
let fakeButtons = [];
let score = 0;
let gameActive = false;

let startTime = 0;
let timerInterval = null;
let clickTimes = [];

// ===== Демотиваторы =====
const demotivators = [
  "Да ладно, это всё, что ты смог?",
  "Серьёзно? Дальше хуже.",
  "Попробуй ещё раз, может повезёт.",
  "Может, это не твоё?",
  "Ты уже устал, да?",
  "Почти, но не совсем.",
  "Ниже плинтуса.",
  "Даже кот справился бы лучше."
];

function getDemotivator(duration) {
  // Чем дольше играл — тем мягче фраза
  if (duration < 5) return demotivators[6];
  if (duration < 10) return demotivators[4];
  if (duration < 20) return demotivators[2];
  return demotivators[1];
}

// === LOADING ===
setTimeout(() => {
  loadingScreen.style.display = "none";
  levelScreen.style.display = "flex";
}, 1200);

// === LEVEL ===
document.querySelectorAll("[data-level]").forEach(btn => {
  btn.addEventListener("click", () => {
    levelScreen.style.display = "none";
    prepScreen.style.display = "flex";
  });
});

// === PREP → GAME ===
startGameBtn.addEventListener("click", () => {
  prepScreen.style.display = "none";
  startGame();
});

// === START GAME ===
function startGame() {
  score = 0;
  clickTimes = [];
  gameActive = true;
  startTime = performance.now();

  resultScreen.style.display = "none";
  gameContainer.innerHTML = "";
  gameContainer.style.display = "block";
  scoreText.textContent = `Очки: ${score}`;
  timerText.textContent = `Время: 0.00s`;

  spawnRealButton();
  spawnFakeButtons();

  // Таймер
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    timerText.textContent = `Время: ${elapsed.toFixed(2)}s`;
  }, 10);
}

// === SPAWN REAL BUTTON ===
function spawnRealButton() {
  realButton = document.createElement("button");
  realButton.textContent = "ЖМИ";
  styleButton(realButton, 120, 60, 18);
  moveButton(realButton);

  realButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!gameActive) return;

    score++;
    const now = performance.now();
    clickTimes.push(now - startTime);
    startTime = now; // reset для следующего интервала

    realButton.textContent = `ЖМИ (${score})`;

    spawnFakeButtons();

    if (Math.random() < 0.7) moveButton(realButton);
  });

  gameContainer.appendChild(realButton);
}

// === SPAWN FAKE BUTTONS ===
function spawnFakeButtons() {
  fakeButtons.forEach(b => b.remove());
  fakeButtons = [];

  const count = Math.min(3, Math.floor(score / 2) + 1);
  for (let i = 0; i < count; i++) {
    const btn = document.createElement("button");
    const texts = ["ЖМИ", "ЖМи", "ЖМИ!", "ЖМИ?"];
    btn.textContent = texts[Math.floor(Math.random() * texts.length)];

    const sizeMod = 0.8 + Math.random() * 0.4;
    styleButton(btn, 120 * sizeMod, 60 * sizeMod, 18 * sizeMod);

    placeAwayFromReal(btn);

    btn.addEventListener("click", () => {
      if (!gameActive) return;
      endGame();
    });

    gameContainer.appendChild(btn);
    fakeButtons.push(btn);
  }
}

// === HELPERS ===
function styleButton(btn, w, h, fz) {
  btn.style.position = "absolute";
  btn.style.width = w + "px";
  btn.style.height = h + "px";
  btn.style.fontSize = fz + "px";
  btn.style.cursor = "pointer";
}

function moveButton(btn) {
  const rect = gameContainer.getBoundingClientRect();
  const w = parseFloat(btn.style.width);
  const h = parseFloat(btn.style.height);
  const x = Math.random() * (rect.width - w);
  const y = Math.random() * (rect.height - h);
  btn.style.left = x + "px";
  btn.style.top = y + "px";
}

function placeAwayFromReal(btn) {
  if (!realButton) return moveButton(btn);

  const rect = gameContainer.getBoundingClientRect();
  const btnW = parseFloat(btn.style.width);
  const btnH = parseFloat(btn.style.height);
  const realRect = realButton.getBoundingClientRect();

  let tries = 0;
  let x, y;
  do {
    x = Math.random() * (rect.width - btnW);
    y = Math.random() * (rect.height - btnH);
    tries++;
  } while (
    isOverlap(x, y, btnW, btnH, realRect) && tries < 20
  );

  btn.style.left = x + "px";
  btn.style.top = y + "px";
}

function isOverlap(x, y, w, h, realRect) {
  return !(
    x + w < realRect.left ||
    x > realRect.right ||
    y + h < realRect.top ||
    y > realRect.bottom
  );
}

// === CLICK MISS ===
gameContainer.addEventListener("click", () => {
  if (!gameActive) return;
  endGame();
});

// === END GAME ===
function endGame() {
  gameActive = false;
  if (realButton) realButton.remove();
  fakeButtons.forEach(b => b.remove());
  gameContainer.style.display = "none";

  if (timerInterval) clearInterval(timerInterval);

  // Среднее время реакции
  const avg = clickTimes.length
    ? (clickTimes.reduce((a,b)=>a+b,0)/clickTimes.length)/1000
    : 0;

  // Демотиватор
  const totalTime = clickTimes.reduce((a,b)=>a+b,0)/1000;
  const demotivator = getDemotivator(totalTime);

  resultText.innerHTML = `Очков: ${score}<br>Среднее время реакции: ${avg.toFixed(2)}s<br><i>${demotivator}</i>`;
  resultScreen.style.display = "flex";
}

// === RETRY ===
retryBtn.addEventListener("click", () => {
  resultScreen.style.display = "none";
  startGame();
});
