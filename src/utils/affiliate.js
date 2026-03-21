// src/utils/affiliate.js

/**
 * Travelpayouts 제휴 링크 생성기
 * 원본 URL에 제휴 마커와 프로그램 ID, 그리고 추적 파라미터를 붙여 딥링크로 변환합니다.
 *
 * @param {string} originalUrl - 원래 이동하고자 하는 URL (예: https://www.agoda.com/ko-kr/search?text=파리)
 * @param {string} provider - 제휴사 식별자 (예: 'agoda', 'klook')
 * @param {object} options - 추가 추적 파라미터 { campaign, locationName }
 * @returns {string} - 제휴 코드가 포함된 최종 URL
 */
export const getAffiliateLink = (originalUrl, provider, options = {}) => {
  // Travelpayouts 대시보드 상단에 위치한 고유 마커 (예: 712266)
  // 환경변수 VITE_TP_MARKER에 운영자 마커 번호를 입력합니다.
  const marker = import.meta.env.VITE_TP_MARKER;

  // 마커가 없거나 원본 URL이 없으면 원본 URL을 그대로 반환 (로컬 개발 환경 등 안전망)
  if (!marker || !originalUrl) return originalUrl;

  // Travelpayouts Programs 대시보드에서 각 제휴 프로그램 연결(Connect) 후 확인 가능한 프로그램 ID (PID)
  // 향후 대시보드에서 추가 프로그램 승인 시, 아래 목록에 ID를 추가하면 됩니다.
  const providerIds = {
    agoda: '104',         // 아고다 (숙박)
    booking: '84',       // 부킹닷컴 (숙박)
    klook: '137',         // 클룩 (교통, 액티비티)
    getyourguide: '108',  // 겟유어가이드 (교통, 액티비티 - 구미권)
    skyscanner: '789',    // 스카이스캐너 (항공권)
    airalo: '541'         // 에어알로 (eSIM/유심)
  };

  const pid = providerIds[provider];

  // 등록된 제휴사라면 Travelpayouts 딥링크 구조로 변환
  if (pid) {
    let tpUrl = `https://tp.media/r?marker=${marker}&p=${pid}&u=${encodeURIComponent(originalUrl)}`;

    // 추가 파라미터: 어디서 클릭했는지 출처 (예: toolkit)
    if (options.campaign) {
      tpUrl += `&campaign=${encodeURIComponent(options.campaign)}`;
    }

    // 추가 파라미터: 어떤 도시/장소 카드에서 클릭이 일어났는지 추적
    if (options.locationName) {
      tpUrl += `&sub1=${encodeURIComponent(options.locationName)}`;
    }

    return tpUrl;
  }

  // 등록되지 않은 제휴사라면 원본 URL 그대로 반환
  return originalUrl;
};
