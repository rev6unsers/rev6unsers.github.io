/*
   fx.js: 파스텔(main) version의 화려한 연출. main.js 다음에 load한다.
   이 파일이 없거나 한 기능이 실패해도 청첩장 자체는 그대로 동작하도록, 기능마다 따로 감싼다.
   움직임 줄이기(REDUCE_MOTION, main.js)를 켠 기기에서는 움직이는 연출을 하지 않는다.

   목차
   01. 오프닝 인트로   : 봉투를 누르면 도장이 떨어지고 편지가 올라온 뒤 청첩장이 열린다 (세션당 한 번)
   02. 꽃잎            : 표지 위로 꽃잎이 흩날린다 (canvas, 표지가 보일 때만)
   03. 하트 터치       : 표지를 누르면 그 자리에서 하트가 떠오른다
   04. 진행 바         : 맨 위 얇은 바가 읽은 만큼 차오른다 (CSS scroll-timeline, 미지원 시 JS)
   05. 섹션 제목       : 한글 제목을 글자 단위로 나눠 차례로 떠오르게 한다
   06. 달력            : 날짜가 차례로 톡톡 나타나도록 순번을 매긴다
   07. 배경색          : 스크롤에 따라 배경색이 은은하게 바뀐다 (CSS scroll-timeline 미지원 시 JS)
   08. 프로필 카드     : 손가락을 댄 자리에 빛이 따라오고 PC에서는 3D로 기운다
   09. 복사·공유 하트  : 복사·공유 button을 누르면 하트가 터지고 짧게 진동한다
   10. 마지막 장면     : '감사합니다' 손글씨와 아래에서 떠오르는 하트
   11. 팝업북 카드     : 책이 펼쳐지며 꽃 아치, 이름 팻말, 꽃덤불이 차례로 일어선다
 */

const FX_MOTION = !(typeof REDUCE_MOTION !== 'undefined' && REDUCE_MOTION);

function fxSafe(name, fn) {
  try { fn(); } catch (e) { if (window.console) console.warn('[fx] ' + name, e); }
}


/* 01. 오프닝 인트로 */

fxSafe('intro', () => {
  if (!FX_MOTION) return;
  let seen = false;
  try { seen = sessionStorage.getItem('wedding-intro') === '1'; } catch (e) {}
  // 이미 본 사람, 중간 위치로 새로고침한 사람에게는 다시 보여주지 않는다.
  if (seen || window.scrollY > 40) return;

  const p = CONFIG.people || {};
  const g = (p.groom || {}).short || '';
  const b = (p.bride || {}).short || '';
  const D = CONFIG.date;
  const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][D.getDay()];
  const h12 = D.getHours() % 12 || 12;
  const ampm = D.getHours() < 12 ? 'AM' : 'PM';
  const dateText = `${D.getFullYear()}. ${D.getMonth() + 1}. ${D.getDate()}  ${DAY}  ${h12}${ampm}`;


  // 봉투: 뒤판, 편지, 앞주머니, 윗덮개, 밀랍 도장 순서로 쌓는다. 모양과 움직임은 css/main.css 의 17-1.
  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.setAttribute('role', 'dialog');
  intro.setAttribute('aria-label', '청첩장 봉투 열기');
  intro.innerHTML =
    '<div class="intro-glow"></div>' +
    '<div class="env-to">You\'re invited</div>' +
    '<div class="env-wrap"><div class="env">' +
      '<div class="env-back"></div>' +
      '<div class="env-letter">' +
        '<svg class="intro-sign" viewBox="0 0 360 86" aria-hidden="true">' +
          '<text x="180" y="62" text-anchor="middle">Our Wedding Day</text>' +
        '</svg>' +
        `<div class="intro-names">${g} <i>&amp;</i> ${b}</div>` +
        `<div class="intro-date">${dateText}</div>` +
      '</div>' +
      '<div class="env-pocket">' +
        '<svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">' +
          '<defs>' +
            '<linearGradient id="envSide" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8dccf"/><stop offset="1" stop-color="#f3cbba"/></linearGradient>' +
            '<linearGradient id="envBottom" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fde7dd"/><stop offset="1" stop-color="#fad9cb"/></linearGradient>' +
          '</defs>' +
          '<path d="M0 6 Q0 0 4 1 L150 112 L4 199 Q0 200 0 194 Z" fill="url(#envSide)"/>' +
          '<path d="M300 6 Q300 0 296 1 L150 112 L296 199 Q300 200 300 194 Z" fill="url(#envSide)"/>' +
          '<path d="M0 194 L150 100 L300 194 Q300 200 292 200 L8 200 Q0 200 0 194 Z" fill="url(#envBottom)"/>' +
        '</svg>' +
      '</div>' +
      '<div class="env-flap"></div>' +
      '<div class="env-seal"><span>♥</span></div>' +   // 밀랍 도장: 하트 하나
    '</div></div>' +
    '<div class="intro-hint">봉투를 눌러 열어 주세요</div>';

  document.body.appendChild(intro);
  document.documentElement.classList.add('intro-on');

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    try { sessionStorage.setItem('wedding-intro', '1'); } catch (e) {}
    intro.classList.add('out');
    document.documentElement.classList.remove('intro-on');
    setTimeout(() => intro.remove(), 1000);
  }

  // 누르면 봉투가 열린다. 열리는 동안 한 번 더 누르면 바로 청첩장으로 넘어간다.
  // 아무도 누르지 않으면 6초 뒤 저절로 열린다(멈춘 화면처럼 보이지 않게).
  let opened = false, autoTimer = 0;
  function open() {
    if (opened) { close(); return; }
    opened = true;
    clearTimeout(autoTimer);
    intro.classList.add('ready', 'open');
    if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
    setTimeout(close, 4800);
  }

  // 손글씨 글꼴이 load된 뒤 봉투를 띄운다. 글꼴이 늦어도 0.7초 뒤에는 띄운다.
  const start = () => {
    intro.classList.add('ready');
    autoTimer = setTimeout(open, 6000);
  };
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 700))]).then(start);
  } else {
    start();
  }
  intro.addEventListener('click', open);
});


