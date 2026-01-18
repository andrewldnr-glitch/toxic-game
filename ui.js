export function createButton(label, type = "correct") {
  const btn = document.createElement("button");
  btn.innerText = label;
  btn.className = type;
  return btn;
}
