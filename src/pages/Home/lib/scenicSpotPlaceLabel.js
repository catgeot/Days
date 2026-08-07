import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import { extractTourAttractionSigungu } from './koreaTourAttractionLocality.js';
import {
  labelScenicAreaCode,
  scenicAreaCodeForHubId,
} from './koreaTourAttractionMap.js';
import { stripKoAdminSuffix } from '../../../utils/mrtStayQuery.js';

/** koreaAreaCodes.byHubId 미등록 curated hub → 시도 약칭 */
const HUB_SIDO_FALLBACK = {
  seongnam: '경기',
  buan: '전북',
  jinan: '전북',
  hapcheon: '경남',
  hadong: '경남',
  danyang: '충북',
  seogwipo: '제주',
  ulleung: '경북',
};

/** GATEO 권역 중 시도 1개인 경우 — areaCode 없을 때 시도 폴백 */
const SINGLE_PROVINCE_REGION = new Set(['강원', '제주']);

/**
 * 명승 목록 우측 표기 — 권역·시도 대/중분류가 아니라 「시도 도시」.
 * 예: 강원 춘천 · 경북 경주 · 서울(도시=시도와 같으면 한 번만)
 *
 * @param {{
 *   areaCode?: string | number | null,
 *   areaLabel?: string | null,
 *   region?: string | null,
 *   locality?: string | null,
 *   addr1?: string | null,
 *   addr2?: string | null,
 *   hubId?: string | null,
 *   hubName?: string | null,
 * } | null | undefined} spot
 * @returns {string}
 */
export function formatScenicSpotPlaceLabel(spot) {
  if (!spot) return '';

  const hubId = String(spot.hubId || '')
    .trim()
    .toLowerCase();
  const areaCode =
    String(spot.areaCode ?? '').trim() || scenicAreaCodeForHubId(hubId) || '';
  const region = String(spot.region || '').trim();
  const sido = String(
    spot.areaLabel ||
      labelScenicAreaCode(areaCode) ||
      HUB_SIDO_FALLBACK[hubId] ||
      (SINGLE_PROVINCE_REGION.has(region) ? region : '') ||
      '',
  ).trim();

  const hubName =
    String(spot.hubName || '').trim() ||
    (hubId ? String(resolveCityAttractionHub(hubId)?.name || '') : '');

  const fromAddr =
    extractTourAttractionSigungu(spot.addr1, spot.addr2) ||
    extractTourAttractionSigungu(spot.locality) ||
    '';
  const cityRaw = fromAddr || hubName;
  const city = stripKoAdminSuffix(cityRaw) || String(cityRaw || '').trim();

  if (!sido && !city) return region;
  if (!city || sido === city) return sido || city;
  if (!sido) return city;
  return `${sido} ${city}`;
}