// 오프닝을 띄웠든 건너뛰었든, 본문 가림(main.html <head> 의 intro-pending)을 푼다.
// 봉투가 화면에 한 번 그려진 다음 프레임에 푼다(그 사이에 본문이 비치지 않게).
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('intro-pending')));

/* 01-2. 날짜 긁기: 예식 안내의 날짜를 로즈골드 은박으로 덮고, 긁으면 드러난다 (makeScratch 는 config.js) */

fxSafe('scratch', () => {
  const box = document.getElementById('whenBox');
  if (!box || typeof makeScratch !== 'function') return;

  // 반짝이 위치는 매번 같게(새로 그려도 모양이 튀지 않게) 고정된 난수로 만든다.
  function rnd(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

  function paintFoil(g, W, H) {
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#efc2b0');
    grd.addColorStop(0.35, '#fbe6dc');
    grd.addColorStop(0.55, '#f2c4b2');
    grd.addColorStop(0.8, '#fde9e0');
    grd.addColorStop(1, '#e3a28c');
    g.fillStyle = grd;
    g.beginPath();
    g.roundRect ? g.roundRect(0, 0, W, H, 16) : g.rect(0, 0, W, H);
    g.fill();
    // 은박 결(사선)과 반짝이
    g.save();
    g.globalAlpha = 0.18;
    g.strokeStyle = '#fff';
    g.lineWidth = 1;
    for (let x = -H; x < W; x += 7) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke(); }
    g.restore();
    const r = rnd(7);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(255,255,255,${(0.35 + r() * 0.5).toFixed(2)})`;
      g.beginPath();
      g.arc(r() * W, r() * H, 0.6 + r() * 1.6, 0, Math.PI * 2);
      g.fill();
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = 'rgba(150,70,50,0.35)';
    g.shadowBlur = 4;
    g.fillStyle = '#fff';
    g.font = '700 16px "Gowun Batang", serif';
    g.fillText('✦ 손가락으로 긁어 주세요 ✦', W / 2, H / 2 - 9);
    g.shadowBlur = 0;
    g.fillStyle = 'rgba(140,70,52,0.75)';
    g.font = '12px "Gowun Dodum", sans-serif';
    g.fillText('예식 날짜가 숨어 있어요', W / 2, H / 2 + 14);
  }

  makeScratch(box, {
    id: 'date',
    brush: 30,
    paint: paintFoil,
    onReveal(el) {
      if (!FX_MOTION) return;
      const layer = document.querySelector('.fx-layer');
      if (!layer) return;
      const r = el.getBoundingClientRect();
      for (let i = 0; i < 14; i++) {
        const h = document.createElement('span');
        h.className = 'burst-heart';
        h.textContent = i % 3 === 0 ? '♡' : '♥';
        h.style.left = (r.left + r.width / 2) + 'px';
        h.style.top = (r.top + r.height / 2) + 'px';
        const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
        const dist = 70 + Math.random() * 50;
        h.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
        h.style.setProperty('--dy', (Math.sin(ang) * dist * 0.6 - 30).toFixed(0) + 'px');
        h.style.setProperty('--rot', ((Math.random() - 0.5) * 80).toFixed(0) + 'deg');
        h.style.setProperty('--sz', (12 + Math.random() * 10).toFixed(0) + 'px');
        layer.appendChild(h);
        setTimeout(() => h.remove(), 1200);
      }
    },
  });
});


/* 02. 꽃잎 */

fxSafe('petals', () => {
  if (!FX_MOTION) return;
  const cover = document.querySelector('.cover');
  if (!cover) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'petals';
  canvas.setAttribute('aria-hidden', 'true');
  cover.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const COLORS = ['rgba(240,169,143,0.75)', 'rgba(232,149,122,0.6)', 'rgba(251,228,218,0.9)', 'rgba(185,167,217,0.55)'];
  const COUNT = 18;
  let W = 0, H = 0, dpr = 1;
  let petals = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cover.clientWidth;
    H = cover.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(initial) {
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : -20,
      s: 5 + Math.random() * 6,                    // 크기
      vy: 0.35 + Math.random() * 0.55,             // 떨어지는 속도
      sway: 0.6 + Math.random() * 1.2,             // 좌우로 흔들리는 폭
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.03,
      flip: Math.random() * Math.PI * 2,           // 뒤집히는 정도 (3D 느낌)
      c: COLORS[(Math.random() * COLORS.length) | 0],
    };
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.7 + 0.3);
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.moveTo(0, -p.s);
    ctx.bezierCurveTo(p.s * 0.95, -p.s * 0.55, p.s * 0.6, p.s * 0.8, 0, p.s);
    ctx.bezierCurveTo(-p.s * 0.6, p.s * 0.8, -p.s * 0.95, -p.s * 0.55, 0, -p.s);
    ctx.fill();
    ctx.restore();
  }

  let running = false, raf = 0, t = 0;
  function frame() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    for (const p of petals) {
      p.y += p.vy;
      p.x += Math.sin(t * 0.012 + p.phase) * p.sway * 0.35;
      p.rot += p.vr;
      p.flip += 0.03;
      if (p.y > H + 20) Object.assign(p, spawn(false));
      drawPetal(p);
    }
    raf = requestAnimationFrame(frame);
  }
  function play() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  petals = Array.from({ length: COUNT }, () => spawn(true));
  window.addEventListener('resize', resize, { passive: true });

  // 표지가 화면에 보일 때만 그린다. 화면 밖이거나 탭이 숨겨지면 멈춰 배터리를 아낀다.
  let visible = true;
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible && !document.hidden) play(); else stop();
  }).observe(cover);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (visible) play();
  });
  play();
});


/* 03. 하트 터치 */

fxSafe('hearts', () => {
  if (!FX_MOTION) return;
  const cover = document.querySelector('.cover');
  if (!cover) return;
  let downX = 0, downY = 0;
  cover.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; }, { passive: true });
  cover.addEventListener('pointerup', (e) => {
    if (e.target.closest('a, button')) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;   // 스크롤 중이면 무시
    const r = cover.getBoundingClientRect();
    const HEARTS = ['♥', '♡', '♥', '❤'];
    for (let i = 0; i < 7; i++) {
      const h = document.createElement('span');
      h.className = 'tap-heart';
      h.textContent = HEARTS[i % HEARTS.length];
      h.style.left = (e.clientX - r.left) + 'px';
      h.style.top = (e.clientY - r.top) + 'px';
      h.style.setProperty('--dx', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
      h.style.setProperty('--dy', (-(60 + Math.random() * 90)).toFixed(0) + 'px');
      h.style.setProperty('--rot', ((Math.random() - 0.5) * 70).toFixed(0) + 'deg');
      h.style.setProperty('--sz', (14 + Math.random() * 12).toFixed(0) + 'px');
      h.style.animationDelay = (i * 35) + 'ms';
      cover.appendChild(h);
      setTimeout(() => h.remove(), 1600);
    }
  });
});


/* 04. 진행 바 */

fxSafe('progress', () => {
  const bar = document.querySelector('.scroll-bar');
  if (!bar) return;
  // 최신 browser는 CSS(animation-timeline: scroll())가 알아서 그린다.
  if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) return;
  let ticking = false;
  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--sp', max > 0 ? (window.scrollY / max).toFixed(4) : '0');
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
});


/* 05. 섹션 제목: 글자 단위로 나눈다. 등장 자체는 .rv.in 이 붙을 때 CSS가 한다. */

fxSafe('titles', () => {
  // 손글씨 영문 label: 안쪽 span(.lbl)만 왼쪽부터 드러난다.
  document.querySelectorAll('.label').forEach((el) => {
    const span = document.createElement('span');
    span.className = 'lbl';
    while (el.firstChild) span.appendChild(el.firstChild);
    el.appendChild(span);
  });

  document.querySelectorAll('.label-title').forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((ch, i) =>
      `<span class="ch" aria-hidden="true" style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch}</span>`
    ).join('');
  });
});


/* 06. 달력: 날짜마다 순번을 매겨 차례로 나타나게 한다. */

fxSafe('calendar', () => {
  document.querySelectorAll('.cal .d').forEach((d, i) => d.style.setProperty('--i', i));
});


/* 07. 배경색: CSS scroll-timeline을 지원하지 않는 browser용. 색과 위치는 css/main.css 의 '18.'과 같다. */

fxSafe('tint', () => {
  if (!FX_MOTION) return;
  if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) return;
  const paper = document.querySelector('.paper');
  if (!paper) return;
  const STOPS = [
    [0.00, [255, 248, 243]],
    [0.22, [253, 238, 230]],
    [0.45, [251, 242, 239]],
    [0.62, [245, 240, 250]],
    [0.82, [253, 239, 231]],
    [1.00, [255, 248, 243]],
  ];
  function colorAt(t) {
    for (let i = 1; i < STOPS.length; i++) {
      const [t1, c1] = STOPS[i];
      const [t0, c0] = STOPS[i - 1];
      if (t <= t1) {
        const k = (t - t0) / (t1 - t0 || 1);
        return 'rgb(' + c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',') + ')';
      }
    }
    return 'rgb(255,248,243)';
  }
  let ticking = false;
  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const t = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    paper.style.setProperty('--bgc', colorAt(t));
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
});


/* 08. 프로필 카드: 손가락이나 마우스를 댄 자리에 빛이 따라오고, PC에서는 살짝 3D로 기운다. */

fxSafe('cards', () => {
  if (!FX_MOTION) return;
  const canHover = window.matchMedia('(hover: hover)').matches;
  // 카드는 main.html 끝의 profile script가 만든다. 그 script가 끝난 뒤(DOMContentLoaded)에 연결한다.
  const attach = () => document.querySelectorAll('.pf-card').forEach((card) => {
    function move(e) {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      if (canHover) {
        card.style.setProperty('--tx', ((0.5 - y) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--ty', ((x - 0.5) * 12).toFixed(2) + 'deg');
      }
      card.classList.add('lit');
    }
    function leave() {
      card.classList.remove('lit');
      card.style.setProperty('--tx', '0deg');
      card.style.setProperty('--ty', '0deg');
    }
    card.addEventListener('pointermove', move, { passive: true });
    card.addEventListener('pointerdown', move, { passive: true });
    card.addEventListener('pointerleave', leave, { passive: true });
    card.addEventListener('pointercancel', leave, { passive: true });
    card.addEventListener('pointerup', () => setTimeout(leave, 600), { passive: true });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
});


/* 09. 복사·공유 하트: 계좌 복사, 주소 복사, 공유하기를 누르면 그 자리에서 하트가 터진다.
   안드로이드에서는 짧게 진동한다(iOS는 지원하지 않아 조용히 넘어간다). */

fxSafe('burst', () => {
  if (!FX_MOTION) return;
  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.acc button, #copyAddr, #shareBtn');
    if (!btn) return;
    let x = e.clientX, y = e.clientY;
    if (!x && !y) {                          // 키보드로 누른 경우 button 가운데에서
      const r = btn.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    for (let i = 0; i < 9; i++) {
      const h = document.createElement('span');
      h.className = 'burst-heart';
      h.textContent = i % 3 === 0 ? '♡' : '♥';
      h.style.left = x + 'px';
      h.style.top = y + 'px';
      const ang = (Math.PI * 2 * i) / 9 + Math.random() * 0.4;
      const dist = 40 + Math.random() * 40;
      h.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
      h.style.setProperty('--dy', (Math.sin(ang) * dist - 30).toFixed(0) + 'px');
      h.style.setProperty('--rot', ((Math.random() - 0.5) * 80).toFixed(0) + 'deg');
      h.style.setProperty('--sz', (11 + Math.random() * 9).toFixed(0) + 'px');
      layer.appendChild(h);
      setTimeout(() => h.remove(), 1200);
    }
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (err) {} }
  });
});


/* 10. 마지막 장면: footer가 보이면 '감사합니다'를 손글씨로 그리고 아래에서 하트가 천천히 떠오른다. */

fxSafe('finale', () => {
  const footer = document.querySelector('footer');
  const thanks = footer && footer.querySelector('.ft-thanks');
  if (!footer || !thanks) return;

  // '감사합니다' 글자를 손글씨 획 SVG로 바꾼다. 화면 읽기 프로그램에는 원래 글자를 알려 준다.
  const label = thanks.textContent.trim();
  thanks.setAttribute('aria-label', label);
  thanks.innerHTML =
    '<svg class="ft-sign" viewBox="0 0 260 64" aria-hidden="true">' +
    `<text x="130" y="46" text-anchor="middle">${label}</text></svg>`;
  if (!FX_MOTION) { thanks.classList.add('play'); return; }

  const bubbles = document.createElement('div');
  bubbles.className = 'ft-bubbles';
  bubbles.setAttribute('aria-hidden', 'true');
  footer.prepend(bubbles);

  let timer = 0;
  function bubble() {
    if (bubbles.childElementCount > 10) return;
    const h = document.createElement('span');
    h.textContent = Math.random() < 0.3 ? '♡' : '♥';
    h.style.left = (8 + Math.random() * 84).toFixed(1) + '%';
    h.style.setProperty('--sz', (10 + Math.random() * 12).toFixed(0) + 'px');
    h.style.setProperty('--sway', ((Math.random() - 0.5) * 50).toFixed(0) + 'px');
    h.style.setProperty('--dur', (5 + Math.random() * 3).toFixed(1) + 's');
    bubbles.appendChild(h);
    setTimeout(() => h.remove(), 8500);
  }

  new IntersectionObserver((es) => {
    const on = es[0].isIntersecting;
    if (on) {
      thanks.classList.add('play');
      if (!timer) { bubble(); timer = setInterval(bubble, 900); }
    } else if (timer) {
      clearInterval(timer); timer = 0;
    }
  }, { threshold: 0.25 }).observe(footer);
});


/* 11. 팝업북 카드: 화면에 절반쯤 들어오면 펼친다. 누르면 접었다가 다시 펼친다. 모양은 css/main.css 의 24. */

fxSafe('popup', () => {
  const pop = document.getElementById('popup');
  if (!pop) return;
  if (!FX_MOTION || !('IntersectionObserver' in window)) { pop.classList.add('open'); return; }
  let busy = false;
  // 카드가 화면 가운데쯤 오면, 닫힌 표지를 잠깐 보여 준 뒤 펼친다.
  let timer = 0;
  const io = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) {
      timer = setTimeout(() => { pop.classList.add('open'); io.disconnect(); }, 700);
    } else clearTimeout(timer);
  }, { threshold: 0.9, rootMargin: '0px 0px -18% 0px' });
  io.observe(pop);
  pop.addEventListener('click', () => {
    if (busy) return;
    if (!pop.classList.contains('open')) { clearTimeout(timer); io.disconnect(); pop.classList.add('open'); return; }
    busy = true;
    pop.classList.remove('open');
    setTimeout(() => { pop.classList.add('open'); busy = false; }, 1000);
  });
});
