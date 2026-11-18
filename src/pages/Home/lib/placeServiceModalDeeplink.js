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

/**
 * 주소창만 바꾸는 레거시. 딥링크 소비는 navigate(replace)로 라우터와 주소를 같이 맞춘다.
 * 이 함수를 딥링크 경로에서 다시 호출하면 라우터는 / 인데 주소만 /place 가 된다.
 */
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

const deeplinkEmitted = new Set();
let lastDeeplinkEmitKey = null;
let serviceModalSummaryRequest = null;

export function claimPlaceServiceModalDeeplinkEmit(consumeKey) {
  const key = String(consumeKey || '');
  if (!key || deeplinkEmitted.has(key)) return false;
  deeplinkEmitted.add(key);
  lastDeeplinkEmitKey = key;
  return true;
}

/** open 쿼리가 사라진 뒤 같은 키의 다음 방문이 다시 1회 기록되게 한다. */
export function releasePlaceServiceModalDeeplinkEmit() {
  if (!lastDeeplinkEmitKey) return;
  deeplinkEmitted.delete(lastDeeplinkEmitKey);
  lastDeeplinkEmitKey = null;
}

export function rememberPlaceServiceModalSummary(slug, service, pathname) {
  serviceModalSummaryRequest = {
    slug: String(slug || '').trim().toLowerCase(),
    service: service === 'stay' ? 'stay' : 'tour',
    pathname: String(pathname || '').split('?')[0] || null,
  };
}

export function readPlaceServiceModalSummaryRequest() {
  return serviceModalSummaryRequest;
}

export function clearPlaceServiceModalSummaryRequest() {
  serviceModalSummaryRequest = null;
}

export function resetPlaceServiceModalDeeplinkSession() {
  deeplinkEmitted.clear();
  lastDeeplinkEmitKey = null;
  serviceModalSummaryRequest = null;
}

export function readServiceModalSummaryFromLocation(pathname, search) {
  const path = String(pathname || '');
  if (!path.startsWith('/place/')) return false;
  return Boolean(parsePlaceServiceModalDeeplink(search).open);
}

export function initialServiceModalSummaryActive() {
  if (typeof window === 'undefined') return false;
  const req = readPlaceServiceModalSummaryRequest();
  if (req?.slug && window.location.pathname.startsWith(`/place/${req.slug}`)) {
    if (!req.pathname || window.location.pathname === req.pathname) return true;
  }
  return readServiceModalSummaryFromLocation(window.location.pathname, window.location.search);
}

export function initialDeeplinkStripSignals() {
  const empty = { tour: 0, stay: 0 };
  if (typeof window === 'undefined') return empty;
  const req = readPlaceServiceModalSummaryRequest();
  if (!req?.slug || !window.location.pathname.startsWith(`/place/${req.slug}`)) return empty;
  if (req.pathname && window.location.pathname !== req.pathname) return empty;
  return {
    tour: req.service === 'tour' ? 1 : 0,
    stay: req.service === 'stay' ? 1 : 0,
  };
}