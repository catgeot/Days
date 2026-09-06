import {
  ensureLatinPlaceSlug,
  isLatinPlaceName,
  mergeSearchBoxEnglishHits,
} from './uiPlaceAssetQuery.js';

function readMapboxToken() {
  const fromVite = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_MAPBOX_TOKEN : '';
  const fromProcess =
    typeof process !== 'undefined'
      ? process.env?.VITE_MAPBOX_TOKEN || process.env?.MAPBOX_TOKEN
      : '';
  return String(fromVite || fromProcess || '').trim();
}

const GEOCODE_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

async function fetchGeocodeFeatures(query, language) {
  const token = readMapboxToken();
  if (!token) return [];
  const params = new URLSearchParams({
    access_token: token,
    language,
    limit: '6',
    autocomplete: 'true',
    types: 'place,region,locality',
  });
  const response = await fetch(`${GEOCODE_BASE}/${encodeURIComponent(query)}.json?${params}`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data?.features) ? data.features : [];
}

function featureToHit(feature) {
  const [lng, lat] = feature?.center || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = String(feature.text || '').trim();
  if (!name) return null;
  const types = Array.isArray(feature.place_type) ? feature.place_type : [];
  const ctx = Array.isArray(feature.context) ? feature.context : [];
  const countryCtx = ctx.find((row) => String(row?.id || '').startsWith('country.'));
  const country = String(countryCtx?.text || feature.place_name?.split(',').pop() || '').trim();
  const latinName = isLatinPlaceName(name) ? name : '';
  const latinCountry = isLatinPlaceName(country) ? country : '';
  return {
    id: `geocode-${feature.id || `${lat}-${lng}`}`,
    kind: 'city',
    badge: types.includes('place') || types.includes('city') ? '도시' : '장소',
    name,
    name_en: latinName,
    country,
    country_en: latinCountry,
    lat,
    lng,
    mapboxId: feature.id || '',
    source: 'mapbox-geocode',
    uiPlace: true,
  };
}

/**
 * Search Box가 못 찾는 한글 지명용 Geocoding 후보 (ko+en 라틴 name_en).
 * geocoding.js를 동적 import하지 않음 — 토큰·번들이 Search Box와 같게.
 */
export async function geocodeForwardSuggestionHits(query, { limit = 6 } = {}) {
  const q = String(query || '').trim();
  if (!q || !readMapboxToken()) return [];
  try {
    const [koFeatures, enFeatures] = await Promise.all([
      fetchGeocodeFeatures(q, 'ko'),
      fetchGeocodeFeatures(q, 'en'),
    ]);
    const merged = mergeSearchBoxEnglishHits(
      koFeatures.map(featureToHit).filter(Boolean),
      enFeatures.map(featureToHit).filter(Boolean),
    );
    return merged.slice(0, limit).map(ensureLatinPlaceSlug);
  } catch {
    return [];
  }
}
