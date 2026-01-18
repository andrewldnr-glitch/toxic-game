export function startEngine(container, updateScoreCallback) {
  let score = 0;

  function createButton(label, type = "correct") {
    const btn = document.createElement("button");
    btn.innerText = label;
    btn.className = type;
    const width = Math.random() * 80 + 60; // случайный размер
    btn.style.width = width + "px";
    btn.style.height = "50px";
    btn.style.fontSize = Math.max(width / 6, 12) + "px";
    btn.style.top = Math.random() * 60 + "%";
    btn.style.left = Math.random() * 60 + "%";
    return btn;
  }

  function spawnButtons() {
    container.innerHTML = "";

    // Создаем правильную кнопку
    const correctBtn = createButton("Нажми меня", "correct");
    container.appendChild(correctBtn);

    correctBtn.addEventListener("click", () => {
      score++;
      updateScoreCallback(score);
      // Иногда перемещаем кнопку, иногда убираем
      if(Math.random() > 0.5){
        correctBtn.style.top = Math.random() * 60 + "%";
        correctBtn.style.left = Math.random() * 60 + "%";
      } else {
        correctBtn.remove();
      }
      spawnFakeButtons();
    });
  }

  function spawnFakeButtons() {
    const count = Math.floor(Math.random() * 2) + 1;
    for(let i=0;i<count;i++){
      const fake = createButton("Ложная", "fake");
      container.appendChild(fake);
      fake.addEventListener("click", () => {
        alert("Game Over!");
        spawnButtons();
      });
    }
  }

  container.addEventListener("click", (e)=>{
    if(e.target === container){
      alert("Промах! Game Over!");
      spawnButtons();
    }
  });

  spawnButtons();
}
