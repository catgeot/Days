import { buildPlacePlannerPath } from './placePlannerPath.js';

/** PlannerTab DOM id — hash와 1:1 */
export const PLANNER_FOCUS_ID = {
  PREP_SECTION: 'planner-prep',
  PREP_VISA: 'planner-prep-visa',
  PREP_SAFETY: 'planner-prep-safety',
  PRE_TRAVEL_CHECKLIST: 'planner-pre-travel-checklist',
};

/**
 * @param {string | null | undefined} hash
 * @returns {string | null}
 */
export function parsePlannerFocusFromHash(hash) {
  const id = String(hash ?? '')
    .replace(/^#/, '')
    .trim();
  if (!id) return null;
  return id;
}

/**
 * MOONi·채팅 CTA — 발화에 맞는 플래너 앵커.
 *
 * @param {string} userText
 * @returns {string | null}
 */
export function resolvePlannerFocusFromUserText(userText) {
  const t = String(userText ?? '');

  if (/의료\s*후송|후송\s*보험|여행\s*보험/.test(t)) {
    return PLANNER_FOCUS_ID.PREP_SAFETY;
  }
  if (/치안|현지.*주의|현금|결제\s*주의/.test(t) && !/비자|입국|증빙|서류/.test(t)) {
    return PLANNER_FOCUS_ID.PREP_SAFETY;
  }
  if (
    /입국\s*심사|숙소.*증빙|항공.*증빙|증빙|왕복\s*항공|예약\s*확인증|비자|입국|필수\s*서류|관광세|수수료|uk\s*eta/i.test(
      t
    )
  ) {
    return PLANNER_FOCUS_ID.PREP_VISA;
  }
  if (/출발\s*전|준비|관광세/.test(t)) {
    return PLANNER_FOCUS_ID.PREP_SECTION;
  }

  return null;
}

/**
 * @param {string | null | undefined} slug
 * @param {string | null | undefined} focusId
 */
export function buildPlacePlannerPathWithFocus(slug, focusId = null) {
  const base = buildPlacePlannerPath(slug);
  if (!base || !focusId) return base;
  const id = String(focusId).trim();
  return `${base}#${id}`;
}

/**
 * @param {HTMLElement | null} scrollRoot
 * @param {string} focusId
 * @param {{ headerOffset?: number }} [options]
 */
export function scrollPlannerFocusIntoView(scrollRoot, focusId, options = {}) {
  const el = document.getElementById(focusId);
  if (!el) return false;

  const headerOffset = options.headerOffset ?? 88;

  if (scrollRoot && scrollRoot.contains(el)) {
    const rootRect = scrollRoot.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const nextTop =
      scrollRoot.scrollTop + (elRect.top - rootRect.top) - headerOffset;
    scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
    return true;
  }

  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}
