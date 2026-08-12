import { extractTourAttractionSigungu } from './koreaTourAttractionLocality.js';
import { formatScenicSpotPlaceLabel } from './scenicSpotPlaceLabel.js';
import {
  labelScenicAreaCode,
  SCENIC_REGION_AREA_CODES,
  SCENIC_REGION_ORDER,
  scenicAreaCodeForHubId,
  scenicRegionForAreaCode,
} from './koreaTourAttractionMap.js';

/** 국가유산 CHA ctcd → TourAPI areaCode (칩·정렬 정합) */
const CHA_CTCD_TO_TOUR_AREA = {
  11: '1',
  23: '2',
  25: '3',
  22: '4',
  24: '5',
  21: '6',
  26: '7',
  45: '8',
  31: '31',
  32: '32',
  51: '32',
  33: '33',
  34: '34',
  37: '35',
  38: '36',
  35: '37',
  36: '38',
  52: '38',
  50: '39',
};

const AREA_LABEL_TO_CODE = (() => {
  /** @type {Record<string, string>} */
  const map = {};
  for (const codes of Object.values(SCENIC_REGION_AREA_CODES)) {
    for (const code of codes) {
      const label = labelScenicAreaCode(code);
      if (label) map[label] = code;
    }
  }
  return map;
})();

/**
 * 권역 안 시도(areaCode) 나열 순서 — 칩과 동일.
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} region
 * @returns {number}
 */
function areaOrderIndex(areaCode, region) {
  const code = String(areaCode || '').trim();
  if (!code) return 900;
  const regionKey =
    String(region || '').trim() || scenicRegionForAreaCode(code) || '';
  const codes = SCENIC_REGION_AREA_CODES[regionKey];
  if (codes) {
    const idx = codes.indexOf(code);
    if (idx >= 0) return idx;
  }
  for (const r of SCENIC_REGION_ORDER) {
    const list = SCENIC_REGION_AREA_CODES[r] || [];
    const idx = list.indexOf(code);
    if (idx >= 0) return SCENIC_REGION_ORDER.indexOf(r) * 20 + idx;
  }
  return 800;
}

/**
 * @param {object | null | undefined} spot
 * @returns {string}
 */
function spotAreaCode(spot) {
  const direct = String(spot?.areaCode ?? '').trim();
  if (direct) return direct;
  const hubId = String(spot?.hubId || '')
    .trim()
    .toLowerCase();
  if (hubId) {
    const fromHub = scenicAreaCodeForHubId(hubId);
    if (fromHub) return fromHub;
  }
  const fromCtcd = CHA_CTCD_TO_TOUR_AREA[String(spot?.ctcd || '').trim()];
  if (fromCtcd) return fromCtcd;
  const fromLabel = AREA_LABEL_TO_CODE[String(spot?.areaLabel || '').trim()];
  if (fromLabel) return fromLabel;
  // hub→areaCode 미등록이어도 목록 표기(경북 울릉)의 시도로 뭉침
  const place = formatScenicSpotPlaceLabel(spot);
  const sidoTok = place.split(/\s+/).find((t) => AREA_LABEL_TO_CODE[t]);
  if (sidoTok) return AREA_LABEL_TO_CODE[sidoTok];
  return '';
}

/**
 * 시·군 클러스터 키 — 같은 경주끼리 붙이기.
 * @param {object | null | undefined} spot
 * @returns {string}
 */
function spotCityKey(spot) {
  const fromAddr =
    extractTourAttractionSigungu(spot?.addr1, spot?.addr2) ||
    extractTourAttractionSigungu(spot?.locality) ||
    '';
  if (fromAddr) return fromAddr;
  const place = formatScenicSpotPlaceLabel(spot);
  if (place) {
    const parts = place.split(/\s+/);
    return parts[parts.length - 1] || place;
  }
  return String(spot?.hubId || '').trim().toLowerCase();
}

/**
 * 동일 권역(시도)→동일 시·군끼리 뭉친 뒤 이름순.
 * @param {object | null | undefined} a
 * @param {object | null | undefined} b
 * @returns {number}
 */
export function compareScenicSpotsByPlaceCluster(a, b) {
  const regionA = String(a?.region || '').trim();
  const regionB = String(b?.region || '').trim();
  const regionIdxA = SCENIC_REGION_ORDER.indexOf(regionA);
  const regionIdxB = SCENIC_REGION_ORDER.indexOf(regionB);
  const rA = regionIdxA >= 0 ? regionIdxA : 99;
  const rB = regionIdxB >= 0 ? regionIdxB : 99;
  if (rA !== rB) return rA - rB;

  const codeA = spotAreaCode(a);
  const codeB = spotAreaCode(b);
  const areaA = areaOrderIndex(codeA, regionA);
  const areaB = areaOrderIndex(codeB, regionB);
  if (areaA !== areaB) return areaA - areaB;

  const cityA = spotCityKey(a);
  const cityB = spotCityKey(b);
  const cityCmp = cityA.localeCompare(cityB, 'ko');
  if (cityCmp !== 0) return cityCmp;

  const nameA = String(a?.name || '');
  const nameB = String(b?.name || '');
  return nameA.localeCompare(nameB, 'ko');
}

/**
 * @template T
 * @param {T[]} spots
 * @returns {T[]}
 */
export function sortScenicSpotsByPlaceCluster(spots) {
  return (spots || []).slice().sort(compareScenicSpotsByPlaceCluster);
}
