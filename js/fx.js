/*
   fx.js: 파스텔(main) version의 화려한 연출. main.js 다음에 load한다.
   이 파일이 없거나 한 기능이 실패해도 청첩장 자체는 그대로 동작하도록, 기능마다 따로 감싼다.
   움직임 줄이기(REDUCE_MOTION, main.js)를 켠 기기에서는 움직이는 연출을 하지 않는다.

   목차
   01. 오프닝 인트로   : 화면 전체 봉투. 도장을 누르면 틈으로 빛이 새고 덮개가 열리며 청첩장이 드러난다 (세션당 한 번)
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
  const dateText = `${D.getFullYear()}. ${D.getMonth() + 1}. ${D.getDate()}  ${DAY}`;

  // 화면 전체가 봉투다. 안쪽(빛) 위에 왼쪽·오른쪽·아래·위 덮개를 차례로 겹치고, 가운데에 밀랍 도장을 찍는다.
  // 모양과 움직임은 css/main.css 의 17-1.
  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.setAttribute('role', 'dialog');
  intro.setAttribute('aria-label', '청첩장 봉투 열기');
  intro.innerHTML =
    '<div class="ix-in"></div>' +
    '<div class="ix-light"></div>' +
    '<div class="ix-flap ix-l"><svg aria-hidden="true"></svg></div>' +
    '<div class="ix-flap ix-r"><svg aria-hidden="true"></svg></div>' +
    '<div class="ix-flap ix-b"><svg aria-hidden="true"></svg>' +
      `<div class="ix-names">${g} <i>&amp;</i> ${b}<small>${dateText}</small></div>` +
    '</div>' +
    '<div class="ix-flap ix-t"><svg aria-hidden="true"></svg>' +
      '<div class="ix-to">You\'re invited</div>' +
    '</div>' +
    '<div class="ix-seal">' + sealSVG() + '</div>' +
    '<div class="ix-hint"><span class="ix-chev"></span>봉투를 눌러 열어 주세요</div>';

  // 밀랍 도장: 가장자리가 조금 울퉁불퉁한 원에 눌러 찍은 하트
  function sealSVG() {
    const n = 18, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 44 + Math.sin(i * 2.3) * 1.8 + Math.cos(i * 1.7) * 1.2;
      pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
    }
    const mid = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
    let d = 'M' + mid(pts[n - 1], pts[0]).map((x) => x.toFixed(1)).join(' ');
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
    }
    const heart = 'M50 64 C38 55 33 49 33 43 C33 38 37 34.5 41.5 34.5 C45 34.5 48 36.5 50 39.5 C52 36.5 55 34.5 58.5 34.5 C63 34.5 67 38 67 43 C67 49 62 55 50 64 Z';
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><defs>' +
        '<radialGradient id="ixWax" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="#f2b7a2"/><stop offset="0.45" stop-color="#d9846b"/><stop offset="1" stop-color="#b45d47"/></radialGradient>' +
        '<radialGradient id="ixPress" cx="0.6" cy="0.68" r="0.75"><stop offset="0" stop-color="#e4977f"/><stop offset="1" stop-color="#bf654e"/></radialGradient>' +
      '</defs>' +
      `<path d="${d}" fill="url(#ixWax)"/>` +
      '<circle cx="50" cy="50" r="31" fill="url(#ixPress)"/>' +
      '<circle cx="50" cy="50" r="31" fill="none" stroke="#9e4c39" stroke-opacity="0.35" stroke-width="1.4"/>' +
      '<circle cx="50" cy="50" r="27" fill="none" stroke="#fff1e9" stroke-opacity="0.4" stroke-width="0.8" stroke-dasharray="1.5 2.2"/>' +
      `<path d="${heart}" fill="#9e4c39" fill-opacity="0.45" transform="translate(0.8 1.2)"/>` +
      `<path d="${heart}" fill="#fde9df"/>` +
    '</svg>';
  }

  // 덮개 무늬: 꽃과 잎 줄기를 종이에 눌러 찍은 듯(엠보싱) 그림자·빛·바탕 세 겹으로 그린다.
  const MOTIF =
    [0, 72, 144, 216, 288].map((a) => `<ellipse cx="26" cy="21.5" rx="3.4" ry="5.6" transform="rotate(${a} 26 28)"/>`).join('') +
    '<circle cx="26" cy="28" r="2.2"/>' +
    '<path d="M54 90 Q66 74 86 58" fill="none" stroke-width="1.2"/>' +
    '<ellipse cx="62" cy="77" rx="2.4" ry="5.4" transform="rotate(-25 62 77)"/>' +
    '<ellipse cx="69" cy="80" rx="2.4" ry="5.4" transform="rotate(68 69 80)"/>' +
    '<ellipse cx="72" cy="66" rx="2.2" ry="5" transform="rotate(-18 72 66)"/>' +
    '<ellipse cx="79" cy="70" rx="2.2" ry="5" transform="rotate(74 79 70)"/>' +
    '<circle cx="87" cy="57" r="2.8"/>' +
    '<circle cx="82" cy="20" r="1.5"/><circle cx="12" cy="78" r="1.3"/><circle cx="44" cy="52" r="1.1"/>';

  const FLAPS = {
    // 이름: [밝은 쪽 색, 안쪽(가운데) 색, 무늬 바탕색, 무늬 기울기]
    t: ['#fff4ee', '#f9e1d6', '#fcebe3', -10],
    b: ['#fdeee7', '#f6dacd', '#f9e4da', 14],
    l: ['#fcebe3', '#f4d5c7', '#f8e1d6', 32],
    r: ['#fcebe3', '#f4d5c7', '#f8e1d6', -32],
  };

  function draw() {
    const W = intro.clientWidth || window.innerWidth;
    const H = intro.clientHeight || window.innerHeight;
    const cx = W / 2, cy = H / 2, o = 3;
    const shape = {
      t: `M0 0H${W}L${cx} ${cy}Z`,
      b: `M0 ${H}H${W}L${cx} ${cy}Z`,
      l: `M0 ${-o}L${cx + o} ${cy}L0 ${H + o}Z`,
      r: `M${W} ${-o}L${cx - o} ${cy}L${W} ${H + o}Z`,
    };
    const grad = {          // 밝은 바깥 가장자리에서 어두운 가운데로
      t: [0, 0, 0, cy], b: [0, H, 0, cy], l: [0, 0, cx, 0], r: [W, 0, cx, 0],
    };
    const edge = {          // 겹친 덮개의 접힌 선에 비치는 빛
      t: `M0 0L${cx} ${cy}L${W} 0`, b: `M0 ${H}L${cx} ${cy}L${W} ${H}`, l: '', r: '',
    };
    Object.keys(FLAPS).forEach((k) => {
      const [c1, c2, base, rot] = FLAPS[k];
      const [x1, y1, x2, y2] = grad[k];
      const svg = intro.querySelector('.ix-' + k + ' svg');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML =
        '<defs>' +
          `<linearGradient id="ixG${k}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
          `<pattern id="ixP${k}" width="104" height="104" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})">` +
            `<g fill="#b8735c" stroke="#b8735c" stroke-width="0" opacity="0.2" transform="translate(0.8 1)">${MOTIF}</g>` +
            `<g fill="#fff" stroke="#fff" stroke-width="0" opacity="0.9" transform="translate(-0.6 -0.7)">${MOTIF}</g>` +
            `<g fill="${base}" stroke="${base}" stroke-width="0">${MOTIF}</g>` +
          '</pattern>' +
        '</defs>' +
        `<path d="${shape[k]}" fill="url(#ixG${k})"/>` +
        `<path d="${shape[k]}" fill="url(#ixP${k})" opacity="0.85"/>` +
        (edge[k] ? `<path d="${edge[k]}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="1.2"/>` : '');
    });
  }

  document.body.appendChild(intro);
  document.documentElement.classList.add('intro-on');
  draw();
  window.addEventListener('resize', draw);

  // 누르면: 덮개 틈으로 빛이 새고(open) → 도장이 빛나고 → 덮개가 바깥으로 열리며 청첩장이 드러난다(reveal).
  // 여는 중에 한 번 더 누르면 바로 넘어간다. 아무도 누르지 않으면 6초 뒤 저절로 열린다.
  let opened = false, revealed = false, done = false, autoTimer = 0;

  function finish() {
    if (done) return;
    done = true;
    try { sessionStorage.setItem('wedding-intro', '1'); } catch (e) {}
    intro.classList.add('reveal', 'out');
    document.documentElement.classList.remove('intro-on');
    window.removeEventListener('resize', draw);
    setTimeout(() => intro.remove(), 900);
  }

  function reveal() {
    if (revealed) { finish(); return; }
    revealed = true;
    try { sessionStorage.setItem('wedding-intro', '1'); } catch (e) {}
    intro.classList.add('reveal');
    setTimeout(finish, 1200);
  }

  function open() {
    if (opened) { reveal(); return; }
    opened = true;
    clearTimeout(autoTimer);
    intro.classList.add('ready', 'open');
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
    setTimeout(reveal, 1350);
  }

  // 손글씨 글꼴이 load된 뒤 글자와 도장을 띄운다. 글꼴이 늦어도 0.7초 뒤에는 띄운다.
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
