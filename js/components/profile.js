/**
 * profile.js — 신랑 & 신부 프로필 섹션
 */
export function render() {
  return `
    <section class="profile-section">
      <div class="section-eng">Groom &amp; Bride</div>
      <div class="section-title">신랑 &amp; 신부</div>
      <div class="profile-cards fade-in">
        <div class="profile-card">
          <div class="profile-photo">
            <!-- <img src="images/groom.jpg" alt="신랑"> -->
            📷
          </div>
          <div class="profile-role">Groom</div>
          <div class="profile-name">이성연</div>
          <div class="profile-meta">
            1995.01.01<br>
            MBTI
          </div>
          <a href="tel:010-0000-0000" class="profile-contact">연락하기 ›</a>
        </div>
        <div class="profile-card">
          <div class="profile-photo">
            <!-- <img src="images/bride.jpg" alt="신부"> -->
            📷
          </div>
          <div class="profile-role">Bride</div>
          <div class="profile-name">천희진</div>
          <div class="profile-meta">
            1995.01.01<br>
            MBTI
          </div>
          <a href="tel:010-0000-0000" class="profile-contact">연락하기 ›</a>
        </div>
      </div>
    </section>
  `;
}
