console.log("ENGINE LOADED");
const loadingScreen = document.getElementById("loadingScreen");
const levelScreen = document.getElementById("levelScreen");

setTimeout(() => {
  loadingScreen.style.display = "none";
  levelScreen.style.display = "flex";
  console.log("LOADING HIDDEN, LEVEL SCREEN SHOWN");
}, 1500);

const gameContainer = document.getElementById("gameContainer");
const scoreText = document.getElementById("scoreText");
const timerText = document.getElementById("timerText");
const prepScreen = document.getElementById("prepScreen");

let gameActive = false;
let realButton = null;
let startTime = 0;
let score = 0;

// === СТАРТ ИГРЫ ===
function startGame() {
  // 1. Полный сброс
  gameContainer.innerHTML = "";
  gameContainer.style.display = "block";
  score = 0;
  scoreText.textContent = "Очки: 0";
  timerText.textContent = "Время: 0.00s";
  gameActive = false; // ВАЖНО

  // 2. Создаём кнопку СРАЗУ
  spawnRealButton();

  // 3. Только теперь запускаем игру
  startTime = performance.now();
  gameActive = true;

  // 4. И только теперь разрешаем ловить промахи
  setTimeout(() => {
    document.addEventListener("click", handleMissClick);
  }, 100);
}

// === ПРОИГРЫШ ===
function endGame() {
  if (!gameActive) return;

  gameActive = false;
  document.removeEventListener("click", handleMissClick);

  gameContainer.innerHTML = "";

  const msg = document.createElement("div");
  msg.style.position = "absolute";
  msg.style.top = "40%";
  msg.style.left = "50%";
  msg.style.transform = "translateX(-50%)";
  msg.style.fontSize = "20px";
  msg.textContent = "Ты проиграл. Но ты и не надеялся, да?";
  gameContainer.appendChild(msg);

  const restart = document.createElement("button");
  restart.textContent = "Вернись и докажи";
  restart.style.marginTop = "20px";
  restart.onclick = startGame;
  msg.appendChild(document.createElement("br"));
  msg.appendChild(restart);
}

// === ПРОМАХ ===
function handleMissClick(e) {
  if (!gameActive) return;
  if (!realButton) return;

  if (!e.target.classList.contains("correct")) {
    endGame();
  }
}

// === РЕАЛЬНАЯ КНОПКА ===
function spawnRealButton() {
  realButton = document.createElement("button");
  realButton.className = "correct";
  realButton.textContent = "ЖМИ";

  realButton.style.position = "absolute";
  realButton.style.width = "120px";
  realButton.style.height = "60px";
  realButton.style.left = "50%";
  realButton.style.top = "50%";
  realButton.style.transform = "translate(-50%, -50%)";

  realButton.onclick = (e) => {
    e.stopPropagation();
    score++;
    scoreText.textContent = "Очки: " + score;

    moveButton();
  };

  gameContainer.appendChild(realButton);
}

// === ДВИЖЕНИЕ КНОПКИ ===
function moveButton() {
  const rect = gameContainer.getBoundingClientRect();
  const x = Math.random() * (rect.width - 120);
  const y = Math.random() * (rect.height - 60);

  realButton.style.left = x + "px";
  realButton.style.top = y + "px";
  realButton.style.transform = "none";
}

// === КНОПКА "НАЧАТЬ ИГРУ" ===
document.getElementById("startGameBtn").onclick = () => {
  prepScreen.style.display = "none";
  startGame();
};
