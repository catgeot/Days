import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { citiesData } from '../data/citiesData.js';
import { formatUrlName } from './formatUrlName.js';
import {
  buildSpotLookup,
  resolveTravelSpotFromPlaceId,
  isPlaceholderCountry,
  isSameCanonicalPlace,
} from '../../../utils/travelSpotResolve.js';
import { readCachedPlaceBySlug } from './placeLocationCache.js';

/**
 * SSOT/cities hydrate 후에도 검색·테마 큐레이션(originalQuery·curationSummary)을 유지.
 * /place/:slug sync가 카탈로그 desc만 넣으면 큐레이션이 깜빡이다 사라지던 회귀 방지.
 */
export function overlaySessionCuration(target, options = {}) {
  if (!target || typeof target !== 'object') return target;

  const { selectedLocation = null } = options;
  const slug = String(target.slug || target.canonical_slug || '')
    .trim()
    .toLowerCase();

  let source = null;
  if (
    selectedLocation &&
    (selectedLocation.curationSummary || selectedLocation.originalQuery) &&
    isSameCanonicalPlace(selectedLocation, target)
  ) {
    source = selectedLocation;
  }

  if (!source && slug) {
    const cached = readCachedPlaceBySlug(slug);
    if (cached?.curationSummary || cached?.originalQuery) {
      source = cached;
    }
  }

  if (!source) return target;

  const curationSummary = String(source.curationSummary || '').trim();
  const originalQuery = source.originalQuery || undefined;
  const fixed = String(target.desc || '').trim();
  let desc = fixed;
  if (curationSummary) {
    if (!fixed) desc = curationSummary;
    else if (fixed === curationSummary || fixed.startsWith(curationSummary)) desc = fixed;
    else desc = `${curationSummary}\n\n${fixed}`;
  } else if (source.desc) {
    desc = source.desc;
  }

  return {
    ...target,
    originalQuery,
    curationSummary: curationSummary || source.curationSummary,
    isCorrected: source.isCorrected ?? true,
    desc,
  };
}

/** 즐겨찾기·저장 여정에서 /place/:slug URL 세그먼트와 매칭 */
export function findSavedTripByPlaceSlug(trips, slug) {
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized || !Array.isArray(trips)) return null;

  return (
    trips.find((t) => {
      const dest = t?.destination || '';
      const nameEn = t?.name_en || t?.curation_data?.locationEn || dest;
      const tripSlug = t?.slug || t?.curation_data?.slug || '';
      return (
        formatUrlName(dest) === normalized ||
        formatUrlName(nameEn) === normalized ||
        (tripSlug && formatUrlName(tripSlug) === normalized) ||
        String(t?.id) === slug
      );
    }) || null
  );
}

/** saved_trips 행 → 장소카드 location (Mapbox uiPlace·SSOT 공통) */
export function hydrateLocationFromSavedTrip(trip, category = 'paradise') {
  if (!trip) return null;

  const dest = trip.destination || '';
  const meta = trip.curation_data || {};

  const realSpot = TRAVEL_SPOTS.find((s) => s.name === dest || s.name_en === dest);
  if (realSpot) {
    return {
      ...trip,
      ...realSpot,
      name: dest,
      type: 'temp-base',
      category: realSpot.category || trip.category || category,
    };
  }

  const realCity = (citiesData || []).find((c) => c.name === dest || c.name_en === dest);
  if (realCity) {
    return {
      ...trip,
      id: `city-${realCity.lat}-${realCity.lng}`,
      slug: realCity.slug,
      name: dest,
      name_en: realCity.name_en,
      lat: realCity.lat,
      lng: realCity.lng,
      country: realCity.country || 'Explore',
      country_en: realCity.country_en || 'Explore',
      type: 'temp-base',
      category: trip.category || category,
    };
  }

  const nameEn = trip.name_en || meta.locationEn || dest;
  const slug = meta.slug || trip.slug || formatUrlName(nameEn || dest);
  const lat = Number(trip.lat);
  const lng = Number(trip.lng);
  const rawCountry = meta.country || trip.country || '';
  const rawCountryEn = meta.country_en || trip.country_en || '';
  // Explore/Global을 하드코딩하지 않음 → healPlaceholderCountry·역지오 자가치유 여지
  const country = isPlaceholderCountry(rawCountry) ? undefined : rawCountry;
  const countryEn = isPlaceholderCountry(rawCountryEn) ? undefined : rawCountryEn;

  return {
    ...trip,
    id:
      meta.placeId ||
      trip.place_id ||
      (Number.isFinite(lat) && Number.isFinite(lng) ? `label-${lat}-${lng}` : `trip-${trip.id}`),
    slug,
    name: dest,
    name_en: nameEn,
    lat,
    lng,
    country,
    country_en: countryEn,
    type: 'temp-base',
    category: trip.category || category,
    uiPlace: meta.uiPlace !== false,
    desc: meta.description || trip.desc || '',
    galleryRegionSpot: meta.galleryRegionSpot || trip.galleryRegionSpot || undefined,
  };
}

/**
 * /place/:slug 해석 — SSOT · cities · 세션 캐시 · 즐겨찾기(uiPlace) 순
 * loc-/search-/city- 좌표 URL은 index.jsx에서 별도 처리
 */
export function resolvePlaceTargetFromSlug(slug, options = {}) {
  const { savedTrips = [], category = 'paradise', selectedLocation = null } = options;
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized) return null;

  let target = TRAVEL_SPOTS.find(
    (s) =>
      s.slug === normalized ||
      String(s.id) === slug ||
      formatUrlName(s.name_en || s.name) === normalized,
  );

  if (!target) {
    const aliasResolved = resolveTravelSpotFromPlaceId(
      buildSpotLookup(TRAVEL_SPOTS),
      TRAVEL_SPOTS,
      normalized,
    );
    if (aliasResolved?.spot) target = aliasResolved.spot;
  }
  if (target) return overlaySessionCuration(target, options);

  const matchedCity = (citiesData || []).find(
    (c) => c.slug === normalized || formatUrlName(c.name_en || c.name) === normalized,
  );
  if (matchedCity) {
    return overlaySessionCuration(
      {
        id: `city-${matchedCity.lat}-${matchedCity.lng}`,
        slug: matchedCity.slug,
        canonical_slug: matchedCity.slug,
        name: matchedCity.name,
        name_en: matchedCity.name_en,
        lat: matchedCity.lat,
        lng: matchedCity.lng,
        country: matchedCity.country || 'Explore',
        country_en: matchedCity.country_en || 'Explore',
        tags: matchedCity.tags || [],
        desc: matchedCity.desc || '',
      },
      options,
    );
  }

  if (
    selectedLocation &&
    (selectedLocation.slug === normalized ||
      formatUrlName(selectedLocation.name_en || selectedLocation.name) === normalized ||
      String(selectedLocation.id) === slug)
  ) {
    return selectedLocation;
  }

  const cached = readCachedPlaceBySlug(normalized);
  if (cached) return overlaySessionCuration(cached, options);

  const tripMatch = findSavedTripByPlaceSlug(savedTrips, normalized);
  if (tripMatch) {
    return hydrateLocationFromSavedTrip(tripMatch, category);
  }

  return null;
}
