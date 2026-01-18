import { startEngine } from "./engine.js";
import { getToxicMessage } from "./data/messages.js";
import { getRandomLoadingMessage } from "./data/loadingMessages.js";

const container = document.getElementById("gameContainer");
const loadingScreen = document.getElementById("loadingScreen");
const loadingMessage = document.getElementById("loadingMessage");

loadingMessage.innerText = getRandomLoadingMessage();

setTimeout(() => {
  loadingScreen.style.display = "none";
  container.style.display = "block";
  startGame();
}, 2500);

function startGame(){
  container.innerHTML = "";
  startEngine(container, updateScore);
}

function updateScore(score){
  container.querySelectorAll(".social,.sub").forEach(el => el.remove());

  const record = document.createElement("p");
  record.className = "social";
  record.innerText = `Очки: ${score}`;
  container.appendChild(record);

  if(score > 0 && score % 5 === 0){
    const msg = getToxicMessage(score);
    const p = document.createElement("p");
    p.className = "sub";
    p.innerText = msg;
    container.appendChild(p);
  }
}

window.addEventListener("DOMContentLoaded", () => {});
