console.log("ENGINE LOADED");

const loadingScreen = document.getElementById("loadingScreen");
const levelScreen = document.getElementById("levelScreen");
const prepScreen = document.getElementById("prepScreen");
const gameContainer = document.getElementById("gameContainer");
const startGameBtn = document.getElementById("startGameBtn");

let realButton = null;
let score = 0;

// === LOADING → LEVEL ===
setTimeout(() => {
  loadingScreen.style.display = "none";
  levelScreen.style.display = "flex";
}, 1200);

// === LEVEL → PREP ===
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
  gameContainer.innerHTML = "";
  gameContainer.style.display = "block";

  spawnButton();
}

// === SPAWN REAL BUTTON ===
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
    score++;
    realButton.textContent = `ЖМИ (${score})`;
    moveButton();
  });

  gameContainer.appendChild(realButton);
}

// === MOVE BUTTON INSIDE CONTAINER ===
function moveButton() {
  const rect = gameContainer.getBoundingClientRect();
  const btnWidth = 120;
  const btnHeight = 60;

  const x = Math.random() * (rect.width - btnWidth);
  const y = Math.random() * (rect.height - btnHeight);

  realButton.style.left = x + "px";
  realButton.style.top = y + "px";
}
