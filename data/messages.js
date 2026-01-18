export const TOXIC_BY_SCORE = {
  0:["Ты даже не начал.","Пальцы дрожат?"],
  5:["Да, именно так, продолжаем сливать очки 😏"],
  10:["Ха, ты думал, что сможешь легко?"],
  20:["Вижу, ты всё ещё здесь... 😎"],
  50:["Ты почти достиг невозможного, но всё равно никто не похвалит!"]
};

export function getToxicMessage(score){
  const keys=Object.keys(TOXIC_BY_SCORE).map(Number).filter(k=>score>=k);
  const key=Math.max(...keys);
  const arr=TOXIC_BY_SCORE[key];
  return arr[Math.floor(Math.random()*arr.length)];
}
