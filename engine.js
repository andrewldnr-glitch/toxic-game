const loadingScreen = document.getElementById("loadingScreen");
const levelScreen = document.getElementById("levelScreen");
const prepScreen = document.getElementById("prepScreen");
const gameContainer = document.getElementById("gameContainer");

const scoreText = document.getElementById("scoreText");
const timerText = document.getElementById("timerText");
const prepMessage = document.getElementById("prepMessage");
const startGameBtn = document.getElementById("startGameBtn");

let score = 0;
let times = [];
let startTime = 0;
let realButton = null;
let fakeButtons = [];
let gameActive = false;
let level = "easy";

// Загрузка
setTimeout(() => {
  loadingScreen.style.display = "none";
  levelScreen.style.display = "block";
}, 1500);

// Выбор уровня
document.querySelectorAll(".levelButtons button").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    level = btn.getAttribute("data-level");
    levelScreen.style.display = "none";
    prepScreen.style.display = "block";
    prepMessage.textContent = getPrepMessage(level);
  });
});

// Подготовка к игре
startGameBtn.addEventListener("click", ()=>{
  prepScreen.style.display = "none";
  startGame();
});

// Получение саркастического сообщения для уровня
function getPrepMessage(lvl){
  const messages = {
    easy: "Ты выбрал легкий путь... не обольщайся!",
    medium: "Средний? Думаешь, справишься?",
    hard: "Сложный, но кто предупреждал?",
    insane: "Безумие. Вернись пока не поздно!"
  };
  return messages[lvl] || "Готов? Ну давай...";
}

// Начало игры
function startGame(){
  score = 0;
  times = [];
  scoreText.textContent = "Очки: 0";
  timerText.textContent = "Время: 0.00s";
  gameContainer.style.display = "block";
  gameContainer.innerHTML = "";
  gameActive = true;
  startTime = performance.now();

  spawnButtons();

  document.addEventListener("click", handleMissClick);
}

// Конец игры
function endGame(){
  gameActive = false;
  document.removeEventListener("click", handleMissClick);

  let avgTime = times.length>0 ? (times.reduce((a,b)=>a+b,0)/times.length)/1000 : 0;
  let resultMsg = getEndMessage(score, avgTime);
  alert(`${resultMsg}\nОчки: ${score}\nСреднее время: ${avgTime.toFixed(2)}s`);

  // Показываем кнопку перезапуска
  const restartBtn = document.createElement("button");
  restartBtn.textContent = "Вернись и докажи";
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
  restartBtn.addEventListener("click", ()=>{
    restartBtn.remove();
    startGame();
  });
  gameContainer.appendChild(restartBtn);
}

// Сообщения в конце игры
function getEndMessage(score, avgTime){
  if(score<5) return "Ого, ты реально это сделал… хуже, чем ожидалось!";
  if(score<10) return "Хм, чуть лучше, но кто тебя этому учил?";
  return "Ого, почти профессионал… думаешь, сможешь лучше?";
}

// Обработка промаха
function handleMissClick(e){
  if(!gameActive) return;
  if(!e.target.classList.contains("correct") && !e.target.classList.contains("fake")){
    endGame();
  }
}

// Создание кнопок
function spawnButtons(){
  if(realButton) realButton.remove();
  fakeButtons.forEach(btn=>btn.remove());
  fakeButtons=[];

  realButton = document.createElement("button");
  realButton.classList.add("correct");
  realButton.textContent = "Нажми меня!";
  setButtonSizeAndPosition(realButton);
  realButton.addEventListener("click", (e)=>{
    e.stopPropagation();
    let elapsed = performance.now()-startTime;
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

// Ложные кнопки
function spawnFakeButtons(){
  let maxFakes = {"easy":2,"medium":3,"hard":4,"insane":5}[level] || 3;

  for(let i=0;i<maxFakes;i++){
    const fake = document.createElement("button");
    fake.classList.add("fake");
    fake.textContent = ["Ложная","Не та","Ха!","Ты хотел это?"][Math.floor(Math.random()*4)];
    setButtonSizeAndPosition(fake);

    // Ложная кнопка обманывает
    fake.addEventListener("mouseenter", ()=>{
      const containerRect = gameContainer.getBoundingClientRect();
      const size = parseInt(fake.style.width);
      const newX = Math.random()*(containerRect.width - size);
      const newY = Math.random()*(containerRect.height - size/2);
      fake.style.left = newX+"px";
      fake.style.top = newY+"px";
    });

    fake.addEventListener("click", (e)=>{
      e.stopPropagation();
      endGame();
    });

    gameContainer.appendChild(fake);
    fakeButtons.push(fake);
  }
}

// Размер и позиция кнопки
function setButtonSizeAndPosition(btn){
  const containerRect = gameContainer.getBoundingClientRect();
  const size = Math.max(60,120-score*3);
  btn.style.width = size+"px";
  btn.style.height = size/2+"px";
  btn.style.fontSize = Math.floor(size/5)+"px";

  const x = Math.random()*(containerRect.width - size);
  const y = Math.random()*(containerRect.height - size/2);
  btn.style.left = x+"px";
  btn.style.top = y+"px";
}

// Плавное перемещение реальной кнопки
function moveButtonSmooth(btn){
  const containerRect = gameContainer.getBoundingClientRect();
  const size = parseInt(btn.style.width);
  const newX = Math.random()*(containerRect.width - size);
  const newY = Math.random()*(containerRect.height - size/2);
  btn.style.transition = "left 0.5s ease, top 0.5s ease";
  btn.style.left = newX+"px";
  btn.style.top = newY+"px";
  setTimeout(()=>{btn.style.transition="";},600);
}
