// === Переменные ===
const gameContainer = document.getElementById("gameContainer");
const scoreText = document.getElementById("scoreText");
const timerText = document.getElementById("timerText");
const loadingScreen = document.getElementById("loadingScreen");
const levelScreen = document.getElementById("levelScreen");
const prepScreen = document.getElementById("prepScreen");
const prepMessage = document.getElementById("prepMessage");
const startGameBtn = document.getElementById("startGameBtn");

let score = 0;
let times = [];
let startTime = 0;
let realButton = null;
let fakeButtons = [];
let gameActive = false;
let level = "easy";

// === Демотиваторы ===
const demotivators = [
  { text: "Ты даже пальцем не шевельнул", minTime: 0, maxTime: 2 },
  { text: "Ого… это твой максимум?", minTime: 0, maxTime: 2 },
  { text: "Серьезно? Даже не начал", minTime: 0, maxTime: 2 },
  { text: "Ты думаешь это игра для слабаков?", minTime: 2, maxTime: 4 },
  { text: "Неплохо… но смешно", minTime: 2, maxTime: 4 },
  { text: "Хм, почти смог… можешь лучше", minTime: 4, maxTime: 6 },
  { text: "Теперь ты начинаешь понимать, о чём игра", minTime: 4, maxTime: 6 },
  { text: "Уже не так плохо… но попробуй снова", minTime: 6, maxTime: 8 },
  { text: "Ты почти стал достойным", minTime: 6, maxTime: 8 },
  { text: "Боже, это удивительно… ещё немного!", minTime: 8, maxTime: 10 },
  { text: "Ты настоящий мастер… или думаешь, что таковым?", minTime: 8, maxTime: 10 }
  // сюда можно добавить остальные 1000 демотиваторов
];

// === Старт после загрузки ===
window.addEventListener("DOMContentLoaded", () => {
  // 1. Загрузка
  setTimeout(() => {
    loadingScreen.style.display = "none";
    levelScreen.style.display = "flex";
  }, 1500);

  // 2. Выбор уровня
  document.querySelectorAll(".levelButtons button").forEach(btn => {
    btn.addEventListener("click", () => {
      level = btn.getAttribute("data-level");
      levelScreen.style.display = "none";
      prepScreen.style.display = "flex";
      prepMessage.textContent = getPrepMessage(level);
    });
  });

  // 3. Подготовка и старт игры
  startGameBtn.addEventListener("click", () => {
    prepScreen.style.display = "none";
    startGame();
  });
});

// === Подготовительные сообщения ===
function getPrepMessage(lvl) {
  const messages = {
    easy: "Ты выбрал лёгкий путь... не обольщайся!",
    medium: "Средний? Думаешь справишься?",
    hard: "Сложный, но кто предупреждал?",
    insane: "Безумие. Вернись пока не поздно!"
  };
  return messages[lvl] || "Готов? Ну давай...";
}

// === Начало игры ===
function startGame() {
  score = 0;
  times = [];
  scoreText.textContent = "Очки: 0";
  timerText.textContent = "Время: 0.00s";
  gameContainer.style.display = "block";
  gameContainer.innerHTML = "";
  gameActive = true;
  startTime = performance.now();

  spawnRealButton();
  document.addEventListener("click", handleMissClick);
}

