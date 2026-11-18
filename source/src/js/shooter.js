/* 미니 게임 'bug-hunt' (개발자 version 전용) + 게임 탭 전환
   아래의 작은 우주선이 하트를 쏘아 위에서 내려오는 버그와 에러 블록을 잡는다.
   - 손가락(마우스)으로 끌면 우주선이 따라오고, 하트는 자동으로 나간다. PC 는 ←/→ 키도 된다.
   - 버그 10점, 에러 블록 30점, 내려꽂히는 적을 잡으면 +20점. 목숨은 ♥ 3개.
   - 적이 쏘는 빨간 '!' 에 맞거나 적과 부딪히면 목숨이 하나 준다.
   - 한 wave 를 다 잡으면 다음 wave 가 더 빨라진다. 1030점(예식일 10.30)을 넘으면 축하 문구.
   - 색은 css/developer.css 의 theme 변수를 읽는다. 화면 밖·다른 탭에서는 멈춘다. */

// ---- 게임 탭 (wedding-run / bug-hunt) ----
(function gameTabs() {
  var tabs = document.querySelectorAll('.gtab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) {
        var on = o === t;
        o.classList.toggle('on', on);
        o.setAttribute('aria-selected', on ? 'true' : 'false');
        var box = document.getElementById(o.dataset.game);
        if (box) {
          box.hidden = !on;
          if (on) box.classList.add('in');          // 숨겨져 있던 동안 reveal 연출을 못 받았으므로 바로 보이게
        }
      });
      window.dispatchEvent(new Event('resize'));  // 새로 보인 canvas 의 크기를 다시 잰다
    });
  });
})();

