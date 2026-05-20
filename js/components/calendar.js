/**
 * calendar.js — 달력 + D-day 카운트다운 섹션
 */
export function render() {
  return `
    <section class="when-section">
      <div class="line-deco"></div>
      <div class="section-eng">Wedding Day</div>
      <div class="section-title">예식 안내</div>
      <div class="fade-in">
        <div class="when-venue">더그랜드홀</div>
        <div class="when-datetime">2025년 9월 20일 토요일 · 오후 2시</div>

        <div class="cal">
          <div class="cal-month">SEPTEMBER 2025</div>
          <div class="cal-grid">
            <div class="dn">일</div><div class="dn">월</div><div class="dn">화</div>
            <div class="dn">수</div><div class="dn">목</div><div class="dn">금</div><div class="dn">토</div>
            <div class="d empty">.</div>
            <div class="d">1</div><div class="d">2</div><div class="d">3</div>
            <div class="d">4</div><div class="d">5</div><div class="d">6</div>
            <div class="d sun">7</div><div class="d">8</div><div class="d">9</div>
            <div class="d">10</div><div class="d">11</div><div class="d">12</div><div class="d">13</div>
            <div class="d sun">14</div><div class="d">15</div><div class="d">16</div>
            <div class="d">17</div><div class="d">18</div><div class="d">19</div>
            <div class="d today">20</div>
            <div class="d sun">21</div><div class="d">22</div><div class="d">23</div>
            <div class="d">24</div><div class="d">25</div><div class="d">26</div><div class="d">27</div>
            <div class="d sun">28</div><div class="d">29</div><div class="d">30</div>
            <div class="d empty">.</div><div class="d empty">.</div><div class="d empty">.</div><div class="d empty">.</div>
          </div>
        </div>

        <div class="dday">
          <div class="dday-item">
            <div class="dday-num" id="dday-days">--</div>
            <div class="dday-label">Days</div>
          </div>
          <div class="dday-sep">:</div>
          <div class="dday-item">
            <div class="dday-num" id="dday-hours">--</div>
            <div class="dday-label">Hours</div>
          </div>
          <div class="dday-sep">:</div>
          <div class="dday-item">
            <div class="dday-num" id="dday-mins">--</div>
            <div class="dday-label">Min</div>
          </div>
          <div class="dday-sep">:</div>
          <div class="dday-item">
            <div class="dday-num" id="dday-secs">--</div>
            <div class="dday-label">Sec</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function init() {
  const weddingDate = new Date('2025-09-20T14:00:00+09:00');

  function updateCountdown() {
    const now = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) {
      document.getElementById('dday-days').textContent = '0';
      document.getElementById('dday-hours').textContent = '0';
      document.getElementById('dday-mins').textContent = '0';
      document.getElementById('dday-secs').textContent = '0';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('dday-days').textContent = String(d).padStart(2, '0');
    document.getElementById('dday-hours').textContent = String(h).padStart(2, '0');
    document.getElementById('dday-mins').textContent = String(m).padStart(2, '0');
    document.getElementById('dday-secs').textContent = String(s).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}
