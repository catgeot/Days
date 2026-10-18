/** @param {unknown} url */
export function isHttpOnlyHomepage(url) {
  const s = String(url || '').trim();
  return /^http:\/\//i.test(s);
}

export const FESTIVAL_SHEET_EXTERNAL_RETURN_KEY = 'gateo:festival-sheet-external-return';

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
