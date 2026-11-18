/* 미니 게임 'wedding-run' (개발자 version 전용)
   픽셀 신랑이 예식장으로 달려간다. 화면을 누르거나(스페이스/↑) 점프해서 버그와 500 에러를 피하고,
   떠 있는 하트를 먹으면 +50점. 1030점(예식일 10.30)을 넘으면 축하 문구가 뜬다.
   - 색은 css/developer.css 의 theme 변수(다크/라이트)를 그대로 읽어 쓴다.
   - 화면 밖으로 나가거나 다른 탭으로 가면 멈춘다.
   - 최고 점수는 이 기기에만 저장한다(localStorage). */
(function weddingRun() {
  var wrap = document.getElementById('game');
  var cv = document.getElementById('gameCanvas');
  var startBtn = document.getElementById('gameStart');
  var scoreEl = document.getElementById('gameScore');
  if (!wrap || !cv || !cv.getContext) return;
  var g = cv.getContext('2d');

  var BEST_KEY = 'wedding-run-best';
  var GOAL = 1030;
  var best = 0;
  try { best = +localStorage.getItem(BEST_KEY) || 0; } catch (e) {}

  // ---- 화면 크기 ----
  var W = 0, H = 180, DPR = 1, GROUND = 0;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth || 320;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    GROUND = H - 30;
    if (state !== 'run') draw();
  }

  // ---- theme 색 ----
  var C = {};
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, d) { return (cs.getPropertyValue(n) || '').trim() || d; }
    C.bg = v('--panel', '#202024');
    C.line = v('--line', '#34343a');
    C.dim = v('--comment', '#8b8b96');
    C.text = v('--text', '#d6d6dc');
    C.bright = v('--text-bright', '#fafafa');
    C.red = v('--laravel', '#ff2d20');
    C.rose = v('--rose', '#ff7a8a');
    C.green = v('--green', '#6ee7a8');
    C.panel2 = v('--panel-2', '#27272b');
  }

  // ---- 픽셀 스프라이트 ----
  // h 머리·구두, s 얼굴, e 눈, w 셔츠, r 나비넥타이, k 턱시도
  var GROOM_TOP = [
    '..hhhhh...',
    '.hhhhhhh..',
    '.hssssss..',
    '.hsesses..',
    '..ssssss..',
    '...wrrw...',
    '..kkwwkk..',
    '.kkkwwkkk.',
    '.skkwwkks.',
    '...kkkk...',
  ];
  var LEGS = [
    ['...kk.kk..', '..kk...kk.', '..hh...hh.'],
    ['....kkk...', '....kk....', '....hh....'],
    ['...kkkk...', '...k..k...', '..hh..hh..'],   // 공중 자세
  ];
  var BUG = [
    '..b..b..',
    '...bb...',
    '.bbbbbb.',
    'bbbbbbbb',
    '.bbbbbb.',
    'b.b..b.b',
  ];
  var HEART = [
    '.hh.hh.',
    'hhhhhhh',
    'hhhhhhh',
    '.hhhhh.',
    '..hhh..',
    '...h...',
  ];
  function sprite(rows, x, y, px, pal) {
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        var col = pal[rows[r][c]];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(Math.round(x + c * px), Math.round(y + r * px), Math.ceil(px), Math.ceil(px));
      }
    }
  }

  // ---- 게임 상태 ----
  var PX = 2;                               // 신랑 픽셀 크기
  var PW = 10 * PX, PH = 13 * PX;           // 신랑 크기
  var state = 'idle';                        // idle | run | over
  var player, obs, hearts, tokens, speed, dist, bonus, spawnIn, heartIn, last, raf = 0, frame = 0;
  var goalShown = 0, overAt = 0, flash = 0;

  function reset() {
    player = { x: 34, y: 0, vy: 0, onGround: true };
    obs = [];
    hearts = [];
    tokens = [];
    speed = 250;
    dist = 0;
    bonus = 0;
    spawnIn = 380;
    heartIn = 700;
    goalShown = 0;
    flash = 0;
    for (var i = 0; i < 6; i++) tokens.push(makeToken(Math.random() * W));
  }
  function score() { return Math.floor(dist / 10) + bonus; }

  var TOKENS = ['</>', '{ }', '=>', '::', '$', '♥', '[]', '->', ';'];
  function makeToken(x) {
    return { x: x, y: 18 + Math.random() * (GROUND - 70), t: TOKENS[(Math.random() * TOKENS.length) | 0], s: 0.25 + Math.random() * 0.25 };
  }

  function jump() {
    if (state !== 'run') return;
    if (player.onGround) { player.vy = -620; player.onGround = false; }
  }

  function spawnObstacle() {
    var tall = Math.random() < 0.35 && speed > 300;
    if (tall) obs.push({ kind: '500', x: W + 10, w: 26, h: 28 });
    else obs.push({ kind: 'bug', x: W + 10, w: 8 * 2.5, h: 6 * 2.5 });
    // 가끔 버그 두 마리가 붙어 나온다
    if (!tall && speed > 340 && Math.random() < 0.25) obs.push({ kind: 'bug', x: W + 34, w: 20, h: 15 });
    var gap = speed * 0.62 + 140 + Math.random() * 260;
    spawnIn = gap;
  }

  function hit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ---- 한 frame ----
  function step(t) {
    raf = requestAnimationFrame(step);
    var dt = Math.min(0.033, (t - last) / 1000 || 0);
    last = t;
    frame += dt;

    speed = Math.min(640, speed + 9 * dt);
    var dx = speed * dt;
    dist += dx;

    // 신랑
    player.vy += 2100 * dt;
    player.y += player.vy * dt;
    if (player.y >= 0) { player.y = 0; player.vy = 0; player.onGround = true; }

    // 장애물·하트·배경 token
    spawnIn -= dx;
    if (spawnIn <= 0) spawnObstacle();
    heartIn -= dx;
    if (heartIn <= 0) {
      hearts.push({ x: W + 10, y: GROUND - 62 - Math.random() * 26, w: 14, h: 12 });
      heartIn = 900 + Math.random() * 900;
    }
    obs.forEach(function (o) { o.x -= dx; });
    hearts.forEach(function (h) { h.x -= dx; });
    obs = obs.filter(function (o) { return o.x + o.w > -20; });
    hearts = hearts.filter(function (h) { return h.x + h.w > -20 && !h.got; });
    tokens.forEach(function (k) { k.x -= dx * k.s; if (k.x < -30) { var n = makeToken(W + Math.random() * 60); k.x = n.x; k.y = n.y; k.t = n.t; k.s = n.s; } });

    // 충돌 (조금 너그럽게)
    var box = { x: player.x + 4, y: GROUND - PH + player.y + 3, w: PW - 8, h: PH - 4 };
    for (var i = 0; i < obs.length; i++) {
      var o = obs[i];
      if (hit(box, { x: o.x + 2, y: GROUND - o.h + 2, w: o.w - 4, h: o.h - 2 })) { gameOver(); return; }
    }
    hearts.forEach(function (h) {
      if (!h.got && hit(box, h)) { h.got = true; bonus += 50; flash = 0.6; }
    });

    var s = score();
    if (s >= GOAL && !goalShown) goalShown = 2.6;
    if (goalShown > 0) goalShown = Math.max(0.0001, goalShown - dt);
    if (flash > 0) flash -= dt;

    draw();
    updateScore();
  }

  // ---- 그리기 ----
  function draw() {
    if (!W) return;
    g.clearRect(0, 0, W, H);
    g.fillStyle = C.bg;
    g.fillRect(0, 0, W, H);

    // 흐르는 code token
    g.font = '12px "Fira Code", monospace';
    g.fillStyle = C.line;
    (tokens || []).forEach(function (k) { g.fillText(k.t, k.x, k.y); });

    // 땅
    g.strokeStyle = C.dim;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, GROUND + 0.5);
    g.lineTo(W, GROUND + 0.5);
    g.stroke();
    g.fillStyle = C.line;
    var off = (dist || 0) % 24;
    for (var x = -off; x < W; x += 24) g.fillRect(x, GROUND + 7, 8, 1);

    // 하트
    (hearts || []).forEach(function (h) {
      var bob = Math.sin(frame * 5 + h.x * 0.05) * 2;
      sprite(HEART, h.x, h.y + bob, 2, { h: C.rose });
    });

    // 장애물
    (obs || []).forEach(function (o) {
      if (o.kind === 'bug') {
        var leg = Math.floor(frame * 10) % 2 ? 0 : 1;
        sprite(BUG, o.x, GROUND - o.h + leg, 2.5, { b: C.red });
      } else {
        g.fillStyle = C.panel2;
        g.fillRect(o.x, GROUND - o.h, o.w, o.h);
        g.strokeStyle = C.red;
        g.strokeRect(o.x + 0.5, GROUND - o.h + 0.5, o.w - 1, o.h - 1);
        g.fillStyle = C.red;
        g.font = 'bold 10px "Fira Code", monospace';
        g.textAlign = 'center';
        g.fillText('500', o.x + o.w / 2, GROUND - o.h / 2 + 4);
        g.textAlign = 'left';
      }
    });

    // 신랑
    if (player) {
      var y = GROUND - PH + player.y;
      var light = document.documentElement.dataset.theme === 'light';
      var pal = { h: '#4a3528', s: '#f2c9a5', e: '#1b1b1f', w: '#ffffff', r: C.red, k: light ? '#27272a' : '#5b5b66' };
      sprite(GROOM_TOP, player.x, y, PX, pal);
      var legs = !player.onGround ? LEGS[2] : LEGS[Math.floor(frame * 12) % 2];
      sprite(legs, player.x, y + GROOM_TOP.length * PX, PX, pal);
    }

    // +50
    if (flash > 0 && player) {
      g.fillStyle = C.rose;
      g.font = 'bold 12px "Fira Code", monospace';
      g.fillText('+50 ♥', player.x + 18, GROUND - PH - 8 + player.y - (0.6 - flash) * 20);
    }

    // 1030점 축하
    if (goalShown > 0) {
      g.textAlign = 'center';
      g.fillStyle = C.green;
      g.font = 'bold 13px "Fira Code", monospace';
      g.fillText('🎉 2027.10.30 예식장 도착!', W / 2, 34);
      g.fillStyle = C.dim;
      g.font = '11px "Fira Code", monospace';
      g.fillText('// 실제로도 꼭 와 주세요 ♥', W / 2, 52);
      g.textAlign = 'left';
    }

    if (state === 'idle') {
      g.textAlign = 'center';
      g.fillStyle = C.dim;
      g.font = '12px "Fira Code", monospace';
      g.fillText('// 신랑이 예식장으로 출발 대기 중', W / 2, 40);
      g.textAlign = 'left';
    }
    if (state === 'over') {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(0, 0, W, H);
      g.textAlign = 'center';
      g.fillStyle = C.red;
      g.font = 'bold 13px "Fira Code", monospace';
      g.fillText('BugException: 신랑이 버그에 걸렸어요', W / 2, 52);
      g.fillStyle = '#fafafa';
      g.font = '12px "Fira Code", monospace';
      g.fillText('score ' + score() + (score() >= best && score() > 0 ? '  · new best!' : ''), W / 2, 74);
      g.textAlign = 'left';
    }
  }

  function pad(n) { return ('00000' + n).slice(-5); }
  function updateScore() {
    if (scoreEl) scoreEl.textContent = 'score ' + pad(state === 'idle' ? 0 : score()) + ' · best ' + pad(best);
  }

  // ---- 시작·끝·멈춤 ----
  function start() {
    readColors();
    reset();
    state = 'run';
    wrap.classList.add('playing');
    wrap.classList.remove('over');
    startBtn.hidden = true;
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
    updateScore();
  }
  function gameOver() {
    cancelAnimationFrame(raf);
    state = 'over';
    overAt = performance.now();
    var s = score();
    if (s > best) { best = s; try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {} }
    wrap.classList.remove('playing');
    wrap.classList.add('over');
    startBtn.textContent = '$ php artisan play:retry';
    startBtn.hidden = false;
    if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
    draw();
    updateScore();
  }
  var paused = false;
  function pause() {
    if (state !== 'run' || paused) return;
    paused = true;
    cancelAnimationFrame(raf);
  }
  function resume() {
    if (state !== 'run' || !paused) return;
    paused = false;
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  // ---- 입력 ----
  startBtn.addEventListener('click', start);
  cv.addEventListener('pointerdown', function (e) {
    if (state === 'run') { e.preventDefault(); jump(); }
    else if (state === 'over' && performance.now() - overAt > 600) start();
    else if (state === 'idle') start();
  });
  document.addEventListener('keydown', function (e) {
    if (state !== 'run') return;
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else resume(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) resume(); else pause();
    }, { threshold: 0.3 }).observe(cv);
  }
  // 다크/라이트 전환을 따라간다
  new MutationObserver(function () { readColors(); if (state !== 'run') draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  window.addEventListener('resize', resize);

  readColors();
  reset();
  resize();
  updateScore();
})();