// === Конец игры ===
function endGame() {
  gameActive = false;
  document.removeEventListener("click", handleMissClick);

  const elapsed = (performance.now() - startTime) / 1000;
  const avgTime = times.length > 0 ? (times.reduce((a,b)=>a+b,0)/times.length)/1000 : 0;

  // Демотиватор по времени
  const phrases = demotivators.filter(d => elapsed >= d.minTime && elapsed < d.maxTime);
  const phrase = phrases[Math.floor(Math.random()*phrases.length)] || { text: "Ну что же, попробуй снова!" };

  // Убираем кнопки
  if(realButton) realButton.remove();
  fakeButtons.forEach(btn=>btn.remove());
  fakeButtons = [];

  // Таймер и демотиватор
  const timerMsg = document.createElement("p");
  timerMsg.textContent = `Среднее время: ${avgTime.toFixed(2)}s`;
  timerMsg.style.position = "absolute";
  timerMsg.style.top = "20%";
  timerMsg.style.left = "50%";
  timerMsg.style.transform = "translateX(-50%)";
  timerMsg.style.color = "#fff";
  timerMsg.style.fontSize = "16px";
  timerMsg.style.textAlign = "center";
  gameContainer.appendChild(timerMsg);

  const demotMsg = document.createElement("p");
  demotMsg.textContent = phrase.text;
  demotMsg.style.position = "absolute";
  demotMsg.style.top = "30%";
  demotMsg.style.left = "50%";
  demotMsg.style.transform = "translateX(-50%)";
  demotMsg.style.color = "#fff";
  demotMsg.style.fontSize = "18px";
  demotMsg.style.fontWeight = "700";
  demotMsg.style.textAlign = "center";
  gameContainer.appendChild(demotMsg);

  // Кнопка перезапуска
  const restartBtn = document.createElement("button");
  restartBtn.textContent = "Вернись и докажи";
  restartBtn.classList.add("restart");
  restartBtn.style.position = "absolute";
  restartBtn.style.top = "50%";
  restartBtn.style.left = "50%";
  restartBtn.style.transform = "translate(-50%, -50%)";
  restartBtn.addEventListener("click", ()=>{
    timerMsg.remove();
    demotMsg.remove();
    restartBtn.remove();
    startGame();
  });
  gameContainer.appendChild(restartBtn);
}

// === Обработка промаха по пустому месту ===
function handleMissClick(e) {
  if(!gameActive) return;
  if(!e.target.classList.contains("correct") && !e.target.classList.contains("fake")) {
    endGame();
  }
}

// === Создание реальной кнопки ===
function spawnRealButton() {
  if(realButton) realButton.remove();
  realButton = document.createElement("button");
  realButton.classList.add("correct");
  realButton.textContent = "Нажми меня!";
  setButtonSizeAndPosition(realButton);
  realButton.addEventListener("click", e=>{
    e.stopPropagation();
    const elapsed = performance.now() - startTime;
    times.push(elapsed);
    score++;
    scoreText.textContent = `Очки: ${score}`;
    timerText.textContent = `Время: ${(elapsed/1000).toFixed(2)}s`;

    if(Math.random()<0.5) moveButtonSmooth(realButton);
    spawnFakeButtons();
  });
  gameContainer.appendChild(realButton);
  spawnFakeButtons();
}

// === Создание ложных кнопок ===
function spawnFakeButtons() {
  fakeButtons.forEach(btn=>btn.remove());
  fakeButtons = [];
  const maxFakes = { easy:2, medium:3, hard:4, insane:5 }[level]||3;

  for(let i=0;i<maxFakes;i++){
    const fake = document.createElement("button");
    fake.classList.add("fake");
    fake.textContent = ["Ложная","Не та","Ха!","Ты хотел это?"][Math.floor(Math.random()*4)];
    setButtonSizeAndPosition(fake);
    fake.addEventListener("mouseenter", ()=>{
      const rect = gameContainer.getBoundingClientRect();
      const size = parseInt(fake.style.width);
      fake.style.left = Math.random()*(rect.width-size)+"px";
      fake.style.top = Math.random()*(rect.height-size/2)+"px";
    });
    fake.addEventListener("click", e=>{
      e.stopPropagation();
      endGame();
    });
    gameContainer.appendChild(fake);
    fakeButtons.push(fake);
  }
}

// === Размер и позиция кнопки ===
function setButtonSizeAndPosition(btn){
  const rect = gameContainer.getBoundingClientRect();
  const size = Math.max(60,120-score*3);
  btn.style.width = size+"px";
  btn.style.height = size/2+"px";
  btn.style.fontSize = Math.min(Math.floor(size/4),16)+"px";
  btn.style.display = "flex";
  btn.style.justifyContent = "center";
  btn.style.alignItems = "center";
  btn.style.position = "absolute";
  btn.style.left = Math.random()*(rect.width-size)+"px";
  btn.style.top = Math.random()*(rect.height-size/2)+"px";
}

// === Плавное перемещение реальной кнопки ===
function moveButtonSmooth(btn){
  const rect = gameContainer.getBoundingClientRect();
  const size = parseInt(btn.style.width);
  const newX = Math.random()*(rect.width-size);
  const newY = Math.random()*(rect.height-size/2);
  btn.style.transition = "left 0.5s ease, top 0.5s ease";
  btn.style.left = newX+"px";
  btn.style.top = newY+"px";
  setTimeout(()=>{btn.style.transition="";},600);
}
