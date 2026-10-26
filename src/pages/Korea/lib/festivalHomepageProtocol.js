/**
 * iOS Safari can follow HTTP official links in the same tab (interstitial → back → white bfcache).
 * @param {import('react').MouseEvent<HTMLAnchorElement>} event
 * @param {() => void} [onBeforeNavigate]
 */
export function openExternalHomepageFromAnchorClick(event, onBeforeNavigate) {
  onBeforeNavigate?.();
  const anchor = event.currentTarget;
  if (!(anchor instanceof HTMLAnchorElement)) return;
  const href = (anchor.getAttribute('href') || anchor.href || '').trim();
  if (!href) return;
  event.preventDefault();
  event.stopPropagation();
  window.open(href, '_blank', 'noopener,noreferrer');
}

/** @param {unknown} url */
export function isHttpOnlyHomepage(url) {
  const s = String(url || '').trim();
  return /^http:\/\//i.test(s);
}

export const FESTIVAL_SHEET_EXTERNAL_RETURN_KEY = 'gateo:festival-sheet-external-return';
export const FESTIVAL_SHEET_PENDING_DEEPLINK_KEY = 'gateo:festival-sheet-pending-deeplink';

/** @param {string} contentId */
export function markFestivalSheetExternalReturn(contentId) {
  if (typeof sessionStorage === 'undefined') return;
  const id = String(contentId || '').trim();
  if (!id) return;
  try {
    sessionStorage.setItem(FESTIVAL_SHEET_EXTERNAL_RETURN_KEY, id);
  } catch {
    /* quota */
  }
}

/** @param {string} contentId */
export function consumeFestivalSheetExternalReturn(contentId) {
  if (typeof sessionStorage === 'undefined') return false;
  const id = String(contentId || '').trim();
  if (!id) return false;
  try {
    const stored = sessionStorage.getItem(FESTIVAL_SHEET_EXTERNAL_RETURN_KEY);
    if (stored !== id) return false;
    sessionStorage.removeItem(FESTIVAL_SHEET_EXTERNAL_RETURN_KEY);
    return true;
  } catch {
    return false;
  }
}

/** @param {string} contentId */
export function markFestivalSheetPendingDeeplink(contentId) {
  if (typeof sessionStorage === 'undefined') return;
  const id = String(contentId || '').trim();
  if (!id) return;
  try {
    sessionStorage.setItem(FESTIVAL_SHEET_PENDING_DEEPLINK_KEY, id);
  } catch {
    /* quota */
  }
}

export function clearFestivalSheetPendingDeeplink() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(FESTIVAL_SHEET_PENDING_DEEPLINK_KEY);
  } catch {
    /* quota */
  }
}

/** @returns {string} */
export function peekFestivalSheetRestoreId() {
  if (typeof sessionStorage === 'undefined') return '';
  try {
    return (
      sessionStorage.getItem(FESTIVAL_SHEET_PENDING_DEEPLINK_KEY) ||
      sessionStorage.getItem(FESTIVAL_SHEET_EXTERNAL_RETURN_KEY) ||
      ''
    ).trim();
  } catch {
    return '';
  }
}
