import { TRAVEL_SPOT_TOOLKIT_SYNONYMS } from '../../scripts/data/travel-spot-place-id-aliases.mjs';
import { getPlaceStableKey } from './travelSpotResolve.js';
import { RENTAL_AIRPORT_HUBS } from './rentalAirportHubs.js';
import { distanceKm, extractArrivalIataCodesFromEssentialGuide } from './rentalAirportMatch.js';

/** 목적지 좌표와 도착 공항 허브가 이 거리(km)보다 멀면 툴킷·배너에서 제외 */
export const MAX_DESTINATION_AIRPORT_KM = 900;

export function normalizePlaceKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/** 플래너 DB `place_id` 조회 후보 — 공식명·영문·slug·별칭 */
export function buildToolkitPlaceIdCandidates(location) {
  if (location == null) return [];
  if (typeof location === 'string') {
    const s = location.trim();
    return s ? [s] : [];
  }

  const seen = new Set();
  const out = [];
  const add = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return;
    const norm = normalizePlaceKey(s);
    if (seen.has(norm)) return;
    seen.add(norm);
    out.push(s);
  };

  add(location.place_id);
  add(location.placeId);
  add(location.name);
  add(location.name_en);
  add(location.slug);

  const slugKey = getPlaceStableKey(location);
  const synonyms = TRAVEL_SPOT_TOOLKIT_SYNONYMS[slugKey];
  if (synonyms) {
    for (const syn of synonyms) add(syn);
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

/** 등록된 허브 IATA가 여행지 좌표와 지리적으로 맞는지 */
export function isIataPlausibleForLocation(iata, location) {
  const hub = hubByIata(iata);
  if (!hub) return true;

  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return true;

  const d = distanceKm(lat, lng, hub.lat, hub.lng);
  const maxR = Math.max(hub.radiusKm ?? 200, MAX_DESTINATION_AIRPORT_KM);
  return d <= maxR;
}

/** AI 툴킷 본문이 다른 여행지(잘못 생성)인지 검사 */
export function essentialGuideMatchesLocation(guide, location) {
  if (!guide || typeof guide !== 'object' || !location) return true;

  const iataBuckets = [];
  if (Array.isArray(guide.primary_arrival_airports_iata) && guide.primary_arrival_airports_iata.length) {
    iataBuckets.push(guide.primary_arrival_airports_iata);
  }
  const fromTimeline = extractArrivalIataCodesFromEssentialGuide(guide);
  if (fromTimeline?.length) iataBuckets.push(fromTimeline);

  for (const codes of iataBuckets) {
    const known = codes.map((c) => String(c).trim().toUpperCase()).filter((c) => hubByIata(c));
    if (known.length === 0) continue;
    if (!known.some((c) => isIataPlausibleForLocation(c, location))) return false;
  }

  return true;
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

  return pickBestToolkitRow(data, location);
}

export function toolkitUpdateMatchesLocation(updatedPlaceId, location) {
  if (!updatedPlaceId || location == null) return false;
  const key = normalizePlaceKey(updatedPlaceId);
  return buildToolkitPlaceIdCandidates(location).some((c) => normalizePlaceKey(c) === key);
}
