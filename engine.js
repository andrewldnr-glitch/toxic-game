(() => {
  'use strict';

  // ===== DOM helpers =====
  const $ = (id) => document.getElementById(id);

  // Screens
  const loadingScreen = $('loadingScreen');
  const levelScreen = $('levelScreen');
  const prepScreen = $('prepScreen');
  const gameScreen = $('gameScreen');
  const resultScreen = $('resultScreen');
  const leaderboardScreen = $('leaderboardScreen');

  // UI
  const startGameBtn = $('startGameBtn');
  const backToLevelsBtn = $('backToLevelsBtn');
  const retryBtn = $('retryBtn');
  const levelsBtn = $('levelsBtn');
  const saveRunBtn = $('saveRunBtn');

  const openLeaderboardBtn = $('openLeaderboardBtn');
  const openLeaderboardBtn2 = $('openLeaderboardBtn2');
  const closeLeaderboardBtn = $('closeLeaderboardBtn');
  const clearLbBtn = $('clearLbBtn');
  const lbLevelSelect = $('lbLevelSelect');
  const lbBody = $('lbBody');

  const scoreText = $('scoreText');
  const timerText = $('timerText');
  const levelText = $('levelText');
  const selectedLevelText = $('selectedLevel');

  const gameArea = $('gameArea');
  const toast = $('toast');

  const resultText = $('resultText');
  const demotivatorText = $('demotivatorText');

  const loadbarFill = $('loadbarFill');
  const loadingTip = $('loadingTip');

  // ===== Telegram =====
  const tg = window.Telegram?.WebApp;

  function safeTg(fn) { try { fn(); } catch (_) {} }

  function applySafeAreaFromTg() {
    if (!tg) return;
    const inset = tg.contentSafeAreaInset || tg.safeAreaInset;
    if (!inset) return;
    const root = document.documentElement;
    root.style.setProperty('--tg-safe-area-inset-top', `${inset.top || 0}px`);
    root.style.setProperty('--tg-safe-area-inset-right', `${inset.right || 0}px`);
    root.style.setProperty('--tg-safe-area-inset-bottom', `${inset.bottom || 0}px`);
    root.style.setProperty('--tg-safe-area-inset-left', `${inset.left || 0}px`);
  }

  function initTelegram() {
    if (!tg) return;
    safeTg(() => tg.ready());
    safeTg(() => tg.expand());
    safeTg(() => tg.disableVerticalSwipes?.());
    applySafeAreaFromTg();
    safeTg(() => tg.onEvent?.('viewportChanged', () => clampButtonsToBounds()));
    safeTg(() => tg.onEvent?.('safeAreaChanged', applySafeAreaFromTg));
    safeTg(() => tg.onEvent?.('contentSafeAreaChanged', applySafeAreaFromTg));
  }
  initTelegram();

  // ===== Screens manager =====
  const screens = [loadingScreen, levelScreen, prepScreen, gameScreen, resultScreen, leaderboardScreen].filter(Boolean);

  function showScreen(screenEl) {
    screens.forEach(el => el.classList.toggle('active', el === screenEl));
  }

  // ===== Level config =====
  const levelConfig = {
    easy:   { label: 'Лёгкий',  fakeMax: 2, moveChance: 0.40, sizeScale: 1.10 },
    medium: { label: 'Средний', fakeMax: 3, moveChance: 0.60, sizeScale: 1.00 },
    hard:   { label: 'Сложный', fakeMax: 4, moveChance: 0.75, sizeScale: 0.90 },
    insane: { label: 'Безумие', fakeMax: 5, moveChance: 0.90, sizeScale: 0.80 },
  };

  let selectedLevelKey = 'easy';
  let selectedLevel = levelConfig[selectedLevelKey];

  // ===== Demotivators (small starter set) =====
  // Ты можешь заменить на демотиваторы_1500 и/или подключить отдельный файл.
  const demotivators = [
    'Неплохо. Для человека.',
    'Мимо. Как по жизни.',
    'Ты нажал не туда. Впрочем, это твоя специализация.',
    'Скорость есть. Точности — как обычно.',
    'Ого. Похоже, ты случайно стараешься.',
    'Ладно… это было почти красиво.',
    'Твои пальцы сегодня опасны. Чуть-чуть.',
  ];

  // Чем больше score/время — тем мягче
  function demotivatorIndex(score, totalSec) {
    const p = score + totalSec * 0.25;
    if (p < 4) return 2;
    if (p < 10) return 3;
    if (p < 18) return 1;
    if (p < 28) return 0;
    return 5;
  }

  function pickDemotivator(score, totalSec) {
    const idx = demotivatorIndex(score, totalSec);
    return demotivators[Math.max(0, Math.min(demotivators.length - 1, idx))] || '…';
  }

  // ===== Game state =====
  let realButton = null;
  let fakeButtons = [];
  let score = 0;
  let gameActive = false;

  let gameStartTime = 0;
  let lastHitTime = 0;
  let timerInterval = null;
  let reactionTimes = []; // ms

  let lastRun = null; // for saving to leaderboard

  // ===== Loading / preloading =====
  function setProgress(p) {
    const clamped = Math.max(0, Math.min(1, p));
    if (loadbarFill) loadbarFill.style.width = `${Math.round(clamped * 100)}%`;
  }
  function setTip(t) { if (loadingTip) loadingTip.textContent = t; }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function preloadAll() {
    const assets = [
      { type: 'img', src: 'assets/splash.webp' },
    ];

    setTip('Разогреваем токсичность…');
    setProgress(0);

    let done = 0;
    for (const a of assets) {
      try {
        if (a.type === 'img') await preloadImage(a.src);
      } catch (e) {
        // если картинки нет — просто продолжаем
        console.warn('Asset failed:', a.src, e);
      }
      done++;
      setProgress(done / assets.length);
    }
    setTip('Почти готово…');
  }

  (async () => {
    showScreen(loadingScreen);
    await preloadAll();
    await new Promise(r => setTimeout(r, 350));
    showScreen(levelScreen);
  })();

  // ===== Level selection =====
  document.querySelectorAll('[data-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-level') || 'easy';
      selectedLevelKey = levelConfig[key] ? key : 'easy';
      selectedLevel = levelConfig[selectedLevelKey];

      selectedLevelText.textContent = selectedLevel.label;
      levelText.textContent = `Уровень: ${selectedLevel.label}`;
      showScreen(prepScreen);
    });
  });

  startGameBtn?.addEventListener('click', startGame);
  backToLevelsBtn?.addEventListener('click', () => showScreen(levelScreen));
  retryBtn?.addEventListener('click', startGame);
  levelsBtn?.addEventListener('click', () => showScreen(levelScreen));

  openLeaderboardBtn?.addEventListener('click', () => openLeaderboard(selectedLevelKey));
  openLeaderboardBtn2?.addEventListener('click', () => openLeaderboard(selectedLevelKey));
  closeLeaderboardBtn?.addEventListener('click', () => {
    // возвращаемся туда, откуда логично
    if (resultScreen.classList.contains('active')) showScreen(resultScreen);
    else showScreen(levelScreen);
  });

  lbLevelSelect?.addEventListener('change', () => renderLeaderboard(lbLevelSelect.value));
  clearLbBtn?.addEventListener('click', () => {
    const key = lbKey(lbLevelSelect.value);
    localStorage.removeItem(key);
    renderLeaderboard(lbLevelSelect.value);
  });

  saveRunBtn?.addEventListener('click', async () => {
    if (!lastRun) return;

    // Try global save first (Telegram only). Fallback to local.
    const posted = await postScoreGlobal(lastRun);
    if (posted.ok) {
      showToast('Отправлено в глобальный лидерборд. Токсично.', 1200);
    } else {
      saveToLeaderboard(lastRun);
    }
    openLeaderboard(lastRun.levelKey);
  });

  // ===== Game logic =====
  gameArea.addEventListener('contextmenu', (e) => e.preventDefault());

  // Miss click only on playfield
  gameArea.addEventListener('click', () => {
    if (!gameActive) return;
    endGame('miss');
  });

  window.addEventListener('resize', () => clampButtonsToBounds());

  function startGame() {
    score = 0;
    reactionTimes = [];
    lastRun = null;
    gameActive = true;

    showScreen(gameScreen);

    scoreText.textContent = 'Очки: 0';
    timerText.textContent = 'Время: 0.00s';
    levelText.textContent = `Уровень: ${selectedLevel.label}`;

    clearBoard();

    gameStartTime = performance.now();
    lastHitTime = gameStartTime;

    requestAnimationFrame(() => {
      spawnRealButton();
      spawnFakeButtons();
      startTimer();
      showToast('Не промахнись. Я верю в твою неудачу.', 1200);
    });
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const elapsed = (performance.now() - gameStartTime) / 1000;
      timerText.textContent = `Время: ${elapsed.toFixed(2)}s`;
    }, 25);
  }

  function clearBoard() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    gameArea.innerHTML = '';
    realButton = null;
    fakeButtons = [];
  }

  function spawnRealButton() {
    realButton = document.createElement('button');
    realButton.type = 'button';
    realButton.className = 'game-btn correct';
    realButton.textContent = 'ЖМИ';

    applyButtonSize(
      realButton,
      120 * selectedLevel.sizeScale,
      60 * selectedLevel.sizeScale,
      18 * selectedLevel.sizeScale
    );

    moveButtonRandom(realButton);

    realButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!gameActive) return;

      const now = performance.now();
      reactionTimes.push(now - lastHitTime);
      lastHitTime = now;

      score += 1;
      scoreText.textContent = `Очки: ${score}`;
      realButton.textContent = `ЖМИ (${score})`;

      safeTg(() => tg?.HapticFeedback?.impactOccurred?.('light'));

      // during demotivators, not too often
      if (score === 1 || score % 3 === 0 || Math.random() < 0.22) {
        const totalSec = (performance.now() - gameStartTime) / 1000;
        showToast(pickDemotivator(score, totalSec), 1100);
      }

      spawnFakeButtons();
      if (Math.random() < selectedLevel.moveChance) moveButtonRandom(realButton);
    });

    gameArea.appendChild(realButton);
  }

  function spawnFakeButtons() {
    fakeButtons.forEach(b => b.remove());
    fakeButtons = [];

    const count = Math.min(selectedLevel.fakeMax, Math.floor(score / 2) + 1);
    const texts = ['ЖМИ', 'ЖМи', 'ЖМИ!', 'ЖМИ?'];

    for (let i = 0; i < count; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'game-btn fake';
      btn.textContent = texts[Math.floor(Math.random() * texts.length)];

      const sizeMod = selectedLevel.sizeScale * (0.8 + Math.random() * 0.4);
      applyButtonSize(btn, 120 * sizeMod, 60 * sizeMod, 18 * sizeMod);

      placeAwayFromReal(btn, 14);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!gameActive) return;
        endGame('fake');
      });

      gameArea.appendChild(btn);
      fakeButtons.push(btn);
    }
  }

  function applyButtonSize(btn, w, h, fz) {
    btn.style.width = `${Math.round(w)}px`;
    btn.style.height = `${Math.round(h)}px`;
    btn.style.fontSize = `${Math.round(fz)}px`;
  }

  function moveButtonRandom(btn) {
    const w = btn.offsetWidth || (parseFloat(btn.style.width) || 120);
    const h = btn.offsetHeight || (parseFloat(btn.style.height) || 60);

    const maxX = Math.max(0, gameArea.clientWidth - w);
    const maxY = Math.max(0, gameArea.clientHeight - h);

    btn.style.left = `${Math.random() * maxX}px`;
    btn.style.top = `${Math.random() * maxY}px`;
  }

  function placeAwayFromReal(btn, marginPx = 0) {
    const w = parseFloat(btn.style.width) || 120;
    const h = parseFloat(btn.style.height) || 60;

    const maxX = Math.max(0, gameArea.clientWidth - w);
    const maxY = Math.max(0, gameArea.clientHeight - h);

    const realBox = realButton ? getBox(realButton) : null;
    const inflated = realBox
      ? { left: realBox.left - marginPx, top: realBox.top - marginPx, right: realBox.right + marginPx, bottom: realBox.bottom + marginPx }
      : null;

    let x = 0, y = 0;
    let tries = 0;

    do {
      x = Math.random() * maxX;
      y = Math.random() * maxY;
      tries++;
      if (!inflated) break;
    } while (boxesOverlap({ left: x, top: y, right: x + w, bottom: y + h }, inflated) && tries < 60);

    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
  }

  function getBox(el) {
    const left = el.offsetLeft;
    const top = el.offsetTop;
    return { left, top, right: left + el.offsetWidth, bottom: top + el.offsetHeight };
  }

  function boxesOverlap(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  }

  function clampButtonsToBounds() {
    if (!gameActive) return;

    const clampEl = (el) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;

      const maxX = Math.max(0, gameArea.clientWidth - w);
      const maxY = Math.max(0, gameArea.clientHeight - h);

      const curX = parseFloat(el.style.left) || 0;
      const curY = parseFloat(el.style.top) || 0;

      el.style.left = `${Math.min(maxX, Math.max(0, curX))}px`;
      el.style.top = `${Math.min(maxY, Math.max(0, curY))}px`;
    };

    if (realButton) clampEl(realButton);
    fakeButtons.forEach(clampEl);
  }

  function endGame(reason) {
    gameActive = false;

    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

    const totalSec = (performance.now() - gameStartTime) / 1000;
    const avgSec = reactionTimes.length
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) / 1000
      : 0;

    safeTg(() => tg?.HapticFeedback?.impactOccurred?.('heavy'));

    const reasonText = (reason === 'fake') ? 'Ты нажал на фейк 😈' : 'Мимо 😈';
    resultText.innerHTML =
      `${reasonText}<br><br>` +
      `Очков: <b>${score}</b><br>` +
      `Среднее время реакции: <b>${avgSec.toFixed(2)}s</b><br>` +
      `Время в раунде: <b>${totalSec.toFixed(2)}s</b>`;

    demotivatorText.textContent = pickDemotivator(score, totalSec);

    lastRun = {
      levelKey: selectedLevelKey,
      levelLabel: selectedLevel.label,
      score,
      avgSec,
      totalSec,
      at: Date.now(),
      name: guessPlayerName(),
    };

    clearBoard();
    showScreen(resultScreen);
  }

  // ===== Toast =====
  let toastTimer = null;
  function showToast(text, ms = 1000) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  }


  // ===== Global Leaderboard (Vercel API) =====
  async function fetchGlobalLeaderboard(levelKey) {
    try {
      const r = await fetch(`/api/leaderboard?level=${encodeURIComponent(levelKey)}`);
      if (!r.ok) throw new Error('bad response');
      const data = await r.json();
      return Array.isArray(data.top) ? data.top : [];
    } catch (e) {
      return null; // means unavailable
    }
  }

  async function postScoreGlobal(run) {
    if (!tg?.initData) return { ok: false, reason: 'no_tg' };
    try {
      const r = await fetch('/api/score', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          level: run.levelKey,
          score: run.score,
          avgSec: run.avgSec,
          totalSec: run.totalSec,
          initData: tg.initData,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return { ok: false, reason: `http_${r.status}`, detail: t };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'network' };
    }
  }

  // ===== Leaderboard (local) =====
  function lbKey(levelKey) {
    return `toxic_leaderboard_${levelKey}`;
  }

  function readLeaderboard(levelKey) {
    const raw = localStorage.getItem(lbKey(levelKey));
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function writeLeaderboard(levelKey, arr) {
    localStorage.setItem(lbKey(levelKey), JSON.stringify(arr));
  }

  // Sorting: score desc, avgSec asc, totalSec desc (longer run can be interesting)
  function sortRuns(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if (a.avgSec !== b.avgSec) return a.avgSec - b.avgSec;
    return b.totalSec - a.totalSec;
  }

  function saveToLeaderboard(run) {
    const levelKey = run.levelKey;
    const arr = readLeaderboard(levelKey);

    arr.push({
      name: run.name || 'Игрок',
      score: run.score,
      avgSec: run.avgSec,
      totalSec: run.totalSec,
      at: run.at,
    });

    arr.sort(sortRuns);

    // keep top 50
    const top = arr.slice(0, 50);
    writeLeaderboard(levelKey, top);

    showToast('Сохранено. Тебя будут помнить. Недолго.', 1200);
  }

  function openLeaderboard(levelKey) {
    if (lbLevelSelect) lbLevelSelect.value = levelKey || 'easy';
    renderLeaderboard(lbLevelSelect?.value || 'easy');
    showScreen(leaderboardScreen);
  }

  function renderLeaderboard(levelKey) {
    if (!lbBody) return;

    lbBody.innerHTML = '';

    // Prefer global leaderboard
    fetchGlobalLeaderboard(levelKey).then((globalTop) => {
      if (globalTop && globalTop.length) {
        globalTop.forEach((r, i) => {
          const dt = new Date(r.created_at);
          const date = `${dt.toLocaleDateString('ru-RU')} ${dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
          const name = r.username ? `@${r.username}` : (r.first_name || 'Игрок');
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${escapeHtml(name)}</td>
            <td><b>${r.score}</b></td>
            <td>${Number(r.avg_sec).toFixed(2)}s</td>
            <td>${Number(r.total_sec).toFixed(2)}s</td>
            <td>${date}</td>
          `;
          lbBody.appendChild(tr);
        });
        return;
      }

      // Fallback: local leaderboard
      const arr = readLeaderboard(levelKey).slice(0, 10);
      if (arr.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" style="opacity:.7">Пока пусто. Отличный шанс стать первым токсиком.</td>`;
        lbBody.appendChild(tr);
        return;
      }

      arr.forEach((r, i) => {
        const dt = new Date(r.at);
        const date = `${dt.toLocaleDateString('ru-RU')} ${dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${escapeHtml(r.name || 'Игрок')}</td>
          <td><b>${r.score}</b></td>
          <td>${Number(r.avgSec).toFixed(2)}s</td>
          <td>${Number(r.totalSec).toFixed(2)}s</td>
          <td>${date}</td>
        `;
        lbBody.appendChild(tr);
      });
    });
  }

    arr.forEach((r, i) => {
      const dt = new Date(r.at);
      const date = `${dt.toLocaleDateString('ru-RU')} ${dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${escapeHtml(r.name || 'Игрок')}</td>
        <td><b>${r.score}</b></td>
        <td>${Number(r.avgSec).toFixed(2)}s</td>
        <td>${Number(r.totalSec).toFixed(2)}s</td>
        <td>${date}</td>
      `;
      lbBody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function guessPlayerName() {
    // Telegram: берём first_name/username
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      return u.username ? `@${u.username}` : (u.first_name || 'Игрок');
    }
    // Browser: спросим один раз
    const key = 'toxic_player_name';
    const saved = localStorage.getItem(key);
    if (saved) return saved;

    const name = prompt('Как тебя записать в лидерборд? (можно оставить пустым)') || '';
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem(key, trimmed);
    return trimmed || 'Игрок';
  }

})();
