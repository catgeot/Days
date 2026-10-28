/** Gallery «현지 정보» / «다녀온 이야기» — hash · ?section= · 리뷰 작성 후 1회 펼침 (메모리만). */

export const PLACE_GALLERY_SECTION = {
  FACTS: 'facts',
  STORIES: 'stories',
};

const VALID = new Set([PLACE_GALLERY_SECTION.FACTS, PLACE_GALLERY_SECTION.STORIES]);

/** @type {Map<string, string>} */
const afterReviewByPlaceKey = new Map();

/**
 * @param {string | null | undefined} hash
 * @returns {string | null}
 */
export function parsePlaceGallerySectionFromHash(hash) {
  const id = String(hash ?? '')
    .replace(/^#/, '')
    .trim();
  return VALID.has(id) ? id : null;
}

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @returns {string | null}
 */
export function parsePlaceGallerySectionFromSearch(search) {
  const raw = search instanceof URLSearchParams
    ? search
    : new URLSearchParams(String(search ?? '').replace(/^\?/, ''));
  const section = raw.get('section');
  return VALID.has(section) ? section : null;
}

/**
 * @param {{ hash?: string | null, search?: string | URLSearchParams | null }} locationLike
 * @returns {string | null}
 */
export function parsePlaceGallerySectionFromLocation(locationLike) {
  const fromHash = parsePlaceGallerySectionFromHash(locationLike?.hash);
  if (fromHash) return fromHash;
  return parsePlaceGallerySectionFromSearch(locationLike?.search);
}

/**
 * @param {unknown} placeKey
 * @param {string} section
 */
export function queuePlaceGallerySectionAfterReview(placeKey, section) {
  const key = String(placeKey || '').trim();
  if (!key || !VALID.has(section)) return;
  afterReviewByPlaceKey.set(key, section);
}

/**
 * @param {unknown} placeKey
 * @returns {string | null}
 */
export function peekPlaceGallerySectionAfterReview(placeKey) {
  const key = String(placeKey || '').trim();
  if (!key) return null;
  const section = afterReviewByPlaceKey.get(key);
  return VALID.has(section) ? section : null;
}

/**
 * @param {unknown} placeKey
 * @returns {string | null}
 */
export function consumePlaceGallerySectionAfterReview(placeKey) {
  const key = String(placeKey || '').trim();
  if (!key) return null;
  const section = peekPlaceGallerySectionAfterReview(key);
  if (!section) return null;
  afterReviewByPlaceKey.delete(key);
  return section;
}

/**
 * @param {unknown} placeKey
 * @param {{ hash?: string | null, search?: string | null }} locationLike
 * @returns {string | null}
 */
export function resolvePlaceGallerySectionAutoOpen(placeKey, locationLike) {
  const fromLocation = parsePlaceGallerySectionFromLocation(locationLike);
  if (fromLocation) return fromLocation;
  return peekPlaceGallerySectionAfterReview(placeKey);
}

const DESKTOP_LEFT_INFO_MEDIA = '(min-width: 1024px)';

/**
 * @param {string} sectionId
 */
export function scrollPlaceGallerySectionIntoView(sectionId) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(sectionId);
  if (!el) return;

  const useLeftOverview =
    typeof window !== 'undefined' &&
    window.matchMedia(DESKTOP_LEFT_INFO_MEDIA).matches &&
    el.closest('[data-place-overview-scroll]');

  const scroller = useLeftOverview
    ? el.closest('[data-place-overview-scroll]')
    : el.closest('[data-place-gallery-scroll]');

  if (scroller && scroller !== document.documentElement && scroller !== document.body) {
    const elRect = el.getBoundingClientRect();
    const scRect = scroller.getBoundingClientRect();
    const targetTop = elRect.top - scRect.top + scroller.scrollTop - 8;
    scroller.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    return;
  }

  if (typeof el.scrollIntoView !== 'function') return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
