import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { citiesData } from '../data/citiesData.js';
import { formatUrlName, isEphemeralSlug, resolveCatalogPlaceSlug } from './formatUrlName.js';
import { resolveTravelSpotFromSearchQuery } from '../../../utils/travelSpotResolve.js';
import { logCurationHandoff } from '../../../shared/cloudPreview/curationHandoffDebug.js';

export const CURATION_PENDING_HOME_KEY = 'gateo_curation_pending_home';
const HANDOFF_CLAIM_PREFIX = 'gateo_curation_handoff_claim:';
const HANDOFF_MAX_AGE_MS = 120000;

let handoffApplyTimer = null;
let handoffApplyStamp = null;
/** @type {(() => void) | null} */
let pendingGlobeSyncFlush = null;

function scheduleHandoffTimeout(fn, delayMs) {
  const host = typeof window !== 'undefined' ? window : globalThis;
  return host.setTimeout(fn, delayMs);
}

function clearHandoffTimeout(timerId) {
  const host = typeof window !== 'undefined' ? window : globalThis;
  host.clearTimeout(timerId);
}

export function isCurationHomeHandoffApplyScheduled(at) {
  const stamp = Number(at);
  if (!Number.isFinite(stamp)) return handoffApplyTimer != null;
  return handoffApplyStamp === stamp && handoffApplyTimer != null;
}

export function cancelCurationHomeHandoffApply() {
  if (handoffApplyTimer != null) {
    clearHandoffTimeout(handoffApplyTimer);
    handoffApplyTimer = null;
  }
  handoffApplyStamp = null;
  pendingGlobeSyncFlush = null;
}

/** effect cleanup·deps 변경에도 sync 타이머가 살아 있게 모듈 레벨로 예약 */
export function scheduleCurationHomeHandoffApply(at, delayMs, run) {
  const stamp = Number(at);
  if (!Number.isFinite(stamp)) return false;
  if (isCurationHomeHandoffApplyScheduled(stamp)) return false;
  cancelCurationHomeHandoffApply();
  handoffApplyStamp = stamp;
  pendingGlobeSyncFlush = run;
  handoffApplyTimer = scheduleHandoffTimeout(() => {
    handoffApplyTimer = null;
    handoffApplyStamp = null;
    run();
  }, delayMs);
  return true;
}

export function flushCurationGlobeSyncIfPending() {
  if (!pendingGlobeSyncFlush) return false;
  const run = pendingGlobeSyncFlush;
  pendingGlobeSyncFlush = null;
  run();
  return true;
}

export function clearCurationGlobeSyncFlush() {
  pendingGlobeSyncFlush = null;
}

export function clearCurationPendingHomeSession() {
  try {
    sessionStorage.removeItem(CURATION_PENDING_HOME_KEY);
  } catch {
    /* private mode */
  }
}

function parseHandoffPayload(parsed, maxAgeMs = HANDOFF_MAX_AGE_MS) {
  if (!parsed?.location || !hasValidCurationCoords(parsed.location)) return null;
  const at = Number(parsed.at);
  if (Number.isFinite(at) && Date.now() - at > maxAgeMs) return null;
  return {
    location: parsed.location,
    openMooni: Boolean(parsed.openMooni),
    at: Number.isFinite(at) ? at : Date.now(),
  };
}

export function buildCurationHomeNavigateState(location, { openMooni = false } = {}) {
  return {
    fromSearch: true,
    fromCuration: true,
    curationHandoff: {
      location,
      openMooni: Boolean(openMooni),
      at: Date.now(),
    },
  };
}

function sessionKeyPresent() {
  try {
    return Boolean(sessionStorage.getItem(CURATION_PENDING_HOME_KEY));
  } catch {
    return false;
  }
}

/** SPA navigate state 우선 · sessionStorage 폴백 */
export function resolveCurationHomeHandoff(routeState, { maxAgeMs = HANDOFF_MAX_AGE_MS } = {}) {
  const routePayload = routeState?.curationHandoff;
  if (routePayload) {
    const parsed = parseHandoffPayload(routePayload, maxAgeMs);
    if (parsed) {
      logCurationHandoff('handoff.route', {
        openMooni: parsed.openMooni,
        location: parsed.location?.name,
        at: parsed.at,
      });
      return { ...parsed, source: 'route-state' };
    }
    logCurationHandoff('handoff.route.reject', { reason: 'invalid-or-stale' });
  }

  const session = consumeCurationHomeOpen({ maxAgeMs });
  if (session) {
    return { ...session, at: Date.now(), source: 'session-storage' };
  }

  logCurationHandoff('handoff.miss', {
    hasRoute: Boolean(routeState?.curationHandoff),
    sessionKey: sessionKeyPresent(),
  });
  return null;
}

