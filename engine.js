const gameContainer = document.getElementById("gameContainer");
const scoreText = document.getElementById("scoreText");
const timerText = document.getElementById("timerText");
const loadingScreen = document.getElementById("loadingScreen");

let score = 0;
let startTime = 0;
let times = [];
let realButton = null;
let fakeButtons = [];
let gameActive = false;

function startGame() {
  score = 0;
  times = [];
  scoreText.textContent = "Очки: 0";
  timerText.textContent = "Время: 0.00s";
  gameActive = true;

  gameContainer.innerHTML = "";
  gameContainer.style.display = "block";

  spawnButtons();
  startTime = performance.now();

  document.addEventListener("click", handleMissClick);
}

function endGame() {
  gameActive = false;
  document.removeEventListener("click", handleMissClick);

  let avgTime = times.length > 0 ? (times.reduce((a,b)=>a+b,0)/times.length).toFixed(2) : 0;
  alert(`Игра окончена! Очки: ${score}\nСреднее время нажатия: ${avgTime}s`);
  createRestartButton();
}

function createRestartButton() {
  const restartBtn = document.createElement("button");
  restartBtn.textContent = "Начать заново";
  restartBtn.style.position = "absolute";
  restartBtn.style.top = "50%";
  restartBtn.style.left = "50%";
  restartBtn.style.transform = "translate(-50%, -50%)";
  restartBtn.style.fontSize = "18px";
  restartBtn.style.padding = "12px 25px";
  restartBtn.style.borderRadius = "12px";
  restartBtn.style.backgroundColor = "#007aff";
  restartBtn.style.color = "#fff";
  restartBtn.style.cursor = "pointer";
  restartBtn.addEventListener("click", () => {
    restartBtn.remove();
    startGame();
  });
  gameContainer.appendChild(restartBtn);
}

function handleMissClick(e) {
  if (!gameActive) return;
  if (!e.target.classList.contains("correct") && !e.target.classList.contains("fake")) {
    endGame();
  }
}

function spawnButtons() {
  // Убираем старые кнопки
  if(realButton) realButton.remove();
  fakeButtons.forEach(btn => btn.remove());
  fakeButtons = [];

  // Реальная кнопка
  realButton = document.createElement("button");
  realButton.classList.add("correct");
  realButton.textContent = "Нажми меня!";
  setButtonSizeAndPosition(realButton);
  realButton.addEventListener("click", (e)=>{
    e.stopPropagation();
    let elapsed = (performance.now() - startTime)/1000;
    times.push(elapsed);
    score++;
    scoreText.textContent = `Очки: ${score}`;
    timerText.textContent = `Время: ${elapsed.toFixed(2)}s`;

    // Иногда плавное перемещение, иногда исчезает
    if(Math.random()<0.5) {
      moveButtonSmooth(realButton);
    } else {
      realButton.remove();
    }

    spawnFakeButtons();
  });

  gameContainer.appendChild(realButton);

  // Первые ложные кнопки
  spawnFakeButtons();
}

function spawnFakeButtons() {
  const count = Math.min(score+1,5); // не больше 5 ложных кнопок
  for(let i=0;i<count;i++){
    const fake = document.createElement("button");
    fake.classList.add("fake");
    fake.textContent = "Ложная";
    setButtonSizeAndPosition(fake);
    fake.addEventListener("click", (e)=>{
      e.stopPropagation();
      endGame();
    });
    gameContainer.appendChild(fake);
    fakeButtons.push(fake);
  }
}

function setButtonSizeAndPosition(btn) {
  const containerRect = gameContainer.getBoundingClientRect();
  const size = Math.max(60, 120 - score*3); // уменьшаем с ростом очков
  btn.style.width = size + "px";
  btn.style.height = size/2 + "px";
  btn.style.fontSize = Math.floor(size/5) + "px";

  const x = Math.random()*(containerRect.width - size);
  const y = Math.random()*(containerRect.height - size/2);
  btn.style.left = x + "px";
  btn.style.top = y + "px";
}

function moveButtonSmooth(btn) {
  const containerRect = gameContainer.getBoundingClientRect();
  const size = parseInt(btn.style.width);
  const newX = Math.random()*(containerRect.width - size);
  const newY = Math.random()*(containerRect.height - size/2);

  btn.style.transition = "left 0.5s ease, top 0.5s ease";
  btn.style.left = newX + "px";
  btn.style.top = newY + "px";

  setTimeout(()=>{ btn.style.transition=""; }, 600);
}

// Загрузка
setTimeout(()=>{
  loadingScreen.style.display = "none";
  startGame();
}, 1500);
