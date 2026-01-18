export function startEngine(container, updateScoreCallback) {
  let score = 0;
  let startTime = Date.now();
  let clickTimes = [];

  const realButtonLabel = "Нажми меня";

  // Создание кнопки с динамическим масштабированием текста
  function createButton(label, type = "correct") {
    const btn = document.createElement("button");
    btn.className = type;
    btn.innerText = label;

    // Размер кнопки
    const width = Math.random() * 60 + 100; // 100-160px
    const height = 50;
    btn.style.width = width + "px";
    btn.style.height = height + "px";
    btn.style.padding = "0 10px";

    // Центрирование текста
    btn.style.display = "flex";
    btn.style.justifyContent = "center";
    btn.style.alignItems = "center";
    btn.style.textAlign = "center";

    // Fit-text: подгоняем размер текста под ширину кнопки
    let fontSize = 20;
    btn.style.fontSize = fontSize + "px";

    container.appendChild(btn); // нужно для измерения scrollWidth
    while(btn.scrollWidth > btn.clientWidth - 10 && fontSize > 10) {
      fontSize--;
      btn.style.fontSize = fontSize + "px";
    }
    container.removeChild(btn); // удаляем временно, кнопка будет добавлена позже

    btn.style.top = Math.random() * 60 + "%";
    btn.style.left = Math.random() * 60 + "%";

    return btn;
  }

  // Экран конца игры
  function showGameOver() {
    container.innerHTML = "";
    const gameOver = document.createElement("div");
    gameOver.id = "gameOverScreen";

    const finalScore = document.createElement("p");
    finalScore.id = "finalScore";
    finalScore.innerText = `Очки: ${score}`;

    const averageTime = document.createElement("p");
    averageTime.id = "ave
