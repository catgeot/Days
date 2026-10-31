import { getFestivalSheetScrollContainers } from '../festivalSheetOverviewScroll.js';

const DEFAULT_MARGIN_PX = 12;

/**
 * @param {HTMLElement} scroller
 * @param {HTMLElement} sheet
 */
export function computeFestivalNearbyBandScrollMargin(scroller, sheet) {
  if (!(scroller instanceof HTMLElement)) return DEFAULT_MARGIN_PX;
  const portTop = scroller.getBoundingClientRect().top;
  let margin = DEFAULT_MARGIN_PX;

  if (typeof document !== 'undefined') {
    const closeBtn = [...document.querySelectorAll('body > button.fixed')].find((node) =>
      /닫기|Close/i.test(node.getAttribute('aria-label') || ''),
    );
    if (closeBtn) {
      const closeRect = closeBtn.getBoundingClientRect();
      if (closeRect.bottom > portTop) {
        margin = Math.max(margin, closeRect.bottom - portTop + 8);
      }
    }
  }

  if (sheet instanceof HTMLElement) {
    for (const node of sheet.querySelectorAll('*')) {
      if (!(node instanceof HTMLElement)) continue;
      const style = getComputedStyle(node);
      if (style.position !== 'sticky' || style.top === 'auto') continue;
      const rect = node.getBoundingClientRect();
      if (rect.top <= portTop + 2 && rect.bottom > portTop) {
        margin = Math.max(margin, rect.bottom - portTop + 8);
      }
    }
  }

  return margin;
}

/**
 * @param {HTMLElement | null | undefined} sectionRoot
 * @param {string} band
 * @returns {HTMLElement | null}
 */
export function findFestivalNearbyBandScrollTarget(sectionRoot, band) {
  if (!(sectionRoot instanceof HTMLElement) || !band) return null;
  const escaped =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(band)
      : String(band).replace(/["\\]/g, '\\$&');
  const title = sectionRoot.querySelector(
    `[data-nearby-group][data-band="${escaped}"] [data-nearby-group-title]`,
  );
  return title instanceof HTMLElement ? title : null;
}

/**
 * @param {HTMLElement} sheet
 * @param {HTMLElement} target
 * @param {{ behavior?: ScrollBehavior }} [opts]
 * @returns {boolean}
 */
export function scrollFestivalSheetToNearbyBandTitle(sheet, target, opts = {}) {
  if (!(sheet instanceof HTMLElement) || !(target instanceof HTMLElement)) return false;
  const [primary] = getFestivalSheetScrollContainers(sheet);
  if (!primary) return false;

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduced ? 'instant' : opts.behavior ?? 'smooth';
  const margin = computeFestivalNearbyBandScrollMargin(primary, sheet);
  const targetRect = target.getBoundingClientRect();
  const portRect = primary.getBoundingClientRect();
  const nextTop = primary.scrollTop + (targetRect.top - portRect.top) - margin;
  const maxTop = Math.max(0, primary.scrollHeight - primary.clientHeight);
  primary.scrollTo({
    top: Math.min(Math.max(0, nextTop), maxTop),
    left: 0,
    behavior,
  });
  return true;
}

/**
 * @param {HTMLElement | null | undefined} sectionRoot
 * @param {string} band
 * @returns {boolean}
 */
export function scrollFestivalNearbyBandIntoView(sectionRoot, band) {
  if (!(sectionRoot instanceof HTMLElement)) return false;
  const sheet = sectionRoot.closest('[role="dialog"]');
  if (!(sheet instanceof HTMLElement)) return false;
  const target = findFestivalNearbyBandScrollTarget(sectionRoot, band);
  if (!target) return false;
  return scrollFestivalSheetToNearbyBandTitle(sheet, target);
}
