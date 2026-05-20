/**
 * invitation.js — 인사말 섹션
 */
export function render() {
  return `
    <section class="invitation">
      <div class="line-deco"></div>
      <div class="section-eng">Invitation</div>
      <div class="section-title">소중한 분들을 초대합니다</div>
      <div class="fade-in">
        <p class="invitation-text">
          서로 다른 두 사람이<br>
          하나의 길을 걸어가고자 합니다.<br><br>
          오랜 기다림 속에서<br>
          한 마음 되어 사랑의 결실을 맺게 되었습니다.<br><br>
          귀한 걸음 하시어<br>
          따뜻한 마음으로 축복해 주시면<br>
          더없는 기쁨이 되겠습니다.
        </p>
        <div class="parents-info">
          <div class="parents-row">
            OOO · OOO 의 아들 <span class="name">성연</span>
            <span class="role">신랑</span>
          </div>
          <div class="parents-row">
            OOO · OOO 의 딸 <span class="name">희진</span>
            <span class="role">신부</span>
          </div>
        </div>
      </div>
    </section>
  `;
}
