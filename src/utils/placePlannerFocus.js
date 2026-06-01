import { buildPlacePlannerPath } from './placePlannerPath.js';
import { getPreTravelItemsFromGuide } from './chatPrepBookingLinks.js';

/** PlannerTab DOM id — hash와 1:1 */
export const PLANNER_FOCUS_ID = {
  PREP_SECTION: 'planner-prep',
  PREP_VISA: 'planner-prep-visa',
  PREP_FLIGHT: 'planner-prep-flight',
  PREP_ACCOMMODATION: 'planner-prep-accommodation',
  PREP_SAFETY: 'planner-prep-safety',
  PRE_TRAVEL_CHECKLIST: 'planner-pre-travel-checklist',
  RENTAL_PICKUP: 'planner-rental-pickup',
  ARRIVAL: 'planner-arrival',
  ARRIVAL_TRANSFER: 'planner-arrival-transfer',
  LOCAL_TRANSPORT: 'planner-local-transport',
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
 * @param {Record<string, unknown> | null | undefined} essentialGuide
 */
export function hasPlannerPreTravelChecklist(essentialGuide) {
  if (!essentialGuide || typeof essentialGuide !== 'object') return false;
  if (getPreTravelItemsFromGuide(essentialGuide).length > 0) return true;

  const cats = /** @type {{ pre_travel?: unknown[], journey_timeline?: unknown[] }} */ (
    essentialGuide.categories ?? essentialGuide
  );
  if (Array.isArray(cats?.pre_travel) && cats.pre_travel.length > 0) return true;
  if (Array.isArray(cats?.journey_timeline) && cats.journey_timeline.length > 0) {
    return true;
  }
  if (Array.isArray(essentialGuide.journey_timeline) && essentialGuide.journey_timeline.length > 0) {
    return true;
  }
  return Boolean(essentialGuide.categories);
}

/**
 * @param {Record<string, unknown> | null | undefined} essentialGuide
 */
function resolveLocalTransportFocus(essentialGuide) {
  const cats = /** @type {{ airport_transfer?: unknown, transport?: unknown }} */ (
    essentialGuide?.categories ?? {}
  );
  if (cats?.airport_transfer) return PLANNER_FOCUS_ID.ARRIVAL_TRANSFER;
  if (cats?.transport) return PLANNER_FOCUS_ID.LOCAL_TRANSPORT;
  if (essentialGuide) return PLANNER_FOCUS_ID.RENTAL_PICKUP;
  return PLANNER_FOCUS_ID.ARRIVAL;
}

/**
 * MOONi 출발 전 준비 L2 칩 id → 플래너 앵커 (칩 탭 시 우선)
 *
 * @param {string | null | undefined} chipId
 * @param {Record<string, unknown> | null | undefined} [essentialGuide]
 * @returns {string | null}
 */
export function resolvePlannerFocusFromPrepChipId(chipId, essentialGuide = null) {
  const id = String(chipId ?? '').trim();
  if (!id) return null;

  switch (id) {
    case 'visa_docs':
      return PLANNER_FOCUS_ID.PREP_SECTION;
    case 'prep_flight':
      return hasPlannerPreTravelChecklist(essentialGuide)
        ? PLANNER_FOCUS_ID.PRE_TRAVEL_CHECKLIST
        : PLANNER_FOCUS_ID.PREP_FLIGHT;
    case 'prep_hotel':
      return PLANNER_FOCUS_ID.PREP_ACCOMMODATION;
    case 'prep_transport':
      return resolveLocalTransportFocus(essentialGuide);
    default:
      return null;
  }
}

/**
 * MOONi·채팅 CTA — 발화에 맞는 플래너 앵커.
 *
 * @param {string} userText
 * @param {{ essentialGuide?: Record<string, unknown> | null, chipId?: string | null }} [options]
 * @returns {string | null}
 */
export function resolvePlannerFocusFromUserText(userText, options = {}) {
  const t = String(userText ?? '');
  const { essentialGuide = null, chipId = null } = options;

  const fromChip = resolvePlannerFocusFromPrepChipId(chipId, essentialGuide);
  if (fromChip) return fromChip;

  if (/항공권\s*예약을\s*어떻게|항공권\s*예약/.test(t)) {
    return hasPlannerPreTravelChecklist(essentialGuide)
      ? PLANNER_FOCUS_ID.PRE_TRAVEL_CHECKLIST
      : PLANNER_FOCUS_ID.PREP_FLIGHT;
  }

  if (/숙소는\s*어디가\s*좋|숙소\s*추천|숙박\s*지역/.test(t)) {
    return PLANNER_FOCUS_ID.PREP_ACCOMMODATION;
  }

  if (/현지\s*교통|렌터카|픽업|공항\s*픽/.test(t)) {
    return resolveLocalTransportFocus(essentialGuide);
  }

  if (/비자|입국\s*필수|입국\s*준비|관광세|입국\s*비|증빙|입국\s*심사|필수\s*서류|uk\s*eta/i.test(t)) {
    return PLANNER_FOCUS_ID.PREP_SECTION;
  }

  if (/출발\s*전|준비/.test(t)) {
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