export function claimCurationHomeHandoff(at) {
  const stamp = Number(at);
  if (!Number.isFinite(stamp)) return true;
  const key = `${HANDOFF_CLAIM_PREFIX}${stamp}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

export function releaseCurationHomeHandoffClaim(at) {
  const stamp = Number(at);
  if (!Number.isFinite(stamp)) return;
  try {
    sessionStorage.removeItem(`${HANDOFF_CLAIM_PREFIX}${stamp}`);
  } catch {
    /* private mode */
  }
}

export function hasValidCurationCoords(loc) {
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function matchCatalogSpot(curationData) {
  if (!curationData?.location) return null;
  const dest = String(curationData.location).trim();
  const locationEn = String(curationData.locationEn || '').trim();
  const enCity = locationEn.split(',')[0].trim();
  const slugHint = resolveCatalogPlaceSlug(curationData.slug);

  if (slugHint) {
    const bySlug = TRAVEL_SPOTS.find((s) => String(s.slug).toLowerCase() === slugHint);
    if (bySlug) return bySlug;
  }

  const exact =
    TRAVEL_SPOTS.find(
      (s) =>
        s.name === dest ||
        s.name_en === dest ||
        (enCity && s.name_en && s.name_en.toLowerCase() === enCity.toLowerCase()) ||
        (locationEn && s.name_en && s.name_en.toLowerCase() === locationEn.toLowerCase()),
    ) || null;
  if (exact) return exact;

  return (
    resolveTravelSpotFromSearchQuery(dest) ||
    (enCity ? resolveTravelSpotFromSearchQuery(enCity) : null) ||
    null
  );
}

/**
 * 블로그 AI 큐레이션 결과 → 홈 써머리/장소카드/무니용 location.
 * SSOT 매칭 우선 · 없으면 좌표 있는 uiPlace · 좌표 없으면 null(지도 진입 불가).
 */
export function hydrateLocationFromCuration(curationData) {
  if (!curationData?.location) return null;

  const dest = String(curationData.location).trim();
  const locationEn = String(curationData.locationEn || '').trim();
  const catalog = matchCatalogSpot(curationData);
  if (catalog) {
    return {
      ...catalog,
      type: 'temp-base',
      category: catalog.category || 'paradise',
      desc: curationData.description || catalog.desc || '',
      curationSummary: curationData.description || '',
      curation_data: curationData,
    };
  }

  const enCity = locationEn.split(',')[0].trim();
  const city =
    (citiesData || []).find(
      (c) =>
        c.name === dest ||
        c.name_en === dest ||
        (enCity && c.name_en && c.name_en.toLowerCase() === enCity.toLowerCase()),
    ) || null;
  if (city && hasValidCurationCoords(city)) {
    return {
      id: `city-${city.lat}-${city.lng}`,
      slug: city.slug || formatUrlName(city.name_en || city.name),
      name: dest,
      name_en: city.name_en || locationEn || dest,
      lat: city.lat,
      lng: city.lng,
      country: curationData.country || city.country || undefined,
      country_en: curationData.country_en || city.country_en || undefined,
      type: 'temp-base',
      category: 'paradise',
      uiPlace: true,
      source: 'cities',
      desc: curationData.description || '',
      curationSummary: curationData.description || '',
      curation_data: curationData,
    };
  }

  if (!hasValidCurationCoords(curationData)) return null;

  const lat = Number(curationData.lat);
  const lng = Number(curationData.lng);
  const rawSlug = typeof curationData.slug === 'string' ? curationData.slug.trim() : '';
  const slug =
    (rawSlug && !isEphemeralSlug(rawSlug) && rawSlug) ||
    formatUrlName(enCity || locationEn || dest) ||
    `search-${lat}-${lng}`;

  return {
    id: curationData.placeId || `search-${lat}-${lng}`,
    slug,
    name: dest,
    name_en: locationEn || enCity || dest,
    lat,
    lng,
    country: curationData.country || undefined,
    country_en: curationData.country_en || undefined,
    type: 'temp-base',
    category: 'paradise',
    uiPlace: true,
    desc: curationData.description || '',
    curationSummary: curationData.description || '',
    curation_data: curationData,
  };
}

/** 블로그 → 홈 써머리(±무니) 핸드오프 */
export function queueCurationHomeOpen(location, { openMooni = false } = {}) {
  if (!location || !hasValidCurationCoords(location)) {
    logCurationHandoff('queue.reject', { reason: 'invalid-coords', openMooni });
    return false;
  }
  try {
    sessionStorage.setItem(
      CURATION_PENDING_HOME_KEY,
      JSON.stringify({
        location,
        openMooni: Boolean(openMooni),
        at: Date.now(),
      }),
    );
    logCurationHandoff('queue.ok', {
      openMooni,
      location: location.name,
      lat: location.lat,
      lng: location.lng,
    });
    return true;
  } catch {
    logCurationHandoff('queue.fail', { openMooni });
    return false;
  }
}

export function consumeCurationHomeOpen({ maxAgeMs = 120000 } = {}) {
  try {
    const raw = sessionStorage.getItem(CURATION_PENDING_HOME_KEY);
    if (!raw) {
      logCurationHandoff('consume.empty', { sessionKey: sessionKeyPresent() });
      return null;
    }
    sessionStorage.removeItem(CURATION_PENDING_HOME_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed?.location || !hasValidCurationCoords(parsed.location)) {
      logCurationHandoff('consume.reject', { reason: 'invalid-payload' });
      return null;
    }
    const at = Number(parsed.at);
    if (Number.isFinite(at) && Date.now() - at > maxAgeMs) {
      logCurationHandoff('consume.stale', { ageMs: Date.now() - at });
      return null;
    }
    logCurationHandoff('consume.ok', {
      openMooni: Boolean(parsed.openMooni),
      location: parsed.location?.name,
      ageMs: Number.isFinite(at) ? Date.now() - at : null,
    });
    return {
      location: parsed.location,
      openMooni: Boolean(parsed.openMooni),
    };
  } catch {
    try {
      sessionStorage.removeItem(CURATION_PENDING_HOME_KEY);
    } catch {
      /* private mode */
    }
    logCurationHandoff('consume.error');
    return null;
  }
}
