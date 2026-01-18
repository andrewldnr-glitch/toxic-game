console.log("ENGINE LOADED");

const loadingScreen = document.getElementById("loadingScreen");
const levelScreen = document.getElementById("levelScreen");
const prepScreen = document.getElementById("prepScreen");
const gameContainer = document.getElementById("gameContainer");
const startGameBtn = document.getElementById("startGameBtn");

let realButton = null;

// === LOADING → LEVEL ===
setTimeout(() => {
  loadingScreen.style.display = "none";
  levelScreen.style.display = "flex";
  console.log("LEVEL SCREEN SHOWN");
}, 1500);

// === LEVEL → PREP ===
document.querySelectorAll("[data-level]").forEach(btn => {
  btn.addEventListener("click", () => {
    levelScreen.style.display = "none";
    prepScreen.style.display = "flex";
    console.log("PREP SCREEN SHOWN");
  });
});

// === PREP → GAME ===
startGameBtn.addEventListener("click", () => {
  prepScreen.style.display = "none";
  startGame();
});

// === GAME START ===
function startGame() {
  console.log("GAME STARTED");

  gameContainer.style.display = "block";
  gameContainer.innerHTML = "";

  spawnButton();
}

// === REAL BUTTON ===
function spawnButton() {
  realButton = document.createElement("button");
  realButton.textContent = "НАЖМИ МЕНЯ";

  realButton.style.position = "absolute";
  realButton.style.left = "50%";
  realButton.style.top = "50%";
  realButton.style.transform = "translate(-50%, -50%)";
  realButton.style.padding = "20px 40px";
  realButton.style.fontSize = "20px";

  realButton.onclick = () => {
    alert("КНОПКА РАБОТАЕТ");
  };

  gameContainer.appendChild(realButton);
}
