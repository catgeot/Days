import scenicJson from '../data/koreaTop10Scenic.json' with { type: 'json' };

/**
 * @typedef {{
 *   rank: number,
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
 * }} KoreaTop10ScenicSpot
 */

/** @returns {KoreaTop10ScenicSpot[]} */
export function listKoreaTop10Scenic() {
  const list = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
  return list.slice().sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
}

/** @returns {string} */
export function koreaTop10ScenicDisclaimer() {
  return (
    scenicJson?.meta?.disclaimer ||
    'GATEO 선정 — 공식 국가 지정 10대가 아닙니다.'
  );
}
