console.log("ENGINE LOADED");

const loadingScreen = document.getElementById("loadingScreen");
const levelScreen = document.getElementById("levelScreen");
const prepScreen = document.getElementById("prepScreen");
const gameContainer = document.getElementById("gameContainer");
const startGameBtn = document.getElementById("startGameBtn");
const resultScreen = document.getElementById("resultScreen");
const resultText = document.getElementById("resultText");
const retryBtn = document.getElementById("retryBtn");

let realButton = null;
let fakeButtons = [];
let score = 0;
let gameActive = false;

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
  gameActive = true;
  resultScreen.style.display = "none";
  gameContainer.innerHTML = "";
  gameContainer.style.display = "block";

  spawnRealButton();
  spawnFakeButtons();
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
    realButton.textContent = `ЖМИ (${score})`;

    // при каждом клике шансы появлений ложных кнопок
    spawnFakeButtons();

    // случайно реальная кнопка перемещается или нет
    if (Math.random() < 0.7) moveButton(realButton);
  });

  gameContainer.appendChild(realButton);
}

// === SPAWN FAKE BUTTONS ===
function spawnFakeButtons() {
  // удалить старые
  fakeButtons.forEach(b => b.remove());
  fakeButtons = [];

  const count = Math.min(3, Math.floor(score / 2) + 1); // чем выше счет, тем больше
  for (let i = 0; i < count; i++) {
    const btn = document.createElement("button");
    const texts = ["ЖМИ", "ЖМи", "ЖМИ!", "ЖМИ?"];
    btn.textContent = texts[Math.floor(Math.random() * texts.length)];

    const sizeMod = 0.8 + Math.random() * 0.4; // 80% - 120%
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

  resultText.textContent = `Очков: ${score}. Могло быть хуже.`;
  resultScreen.style.display = "flex";
}

// === RETRY ===
retryBtn.addEventListener("click", () => {
  resultScreen.style.display = "none";
  startGame();
});
