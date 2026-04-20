import { DESTINATION_PACKAGE_MAP, FALLBACK_PACKAGE_MAP } from '../pages/Home/data/tripLinkDestinationMap';

/**
 * 장소 데이터를 기반으로 적합한 트립링크 패키지를 찾아 반환합니다.
 * @param {Object} place - 장소 객체 (name, nameEn, country, region 등 포함)
 * @returns {Object|null} 매칭된 패키지 객체 또는 null
 */
export const getMatchedPackage = (place) => {
  if (!place) return null;

  // 1. 도시명/장소명(한글, 영문)으로 정확한 매칭 시도
  const nameKo = place.name?.toLowerCase().trim();
  const nameEn = place.nameEn?.toLowerCase().trim();

  if (nameKo && DESTINATION_PACKAGE_MAP[nameKo]) {
    return DESTINATION_PACKAGE_MAP[nameKo];
  }

  if (nameEn && DESTINATION_PACKAGE_MAP[nameEn]) {
    return DESTINATION_PACKAGE_MAP[nameEn];
  }

  // 2. 국가명(country) 또는 지역명(region)으로 폴백 매칭 시도
  const country = place.country?.toLowerCase().trim();
  const region = place.region?.toLowerCase().trim();

  if (country && FALLBACK_PACKAGE_MAP[country]) {
    return FALLBACK_PACKAGE_MAP[country];
  }

  if (region && FALLBACK_PACKAGE_MAP[region]) {
    return FALLBACK_PACKAGE_MAP[region];
  }

  return null;
};
