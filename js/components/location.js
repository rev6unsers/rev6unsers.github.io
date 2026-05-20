/**
 * location.js — 오시는 길 섹션
 */

// 트라디노이 (서울 강남구 대치동 도곡로99길 16)
const VENUE_LAT = 37.4935;
const VENUE_LNG = 127.0556;
const VENUE_NAME = '트라디노이';
const VENUE_ADDR = '서울특별시 강남구 대치동 도곡로99길 16';

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
          Tel. 02-0000-0000
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
            <div class="transport-desc">3호선 매봉역 4번 출구 도보 약 10분<br>분당선 한티역 3번 출구 도보 약 8분</div>
          </div>
          <div class="transport-item">
            <div class="transport-label">🚗 자가용</div>
            <div class="transport-desc">
              네비게이션 "트라디노이" 또는 "도곡로99길 16" 검색<br>
              건물 내 주차 가능 (하객 주차 안내는 추후 확인)
            </div>
          </div>
          <div class="transport-item">
            <div class="transport-label">🚌 버스</div>
            <div class="transport-desc">대치동 사거리 정류장 하차</div>
          </div>
        </div>
      </div>
    </section>
  `;
}
