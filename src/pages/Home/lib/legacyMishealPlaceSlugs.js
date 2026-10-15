/**
 * Nominatim이 한글 명소를 근처 라틴 지명으로 굳힌 공유 URL.
 * slug는 옛 주소를 유지하고, 표시명·좌표는 그 명소다.
 * 흥정계곡 21장(place_id herbnara-farm)은 slug 후보로 그대로 조회된다.
 */
/** Unsplash/Pexels — farm/herb place_id·name_en 오탐 방지 (TourAPI는 place_id herbnara-farm 유지) */
const LEGACY_MISHEAL_GALLERY_QUERIES = {
  'herbnara-farm': {
    primary: 'Heungjeonggyegok valley stream',
    backup: 'Pyeongchang mountain valley creek Korea',
  },
};

const LEGACY_MISHEAL_PLACES = {
  'herbnara-farm': {
    name: '흥정계곡',
    parentCity: '평창',
    lat: 37.6270726091,
    lng: 128.3518474417,
  },
  'woljeong-ri': {
    name: '월정리해변',
    parentCity: '제주시',
    lat: 33.5550461413,
    lng: 126.7982299577,
  },
  'seolma-ri': {
    name: '감악산 운계폭포',
    parentCity: '파주시',
    lat: 37.9118746691,
    lng: 126.9523135563,
  },
};

function compactPlaceSlugKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function buildLegacyMishealPin(placeId, row) {
  const key = String(placeId ?? '').trim().toLowerCase();
  if (!key || !row) return null;
  return {
    id: `legacy-${key}`,
    slug: key,
    canonical_slug: key,
    name: row.name,
    name_ko: row.name,
    lat: row.lat,
    lng: row.lng,
    country: '대한민국',
    country_en: 'South Korea',
    parentCity: row.parentCity,
    type: 'temp-base',
    uiPlace: true,
    poiAttraction: true,
    kind: 'poi',
    badge: '명소',
    source: 'legacy-misheal',
  };
}

/** Latin legacy slug (herbnara-farm) or Korean display slug (/place/흥정계곡). */
export function resolveLegacyMishealPlace(slug) {
  const raw = String(slug ?? '').trim();
  if (!raw) return null;
  const key = raw.toLowerCase();
  const byId = LEGACY_MISHEAL_PLACES[key];
  if (byId) return buildLegacyMishealPin(key, byId);

  const compact = compactPlaceSlugKey(raw);
  for (const [placeId, row] of Object.entries(LEGACY_MISHEAL_PLACES)) {
    if (compact && compactPlaceSlugKey(row.name) === compact) {
      return buildLegacyMishealPin(placeId, row);
    }
  }
  return null;
}

function legacyMishealPlaceIdFromLocation(location) {
  if (!location || typeof location !== 'object') return '';
  const candidates = [
    location.canonical_slug,
    location.slug,
    String(location.id || '')
      .replace(/^legacy-/, '')
      .replace(/^visited-/, ''),
    location.name,
    location.name_ko,
  ]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean);
  for (const raw of candidates) {
    const pin = resolveLegacyMishealPlace(raw);
    if (pin?.slug) return String(pin.slug).toLowerCase();
  }
  return '';
}

/** @returns {{ primary: string, backup?: string } | null} */
export function resolveLegacyMishealGalleryQuery(location) {
  const placeId = legacyMishealPlaceIdFromLocation(location);
  if (!placeId) return null;
  return LEGACY_MISHEAL_GALLERY_QUERIES[placeId] || null;
}

export function isLegacyMishealPlaceStatsId(placeId) {
  const key = String(placeId ?? '').trim().toLowerCase();
  return Boolean(key && LEGACY_MISHEAL_PLACES[key]);
}
