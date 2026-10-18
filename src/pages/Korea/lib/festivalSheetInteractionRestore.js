import { scheduleRecalibrateFixedChromeHits } from '../../../shared/lib/mobileViewport.js';
import { consumeFestivalSheetExternalReturn } from './festivalHomepageProtocol.js';

const Z_MIN = 40;
const Z_MAX = 59;

function parsedZIndex(el) {
  if (!(el instanceof HTMLElement)) return null;
  const raw = window.getComputedStyle(el).zIndex;
  if (raw === 'auto') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function isInZBand(el) {
  const z = parsedZIndex(el);
  if (z == null) return false;
  return z >= Z_MIN && z <= Z_MAX;
}

/**
 * WKWebView 복귀 후 sheet 위를 덮는 fixed/sticky 히트 레이어를 끈다.
 * @param {HTMLElement} dialogEl
 */
export function clearFestivalSheetPointerBlockers(dialogEl) {
  if (typeof document === 'undefined' || !dialogEl) return;

  const rect = dialogEl.getBoundingClientRect();
  const probes = [
    [0.5, 0.22],
    [0.5, 0.38],
    [0.5, 0.55],
    [0.25, 0.35],
    [0.75, 0.35],
  ];

  for (const [rx, ry] of probes) {
    const x = rect.left + rect.width * rx;
    const y = rect.top + rect.height * ry;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
    const hit = document.elementFromPoint(x, y);
    if (!hit || dialogEl.contains(hit)) continue;

    let el = hit instanceof HTMLElement ? hit : hit.parentElement;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      const fixedLike =
        style.position === 'fixed' || style.position === 'sticky' || style.position === 'absolute';
      if (fixedLike && isInZBand(el) && !el.closest('[role="dialog"]')) {
        if (!el.hasAttribute('data-festival-sheet-preserve-hit')) {
          el.style.pointerEvents = 'none';
          el.setAttribute('data-festival-sheet-blocker-cleared', '');
        }
        break;
      }
      el = el.parentElement;
    }
  }
}

/** @param {HTMLElement | null | undefined} sheetEl */
export function nudgeFestivalSheetScrollAndRepaint(sheetEl) {
  if (!sheetEl || typeof window === 'undefined') return;

  const prevTop = sheetEl.scrollTop;
  sheetEl.scrollTop = prevTop > 0 ? prevTop - 1 : prevTop + 1;
  sheetEl.scrollTop = prevTop;

  const prevTransform = sheetEl.style.transform;
  sheetEl.style.transform = 'translateZ(0)';
  window.requestAnimationFrame(() => {
    sheetEl.style.transform = prevTransform;
    window.dispatchEvent(new Event('resize'));
    scheduleRecalibrateFixedChromeHits();
  });
}

/**
 * @param {{
 *   contentId: string,
 *   sheetScrollRef: import('react').RefObject<HTMLElement | null>,
 *   onResetUi: () => void,
 *   forceFull?: boolean,
 * }} opts
 */
export function runFestivalSheetInteractionRestore(opts) {
  const { contentId, sheetScrollRef, onResetUi, forceFull = false } = opts;
  const fromSession = consumeFestivalSheetExternalReturn(contentId);
  const full = forceFull || fromSession;

  const sheet = sheetScrollRef.current;

  if (full) {
    onResetUi();
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  if (!sheet) return;

  nudgeFestivalSheetScrollAndRepaint(sheet);
  clearFestivalSheetPointerBlockers(sheet);

  if (full) {
    window.requestAnimationFrame(() => {
      nudgeFestivalSheetScrollAndRepaint(sheet);
      clearFestivalSheetPointerBlockers(sheet);
    });
  }
}
