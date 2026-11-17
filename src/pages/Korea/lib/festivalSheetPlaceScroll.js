import { getFestivalSheetScrollContainers } from '../festivalSheetOverviewScroll.js';

const KEY = 'gateo:festival-sheet-place-scroll';
const MAX_AGE_MS = 30 * 60 * 1000;

function readPayload() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const contentId = String(data.contentId || '').trim();
    const tops = Array.isArray(data.tops) ? data.tops.map((n) => Number(n)) : [];
    const savedAt = Number(data.savedAt);
    if (!contentId || !tops.length || !Number.isFinite(savedAt)) return null;
    if (Date.now() - savedAt > MAX_AGE_MS) return null;
    return { contentId, tops };
  } catch {
    return null;
  }
}

/**
 * The sheet scroller is not the window, so browser back cannot restore it.
 * @param {HTMLElement | null | undefined} sheetEl
 * @param {string} contentId
 */
export function rememberFestivalSheetPlaceScroll(sheetEl, contentId) {
  if (typeof sessionStorage === 'undefined') return;
  const id = String(contentId || '').trim();
  if (!id || !(sheetEl instanceof HTMLElement)) return;
  const tops = getFestivalSheetScrollContainers(sheetEl).map((node) => node.scrollTop);
  if (!tops.some((top) => top > 0)) return;
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ contentId: id, tops, savedAt: Date.now() }),
    );
  } catch {
    /* quota */
  }
}

/** @param {string} contentId @returns {number[] | null} */
export function peekFestivalSheetPlaceScroll(contentId) {
  const data = readPayload();
  if (!data) return null;
  if (data.contentId !== String(contentId || '').trim()) return null;
  return data.tops;
}

/** @param {HTMLElement | null | undefined} sheetEl @param {string} contentId */
export function applyFestivalSheetPlaceScroll(sheetEl, contentId) {
  const tops = peekFestivalSheetPlaceScroll(contentId);
  if (!tops || !(sheetEl instanceof HTMLElement)) return false;
  const containers = getFestivalSheetScrollContainers(sheetEl);
  let applied = false;
  containers.forEach((node, index) => {
    const top = tops[index];
    if (typeof top !== 'number' || !Number.isFinite(top) || top <= 0) return;
    node.scrollTop = top;
    applied = true;
  });
  return applied;
}

/** @param {HTMLElement | null | undefined} sheetEl @param {string} contentId */
export function festivalSheetPlaceScrollSettled(sheetEl, contentId) {
  const tops = peekFestivalSheetPlaceScroll(contentId);
  if (!tops || !(sheetEl instanceof HTMLElement)) return false;
  const containers = getFestivalSheetScrollContainers(sheetEl);
  return containers.some((node, index) => {
    const want = tops[index];
    return typeof want === 'number' && want > 0 && Math.abs(node.scrollTop - want) <= 24;
  });
}

/** @param {string} [contentId] */
export function clearFestivalSheetPlaceScroll(contentId) {
  if (typeof sessionStorage === 'undefined') return;
  if (contentId) {
    const data = readPayload();
    if (data && data.contentId !== String(contentId).trim()) return;
  }
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* quota */
  }
}