(function bugHunt() {
  var wrap = document.getElementById('game2');
  var cv = document.getElementById('shootCanvas');
  var startBtn = document.getElementById('shootStart');
  var scoreEl = document.getElementById('shootScore');
  if (!wrap || !cv || !cv.getContext) return;
  var g = cv.getContext('2d');

  var BEST_KEY = 'wedding-hunt-best';
  var GOAL = 1030;
  var ERR_CODES = ['404', '500', '503', '419'];
  var best = 0;
  try { best = +localStorage.getItem(BEST_KEY) || 0; } catch (e) {}

  // ---- 화면 ----
  var W = 0, H = 260, DPR = 1;
  function resize() {
    if (wrap.hidden) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth || 320;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (ship) ship.x = Math.min(ship.x, W - 14);
    if (state !== 'run') draw();
  }

  var C = {};
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, d) { return (cs.getPropertyValue(n) || '').trim() || d; }
    C.bg = v('--panel', '#202024');
    C.line = v('--line', '#34343a');
    C.dim = v('--comment', '#8b8b96');
    C.bright = v('--text-bright', '#fafafa');
    C.red = v('--laravel', '#ff2d20');
    C.rose = v('--rose', '#ff7a8a');
    C.green = v('--green', '#6ee7a8');
    C.purple = v('--purple', '#a78bfa');
  }

  // ---- 스프라이트 ----
  var SHIP = [
    '....r....',
    '...rrr...',
    '...rwr...',
    '..rrwrr..',
    '.rrrrrrr.',
    'rrr.r.rrr',
    'rr.....rr',
  ];
  var BUG = [
    ['..b..b..', '...bb...', '.bbbbbb.', 'bbbbbbbb', '.bbbbbb.', 'b.b..b.b'],
    ['.b....b.', '..bbbb..', '.bbbbbb.', 'bbbbbbbb', '.bbbbbb.', '.b.bb.b.'],
  ];
  var HEART = ['.h.h.', 'hhhhh', '.hhh.', '..h..'];
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
  var SPX = 2.6, SW = 9 * SPX, SH = 7 * SPX;
  var state = 'idle';
  var ship = null, targetX = null, keys = {}, shots, foes, bombs, sparks, stars;
  var score, lives, wave, fireIn, inv, last, raf = 0, t = 0, msg = '', msgT = 0, goalShown = 0, overAt = 0;
  var swayT = 0;

  function reset() {
    ship = { x: W / 2, y: H - 30 };
    targetX = null;
    shots = []; bombs = []; sparks = [];
    score = 0; lives = 3; wave = 0; fireIn = 0; inv = 0; goalShown = 0;
    stars = [];
    for (var i = 0; i < 26; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: 10 + Math.random() * 30 });
    nextWave();
  }

  function nextWave() {
    wave++;
    foes = [];
    var cols = Math.max(4, Math.min(7, Math.floor((W - 40) / 40)));
    var rows = Math.min(2 + Math.floor(wave / 2), 4);
    var gapX = (W - 40) / cols;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var err = r === 0 && (c % 2 === 0) && wave > 1;
        foes.push({
          kind: err ? 'err' : 'bug',
          code: ERR_CODES[(Math.random() * ERR_CODES.length) | 0],
          hx: 20 + gapX * c + gapX / 2,      // 대열 안의 자리
          hy: 34 + r * 26,
          x: 0, y: -40 - r * 30,             // 위에서 내려오며 등장
          w: err ? 24 : 20, h: err ? 16 : 15,
          dive: false, vx: 0, vy: 0, entering: true,
        });
      }
    }
    msg = 'wave ' + wave + ' · deploying bugs...';
    msgT = 1.6;
  }

  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function foeBox(f) { return { x: f.x - f.w / 2, y: f.y - f.h / 2, w: f.w, h: f.h }; }
  function burst(x, y, col) {
    for (var i = 0; i < 8; i++) {
      var a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 90;
      sparks.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.45, col: col });
    }
  }

  // ---- 한 frame ----
  function step(now) {
    raf = requestAnimationFrame(step);
    var dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;
    t += dt;
    var lvl = Math.min(wave, 8);

    // 우주선 이동
    var mv = 0;
    if (keys.left) mv -= 1;
    if (keys.right) mv += 1;
    if (mv) targetX = null;
    var maxV = 520;
    if (targetX != null) {
      var d = targetX - ship.x;
      ship.x += Math.max(-maxV * dt, Math.min(maxV * dt, d));
    } else ship.x += mv * maxV * 0.75 * dt;
    ship.x = Math.max(SW / 2 + 2, Math.min(W - SW / 2 - 2, ship.x));

    // 자동 발사
    fireIn -= dt;
    if (fireIn <= 0) { shots.push({ x: ship.x - 5, y: ship.y - SH / 2 - 6, w: 10, h: 8 }); fireIn = 0.26; }
    shots.forEach(function (s) { s.y -= 430 * dt; });
    shots = shots.filter(function (s) { return s.y > -12 && !s.dead; });

    // 대열: 좌우로 흔들리며 아주 천천히 내려온다
    swayT += dt;
    var sway = Math.sin(swayT * (0.9 + lvl * 0.08)) * Math.min(40, W * 0.08);
    var sink = Math.min(70, swayT * (1.2 + lvl * 0.5));
    foes.forEach(function (f) {
      if (f.dive) {
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.vx += (ship.x - f.x) * 0.9 * dt;    // 우주선 쪽으로 살짝 휜다
        if (f.y > H + 20) { f.dive = false; f.entering = true; f.y = -20; }
        return;
      }
      var tx = f.hx + sway, ty = f.hy + sink;
      if (f.entering) {
        f.x = tx;
        f.y += 160 * dt;
        if (f.y >= ty) { f.y = ty; f.entering = false; }
      } else { f.x = tx; f.y = ty; }
    });

    // 가끔 한 마리가 내려꽂힌다
    if (Math.random() < dt * (0.25 + lvl * 0.12)) {
      var idle = foes.filter(function (f) { return !f.dive && !f.entering; });
      if (idle.length) {
        var f = idle[(Math.random() * idle.length) | 0];
        f.dive = true; f.vx = (ship.x - f.x) * 0.4; f.vy = 120 + lvl * 18;
      }
    }
    // 적의 '!' 폭탄
    if (foes.length && Math.random() < dt * (0.6 + lvl * 0.25)) {
      var sh = foes[(Math.random() * foes.length) | 0];
      if (!sh.entering) bombs.push({ x: sh.x - 2, y: sh.y + 8, w: 4, h: 10 });
    }
    bombs.forEach(function (b) { b.y += (170 + lvl * 14) * dt; });
    bombs = bombs.filter(function (b) { return b.y < H + 12 && !b.dead; });

    // 하트 ↔ 적
    shots.forEach(function (s) {
      for (var i = 0; i < foes.length; i++) {
        var f = foes[i];
        if (!f.dead && hit(s, foeBox(f))) {
          s.dead = true; f.dead = true;
          score += (f.kind === 'err' ? 30 : 10) + (f.dive ? 20 : 0);
          burst(f.x, f.y, f.kind === 'err' ? C.red : C.rose);
          break;
        }
      }
    });
    foes = foes.filter(function (f) { return !f.dead; });

    // 우주선 피격
    if (inv > 0) inv -= dt;
    var sb = { x: ship.x - SW / 2 + 3, y: ship.y - SH / 2 + 3, w: SW - 6, h: SH - 4 };
    if (inv <= 0) {
      var hurt = false;
      bombs.forEach(function (b) { if (!b.dead && hit(sb, b)) { b.dead = true; hurt = true; } });
      foes.forEach(function (f) { if (!f.dead && hit(sb, foeBox(f))) { f.dead = true; hurt = true; burst(f.x, f.y, C.red); } });
      foes = foes.filter(function (f) { return !f.dead; });
      if (hurt) {
        lives--;
        inv = 1.4;
        burst(ship.x, ship.y, C.red);
        if (navigator.vibrate) { try { navigator.vibrate(50); } catch (e) {} }
        if (lives <= 0) { gameOver(); return; }
      }
    }
    // 대열이 우주선 높이까지 내려오면 끝
    if (foes.some(function (f) { return !f.dive && f.y > ship.y - 20; })) { lives = 0; gameOver(); return; }

    if (!foes.length) { swayT = 0; nextWave(); }

    sparks.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
    sparks = sparks.filter(function (p) { return p.life > 0; });
    stars.forEach(function (s) { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
    if (msgT > 0) msgT -= dt;
    if (score >= GOAL && !goalShown) goalShown = 2.6;
    if (goalShown > 0) goalShown = Math.max(0.0001, goalShown - dt);

    draw();
    updateScore();
  }

  // ---- 그리기 ----
  function draw() {
    if (!W) return;
    g.fillStyle = C.bg;
    g.fillRect(0, 0, W, H);

    g.fillStyle = C.line;
    (stars || []).forEach(function (s) { g.fillRect(s.x, s.y, 1.5, 1.5); });

    // 적
    (foes || []).forEach(function (f) {
      if (f.kind === 'bug') {
        sprite(BUG[Math.floor(t * 4 + f.hx) % 2], f.x - 10, f.y - 7.5, 2.5, { b: f.dive ? C.purple : C.red });
      } else {
        g.save();
        g.shadowColor = C.red;
        g.shadowBlur = 8;
        g.fillStyle = C.red;
        g.fillRect(f.x - f.w / 2, f.y - f.h / 2, f.w, f.h);
        g.restore();
        g.fillStyle = '#fff';
        g.font = 'bold 9px "Fira Code", monospace';
        g.textAlign = 'center';
        g.fillText(f.code, f.x, f.y + 3);
        g.textAlign = 'left';
      }
    });

    // 적 폭탄 '!'
    g.fillStyle = C.red;
    (bombs || []).forEach(function (b) {
      g.fillRect(b.x, b.y, b.w, b.h - 4);
      g.fillRect(b.x, b.y + b.h - 2, b.w, 2);
    });

    // 하트 총알
    (shots || []).forEach(function (s) {
      g.save();
      g.shadowColor = C.rose;
      g.shadowBlur = 6;
      sprite(HEART, s.x, s.y, 2, { h: C.rose });
      g.restore();
    });

    // 불꽃
    (sparks || []).forEach(function (p) {
      g.globalAlpha = Math.max(0, p.life / 0.45);
      g.fillStyle = p.col;
      g.fillRect(p.x, p.y, 2, 2);
    });
    g.globalAlpha = 1;

    // 우주선 (피격 직후 깜빡임)
    if (ship && !(inv > 0 && Math.floor(t * 12) % 2)) {
      sprite(SHIP, ship.x - SW / 2, ship.y - SH / 2, SPX, { r: C.red, w: '#ffffff' });
      if (state === 'run') {                       // 엔진 불꽃
        g.fillStyle = C.rose;
        g.fillRect(ship.x - 1.5, ship.y + SH / 2, 3, 3 + Math.random() * 4);
      }
    }

    g.textAlign = 'center';
    if (state === 'run' && msgT > 0) {
      g.globalAlpha = Math.min(1, msgT);
      g.fillStyle = C.green;
      g.font = '12px "Fira Code", monospace';
      g.fillText(msg, W / 2, H / 2);
      g.globalAlpha = 1;
    }
    if (goalShown > 0) {
      g.fillStyle = C.green;
      g.font = 'bold 13px "Fira Code", monospace';
      g.fillText('🎉 2027.10.30 버그 없는 결혼식!', W / 2, H / 2 - 30);
      g.fillStyle = C.dim;
      g.font = '11px "Fira Code", monospace';
      g.fillText('// 실제로도 꼭 와 주세요 ♥', W / 2, H / 2 - 12);
    }
    if (state === 'idle') {
      g.fillStyle = C.dim;
      g.font = '12px "Fira Code", monospace';
      g.fillText('// 버그 사냥 준비 완료', W / 2, H / 2 - 30);
    }
    if (state === 'over') {
      g.fillStyle = 'rgba(0,0,0,0.4)';
      g.fillRect(0, 0, W, H);
      g.fillStyle = C.red;
      g.font = 'bold 13px "Fira Code", monospace';
      g.fillText('FatalError: 버그가 너무 많아요', W / 2, H / 2 - 52);
      g.fillStyle = '#fafafa';
      g.font = '12px "Fira Code", monospace';
      g.fillText('wave ' + wave + ' · score ' + score + (score >= best && score > 0 ? '  · new best!' : ''), W / 2, H / 2 - 30);
    }
    g.textAlign = 'left';
  }

  function pad(n) { return ('00000' + n).slice(-5); }
  function updateScore() {
    if (!scoreEl) return;
    var hearts = state === 'idle' ? '♥♥♥' : (new Array(Math.max(0, lives) + 1).join('♥') + new Array(3 - Math.max(0, lives) + 1).join('♡'));
    scoreEl.innerHTML = 'score ' + pad(state === 'idle' ? 0 : score) + ' · <span class="lives">' + hearts + '</span> · best ' + pad(best);
  }

  // ---- 시작·끝·멈춤 ----
  function start() {
    readColors();
    resize();
    reset();
    state = 'run';
    swayT = 0;
    wrap.classList.add('playing');
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
    if (score > best) { best = score; try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {} }
    wrap.classList.remove('playing');
    startBtn.textContent = '$ php artisan debug:retry';
    startBtn.hidden = false;
    if (navigator.vibrate) { try { navigator.vibrate(80); } catch (e) {} }
    draw();
    updateScore();
  }
  var paused = false;
  function pause() { if (state === 'run' && !paused) { paused = true; cancelAnimationFrame(raf); } }
  function resume() {
    if (state === 'run' && paused) { paused = false; last = performance.now(); raf = requestAnimationFrame(step); }
  }

  // ---- 입력 ----
  function pointX(e) { var r = cv.getBoundingClientRect(); return e.clientX - r.left; }
  startBtn.addEventListener('click', start);
  cv.addEventListener('pointerdown', function (e) {
    if (state === 'run') { e.preventDefault(); targetX = pointX(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} }
    else if (state === 'over' && performance.now() - overAt > 700) start();
    else if (state === 'idle') start();
  });
  cv.addEventListener('pointermove', function (e) {
    if (state !== 'run') return;
    if (e.pointerType === 'mouse' || e.buttons || e.pressure > 0) targetX = pointX(e);
  });
  document.addEventListener('keydown', function (e) {
    if (state !== 'run' || wrap.hidden) return;
    if (e.code === 'ArrowLeft') { keys.left = true; e.preventDefault(); }
    if (e.code === 'ArrowRight') { keys.right = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
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
    if (!was && W && state === 'idle') { ship = { x: W / 2, y: H - 30 }; foes = []; draw(); }
  });

  readColors();
  resize();
  updateScore();
})();
