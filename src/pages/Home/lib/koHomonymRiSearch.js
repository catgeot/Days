const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;
/** #36: 읍·면·리 · Phase 0 확장: 동(NEED_DISAMBIG). bare는 hub exact 우선·보류 */
const KO_HOMONYM_PLACE_RE = /[읍면리동]$/u;
const KO_RI_TOWNSHIP_RE = /[읍면리]$/u;
const NOMINATIM_UA = 'ProjectDays/1.0 (contact: project.days.dev@gmail.com)';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pickOsmAddr(address, keys) {
  if (!address) return '';
  for (const key of keys) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/** geocoding.buildStayAdminFromOsmAddress와 동일 규칙 — 순환 import 방지용 로컬 */
function buildStayAdminFromOsmAddress(addressKo, addressEn = null) {
  const ko = addressKo || addressEn;
  const en = addressEn || addressKo;
  if (!ko && !en) return null;

  const neighbourhood =
    pickOsmAddr(ko, ['neighbourhood', 'suburb', 'quarter', 'residential']) ||
    pickOsmAddr(en, ['neighbourhood', 'suburb', 'quarter', 'residential']);
  const district =
    pickOsmAddr(ko, ['borough', 'city_district', 'district']) ||
    pickOsmAddr(en, ['borough', 'city_district', 'district']);
  const city =
    pickOsmAddr(ko, ['city', 'town', 'village', 'municipality']) ||
    pickOsmAddr(en, ['city', 'town', 'village', 'municipality']);
  const cityEn = pickOsmAddr(en, ['city', 'town', 'village', 'municipality']);
  const county = pickOsmAddr(ko, ['county']) || pickOsmAddr(en, ['county']);
  const state =
    pickOsmAddr(ko, ['state', 'province', 'region']) ||
    pickOsmAddr(en, ['state', 'province', 'region']);

  if (!neighbourhood && !district && !city && !county && !state) return null;

  return {
    neighbourhood: neighbourhood || '',
    district: district || '',
    city: city || '',
    cityEn: cityEn || '',
    county: county || '',
    state: state || '',
  };
}

function isKoHomonymBaseQuery(query) {
  const q = String(query || '').trim();
  if (!q || q.length < 2 || q.length > 12) return false;
  if (/\s/.test(q)) return false;
  if (!HAS_HANGUL_RE.test(q)) return false;
  return true;
}

/**
 * 국내 단독 「○○리/읍/면/동」검색 — 동명 다후보 대상.
 * bare(무접미사)는 Phase 0에서 보류(hub exact·잡음).
 */
export function isKoHomonymPlaceSearchQuery(query) {
  if (!isKoHomonymBaseQuery(query)) return false;
  return KO_HOMONYM_PLACE_RE.test(String(query).trim());
}

/** #36 회귀 API — 읍·면·리만 (동 제외) */
export function isKoHomonymRiSearchQuery(query) {
  if (!isKoHomonymBaseQuery(query)) return false;
  return KO_RI_TOWNSHIP_RE.test(String(query).trim());
}

/**
 * 상위 행정 라벨 — 군 우선, 없으면 시·광역시.
 * 예: 평창군 · 천안시 · 대전광역시
 */
export function formatKoHomonymRiRegionLabel(address = {}, stayAdmin = null) {
  const county = String(stayAdmin?.county || address?.county || '').trim();
  const city = String(
    stayAdmin?.city || address?.city || address?.town || address?.municipality || '',
  ).trim();
  if (/군$/.test(county)) return county;
  if (/(시|광역시|특별시|특별자치시)$/.test(city)) return city;
  if (/(시|광역시|특별시|특별자치시)$/.test(county)) return county;
  if (/[읍면]$/.test(city) && county) return county;
  return city || county || '';
}

export const formatKoHomonymPlaceRegionLabel = formatKoHomonymRiRegionLabel;

function normalizeRegionKey(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * Nominatim rows → 지역 명시 선택 카드 후보.
 * 동일 지명·서로 다른 시·군만 남김.
 */
export function buildKoHomonymRiCandidatesFromRows(query, rows) {
  const q = String(query || '').trim();
  if (!q || !Array.isArray(rows) || !rows.length) return [];

  const seen = new Set();
  const out = [];

  for (const row of rows) {
    const address = row?.address && typeof row.address === 'object' ? row.address : {};
    const cc = String(address.country_code || '').toLowerCase();
    if (cc && cc !== 'kr') continue;

    const stayAdmin = buildStayAdminFromOsmAddress(address, address);
    const region = formatKoHomonymRiRegionLabel(address, stayAdmin);
    if (!region) continue;

    const regionKey = normalizeRegionKey(region);
    if (!regionKey || seen.has(regionKey)) continue;
    seen.add(regionKey);

    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const baseName =
      String(row.name || '').trim() ||
      String(
        address.village ||
          address.hamlet ||
          address.suburb ||
          address.neighbourhood ||
          address.quarter ||
          q,
      ).trim() ||
      q;
    const labeled = `${baseName} · ${region}`;
    const state = String(stayAdmin?.state || address.state || '').trim();

    out.push({
      id: `ko-homonym-${regionKey}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      kind: 'city',
      badge: '동네',
      name: labeled,
      name_en: labeled,
      name_ko: baseName,
      parentCity: region,
      country: '한국',
      country_en: 'South Korea',
      lat,
      lng,
      source: 'nominatim-homonym',
      uiPlace: true,
      originalQuery: q,
      stayAdmin: stayAdmin || undefined,
      desc: state ? `${labeled} · ${state}` : labeled,
      display_name: String(row.display_name || labeled),
    });
  }

  return out;
}

export const buildKoHomonymPlaceCandidatesFromRows = buildKoHomonymRiCandidatesFromRows;

async function fetchNominatimKoRiRows(searchQuery, attempt = 1) {
  const params = new URLSearchParams({
    format: 'json',
    q: searchQuery,
    limit: '8',
    addressdetails: '1',
    countrycodes: 'kr',
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': NOMINATIM_UA,
          'Accept-Language': 'ko,en',
        },
      },
    );

    if (!response.ok) {
      if (attempt < 3) {
        await delay(400 * attempt);
        return fetchNominatimKoRiRows(searchQuery, attempt + 1);
      }
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    if (attempt < 3) {
      await delay(400 * attempt);
      return fetchNominatimKoRiRows(searchQuery, attempt + 1);
    }
    return [];
  }
}

/**
 * 동명 리/읍/면/동 → 지역 라벨 후보.
 * ≥2이면 선택 카드, 1이면 단일, 0이면 빈 배열(일반 geocode 폴백).
 */
export async function collectKoHomonymPlaceCandidates(query) {
  if (!isKoHomonymPlaceSearchQuery(query)) return [];
  const q = String(query).trim();
  const rows = await fetchNominatimKoRiRows(q);
  return buildKoHomonymRiCandidatesFromRows(q, rows);
}

/** #36 회귀 — 읍·면·리만 (동 쿼리는 place collector 사용) */
export async function collectKoHomonymRiCandidates(query) {
  if (!isKoHomonymRiSearchQuery(query)) return [];
  const q = String(query).trim();
  const rows = await fetchNominatimKoRiRows(q);
  return buildKoHomonymRiCandidatesFromRows(q, rows);
}
