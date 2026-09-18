/**
 * 국내 지명 First-Pass — Mapbox/Nominatim 전에 hub·역 별칭·tourapi_attraction으로 좌표를 확정.
 * 해외 허브·도시 exact·동점 다후보는 고르지 않음.
 */
import {
  attractionToPlacePin,
  listCityAttractionHubs,
  placeUrlSlug,
  resolveCityAttractionHub,
  resolveHubAttraction,
} from './cityAttractionHubs.js';
import { resolveExploreSearchAlias } from './exploreSearchAliases.js';
import { placeNameMatchesSearchQuery } from './searchEnterMatch.js';
import { shouldSkipGeocodeForMood } from './moodSearchIntent.js';
import {
  extractTourAttractionSigungu,
  formatTourAttractionLocality,
} from './koreaTourAttractionLocality.js';
import { resolveKoStationAlias } from '../../../utils/mrtStayQuery.js';

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;
const LODGING_OR_SA_RE = /호텔|콘도|펜션|리조트|휴게소/;
const BARE_ADMIN_RE =
  /^(?:서울|부산|대구|인천|광주|대전|울산|세종|제주|경기|강원|충북|충남|전북|전남|경북|경남)(?:특별시|광역시|특별자치시|특별자치도|도|시)?$/;
const SIDO_RE =
  /서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|세종시|경기도|강원특별자치도|강원도|충청북도|충북|충청남도|충남|전북특별자치도|전라북도|전북|전라남도|전남|경상북도|경북|경상남도|경남|제주특별자치도|제주도/;

const HUB_KIND_TO_CATEGORY = {
  beach: 'NATURE_SCENIC',
  park: 'NATURE_SCENIC',
  viewpoint: 'NATURE_SCENIC',
  temple: 'HISTORY',
  shrine: 'HISTORY',
  museum: 'HISTORY',
  landmark: 'LANDMARK',
  market: 'LANDMARK',
  neighborhood: 'LANDMARK',
};

function compactKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function isKoreaHub(hub) {
  const country = String(hub?.country || '').trim();
  const countryEn = String(hub?.country_en || '')
    .trim()
    .toLowerCase();
  return country === '대한민국' || country === '한국' || countryEn === 'south korea' || countryEn === 'korea';
}

function stayAdminFromHub(hub) {
  const city = String(hub?.name || '').trim();
  if (!city) return null;
  return {
    neighbourhood: '',
    district: '',
    city,
    cityEn: String(hub?.name_en || '').trim(),
    county: city,
    state: '',
  };
}

function stayAdminFromKoreanAddress(addr1, addr2) {
  const raw = [addr1, addr2]
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .join(' ');
  const sigungu = extractTourAttractionSigungu(addr1, addr2);
  const locality = formatTourAttractionLocality(addr1, addr2);
  const neighbourhood =
    locality
      .split(/\s+/)
      .find((tok) => /(?:읍|면|동|가)$/u.test(tok)) || '';
  const sido = raw.match(SIDO_RE)?.[0] || '';
  if (!sigungu && !neighbourhood && !sido) return null;
  return {
    neighbourhood,
    district: '',
    city: sigungu || '',
    cityEn: '',
    county: sigungu || '',
    state: sido,
  };
}

function tourCategoryFromHubKind(kind) {
  return HUB_KIND_TO_CATEGORY[String(kind || '')] || 'LANDMARK';
}

function tourCategoryFromTourCats(cat1, cat2) {
  const major = String(cat1 || '').trim().toUpperCase();
  const mid = String(cat2 || '').trim().toUpperCase();
  if (major === 'A01') return 'NATURE_SCENIC';
  if (mid === 'A0201') return 'HISTORY';
  if (major === 'A02') return 'LANDMARK';
  return 'LANDMARK';
}

function bindCategory(hit, tourCategory) {
  hit.tourCategory = tourCategory;
  hit.placeCategory = tourCategory;
  return hit;
}

function resolveKoreaHubAttractionMatch(query) {
  const exact = resolveHubAttraction(query);
  if (exact && isKoreaHub(exact.hub)) return exact;

  const alias = resolveExploreSearchAlias(query);
  if (alias?.canonical) {
    const via = resolveHubAttraction(alias.canonical);
    if (via && isKoreaHub(via.hub)) return via;
  }

  const compact = compactKey(query);
  if (compact.length < 4) return null;

  const hits = [];
  const seen = new Set();
  for (const hub of listCityAttractionHubs()) {
    if (!isKoreaHub(hub)) continue;
    for (const attraction of hub.attractions || []) {
      if (!placeNameMatchesSearchQuery(query, attraction)) continue;
      const id = `${hub.hubId}:${compactKey(attraction.name)}`;
      if (seen.has(id)) continue;
      seen.add(id);
      hits.push({ hub, attraction });
      if (hits.length > 2) return null;
    }
  }
  if (hits.length === 1) return hits[0];
  if (hits.length === 2 && compactKey(hits[0].attraction.name) === compactKey(hits[1].attraction.name)) {
    return hits[0];
  }
  return null;
}

function hitFromHub(match) {
  const pin = attractionToPlacePin(match.hub, match.attraction);
  const stayAdmin = stayAdminFromHub(match.hub);
  const tourCategory = tourCategoryFromHubKind(match.attraction.kind);
  return bindCategory(
    {
      source: 'hub',
      name: pin.name,
      name_en: pin.name_en,
      lat: pin.lat,
      lng: pin.lng,
      contentId: pin.contentId || null,
      stayAdmin,
      hubId: pin.hubId,
      parentCity: pin.parentCity,
      country: pin.country,
      country_en: pin.country_en,
      uiPlace: pin,
    },
    tourCategory,
  );
}

