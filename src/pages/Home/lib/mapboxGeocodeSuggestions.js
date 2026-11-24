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

async function fetchReverseFeatures(lng, lat, language, types = 'place,region,country') {
  const token = readMapboxToken();
  if (!token) return [];
  const params = new URLSearchParams({
    access_token: token,
    language,
    limit: '1',
    types,
  });
  const response = await fetch(`${GEOCODE_BASE}/${lng},${lat}.json?${params}`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data?.features) ? data.features : [];
}

const reversePlaceCache = new Map();

/**
 * Reverse geocode returns one feature per type. Prefer a wikidata locality
 * (a known place name) over the admin place; otherwise keep that place/district.
 * @param {Array<Record<string, unknown>>} features
 */
export function chooseReverseLocalityFeature(features) {
  const list = (features || []).filter((feature) => String(feature?.text || '').trim());
  if (!list.length) return null;
  const ofType = (type) => list.filter((feature) => (feature.place_type || []).includes(type));
  const known = (rows) => rows.filter((feature) => feature.properties?.wikidata);
  const knownLocality = known(ofType('locality'));
  if (knownLocality.length) return knownLocality[0];
  const knownPlace = known(ofType('place'));
  if (knownPlace.length) return knownPlace[0];
  const locality = ofType('locality');
  if (locality.length) return locality[0];
  const place = ofType('place');
  if (place.length) return place[0];
  return ofType('district')[0] || ofType('region')[0] || list[0];
}

/**
 * 방문 좌표 → 국가·라틴 지명. Search Box 객체 context를 못 읽을 때 카드가 Explore/Global로 떨어지는 구멍 메움.
 * `preferLocality` asks locality and place separately (Mapbox reverse allows one type per call).
 */
export async function geocodeReversePlaceFields(lat, lng, options = {}) {
  const latN = Number(lat);
  const lngN = Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN) || !readMapboxToken()) return null;
  const preferLocality = options.preferLocality === true;
  const cacheKey = `${latN.toFixed(3)},${lngN.toFixed(3)}${preferLocality ? ':loc' : ''}`;
  if (reversePlaceCache.has(cacheKey)) return reversePlaceCache.get(cacheKey);
  try {
    const koTypes = preferLocality ? ['locality', 'place'] : [undefined];
    const enTypes = koTypes;
    const [koLists, enLists] = await Promise.all([
      Promise.all(koTypes.map((type) => fetchReverseFeatures(lngN, latN, 'ko', type))),
      Promise.all(enTypes.map((type) => fetchReverseFeatures(lngN, latN, 'en', type))),
    ]);
    let koFeatures = koLists.flat();
    let enFeatures = enLists.flat();
    if (preferLocality) {
      const chosen = chooseReverseLocalityFeature(koFeatures);
      const enChosen = chosen
        ? enFeatures.find((feature) => feature?.id && feature.id === chosen.id)
          || chooseReverseLocalityFeature(enFeatures)
        : null;
      koFeatures = chosen ? [chosen] : [];
      enFeatures = enChosen ? [enChosen] : [];
    }
    const merged = mergeSearchBoxEnglishHits(
      koFeatures.map(featureToHit).filter(Boolean),
      enFeatures.map(featureToHit).filter(Boolean),
    );
    const placeHit = merged.find((row) => {
      const n = String(row?.name || '').trim();
      const c = String(row?.country || '').trim();
      return n && (!c || n !== c);
    });
    const hit = placeHit || merged[0]
      ? { ...(placeHit || merged[0]), lat: latN, lng: lngN }
      : null;
    reversePlaceCache.set(cacheKey, hit);
    return hit;
  } catch {
    reversePlaceCache.set(cacheKey, null);
    return null;
  }
}

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
