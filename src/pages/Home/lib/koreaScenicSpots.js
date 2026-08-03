import scenicJson from '../data/koreaScenicSpots.json' with { type: 'json' };

/**
 * @typedef {{
 *   order: number,
 *   id: string,
 *   name: string,
 *   blurb: string,
 *   region: string,
 *   hubId: string,
 *   attractionName: string,
 *   attractionNameEn: string,
 *   placeSlug: string,
 *   lat: number,
 *   lng: number,
 *   contentId: string | null,
 * }} KoreaScenicSpot
 */

const REGION_ORDER = ['수도권', '강원', '충청', '전라', '경상', '제주'];

/** @returns {KoreaScenicSpot[]} */
export function listKoreaScenicSpots(region = null) {
  const list = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
  const sorted = list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!region || region === '전체') return sorted;
  return sorted.filter((s) => s.region === region);
}

/** @returns {string[]} */
export function listKoreaScenicRegions() {
  const list = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
  const present = new Set(list.map((s) => s.region).filter(Boolean));
  return REGION_ORDER.filter((r) => present.has(r));
}

/** @returns {string} */
export function koreaScenicSpotsDisclaimer() {
  return (
    scenicJson?.meta?.disclaimer ||
    'GATEO 선정 명승 — 공식 지정 목록 전체가 아닙니다.'
  );
}
