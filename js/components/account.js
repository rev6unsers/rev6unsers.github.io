/**
 * account.js — 축하의 마음 전하기 (계좌번호) 섹션
 */

const accounts = {
  groom: [
    { role: '신랑', name: '이성연', bank: '국민은행', number: '000-0000-0000-00' },
    { role: '아버지', name: 'OOO', bank: '신한은행', number: '000-000-000000' },
    { role: '어머니', name: 'OOO', bank: '우리은행', number: '000-000-000000' },
  ],
  bride: [
    { role: '신부', name: '천희진', bank: '우리은행', number: '0000-000-000000' },
    { role: '아버지', name: 'OOO', bank: '하나은행', number: '000-000000-00000' },
    { role: '어머니', name: 'OOO', bank: '농협', number: '000-0000-0000-00' },
  ],
};

function renderItems(list) {
  return list.map(a => `
    <div class="acc-item">
      <div class="acc-info">
        <div class="acc-role">[${a.role}] ${a.name}</div>
        <div class="acc-detail">${a.bank} · ${a.number}</div>
      </div>
      <button class="acc-copy" onclick="copyText('${a.number.replace(/-/g, '')}')">복사</button>
    </div>
  `).join('');
}

export function render() {
  return `
    <section class="account-section">
      <div class="line-deco"></div>
      <div class="section-eng">Account</div>
      <div class="section-title">축하의 마음을 전하기</div>
      <div class="fade-in">
        <div class="acc-tabs">
          <button class="acc-tab active" data-target="groom">신랑측</button>
          <button class="acc-tab" data-target="bride">신부측</button>
        </div>

        <div class="acc-group active" id="acc-groom">
          ${renderItems(accounts.groom)}
        </div>
        <div class="acc-group" id="acc-bride">
          ${renderItems(accounts.bride)}
        </div>
      </div>
    </section>
  `;
}

export function init() {
  const tabs = document.querySelectorAll('.acc-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.target;
      document.querySelectorAll('.acc-group').forEach(g => g.classList.remove('active'));
      document.getElementById(`acc-${target}`).classList.add('active');
    });
  });
}
