/**
 * app.js — 메인 앱 (Laravel의 app.php 역할)
 * 각 컴포넌트를 로드하고 공통 기능을 초기화합니다.
 */

// ── 컴포넌트 로드 순서 ──
const components = [
  'cover',
  'invitation',
  'profile',
  'calendar',
  'location',
  'gallery',
  'account',
  'footer'
];

// ── 컴포넌트 순차 로드 ──
async function loadComponents() {
  for (const name of components) {
    try {
      const module = await import(`./components/${name}.js`);
      const container = document.getElementById(name);
      if (container && module.render) {
        container.innerHTML = module.render();
        // 컴포넌트별 초기화 함수가 있으면 실행
        if (module.init) module.init();
      }
    } catch (err) {
      console.warn(`[${name}] 컴포넌트 로드 실패:`, err);
    }
  }

  // 모든 컴포넌트 로드 후 공통 초기화
  initFadeIn();
}

// ── 스크롤 페이드인 애니메이션 ──
function initFadeIn() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ── 공통: 클립보드 복사 ──
window.copyText = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast();
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast();
  });
};

// ── 공통: 토스트 메시지 ──
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (msg) toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── 시작 ──
loadComponents();
