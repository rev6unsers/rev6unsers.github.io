/* 미니 게임 'wedding-cake' (개발자 version 전용)
   좌우로 움직이는 케이크 층을 타이밍 맞춰 눌러 쌓는다. 아래 층과 어긋난 만큼 잘려 나가 점점 좁아진다.
   - 거의 딱 맞추면(perfect) 잘리지 않고 +2점, 연속 perfect 면 층이 조금 넓어진다.
   - 아래 층을 완전히 벗어나면 케이크가 무너지며 끝난다. 끝나면 맨 위에 신랑·신부 인형이 올라간다.
   - 30층(예식일 10.30)을 넘으면 축하 문구가 뜬다.
   - 색은 css/developer.css 의 theme 변수를 읽는다. 화면 밖·다른 탭에서는 멈춘다. */
(function weddingCake() {
  var wrap = document.getElementById('game3');
  var cv = document.getElementById('cakeCanvas');
  var startBtn = document.getElementById('cakeStart');
  var scoreEl = document.getElementById('cakeScore');
  if (!wrap || !cv || !cv.getContext) return;
  var g = cv.getContext('2d');

  var BEST_KEY = 'wedding-cake-best';
  var GOAL = 30;
  var LH = 16;                                   // 한 층 높이
  var PERFECT = 5;                               // 이만큼 이내로 맞추면 perfect
  var best = 0;
  try { best = +localStorage.getItem(BEST_KEY) || 0; } catch (e) {}

  // 케이크 층 색 (크림, 딸기, 라즈베리, 바닐라, 초코 순으로 돈다)
  var FLAVORS = [
    { body: '#fde7c8', top: '#fff8ec' },
    { body: '#ffc2cf', top: '#ffe4ea' },
    { body: '#ff8fa6', top: '#ffd0da' },
    { body: '#f6d8a8', top: '#fff3dc' },
    { body: '#a9745a', top: '#d9b39c' },
  ];

  var W = 0, H = 300, DPR = 1;
  function resize() {
    if (wrap.hidden) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth || 320;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (state !== 'run') draw();
  }

  var C = {};
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, d) { return (cs.getPropertyValue(n) || '').trim() || d; }
    C.bg = v('--panel', '#202024');
    C.line = v('--line', '#34343a');
    C.dim = v('--comment', '#8b8b96');
    C.red = v('--laravel', '#ff2d20');
    C.rose = v('--rose', '#ff7a8a');
    C.green = v('--green', '#6ee7a8');
  }

  // 신랑·신부 인형 (k 턱시도, s 얼굴, h 머리, w 드레스·베일, r 나비넥타이)
  var GROOM = ['.hh.', 'hssh', '.ss.', 'krrk', 'kkkk', 'kkkk', '.kk.', '.kk.'];
  var BRIDE = ['.ww.', 'whhw', 'wssw', '.ww.', 'wwww', 'wwww', 'wwww', 'wwww'];
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

  // ---- 상태 ----
  var state = 'idle';                          // idle | run | over
  var stack, mover, falling, crumbs, score, combo, cam, camTo, last, raf = 0, t = 0;
  var popT = 0, popText = '', goalShown = 0, overAt = 0;

  function baseY(i) { return H - 34 - (i + 1) * LH; }   // i 번째 층의 윗면 y (카메라 이동 전)

  function reset() {
    var w0 = Math.min(W * 0.62, 210);
    stack = [{ x: (W - w0) / 2, w: w0, f: 0 }];
    falling = [];
    crumbs = [];
    score = 0;
    combo = 0;
    cam = 0; camTo = 0;
    goalShown = 0;
    popT = 0;
    newMover();
  }

  function newMover() {
    var top = stack[stack.length - 1];
    var n = stack.length;
    var sp = Math.min(150 + n * 9, 380);
    var fromLeft = n % 2 === 1;
    mover = { x: fromLeft ? -top.w : W, w: top.w, f: n % FLAVORS.length, v: fromLeft ? sp : -sp };
    // 쌓인 높이가 화면 가운데를 넘으면 카메라를 내린다
    var topY = baseY(n);
    camTo = Math.max(0, H * 0.42 - topY);
  }

  function drop() {
    if (state !== 'run') return;
    var top = stack[stack.length - 1];
    var m = mover;
    var left = Math.max(m.x, top.x), right = Math.min(m.x + m.w, top.x + top.w);
    var over = right - left;
    var y = baseY(stack.length);
    if (over <= 0) {                           // 완전히 벗어남 → 무너짐
      falling.push({ x: m.x, y: y, w: m.w, f: m.f, vy: 0, vx: m.v * 0.3, rot: 0 });
      gameOver();
      return;
    }
    if (Math.abs(m.x - top.x) <= PERFECT) {    // perfect: 자르지 않고 아래 층에 맞춘다
      combo++;
      var grow = combo >= 3 ? Math.min(8, Math.max(0, Math.min(W * 0.62, 210) - top.w)) : 0;
      stack.push({ x: top.x - grow / 2, w: top.w + grow, f: m.f });
      score += 2;
      popText = combo >= 3 ? 'perfect x' + combo + '!' : 'perfect!';
      popT = 0.9;
      for (var i = 0; i < 10; i++) crumbs.push({ x: top.x + Math.random() * top.w, y: y, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 80, life: 0.6, col: '#fff' });
    } else {
      combo = 0;
      // 잘려 나가는 조각
      if (m.x < top.x) falling.push({ x: m.x, y: y, w: top.x - m.x, f: m.f, vy: 0, vx: -40, rot: 0 });
      else falling.push({ x: top.x + top.w, y: y, w: m.x + m.w - (top.x + top.w), f: m.f, vy: 0, vx: 40, rot: 0 });
      stack.push({ x: left, w: over, f: m.f });
      score += 1;
    }
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
    if (score >= GOAL && !goalShown) goalShown = 2.8;
    newMover();
    updateScore();
  }

  // ---- 한 frame ----
  function step(now) {
    raf = requestAnimationFrame(step);
    var dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;
    t += dt;
    tick(dt);
    draw();
  }
  function tick(dt) {
    if (state === 'run' && mover) {
      mover.x += mover.v * dt;
      // 화면 끝에서 되돌아온다
      if (mover.v > 0 && mover.x > W - mover.w * 0.25) mover.v = -mover.v;
      if (mover.v < 0 && mover.x < -mover.w * 0.75) mover.v = -mover.v;
    }
    cam += (camTo - cam) * Math.min(1, dt * 6);
    falling.forEach(function (p) { p.vy += 900 * dt; p.y += p.vy * dt; p.x += p.vx * dt; p.rot += p.vx * 0.0006; });
    falling = falling.filter(function (p) { return p.y - cam < H + 60; });
    crumbs.forEach(function (c) { c.vy += 400 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt; });
    crumbs = crumbs.filter(function (c) { return c.life > 0; });
    if (popT > 0) popT -= dt;
    if (goalShown > 0) goalShown = Math.max(0.0001, goalShown - dt);
  }

  // ---- 그리기 ----
  function layer(x, y, w, f, ox) {
    var fl = FLAVORS[f % FLAVORS.length];
    g.fillStyle = fl.body;
    g.fillRect(x, y, w, LH);
    g.fillStyle = fl.top;                      // 위쪽 크림
    g.fillRect(x, y, w, 4);
    for (var d = 6; d < w - 4; d += 10) {      // 흘러내린 크림 방울
      g.fillRect(x + d, y + 4, 3, 2 + ((d + (ox || 0)) % 3));
    }
    g.fillStyle = 'rgba(0,0,0,0.08)';
    g.fillRect(x, y + LH - 2, w, 2);
  }

  function draw() {
    if (!W) return;
    g.fillStyle = C.bg;
    g.fillRect(0, 0, W, H);

    g.save();
    g.translate(0, cam);

    // 케이크 받침
    if (stack) {
      var b = stack[0];
      var py = H - 34;
      g.fillStyle = C.line;
      g.fillRect(b.x - 18, py, b.w + 36, 5);
      g.fillRect(W / 2 - 4, py + 5, 8, 18);
      g.fillRect(W / 2 - 22, py + 22, 44, 4);
    }

    // 쌓인 층
    (stack || []).forEach(function (s, i) { layer(s.x, baseY(i), s.w, s.f, i * 3); });

    // 잘려 떨어지는 조각
    (falling || []).forEach(function (p) {
      g.save();
      g.translate(p.x + p.w / 2, p.y + LH / 2);
      g.rotate(p.rot);
      layer(-p.w / 2, -LH / 2, p.w, p.f, 0);
      g.restore();
    });

    // 움직이는 층
    if (state === 'run' && mover) layer(mover.x, baseY(stack.length), mover.w, mover.f, 1);

    // 끝나면 맨 위에 신랑·신부 인형
    if (state === 'over' && stack && stack.length > 1) {
      var top = stack[stack.length - 1], ty = baseY(stack.length - 1);
      var cx = top.x + top.w / 2;
      sprite(GROOM, cx - 11, ty - 16, 2, { h: '#4a3528', s: '#f2c9a5', k: '#3f3f46', r: C.red });
      sprite(BRIDE, cx + 2, ty - 16, 2, { h: '#4a3528', s: '#f2c9a5', w: '#ffffff' });
      g.fillStyle = C.rose;
      g.font = '10px sans-serif';
      g.textAlign = 'center';
      g.fillText('♥', cx, ty - 20 + Math.sin(t * 4) * 2);
      g.textAlign = 'left';
    }

    // 부스러기
    (crumbs || []).forEach(function (c) {
      g.globalAlpha = Math.max(0, c.life / 0.6);
      g.fillStyle = c.col;
      g.fillRect(c.x, c.y, 2, 2);
    });
    g.globalAlpha = 1;
    g.restore();

    // 글자
    g.textAlign = 'center';
    if (popT > 0) {
      g.globalAlpha = Math.min(1, popT * 2);
      g.fillStyle = C.green;
      g.font = 'bold 13px "Fira Code", monospace';
      g.fillText(popText, W / 2, 46);
      g.globalAlpha = 1;
    }
    if (state === 'run') {
      g.fillStyle = C.dim;
      g.font = '12px "Fira Code", monospace';
      g.fillText((stack.length - 1) + '층', W / 2, 24);
    }
    if (goalShown > 0) {
      g.fillStyle = C.green;
      g.font = 'bold 13px "Fira Code", monospace';
      g.fillText('🎉 30점 돌파! 10월 30일에 만나요', W / 2, 70);
    }
    if (state === 'idle') {
      g.fillStyle = C.dim;
      g.font = '12px "Fira Code", monospace';
      g.fillText('// 케이크 반죽 준비 완료', W / 2, 60);
    }
    if (state === 'over') {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(0, 0, W, 96);
      g.fillStyle = C.red;
      g.font = 'bold 12px "Fira Code", monospace';
      g.fillText('CakeException: 케이크가 무너졌어요', W / 2, 30);
      g.fillStyle = '#fafafa';
      g.font = '12px "Fira Code", monospace';
      g.fillText((stack.length - 1) + '층 · score ' + score + (score >= best && score > 0 ? '  · new best!' : ''), W / 2, 50);
    }
    g.textAlign = 'left';
  }

  function pad(n) { return ('000' + n).slice(-3); }
  function updateScore() {
    if (scoreEl) scoreEl.textContent = 'score ' + pad(state === 'idle' ? 0 : score) + ' · best ' + pad(best);
  }

  // ---- 시작·끝·멈춤 ----
  function loop() { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(step); }
  function start() {
    readColors();
    resize();
    reset();
    state = 'run';
    wrap.classList.add('playing');
    startBtn.hidden = true;
    loop();
    updateScore();
  }
  function gameOver() {
    state = 'over';
    overAt = performance.now();
    if (score > best) { best = score; try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {} }
    wrap.classList.remove('playing');
    startBtn.textContent = '$ php artisan cake:bake --retry';
    startBtn.hidden = false;
    if (navigator.vibrate) { try { navigator.vibrate(70); } catch (e) {} }
    updateScore();
    // 무너지는 조각이 떨어지는 동안만 조금 더 그린다
    setTimeout(function () { if (state === 'over') cancelAnimationFrame(raf); }, 1500);
  }
  var paused = false;
  function pause() { if (state === 'run' && !paused) { paused = true; cancelAnimationFrame(raf); } }
  function resume() { if (state === 'run' && paused) { paused = false; loop(); } }

  // ---- 입력 ----
  startBtn.addEventListener('click', start);
  cv.addEventListener('pointerdown', function (e) {
    if (state === 'run') { e.preventDefault(); drop(); }
    else if (state === 'over' && performance.now() - overAt > 700) start();
    else if (state === 'idle') start();
  });
  document.addEventListener('keydown', function (e) {
    if (state !== 'run' || wrap.hidden) return;
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); drop(); }
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else resume(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) resume(); else pause(); }, { threshold: 0.3 }).observe(cv);
  }
  new MutationObserver(function () { readColors(); if (state !== 'run') draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('resize', function () {
    var was = W;
    resize();
    if (!was && W && state === 'idle') { reset(); draw(); }
  });

  readColors();
  resize();
  updateScore();
})();
