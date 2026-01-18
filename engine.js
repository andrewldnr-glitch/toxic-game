import { createButton } from "./ui.js";

export function startEngine(container, onEnd) {
  let score = 0;
  let clickTimes = [];

  const spawnButtons = () => {
    container.innerHTML = "";

    const minWidth = 40, minHeight = 20, maxWidth = 100, maxHeight = 50;
    const width = Math.max(maxWidth - score*2, minWidth);
    const height = Math.max(maxHeight - score, minHeight);

    const correctBtn = createButton("ЖМИ", "correct");
    correctBtn.style.width = width + "px";
    correctBtn.style.height = height + "px";
    correctBtn.style.top = Math.random()*60 + "%";
    correctBtn.style.left = Math.random()*60 + "%";
    container.appendChild(correctBtn);

    let startTime = Date.now();

    const fakeCount = Math.floor(Math.random()*4);
    for(let i=0; i<fakeCount; i++){
      const fakeBtn = createButton("ЛОЖНАЯ", "fake");
      placeFakeButton(fakeBtn, correctBtn, container);
      container.appendChild(fakeBtn);
      fakeBtn.onclick = () => endGame(score);
    }

    const clickHandler = (e) => { if(!e.target.closest("button")) endGame(score); };
    container.addEventListener("click", clickHandler);

    correctBtn.onclick = () => {
      const endTime = Date.now();
      clickTimes.push(endTime - startTime);
      score++;
      container.removeEventListener("click", clickHandler);

      if(Math.random() < 0.7){
        moveCorrectButton(correctBtn, container);
        setTimeout(()=>spawnButtons(),300);
      } else {
        spawnButtons();
      }
      onEnd(score);
    };
  };

  const endGame = (score) => {
    const avgTime = clickTimes.length
      ? (clickTimes.reduce((a,b)=>a+b,0)/clickTimes.length/1000).toFixed(2)
      : 0;

    container.innerHTML = `
      <h2>Промах! 😏</h2>
      <p>Ты нажал не на ту кнопку или промахнулся.</p>
      <p>Твой результат: ${score} очков</p>
      <p>Среднее время нажатия: ${avgTime} сек</p>
      <button id="restart">Попробовать снова</button>
    `;
    document.getElementById("restart").onclick = () => { clickTimes=[]; startEngine(container,onEnd); };
  };

  const moveCorrectButton = (btn, container) => {
    const cRect = container.getBoundingClientRect();
    const btnWidth = btn.offsetWidth, btnHeight = btn.offsetHeight;
    const top = Math.random()*(cRect.height-btnHeight);
    const left = Math.random()*(cRect.width-btnWidth);
    btn.style.top = top+"px"; btn.style.left = left+"px";
  };

  const placeFakeButton = (fakeBtn, correctBtn, container) => {
    let attempts = 0;
    do {
      fakeBtn.style.top = Math.random()*60 + "%";
      fakeBtn.style.left = Math.random()*60 + "%";
      attempts++;
    } while(isOverlap(fakeBtn, correctBtn) && attempts < 50);
  };

  const isOverlap = (btn1, btn2) => {
    const r1=btn1.getBoundingClientRect(), r2=btn2.getBoundingClientRect();
    return !(r1.right<r2.left || r1.left>r2.right || r1.bottom<r2.top || r1.top>r2.bottom);
  };

  spawnButtons();
}
