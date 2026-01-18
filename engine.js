export function startEngine(container, updateScoreCallback) {
  let score = 0;
  let startTime = Date.now();
  let clickTimes = [];

  const realButtonLabel = "Нажми меня";

  function createButton(label, type = "correct") {
    const btn = document.createElement("button");
    btn.className = type;
    btn.innerText = label;

    // Размер кнопки относительно контейнера
    const width = Math.random() * (container.clientWidth * 0.25) + container.clientWidth * 0.2;
    const height = Math.max(40, width * 0.3);
    btn.style.width = width + "px";
    btn.style.height = height + "px";
    btn.style.padding = "0 10px";

    // Центрируем текст
    btn.style.display = "flex";
    btn.style.justifyContent = "center";
    btn.style.alignItems = "center";
    btn.style.textAlign = "center";

    // Скрываем кнопку для измерения
    btn.style.visibility = "hidden";
    container.appendChild(btn);

    // Fit-text: уменьшаем font-size пока текст не помещается
    let fontSize = 20;
    btn.style.fontSize = fontSize + "px";
    while ((btn.scrollWidth > btn.clientWidth - 4 || btn.scrollHeight > btn.clientHeight - 4) && fontSize > 10) {
      fontSize--;
      btn.style.fontSize = fontSize + "px";
    }

    // Безопасное позиционирование внутри контейнера
    const maxTop = container.clientHeight - height;
    const maxLeft = container.clientWidth - width;
    btn.style.top = Math.random() * maxTop + "px";
    btn.style.left = Math.random() * maxLeft + "px";

    // Делаем видимой
    btn.style.visibility = "visible";

    return btn;
  }

  function showGameOver() {
    container.innerHTML = "";
    const gameOver = document.createElement("div");
    gameOver.id = "gameOverScreen";

    const finalScore = document.createElement("p");
    finalScore.id = "finalScore";
    finalScore.innerText = `Очки: ${score}`;

    const averageTime = document.createElement("p");
    averageTime.id = "averageTime";
    const avg = clickTimes.length > 0 ? (clickTimes.reduce((a,b)=>a+b)/clickTimes.length/1000).toFixed(2) : "0";
    averageTime.innerText = `Среднее время реакции: ${avg} сек`;

    const restartBtn = document.createElement("button");
    restartBtn.id = "restartBtn";
    restartBtn.innerText = "Начать заново";
    restartBtn.addEventListener("click", startGame);

    gameOver.appendChild(finalScore);
    gameOver.appendChild(averageTime);
    gameOver.appendChild(restartBtn);

    container.appendChild(gameOver);
  }

  function createRealButton() {
    const btn = createButton(realButtonLabel, "correct");
    container.appendChild(btn);

    btn.addEventListener("click", () => {
      const now = Date.now();
      clickTimes.push(now - startTime);
      startTime = now;

      score++;
      updateScoreCallback(score);

      if(Math.random() > 0.5) {
        // Плавное перемещение
        const maxTop = container.clientHeight - btn.offsetHeight;
        const maxLeft = container.clientWidth - btn.offsetWidth;
        btn.style.top = Math.random() * maxTop + "px";
        btn.style.left = Math.random() * maxLeft + "px";
      } else {
        btn.remove();
        setTimeout(createRealButton, 300);
      }

      spawnFakeButtons();
    });

    return btn;
  }

  function spawnFakeButtons() {
    container.querySelectorAll("button.fake").forEach(btn => btn.remove());

    const count = Math.floor(Math.random() * 2) + 1;
    for(let i=0;i<count;i++){
      const fake = createButton("Ложная", "fake");
      container.appendChild(fake);

      fake.addEventListener("click", () => {
        showGameOver();
      });

      setTimeout(() => {
        if(fake.parentNode) fake.remove();
      }, 2000);
    }
  }

  container.addEventListener("click", (e)=>{
    if(e.target === container){
      showGameOver();
    }
  });

  function startGame(){
    container.innerHTML = "";
    score = 0;
    clickTimes = [];
    startTime = Date.now();
    updateScoreCallback(score);
    createRealButton();
  }

  startGame();
}
