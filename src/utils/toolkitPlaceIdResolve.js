import { TRAVEL_SPOT_TOOLKIT_SYNONYMS, TRAVEL_SPOT_LEGACY_TOOLKIT_IDS } from '../../scripts/data/travel-spot-place-id-aliases.mjs';
import { TRAVEL_SPOT_AIRPORT_OVERRIDES } from '../../scripts/data/travel-spot-airport-overrides.mjs';
import {
  buildPlaceDbIdCandidates,
  getPlaceStableKey,
  mergeCanonicalTravelSpot,
  resolveTravelSpotFromLocation,
} from './travelSpotResolve.js';
import { formatUrlName } from '../pages/Home/lib/formatUrlName.js';
import { RENTAL_AIRPORT_HUBS } from './rentalAirportHubs.js';
import { getAirportsIndexCoords } from './airportsIndexLookup.js';
import { distanceKm, extractArrivalIataCodesFromEssentialGuide } from './rentalAirportMatch.js';

/** 목적지 좌표와 도착 공항 허브가 이 거리(km)보다 멀면 툴킷·배너에서 제외 */
export const MAX_DESTINATION_AIRPORT_KM = 900;

export function normalizePlaceKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/** 플래너 DB `place_id` 조회 후보 — slug·별칭·숫자 id·레거시 id·search-/loc- id */
export function buildToolkitPlaceIdCandidates(location) {
  if (location == null) return [];
  if (typeof location === 'string') {
    const s = location.trim();
    return s ? [s] : [];
  }

  const out = [];
  const pushVariant = (variant) => {
    const s = String(variant ?? '').trim();
    if (!s || out.includes(s)) return;
    out.push(s);
  };
  /** DB place_id는 대소문자 구분 — Ruul vs ruul 등 원문·소문자·slug 변형 모두 조회 */
  const add = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return;
    pushVariant(s);
    const lower = s.toLowerCase();
    if (lower !== s) pushVariant(lower);
    const slug = formatUrlName(s);
    if (slug && slug !== s && slug !== lower) pushVariant(slug);
  };

  const raw = location;
  const loc = mergeCanonicalTravelSpot(location);

  const slugKey = getPlaceStableKey(loc);
  if (slugKey) add(slugKey);

  add(loc.place_id);
  add(loc.placeId);
  add(loc.slug);
  add(loc.name);
  add(loc.name_en);
  add(raw.place_id);
  add(raw.placeId);
  add(raw.slug);
  add(raw.name);
  add(raw.name_en);

  const synonyms = TRAVEL_SPOT_TOOLKIT_SYNONYMS[slugKey];
  if (synonyms) {
    for (const syn of synonyms) add(syn);
  }

  const legacyIds = TRAVEL_SPOT_LEGACY_TOOLKIT_IDS[slugKey];
  if (legacyIds) {
    for (const legacyId of legacyIds) add(legacyId);
  }

  for (const id of buildPlaceDbIdCandidates(loc)) add(id);
  for (const id of buildPlaceDbIdCandidates(raw)) add(id);

  for (const src of [loc, raw]) {
    const ephemeralId = src?.id != null ? String(src.id).trim() : '';
    if (
      ephemeralId &&
      (ephemeralId.startsWith('search-') ||
        ephemeralId.startsWith('loc-') ||
        ephemeralId.startsWith('city-'))
    ) {
      add(ephemeralId);
    }
  }

  return out;
}

export function toolkitRowMatchesLocation(row, location) {
  if (!row || location == null) return false;
  const candidates = buildToolkitPlaceIdCandidates(location);
  const rowKey = normalizePlaceKey(row.place_id);
  return candidates.some((c) => normalizePlaceKey(c) === rowKey);
}

export function parseEssentialGuide(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof raw === 'object' ? raw : null;
}

function categoryHasContent(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') {
    if (typeof value.advice === 'string' && value.advice.trim()) return true;
    if (typeof value.summary === 'string' && value.summary.trim()) return true;
    return Object.keys(value).length > 0;
  }
  return false;
}

