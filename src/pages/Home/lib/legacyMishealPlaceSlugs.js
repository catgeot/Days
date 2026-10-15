/**
 * Nominatim이 한글 명소를 근처 라틴 지명으로 굳힌 공유 URL.
 * slug는 옛 주소를 유지하고, 표시명·좌표는 그 명소다.
 * 흥정계곡 21장(place_id herbnara-farm)은 slug 후보로 그대로 조회된다.
 */
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
