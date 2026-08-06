import data from '../data/koreaHeritageScenic.json' with { type: 'json' };
import { SCENIC_REGION_ORDER } from './koreaTourAttractionMap.js';

/** TourAPI areaCode → CHA ccbaCtcd */
export const TOUR_AREA_TO_CHA_CTCD = {
  1: '11',
  2: '23',
  3: '25',
  4: '22',
  5: '24',
  6: '21',
  7: '26',
  8: '45',
  31: '31',
  32: '32',
  33: '33',
  34: '34',
  35: '37',
  36: '38',
  37: '35',
  38: '36',
  39: '50',
};

/** 강원·전북 특별자치 코드도 같은 권역 칩에 합침 */
const CHA_CTCD_ALIASES = {
  32: ['32', '51'],
  51: ['32', '51'],
  35: ['35', '52'],
  52: ['35', '52'],
};

/** CHA ctcd → TourAPI areaCode (칩·필터 정합) */
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
  52: '37',
  36: '38',
  50: '39',
};

/**
 * @returns {string}
 */
export function koreaHeritageScenicDisclaimer() {
  return String(data?.meta?.disclaimer || '').trim();
}

/**
 * @returns {number}
 */
export function koreaHeritageScenicCount() {
  return Array.isArray(data?.spots) ? data.spots.length : 0;
}

/**
 * @param {string | null | undefined} hubName
 * @returns {string | null}
 */
function localityNeedle(hubName) {
  const raw = String(hubName || '').trim();
  if (!raw) return null;
  const bare = raw
    .replace(/(특별자치시|광역시|특별시|자치시|시|군|구)$/u, '')
    .trim();
  return bare.length >= 2 ? bare : null;
}

/**
 * @param {{
 *   region?: string | null,
 *   areaCode?: string | null,
 *   localityQuery?: string | null,
 * }} [opts]
 * @returns {object[]}
 */
export function listKoreaHeritageScenic(opts = {}) {
  const spots = Array.isArray(data?.spots) ? data.spots : [];
  const region = String(opts.region || '').trim();
  const tourArea = String(opts.areaCode || '').trim();
  const chaCtcd = TOUR_AREA_TO_CHA_CTCD[tourArea] || null;
  const ctcdSet = chaCtcd
    ? new Set(CHA_CTCD_ALIASES[chaCtcd] || [chaCtcd])
    : null;
  const needle = localityNeedle(opts.localityQuery);

  return spots.filter((s) => {
    if (region && SCENIC_REGION_ORDER.includes(region) && s.region !== region) {
      return false;
    }
    if (ctcdSet && !ctcdSet.has(String(s.ctcd || ''))) return false;
    if (needle) {
      const hay = `${s.locality || ''} ${s.addr1 || ''} ${s.areaLabel || ''}`;
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

/**
 * @param {string | null | undefined} id
 * @returns {object | null}
 */
export function getKoreaHeritageScenicById(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  const spots = Array.isArray(data?.spots) ? data.spots : [];
  return spots.find((s) => s.id === key) || null;
}

/**
 * 권역 칩 건수 (국가유산 명승).
 * @returns {Record<string, number>}
 */
export function countKoreaHeritageScenicByRegion() {
  /** @type {Record<string, number>} */
  const out = {};
  for (const r of SCENIC_REGION_ORDER) out[r] = 0;
  for (const s of Array.isArray(data?.spots) ? data.spots : []) {
    if (out[s.region] != null) out[s.region] += 1;
  }
  return out;
}

/**
 * 시도(Tour areaCode) 칩 건수 — 현재 권역 안.
 * @param {string | null | undefined} region
 * @returns {Record<string, number>}
 */
export function countKoreaHeritageScenicByTourArea(region) {
  const spots = listKoreaHeritageScenic({ region });
  /** @type {Record<string, number>} */
  const out = {};
  for (const s of spots) {
    const tourCode = CHA_CTCD_TO_TOUR_AREA[String(s.ctcd || '')];
    if (!tourCode) continue;
    out[tourCode] = (out[tourCode] || 0) + 1;
  }
  return out;
}