/** essential_guide JSON에 실제 카드/타임라인 내용이 있는지 */
export function essentialGuideHasContent(guide) {
  if (!guide || typeof guide !== 'object') return false;

  const cats = guide.categories;
  if (cats && typeof cats === 'object') {
    for (const value of Object.values(cats)) {
      if (categoryHasContent(value)) return true;
    }
  }

  if (Array.isArray(guide.journey_timeline) && guide.journey_timeline.length > 0) return true;

  for (const key of [
    'visa',
    'flight',
    'accommodation',
    'safety',
    'connectivity',
    'transport',
    'airport_transfer',
    'ferry_booking',
  ]) {
    if (categoryHasContent(guide[key])) return true;
  }

  return false;
}

function hubByIata(iata) {
  const code = String(iata ?? '')
    .trim()
    .toUpperCase();
  if (!code) return null;
  return RENTAL_AIRPORT_HUBS.find((h) => h.iata === code) ?? null;
}

/** 광역·원정지 slug — SSOT 중심 좌표와 관문 공항이 멀 수 있음 (curated high) */
function getCuratedGatewayIataSet(location) {
  if (!location) return null;

  const trySlug = (slug) => {
    const key = String(slug ?? '').trim().toLowerCase();
    if (!key) return null;
    const override = TRAVEL_SPOT_AIRPORT_OVERRIDES[key];
    if (!override || override.confidence !== 'high') return null;
    return new Set(
      override.primaryIatas.map((c) =>
        String(c)
          .trim()
          .toUpperCase()
      )
    );
  };

  const direct = trySlug(getPlaceStableKey(location));
  if (direct) return direct;

  const resolved = resolveTravelSpotFromLocation(location);
  return trySlug(resolved?.spot?.slug ?? null);
}

/** 허브 또는 airportsIndex로 IATA 좌표 조회 — 둘 다 없으면 null(미검증 통과용) */
function coordsForIata(iata) {
  const code = String(iata ?? '')
    .trim()
    .toUpperCase();
  if (!code) return null;
  const hub = hubByIata(code);
  if (hub) return { lat: hub.lat, lng: hub.lng, radiusKm: hub.radiusKm ?? 200 };
  const indexed = getAirportsIndexCoords(code);
  if (indexed) return { lat: indexed.lat, lng: indexed.lng, radiusKm: 200 };
  return null;
}

/** 등록된 허브·인덱스 IATA가 여행지 좌표와 지리적으로 맞는지 */
export function isIataPlausibleForLocation(iata, location) {
  const code = String(iata ?? '')
    .trim()
    .toUpperCase();
  if (!code) return true;

  const curated = getCuratedGatewayIataSet(location);
  if (curated?.has(code)) return true;

  const coords = coordsForIata(code);
  if (!coords) return true;

  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;

  const d = distanceKm(lat, lng, coords.lat, coords.lng);
  const maxR = Math.max(coords.radiusKm ?? 200, MAX_DESTINATION_AIRPORT_KM);
  return d <= maxR;
}

/**
 * 지리 검증용 IATA 목록 — 좌표를 알 수 있는 코드만.
 * 허브 미등록이라도 airportsIndex에 있으면 포함 (예: SLA 살타).
 * 원거리 허브(EZE)와 로컬 공항(SLA)이 섞여 있을 때 로컬이 빠지지 않게 함.
 */
function geolocatableIatas(codes) {
  return (codes || [])
    .map((c) => String(c).trim().toUpperCase())
    .filter((c) => c && (hubByIata(c) || getAirportsIndexCoords(c)));
}

