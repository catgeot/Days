import { listCityAttractionHubs, resolveCityAttractionHub } from './cityAttractionHubs.js';
import { matchKoreaAdminRegionFromAddr } from './koreaAdminRegionMatch.js';
import { extractTourAttractionSigungu } from './koreaTourAttractionLocality.js';

const hubById = new Map(
  listCityAttractionHubs().map((hub) => [String(hub.hubId || '').trim().toLowerCase(), hub]),
);

/**
 * TourAPI addr → city hub. 시·도+시군구로 동명(고성군 등)을 구분한다.
 *
 * @param {string | null | undefined} addr1
 * @param {string | null | undefined} [addr2]
 */
export function resolveCityAttractionHubFromTourAddr(addr1, addr2) {
  const admin = matchKoreaAdminRegionFromAddr(addr1);
  if (admin?.hubId) {
    return hubById.get(admin.hubId) || resolveCityAttractionHub(admin.hubId);
  }
  const sigungu = extractTourAttractionSigungu(addr1, addr2);
  if (!sigungu) return null;
  return (
    resolveCityAttractionHub(sigungu) ||
    resolveCityAttractionHub(String(sigungu).replace(/(시|군|구)$/u, ''))
  );
}