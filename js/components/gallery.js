/**
 * gallery.js — 웨딩 갤러리 슬라이더 섹션
 */

// 사진 목록 (실제 이미지 경로로 교체)
const photos = [
  { src: '', alt: 'PHOTO 1' },
  { src: '', alt: 'PHOTO 2' },
  { src: '', alt: 'PHOTO 3' },
  { src: '', alt: 'PHOTO 4' },
  { src: '', alt: 'PHOTO 5' },
  { src: '', alt: 'PHOTO 6' },
];

let currentSlide = 0;

export function render() {
  const slides = photos.map((p, i) => `
    <div class="gallery-slide">
      <div class="img-box">
        ${p.src ? `<img src="${p.src}" alt="${p.alt}">` : `📷 ${p.alt}`}
      </div>
    </div>
  `).join('');

  const dots = photos.map((_, i) => `
    <div class="gallery-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>
  `).join('');

  return `
    <section class="gallery-section">
      <div class="section-eng">Gallery</div>
      <div class="section-title">웨딩 갤러리</div>

      <div class="gallery-slider fade-in">
        <div class="gallery-track" id="galleryTrack">
          ${slides}
        </div>
      </div>

      <div class="gallery-counter">
        <span id="galleryNum">1</span> / ${photos.length}
      </div>

      <div class="gallery-dots" id="galleryDots">
        ${dots}
      </div>
    </section>
  `;
}

export function init() {
  const track = document.getElementById('galleryTrack');
  const dots = document.getElementById('galleryDots');
  const counter = document.getElementById('galleryNum');
  if (!track) return;

  let startX = 0;
  let isDragging = false;

  function goTo(idx) {
    idx = Math.max(0, Math.min(idx, photos.length - 1));
    currentSlide = idx;
    // 75% 슬라이드 폭 + 약간의 센터링
    const offset = idx * 75;
    track.style.transform = `translateX(-${offset}%)`;
    counter.textContent = idx + 1;

    dots.querySelectorAll('.gallery-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
  }

  // 터치 스와이프
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      goTo(currentSlide + (diff > 0 ? 1 : -1));
    }
  });

  // 마우스 드래그
  track.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
    track.style.cursor = 'grabbing';
  });

  track.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = 'grab';
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 40) {
      goTo(currentSlide + (diff > 0 ? 1 : -1));
    }
  });

  // 도트 클릭
  dots.addEventListener('click', (e) => {
    const dot = e.target.closest('.gallery-dot');
    if (dot) goTo(Number(dot.dataset.idx));
  });
}
