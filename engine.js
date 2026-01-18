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

// === START ===
startGameBtn.addEventListener("click", () => {
  prepScreen.style.display = "none";
  startGame();
});

function startGame() {
  console.log("GAME STARTED");

  score = 0;
  gameActive = true;

  resultScreen.style.display = "none";
  gameContainer.innerHTML = "";
  gameContainer.style.display = "block";

  spawnButton();
}

function spawnButton() {
  realButton = document.createElement("button");
  realButton.textContent = "ЖМИ";

  realButton.style.position = "absolute";
  realButton.style.width = "120px";
  realButton.style.height = "60px";
  realButton.style.fontSize = "18px";
  realButton.style.cursor = "pointer";

  moveButton();

  realButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!gameActive) return;

    score++;
    moveButton();
  });

  gameContainer.appendChild(realButton);
}

function moveButton() {
  const rect = gameContainer.getBoundingClientRect();
  const btnW = 120;
  const btnH = 60;

  const x = Math.random() * (rect.width - btnW);
  const y = Math.random() * (rect.height - btnH);

  realButton.style.left = x + "px";
  realButton.style.top = y + "px";
}

// === MISS CLICK ===
gameContainer.addEventListener("click", () => {
  if (!gameActive) return;
  endGame();
});

function endGame() {
  console.log("GAME OVER");

  gameActive = false;
  if (realButton) realButton.remove();

  gameContainer.style.display = "none";
  resultText.textContent = `Очков: ${score}. Могло быть хуже.`;
  resultScreen.style.display = "flex";
}

retryBtn.addEventListener("click", () => {
  resultScreen.style.display = "none";
  startGame();
});
