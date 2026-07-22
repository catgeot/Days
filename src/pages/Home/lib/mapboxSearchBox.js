/**
 * Mapbox Search Box — 타이핑 제안·도시 주변 명소 보강.
 * 실패 시 null/[] 반환 (큐레이션만으로 degrade).
 */
const MAPBOX_TOKEN = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_MAPBOX_TOKEN : '';
const SEARCHBOX_BASE = 'https://api.mapbox.com/search/searchbox/v1';

/** 여행 명소에 가까운 category canonical id */
export const TOURISM_CATEGORY_IDS = [
  'tourist_attraction',
  'monument',
  'museum',
  'beach',
  'park',
  'place_of_worship',
  'viewpoint',
  'historic_site',
];

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;

let searchBoxAvailable = null;
let warnedUnavailable = false;

function newSessionToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `sb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function warnOnce(msg) {
  if (warnedUnavailable) return;
  warnedUnavailable = true;
  console.warn(`[Mapbox Search Box] ${msg}`);
}

/**
 * @param {Response} response
 */
async function parseJsonOrNull(response) {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      searchBoxAvailable = false;
      warnOnce(`권한 없음 (${response.status}) — 큐레이션만 사용합니다.`);
    }
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function featureToSuggestion(feature, { hubId, parentCity, source = 'mapbox' } = {}) {
  if (!feature) return null;
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates;
  const lng = Array.isArray(coords) ? Number(coords[0]) : NaN;
  const lat = Array.isArray(coords) ? Number(coords[1]) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const name = String(props.name || props.name_preferred || props.full_address || '').trim();
  if (!name) return null;

  const featureType = String(props.feature_type || props.place_type?.[0] || '').toLowerCase();
  const isPoi = featureType === 'poi' || (Array.isArray(props.poi_category) && props.poi_category.length > 0);
  const contextCountry = Array.isArray(props.context)
    ? props.context.find((c) => c?.country || String(c?.id || '').startsWith('country'))
    : null;
  const country =
    props.place_formatted?.split(',').pop()?.trim() ||
    contextCountry?.country?.name ||
    contextCountry?.name ||
    'Explore';

  const poiCats = props.poi_category_ids || props.poi_category || [];
  const firstCat = Array.isArray(poiCats) ? poiCats[0] : '';

  return {
    id: `mapbox-${props.mapbox_id || `${lat}-${lng}`}`,
    kind: isPoi ? 'attraction' : featureType === 'place' || featureType === 'city' ? 'city' : 'poi',
    badge: isPoi ? '명소' : featureType === 'place' || featureType === 'city' ? '도시' : '장소',
    name,
    name_en: props.name_preferred || props.name || name,
    name_ko: HAS_HANGUL_RE.test(name) ? name : '',
    country,
    country_en: country,
    lat,
    lng,
    mapboxId: props.mapbox_id,
    hubId,
    parentCity,
    attractionKind: firstCat || undefined,
    source,
    uiPlace: true,
    desc: parentCity ? `${parentCity} · ${name}` : name,
  };
}

/**
 * Forward search (coords included). 타이핑·모호함 해소용.
 * @param {string} query
 * @param {{ limit?: number, types?: string, proximity?: [number, number], country?: string, language?: string }} [opts]
 */
export async function searchBoxForward(query, opts = {}) {
  if (!MAPBOX_TOKEN || searchBoxAvailable === false) return [];
  const q = String(query || '').trim();
  if (!q) return [];

  try {
    const params = new URLSearchParams({
      q,
      access_token: MAPBOX_TOKEN,
      language: opts.language || 'ko',
      limit: String(opts.limit ?? 8),
      auto_complete: 'true',
    });
    if (opts.types) params.set('types', opts.types);
    else params.set('types', 'place,city,locality,poi');
    if (opts.country) params.set('country', opts.country);
    if (Array.isArray(opts.proximity) && opts.proximity.length === 2) {
      params.set('proximity', `${opts.proximity[0]},${opts.proximity[1]}`);
    }

    const response = await fetch(`${SEARCHBOX_BASE}/forward?${params}`);
    const data = await parseJsonOrNull(response);
    if (!data) return [];
    searchBoxAvailable = true;

    const features = Array.isArray(data.features) ? data.features : [];
    return features
      .map((f) => featureToSuggestion(f, { source: 'mapbox' }))
      .filter(Boolean);
  } catch (err) {
    warnOnce(`forward 실패: ${err?.message || err}`);
    return [];
  }
}

/**
 * Interactive suggest — coords 없음. retrieve 필요.
 * @param {string} query
 * @param {{ limit?: number, sessionToken?: string, proximity?: [number, number], language?: string }} [opts]
 */
export async function searchBoxSuggest(query, opts = {}) {
  if (!MAPBOX_TOKEN || searchBoxAvailable === false) {
    return { suggestions: [], sessionToken: null };
  }
  const q = String(query || '').trim();
  if (!q) return { suggestions: [], sessionToken: null };

  const sessionToken = opts.sessionToken || newSessionToken();

  try {
    const params = new URLSearchParams({
      q,
      access_token: MAPBOX_TOKEN,
      session_token: sessionToken,
      language: opts.language || 'ko',
      limit: String(opts.limit ?? 8),
      types: opts.types || 'place,city,poi',
    });
    if (Array.isArray(opts.proximity) && opts.proximity.length === 2) {
      params.set('proximity', `${opts.proximity[0]},${opts.proximity[1]}`);
    }

    const response = await fetch(`${SEARCHBOX_BASE}/suggest?${params}`);
    const data = await parseJsonOrNull(response);
    if (!data) return { suggestions: [], sessionToken };

    searchBoxAvailable = true;
    const raw = Array.isArray(data.suggestions) ? data.suggestions : [];
    const suggestions = raw.map((s) => {
      const featureType = String(s.feature_type || '').toLowerCase();
      const isPoi = featureType === 'poi';
      return {
        id: `suggest-${s.mapbox_id}`,
        kind: isPoi ? 'attraction' : featureType === 'place' || featureType === 'city' ? 'city' : 'poi',
        badge: isPoi ? '명소' : featureType === 'place' || featureType === 'city' ? '도시' : '장소',
        name: String(s.name || '').trim(),
        name_en: s.name || '',
        country: s.place_formatted?.split(',').pop()?.trim() || s.full_address || 'Explore',
        country_en: 'Explore',
        mapboxId: s.mapbox_id,
        needsRetrieve: true,
        sessionToken,
        source: 'mapbox',
        uiPlace: true,
        desc: s.full_address || s.place_formatted || s.name,
        lat: null,
        lng: null,
      };
    }).filter((s) => s.name && s.mapboxId);

    return { suggestions, sessionToken };
  } catch (err) {
    warnOnce(`suggest 실패: ${err?.message || err}`);
    return { suggestions: [], sessionToken };
  }
}

/**
 * Suggest 선택 후 좌표·메타 확보.
 * @param {string} mapboxId
 * @param {string} sessionToken
 */
export async function searchBoxRetrieve(mapboxId, sessionToken) {
  if (!MAPBOX_TOKEN || !mapboxId) return null;
  try {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      session_token: sessionToken || newSessionToken(),
      language: 'ko',
    });
    const response = await fetch(
      `${SEARCHBOX_BASE}/retrieve/${encodeURIComponent(mapboxId)}?${params}`,
    );
    const data = await parseJsonOrNull(response);
    const feature = data?.features?.[0];
    return featureToSuggestion(feature, { source: 'mapbox' });
  } catch (err) {
    warnOnce(`retrieve 실패: ${err?.message || err}`);
    return null;
  }
}

/**
 * 도시 좌표 근처 category POI 목록.
 * @param {number} lng
 * @param {number} lat
 * @param {{ categories?: string[], limitPerCategory?: number, language?: string }} [opts]
 */
export async function searchBoxCategoryNear(lng, lat, opts = {}) {
  if (!MAPBOX_TOKEN || searchBoxAvailable === false) return [];
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return [];

  const categories = opts.categories || TOURISM_CATEGORY_IDS.slice(0, 5);
  const limitPer = opts.limitPerCategory ?? 3;
  const out = [];
  const seen = new Set();

  await Promise.all(
    categories.map(async (categoryId) => {
      try {
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          language: opts.language || 'ko',
          limit: String(limitPer),
          proximity: `${lng},${lat}`,
        });
        const response = await fetch(
          `${SEARCHBOX_BASE}/category/${encodeURIComponent(categoryId)}?${params}`,
        );
        const data = await parseJsonOrNull(response);
        if (!data) return;
        searchBoxAvailable = true;
        for (const feature of data.features || []) {
          const suggestion = featureToSuggestion(feature, {
            source: 'mapbox',
            hubId: opts.hubId,
            parentCity: opts.parentCity,
          });
          if (!suggestion) continue;
          const key = suggestion.name.toLowerCase().replace(/\s+/g, '');
          if (seen.has(key)) continue;
          seen.add(key);
          // 도시 중심에서 너무 먼 POI 제외 (~80km)
          const dLat = suggestion.lat - lat;
          const dLng = suggestion.lng - lng;
          const approxKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
          if (approxKm > 80) continue;
          out.push(suggestion);
        }
      } catch {
        // per-category fail: ignore
      }
    }),
  );

  return out;
}

/**
 * 허브 큐레이션 + Mapbox category 보강 (중복 제거, 상한).
 * @param {object} hub
 * @param {{ maxExtra?: number }} [opts]
 */
export async function enrichHubAttractionsFromMapbox(hub, { maxExtra = 6 } = {}) {
  if (!hub || !Number.isFinite(hub.lng) || !Number.isFinite(hub.lat)) return [];
  const curatedNames = new Set(
    (hub.attractions || []).map((a) => String(a.name || '').toLowerCase().replace(/\s+/g, '')),
  );
  curatedNames.add(String(hub.name || '').toLowerCase().replace(/\s+/g, ''));

  const nearby = await searchBoxCategoryNear(hub.lng, hub.lat, {
    hubId: hub.hubId,
    parentCity: hub.name,
    categories: ['tourist_attraction', 'monument', 'museum', 'beach', 'place_of_worship'],
    limitPerCategory: 4,
  });

  const extras = [];
  for (const item of nearby) {
    const key = String(item.name || '').toLowerCase().replace(/\s+/g, '');
    if (!key || curatedNames.has(key)) continue;
    curatedNames.add(key);
    extras.push(item);
    if (extras.length >= maxExtra) break;
  }
  return extras;
}

export function isSearchBoxLikelyAvailable() {
  return Boolean(MAPBOX_TOKEN) && searchBoxAvailable !== false;
}