function hitFromStation(alias) {
  const name = String(alias.station || '').trim();
  const lat = Number(alias.lat);
  const lng = Number(alias.lng);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const stayAdmin = {
    neighbourhood: '',
    district: String(alias.district || '').trim(),
    city: '서울',
    cityEn: 'Seoul',
    county: '',
    state: '서울특별시',
  };
  return bindCategory(
    {
      source: 'station',
      name,
      name_en: 'Jonggak Station',
      lat,
      lng,
      contentId: null,
      stayAdmin,
      hubId: null,
      parentCity: stayAdmin.district || stayAdmin.city,
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: null,
    },
    'STATION',
  );
}

function hitFromTourRow(row) {
  const lat = Number(row?.lat);
  const lng = Number(row?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = String(row?.name || row?.title || '').trim();
  if (!name) return null;
  const stayAdmin = stayAdminFromKoreanAddress(row.addr1, row.addr2);
  const tourCategory = tourCategoryFromTourCats(row.cat1, row.cat2);
  return bindCategory(
    {
      source: 'tourapi',
      name,
      name_en: String(row?.attractionNameEn || '').trim() || name,
      lat,
      lng,
      contentId: String(row.contentId || '').trim() || null,
      stayAdmin,
      hubId: row.hubId || null,
      parentCity: stayAdmin?.city || row.locality || row.areaLabel || '',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: null,
    },
    tourCategory,
  );
}

/**
 * @param {string} query
 */
export function resolveKoreaDestinationFirstPassSync(query) {
  const q = String(query || '').trim();
  if (!q) return null;

  const hubMatch = resolveKoreaHubAttractionMatch(q);
  if (hubMatch) return hitFromHub(hubMatch);

  const station = resolveKoStationAlias(q);
  if (station) return hitFromStation(station);

  return null;
}

function shouldLookupTourapi(query) {
  const q = String(query || '').trim();
  const compact = compactKey(q);
  if (compact.length < 3) return false;
  if (!HAS_HANGUL_RE.test(q)) return false;
  if (shouldSkipGeocodeForMood(q)) return false;
  if (LODGING_OR_SA_RE.test(compact)) return false;
  if (BARE_ADMIN_RE.test(compact)) return false;
  if (resolveCityAttractionHub(q)) return false;
  return true;
}

async function lookupTourAttractionRow(query, lookup) {
  if (typeof lookup === 'function') return lookup(query);
  try {
    const { lookupKoreaTourAttractionFirstPass } = await import('./koreaTourAttractions.js');
    return lookupKoreaTourAttractionFirstPass(query);
  } catch {
    return null;
  }
}

/**
 * @param {string} query
 * @param {{ lookupTourAttraction?: (q: string) => Promise<object | null> }} [opts]
 */
export async function resolveKoreaDestinationFirstPass(query, opts = {}) {
  const sync = resolveKoreaDestinationFirstPassSync(query);
  if (sync) return sync;
  if (!shouldLookupTourapi(query)) return null;
  const row = await lookupTourAttractionRow(query, opts.lookupTourAttraction);
  if (!row) return null;
  return hitFromTourRow(row);
}

/**
 * @param {object} hit
 */
export function firstPassHitToGeocodeResult(hit) {
  if (!hit || !Number.isFinite(Number(hit.lat)) || !Number.isFinite(Number(hit.lng))) return null;
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lng),
    name: hit.name,
    name_en: hit.name_en || hit.name,
    country: hit.country || '대한민국',
    country_en: hit.country_en || 'South Korea',
    display_name: [hit.name, hit.parentCity, hit.country].filter(Boolean).join(', '),
    source: 'korea-first-pass',
    firstPassSource: hit.source,
    ...(hit.stayAdmin ? { stayAdmin: hit.stayAdmin } : {}),
    ...(hit.contentId ? { contentId: hit.contentId } : {}),
    ...(hit.tourCategory ? { tourCategory: hit.tourCategory, placeCategory: hit.placeCategory || hit.tourCategory } : {}),
    ...(hit.hubId ? { hubId: hit.hubId } : {}),
    ...(hit.parentCity ? { parentCity: hit.parentCity } : {}),
  };
}

/**
 * @param {object} hit
 * @param {string} [query]
 */
export function firstPassHitToUiPlace(hit, query = '') {
  if (!hit) return null;
  const originalQuery = String(query || '').trim() || hit.name;
  if (hit.source === 'hub' && hit.uiPlace) {
    return {
      ...hit.uiPlace,
      originalQuery,
      ...(hit.stayAdmin ? { stayAdmin: hit.stayAdmin } : {}),
      ...(hit.tourCategory ? { tourCategory: hit.tourCategory, placeCategory: hit.placeCategory || hit.tourCategory } : {}),
    };
  }
  const nameEn = hit.name_en || hit.name;
  return {
    id: `${hit.source || 'first-pass'}-${hit.lat}-${hit.lng}`,
    slug: placeUrlSlug(nameEn, hit.name),
    name: hit.name,
    name_en: nameEn,
    name_ko: hit.name,
    country: hit.country || '대한민국',
    country_en: hit.country_en || 'South Korea',
    lat: hit.lat,
    lng: hit.lng,
    type: 'temp-base',
    uiPlace: true,
    originalQuery,
    desc: hit.parentCity ? `${hit.parentCity} · ${hit.name}` : hit.name,
    ...(hit.stayAdmin ? { stayAdmin: hit.stayAdmin } : {}),
    ...(hit.contentId ? { contentId: hit.contentId } : {}),
    ...(hit.tourCategory ? { tourCategory: hit.tourCategory, placeCategory: hit.placeCategory || hit.tourCategory } : {}),
    ...(hit.hubId ? { hubId: hit.hubId } : {}),
    ...(hit.parentCity ? { parentCity: hit.parentCity } : {}),
  };
}
