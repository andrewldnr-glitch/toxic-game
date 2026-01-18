;(() => {
  'use strict';

  /* =========================
     HELPERS
  ========================= */
  const $ = (id) => document.getElementById(id);

  const screens = {
    loading: $('loadingScreen'),
    level: $('levelScreen'),
    prep: $('prepScreen'),
    game: $('gameScreen'),
    result: $('resultScreen'),
    leaderboard: $('leaderboardScreen'),
  };

  function showScreen(target) {
    Object.values(screens).forEach(s => s && s.classList.remove('active'));
    target && target.classList.add('active');
  }

  /* =========================
     TELEGRAM
  ========================= */
  const tg = window.Telegram?.WebApp;
  try {
    tg?.ready();
    tg?.expand();
  } catch {}

  /* =========================
     LOADING
  ========================= */
  const loadbarFill = $('loadbarFill');
  const loadingTip = $('loadingTip');

  function setProgress(p) {
    if (!loadbarFill) return;
    loadbarFill.style.width = `${Math.round(p * 100)}%`;
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }

  async function preloadAll() {
    setProgress(0);
    loadingTip.textContent = 'Разогреваем токсичность…';

    try {
      await preloadImage('assets/splash.webp');
    } catch {
      console.warn('splash.webp not found, continuing');
    }

    setProgress(1);
  }

  (async () => {
    showScreen(screens.loading);
    try {
      await preloadAll();
    } finally {
      setTimeout(() => showScreen(screens.level), 400);
    }
  })();

  /* =========================
     LEVELS
  ========================= */
  const levelConfig = {
    easy:   { label: 'Лёгкий',  fakeMax: 2, moveChance: 0.4, size: 1.1 },
    medium: { label: 'Средний', fakeMax: 3, moveChance: 0.6, size: 1.0 },
    hard:   { label: 'Сложный', fakeMax: 4, moveChance: 0.75, size: 0.9 },
    insane: { label: 'Безумие', fakeMax: 5, moveChance: 0.9, size: 0.8 },
  };

  let currentLevelKey = 'easy';
  let currentLevel = levelConfig.easy;

  document.querySelectorAll('[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLevelKey = btn.dataset.level;
      currentLevel = levelConfig[currentLevelKey];
      $('selectedLevel').textContent = currentLevel.label;
      showScreen(screens.prep);
    });
  });

  $('startGameBtn').onclick = startGame;
  $('backToLevelsBtn').onclick = () => showScreen(screens.level);
  $('retryBtn').onclick = startGame;
  $('levelsBtn').onclick = () => showScreen(screens.level);

  /* =========================
     GAME
  ========================= */
  const gameArea = $('gameArea');
  const scoreText = $('scoreText');
  const timerText = $('timerText');
  const levelText = $('levelText');

  let score = 0;
  let startTime = 0;
  let lastHit = 0;
  let timer = null;
  let realBtn = null;
  let fakeBtns = [];
  let reactionTimes = [];
  let lastRun = null;

  function startGame() {
    score = 0;
    reactionTimes = [];
    gameArea.innerHTML = '';
    showScreen(screens.game);

    scoreText.textContent = 'Очки: 0';
    levelText.textContent = `Уровень: ${currentLevel.label}`;
    timerText.textContent = 'Время: 0.00s';

    startTime = performance.now();
    lastHit = startTime;

    timer = setInterval(() => {
      const t = (performance.now() - startTime) / 1000;
      timerText.textContent = `Время: ${t.toFixed(2)}s`;
    }, 30);

    spawnReal();
    spawnFakes();
  }

  function endGame(reason) {
    clearInterval(timer);
    gameArea.innerHTML = '';

    const total = (performance.now() - startTime) / 1000;
    const avg = reactionTimes.length
      ? reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length/1000
      : 0;

    $('resultText').innerHTML =
      `Очков: <b>${score}</b><br>` +
      `Средняя реакция: <b>${avg.toFixed(2)}s</b><br>` +
      `Время: <b>${total.toFixed(2)}s</b>`;

    $('demotivatorText').textContent =
      score < 5 ? 'Может, это не твоё.' :
      score < 15 ? 'Ладно. Уже лучше.' :
      'Хм. Ты пугающе хорош.';

    lastRun = {
      levelKey: currentLevelKey,
      score,
      avg,
      total,
    };

    showScreen(screens.result);
  }

  function spawnReal() {
    realBtn = document.createElement('button');
    realBtn.className = 'game-btn correct';
    realBtn.textContent = 'ЖМИ';

    placeBtn(realBtn);

    realBtn.onclick = (e) => {
      e.stopPropagation();
      const now = performance.now();
      reactionTimes.push(now - lastHit);
      lastHit = now;

      score++;
      scoreText.textContent = `Очки: ${score}`;
      realBtn.textContent = `ЖМИ (${score})`;

      spawnFakes();
      if (Math.random() < currentLevel.moveChance) placeBtn(realBtn);
    };

    gameArea.appendChild(realBtn);
  }

  function spawnFakes() {
    fakeBtns.forEach(b => b.remove());
    fakeBtns = [];

    const count = Math.min(currentLevel.fakeMax, Math.floor(score / 2) + 1);
    for (let i = 0; i < count; i++) {
      const b = document.createElement('button');
      b.className = 'game-btn fake';
      b.textContent = 'ЖМИ';

      placeBtn(b);
      b.onclick = (e) => {
        e.stopPropagation();
        endGame('fake');
      };

      gameArea.appendChild(b);
      fakeBtns.push(b);
    }
  }

  function placeBtn(btn) {
    const w = 120 * currentLevel.size;
    const h = 60 * currentLevel.size;
    btn.style.width = `${w}px`;
    btn.style.height = `${h}px`;

    const maxX = gameArea.clientWidth - w;
    const maxY = gameArea.clientHeight - h;

    btn.style.left = `${Math.random() * maxX}px`;
    btn.style.top = `${Math.random() * maxY}px`;
  }

  gameArea.onclick = () => endGame('miss');

  /* =========================
     GLOBAL LEADERBOARD (VERCEL)
  ========================= */
  async function fetchLeaderboard(level) {
    try {
      const r = await fetch(`/api/leaderboard?level=${level}`);
      if (!r.ok) throw 0;
      const j = await r.json();
      return j.top || [];
    } catch {
      return null;
    }
  }

  async function saveScore(run) {
    if (!tg?.initData) return false;
    try {
      const r = await fetch('/api/score', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          level: run.levelKey,
          score: run.score,
          avgSec: run.avg,
          totalSec: run.total,
          initData: tg.initData,
        }),
      });
      return r.ok;
    } catch {
      return false;
    }
  }

  $('saveRunBtn').onclick = async () => {
    if (!lastRun) return;
    await saveScore(lastRun);
    openLeaderboard(lastRun.levelKey);
  };

  function openLeaderboard(level) {
    $('lbLevelSelect').value = level;
    renderLeaderboard(level);
    showScreen(screens.leaderboard);
  }

  $('openLeaderboardBtn').onclick = () => openLeaderboard(currentLevelKey);
  $('openLeaderboardBtn2').onclick = () => openLeaderboard(currentLevelKey);
  $('closeLeaderboardBtn').onclick = () => showScreen(screens.level);

  $('lbLevelSelect').onchange = (e) => renderLeaderboard(e.target.value);

  async function renderLeaderboard(level) {
    const body = $('lbBody');
    body.innerHTML = '<tr><td colspan="6">Загрузка…</td></tr>';

    const top = await fetchLeaderboard(level);
    body.innerHTML = '';

    if (!top || !top.length) {
      body.innerHTML = '<tr><td colspan="6">Пока пусто</td></tr>';
      return;
    }

    top.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.username ? '@' + r.username : (r.first_name || 'Игрок')}</td>
        <td><b>${r.score}</b></td>
        <td>${Number(r.avg_sec).toFixed(2)}s</td>
        <td>${Number(r.total_sec).toFixed(2)}s</td>
        <td>${new Date(r.created_at).toLocaleString()}</td>
      `;
      body.appendChild(tr);
    });
  }

})();
