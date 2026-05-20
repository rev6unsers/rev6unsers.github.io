/**
 * location.js — 오시는 길 섹션
 */

// 예식장 좌표 (더그랜드홀 예시 — 실제 주소로 교체 필요)
const VENUE_LAT = 37.5085;
const VENUE_LNG = 127.0632;
const VENUE_NAME = '더그랜드홀';
const VENUE_ADDR = '서울특별시 강남구 테헤란로 123';

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
          Tel. 02-1234-5678
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
            <div class="transport-desc">2호선 OO역 O번 출구 도보 5분</div>
          </div>
          <div class="transport-item">
            <div class="transport-label">🚗 자가용</div>
            <div class="transport-desc">
              네비게이션 "${VENUE_NAME}" 검색<br>
              주차 2시간 무료 (건물 지하주차장 이용)
            </div>
          </div>
          <div class="transport-item">
            <div class="transport-label">🚌 버스</div>
            <div class="transport-desc">OO정류장 하차 (간선: 140, 지선: 4412)</div>
          </div>
        </div>
      </div>
    </section>
  `;
}
