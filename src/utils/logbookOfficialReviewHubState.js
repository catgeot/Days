const BACK_STATE_KEY = 'gateo:logbook-official-review-hub-back';

/**
 * @typedef {{ expanded: boolean, visibleCount: number, scrollTop: number }} LogbookOfficialReviewHubBackState
 */

/**
 * @param {{ expanded?: boolean, visibleCount?: number, scrollTop?: number }} state
 */
export function snapshotLogbookOfficialReviewHubForBack(state) {
  if (typeof sessionStorage === 'undefined') return;
  const expanded = Boolean(state?.expanded);
  const visibleCount = Number(state?.visibleCount);
  const scrollTop = Number(state?.scrollTop);
  if (!expanded) return;
  const payload = {
    expanded: true,
    visibleCount: Number.isFinite(visibleCount) && visibleCount > 0 ? visibleCount : 10,
    scrollTop: Number.isFinite(scrollTop) && scrollTop >= 0 ? scrollTop : 0,
    at: Date.now(),
  };
  try {
    sessionStorage.setItem(BACK_STATE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

/**
 * @param {import('react-router-dom').NavigationType} navigationType
 * @returns {LogbookOfficialReviewHubBackState | null}
 */
export function readLogbookOfficialReviewHubBackState(navigationType) {
  if (navigationType !== 'POP' || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(BACK_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.expanded !== true) return null;
    const visibleCount = Number(parsed.visibleCount);
    const scrollTop = Number(parsed.scrollTop);
    return {
      expanded: true,
      visibleCount: Number.isFinite(visibleCount) && visibleCount > 0 ? visibleCount : 10,
      scrollTop: Number.isFinite(scrollTop) && scrollTop >= 0 ? scrollTop : 0,
    };
  } catch {
    return null;
  }
}

export function clearLogbookOfficialReviewHubBackState() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(BACK_STATE_KEY);
  } catch {
    /* ignore */
  }
}
