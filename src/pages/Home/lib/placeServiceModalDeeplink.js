import { buildGygActivitiesSearchQuery } from '../../../components/PlaceCard/tabs/planner/locationRules.js';
import { buildPlacePath } from '../../../utils/placePlannerPath.js';
import { canShowMrtStayStrip } from '../../../utils/mrtStayQuery.js';
import { canShowMrtTnaStrip } from '../../../utils/mrtTnaQuery.js';

export const PLACE_SERVICE_MODAL_OPEN_VALUES = new Set(['tour', 'stay']);

const FROM_REF_PATTERN = /^[a-z0-9_-]{1,32}$/;

/**
 * @param {URLSearchParams | string | null | undefined} input
 * @returns {{ open: 'tour' | 'stay' | null, from: string | null }}
 */
export function parsePlaceServiceModalDeeplink(input) {
  const params =
    input instanceof URLSearchParams
      ? input
      : new URLSearchParams(typeof input === 'string' ? input.replace(/^\?/, '') : '');
  const openRaw = params.get('open');
  const open =
    typeof openRaw === 'string' && PLACE_SERVICE_MODAL_OPEN_VALUES.has(openRaw) ? openRaw : null;
  const fromRaw = params.get('from');
  const from =
    typeof fromRaw === 'string' && FROM_REF_PATTERN.test(fromRaw) ? fromRaw : null;
  return { open, from };
}

/** Canonical /place slug redirect 시 open·from만 유지 */
export function preserveServiceModalDeeplinkSearch(search) {
  const { open, from } = parsePlaceServiceModalDeeplink(search);
  if (!open) return '';
  const next = new URLSearchParams();
  next.set('open', open);
  if (from) next.set('from', from);
  const serialized = next.toString();
  return serialized ? `?${serialized}` : '';
}

export function hasRawPlaceServiceModalOpenQuery(search) {
  const params = new URLSearchParams(
    typeof search === 'string' ? search.replace(/^\?/, '') : '',
  );
  return params.has('open');
}

/** open·from만 제거하고 나머지 query 유지 */
export function stripPlaceServiceModalDeeplinkSearch(search) {
  const params = new URLSearchParams(
    typeof search === 'string' ? search.replace(/^\?/, '') : '',
  );
  params.delete('open');
  params.delete('from');
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * @param {string} slug
 * @param {{ tab?: string, search?: string }} [opts]
 */
export function buildPlacePathWithStrippedServiceModalDeeplink(slug, opts = {}) {
  const path = buildPlacePath(slug);
  if (!path) return null;
  const tab = opts.tab ? `/${String(opts.tab).trim()}` : '';
  const nextSearch = stripPlaceServiceModalDeeplinkSearch(opts.search ?? '');
  return `${path}${tab}${nextSearch}`;
}

/** Deeplink 소비 후 주소창만 /place SSOT로 맞춤 — React Router는 홈 써머리(/) 유지. */
export function syncPlaceServiceModalDeeplinkDisplayUrl(strippedPath) {
  if (!strippedPath || typeof window === 'undefined') return;
  try {
    window.history.replaceState(window.history.state, '', strippedPath);
  } catch {
    // ignore
  }
}

/**
 * @param {object | null | undefined} location
 * @param {'tour' | 'stay'} service
 */
export function isPlaceServiceModalOpenEligible(location, service) {
  if (!location || location.isScanning) return false;
  if (service === 'stay') return canShowMrtStayStrip(location);
  const useMrtTna = canShowMrtTnaStrip(location);
  const gygQuery = useMrtTna ? null : buildGygActivitiesSearchQuery(location);
  return useMrtTna || Boolean(gygQuery);
}