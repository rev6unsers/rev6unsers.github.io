/**
 * location.js — 오시는 길 섹션
 */

// 트라디노이 (서울 강남구 도곡로99길 16, 대치동 984) 6층
const VENUE_LAT = 37.5018594;
const VENUE_LNG = 127.0634229;
const VENUE_NAME = '트라디노이';
const VENUE_ADDR = '서울특별시 강남구 도곡로99길 16 6층';

export function render() {
  const mapSrc = `https://maps.google.com/maps?q=${VENUE_LAT},${VENUE_LNG}&z=16&output=embed&hl=ko`;

  return `
    <section class="location-section">
      <div class="section-eng">Location</div>
      <div class="section-title">오시는 길</div>
      <div class="fade-in">
        <div class="loc-name">${VENUE_NAME}</div>
        <div class="loc-addr">
          ${VENUE_ADDR}<br>
          Tel. 02-567-9916
        </div>

        <iframe
          class="loc-map"
          src="${mapSrc}"
          allowfullscreen=""
          loading="lazy"
        ></iframe>

        <div class="map-btns">
          <button class="map-btn" onclick="window.open('https://map.naver.com/v5/search/${encodeURIComponent(VENUE_ADDR)}')">
            네이버 지도
          </button>
          <button class="map-btn" onclick="window.open('https://map.kakao.com/link/search/${encodeURIComponent(VENUE_ADDR)}')">
            카카오맵
          </button>
          <button class="map-btn" onclick="window.open('https://apis.openapi.sk.com/tmap/app/routes?appKey=TMAP_KEY&name=${encodeURIComponent(VENUE_NAME)}&lon=${VENUE_LNG}&lat=${VENUE_LAT}')">
            티맵
          </button>
        </div>

        <div class="loc-transport">
          <div class="transport-item">
            <div class="transport-label">🚇 지하철</div>
            <div class="transport-desc">삼성역 3번 출구 도보 8분</div>
          </div>
          <div class="transport-item">
            <div class="transport-label">🚌 버스</div>
            <div class="transport-desc">
              강남01, 강남06, 지선4319<br>
              대치2동주민센터, 래미안하이스턴 하차
            </div>
          </div>
          <div class="transport-item">
            <div class="transport-label">🚗 자가용</div>
            <div class="transport-desc">
              도곡로 99길 16 (구주소: 대치동 98)
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
