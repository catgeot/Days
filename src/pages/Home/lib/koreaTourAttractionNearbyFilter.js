/**
 * 축제/좌표 nearby 큐레이션 — 편의시설·일반 교회 등 비명소 제외.
 * scenic 전국 목록에는 적용하지 않음.
 */

/** 화장실·주차장 등 편의/비명소 제목 */
const AMENITY_TITLE_RE =
  /화장실|공중변소|공중화장실|장애인\s*화장실|소변기|공영주차장|노상주차장|임시주차장|버스정류장|관리사무소|매표소$|안내소$/u;

/** 일반 교회·성당 (사찰·성지는 별도) */
const CHRISTIAN_TITLE_RE =
  /교회|성당|성결교회|감리교회|침례교회/u;

/**
 * 문화재·성지·대표 명소로 볼 만한 표기.
 * 일반 교구 성당/교회는 여기 없으면 nearby에서 제외.
 */
const CHRISTIAN_LANDMARK_RE =
  /문화재|사적|성지|유적|주교좌|순교|옛\s*|구\s+|등록문화|국보|보물|향토|순례|약현|명동|공세리|나바위|합덕|감곡|손골|용산신학교|예배당|성모|매괴|제일교회|성공회/u;

/**
 * @param {string | null | undefined} title
 * @returns {boolean} nearby 후보로 쓸지
 */
export function isNearbyTourAttractionTitle(title) {
  const t = String(title || '').trim();
  if (!t) return false;
  if (AMENITY_TITLE_RE.test(t)) return false;
  if (CHRISTIAN_TITLE_RE.test(t) && !CHRISTIAN_LANDMARK_RE.test(t)) {
    return false;
  }
  return true;
}

/**
 * @param {{ name?: string, title?: string } | null | undefined} spotOrRow
 */
export function isNearbyTourAttractionCandidate(spotOrRow) {
  if (!spotOrRow) return false;
  return isNearbyTourAttractionTitle(spotOrRow.name || spotOrRow.title);
}