/** AI 툴킷 본문이 다른 여행지(잘못 생성)인지 검사 */
export function essentialGuideMatchesLocation(guide, location) {
  if (!guide || typeof guide !== 'object' || !location) return true;

  const loc = mergeCanonicalTravelSpot(location);
  const curated = getCuratedGatewayIataSet(loc);
  const primaryRaw = Array.isArray(guide.primary_arrival_airports_iata)
    ? guide.primary_arrival_airports_iata
        .map((c) => String(c).trim().toUpperCase())
        .filter(Boolean)
    : [];

  // primary_arrival_airports_iata가 있으면 도착 공항만 검사 — 타임라인 경유(ADD·CDG·SIN 등)는 면제
  if (primaryRaw.length > 0) {
    const primaryKnown = geolocatableIatas(primaryRaw);
    if (primaryKnown.length === 0) return true;
    // 하나라도 목적지 근처면 통과 (원거리 국제 관문+로컬 공항 혼합 허용)
    return primaryKnown.some(
      (c) => isIataPlausibleForLocation(c, loc) || curated?.has(c)
    );
  }

  const fromTimeline = extractArrivalIataCodesFromEssentialGuide(guide);
  if (!fromTimeline?.length) return true;

  const known = geolocatableIatas(fromTimeline);
  if (known.length === 0) return true;
  return known.some((c) => isIataPlausibleForLocation(c, loc) || curated?.has(c));
}

export function hasUsableToolkit(row) {
  const guide = parseEssentialGuide(row?.essential_guide);
  return essentialGuideHasContent(guide);
}

export function hasUsableToolkitForLocation(row, location) {
  const guide = parseEssentialGuide(row?.essential_guide);
  if (!essentialGuideHasContent(guide)) return false;
  return essentialGuideMatchesLocation(guide, location);
}

/** DB에 본문은 있으나 여행지와 불일치 */
export function isToolkitLocationMismatch(row, location) {
  const guide = parseEssentialGuide(row?.essential_guide);
  if (!essentialGuideHasContent(guide)) return false;
  return !essentialGuideMatchesLocation(guide, location);
}

/** UI·배너용 — 내용 없거나 여행지 불일치면 null */
export function getEssentialGuide(row, location = null) {
  if (location) {
    if (!hasUsableToolkitForLocation(row, location)) return null;
  } else if (!hasUsableToolkit(row)) {
    return null;
  }
  return parseEssentialGuide(row?.essential_guide);
}

export function pickBestToolkitRow(rows, location = null) {
  if (!rows?.length) return null;
  const withGuide = location
    ? rows.filter((row) => hasUsableToolkitForLocation(row, location))
    : rows.filter(hasUsableToolkit);
  if (!withGuide.length) return null;
  return [...withGuide].sort(
    (a, b) =>
      new Date(b.toolkit_updated_at || 0).getTime() - new Date(a.toolkit_updated_at || 0).getTime()
  )[0];
}

/** @param {import('@supabase/supabase-js').SupabaseClient} supabase */
export async function fetchToolkitRow(supabase, location) {
  const candidates = buildToolkitPlaceIdCandidates(location);
  if (!candidates.length) return null;

  const { data, error } = await supabase
    .from('place_toolkit')
    .select('*')
    .in('place_id', candidates);

  if (error) {
    console.error('[toolkitPlaceIdResolve] DB 조회 에러:', error, { candidates });
    return null;
  }

  if (!data?.length) return null;

  const picked = pickBestToolkitRow(data, location);
  if (picked) return picked;

  if (import.meta.env?.DEV && data.length > 0) {
    console.warn('[toolkitPlaceIdResolve] place_id는 일치하나 지리 검증 실패 — 레거시 행 폴백', {
      candidates,
      placeIds: data.map((r) => r.place_id),
    });
  }

  // place_id는 맞지만 IATA 지리 검증만 실패한 레거시 행 — UI mismatch 경고로 표시
  return pickBestToolkitRow(data, null);
}

export function toolkitUpdateMatchesLocation(updatedPlaceId, location) {
  if (!updatedPlaceId || location == null) return false;
  const key = normalizePlaceKey(updatedPlaceId);
  return buildToolkitPlaceIdCandidates(location).some((c) => normalizePlaceKey(c) === key);
}
