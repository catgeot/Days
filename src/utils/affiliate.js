// src/utils/affiliate.js

/**
 * Travelpayouts 제휴 링크 생성기 (Short Link 방식)
 * 대시보드에서 직접 생성한 단축 링크(`tp.st`)를 기반으로,
 * 클릭 발생 위치 등을 추적하기 위한 파라미터(`sub1`, `sub2`)만 덧붙여 반환합니다.
 *
 * @param {string} originalUrl - 원래 이동하고자 하는 URL (미승인 제휴사 대비 폴백 용도)
 * @param {string} provider - 제휴사 식별자 (예: 'agoda', 'klook')
 * @param {object} options - 추가 추적 파라미터 { campaign, locationName }
 * @returns {string} - 제휴 코드가 포함된 최종 단축 URL 또는 원본 URL
 */
export const getAffiliateLink = (originalUrl, provider, options = {}) => {
  // Travelpayouts 대시보드에서 각 제휴 프로그램의 [Link Generator]를 통해 발급받은 'Short Link'
  // 현재 승인된 제휴사만 단축 링크를 입력합니다. (미승인된 곳은 빈 문자열로 두면 원본 URL로 연결됨)
  const shortLinks = {
    agoda: '',
    booking: '',
    tripcom: '',
    klook: 'https://klook.tp.st/aXUEEWaI',
    '12go': '',
    getyourguide: '',
    tiqets: 'https://tiqets.tp.st/U8nE2ydu',
    skyscanner: '',
    airalo: 'https://airalo.tp.st/xh8K1qLE'
  };

  const shortUrl = shortLinks[provider];

  // 등록된 제휴사의 단축 링크가 있다면 파라미터를 붙여 반환
  if (shortUrl) {
    let tpUrl = shortUrl;
    let hasQuery = shortUrl.includes('?');

    // 파라미터 추가 헬퍼 함수
    const addParam = (key, value) => {
      tpUrl += (hasQuery ? '&' : '?') + `${key}=${encodeURIComponent(value)}`;
      hasQuery = true;
    };

    // sub1: 어떤 도시/장소 카드에서 클릭이 일어났는지 추적
    if (options.locationName) {
      addParam('sub1', options.locationName);
    }

    // sub2: 어디서 클릭했는지 출처 (예: toolkit)
    if (options.campaign) {
      addParam('sub2', options.campaign);
    }

    return tpUrl;
  }

  // 승인되지 않은 제휴사이거나 링크가 없으면 원본 URL을 그대로 반환 (사용자 불편 방지)
  return originalUrl;
};
