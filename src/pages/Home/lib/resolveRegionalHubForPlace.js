import {
  listCityAttractionHubs,
  resolveCityAttractionHub,
  resolveHubPlaceFromSlug,
} from './cityAttractionHubs.js';
import { matchKoreaAdminRegionFromAddr, stripKoreaAdminSuffix } from './koreaAdminRegionMatch.js';
import { extractTourAttractionSigungu } from './koreaTourAttractionLocality.js';
import { detectSidoFromAddr, normalizeTourApiSidoAreaCode, SIDO_ADDR_HINTS } from '../../Korea/koreaAreaFilter.js';
import { scenicAreaCodeForHubId } from './koreaTourAttractionMap.js';
import { resolveTourAreaForHub } from './koreaSigunguByHub.js';

const KOREA_COUNTRY = new Set(['대한민국', '한국', 'south korea', 'korea', 'kr']);
/** 동명 시군구는 허브 중심에서 이 거리 밖이면 다른 시도다. */
const HOMONYM_MAX_KM = 120;
const SIDO_HINT_SET = new Set(Object.values(SIDO_ADDR_HINTS).flat());

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lastToken(raw) {
  const parts = String(raw || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

/** 시군구 표기 → 색인 키. 「중구」는 축약하면 한 글자라 원형을 유지한다. */
export function sigunguLabelKeys(raw) {
  const token = lastToken(raw);
  if (!token || !/[가-힣]/u.test(token)) return [];
  const keys = [];
  const stripped = stripKoreaAdminSuffix(token);
  if (stripped.length >= 2) keys.push(stripped);
  if (token.length >= 2 && token !== stripped) keys.push(token);
  return keys;
}

function hubSidoCode(hub) {
  const id = String(hub?.hubId || '').trim().toLowerCase();
  const fromTable = scenicAreaCodeForHubId(id) || resolveTourAreaForHub(id)?.areaCode || '';
  if (fromTable) return normalizeTourApiSidoAreaCode(fromTable);
  const text = [hub?.name, ...(hub?.aliases || [])]
    .map((part) => String(part || '').trim())
    .filter((part) => /[가-힣]/u.test(part))
    .join(' ');
  return detectSidoFromAddr(text) || '';
}

function buildHomonymIndex() {
  /** @type {Map<string, object[]>} */
  const map = new Map();
  for (const hub of listCityAttractionHubs()) {
    const own = new Set(sigunguLabelKeys(hub?.name));
    const labels = new Set(own);
    for (const raw of hub?.aliases || []) {
      for (const key of sigunguLabelKeys(raw)) {
        if (SIDO_HINT_SET.has(key) && !own.has(key)) continue;
        labels.add(key);
      }
    }
    for (const key of labels) {
      const list = map.get(key) || [];
      if (!list.some((row) => row.hubId === hub.hubId)) list.push(hub);
      map.set(key, list);
    }
  }
  return map;
}

const HOMONYM_INDEX = buildHomonymIndex();

function placeCoords(loc) {
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function placeSidoCode(loc) {
  const raw = loc?.areaCode ?? loc?.areacode;
  if (raw != null && String(raw).trim() !== '') {
    const code = normalizeTourApiSidoAreaCode(raw);
    if (code) return code;
  }
  const addr = [loc?.addr1, loc?.address, loc?.place_formatted]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
  return detectSidoFromAddr(addr) || '';
}

function placeSigunguKeys(loc) {
  const keys = new Set();
  for (const raw of [loc?.parentCity, extractTourAttractionSigungu(loc?.addr1, loc?.addr2)]) {
    for (const key of sigunguLabelKeys(raw)) keys.add(key);
  }
  if (!keys.size) {
    for (const key of sigunguLabelKeys(loc?.name || loc?.name_ko)) keys.add(key);
  }
  return [...keys];
}

function hubsForKeys(keys) {
  const out = [];
  const seen = new Set();
  for (const key of keys) {
    for (const hub of HOMONYM_INDEX.get(key) || []) {
      const id = String(hub.hubId || '').toLowerCase();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(hub);
    }
  }
  return out;
}

function hubDistanceKm(hub, coords) {
  if (!coords) return Infinity;
  const lat = Number(hub?.lat);
  const lng = Number(hub?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Infinity;
  return haversineKm(coords.lat, coords.lng, lat, lng);
}

function isDomesticPlace(loc) {
  const country = String(loc?.country || loc?.country_en || '')
    .trim()
    .toLowerCase();
  if (country && !KOREA_COUNTRY.has(country)) return false;
  return true;
}

/**
 * 같은 시군구 이름의 허브가 여러 시도에 있으면 areaCode·주소 시도·좌표로 가른다.
 * 시도가 어긋나면 이름만 맞는 허브(강원 고성, 서울 중구)를 쓰지 않는다.
 *
 * @param {object | null | undefined} loc
 * @returns {string}
 */
export function resolveRegionalHubIdForPlace(loc) {
  if (!loc || typeof loc !== 'object') return '';
  if (!isDomesticPlace(loc)) return '';

  const sido = placeSidoCode(loc);
  const coords = placeCoords(loc);
  const keys = placeSigunguKeys(loc);
  const homonyms = hubsForKeys(keys);

  const slug = String(loc.slug || loc.canonical_slug || '').trim().toLowerCase();
  const slugHubId = slug ? String(resolveHubPlaceFromSlug(slug)?.hubId || '').toLowerCase() : '';
  if (slugHubId && !hubContradicts(slugHubId, sido, coords, homonyms, keys)) return slugHubId;

  const picked = pickHomonymHub(homonyms, sido, coords, keys);
  if (picked) return picked;

  const admin = matchKoreaAdminRegionFromAddr(loc.addr1 || loc.address);
  if (admin?.hubId && !hubContradicts(admin.hubId, sido, coords, homonyms, keys)) {
    return String(admin.hubId).toLowerCase();
  }

  const explicit = String(loc.hubId || '').trim().toLowerCase();
  if (explicit && resolveCityAttractionHub(explicit) && !hubContradicts(explicit, sido, coords, homonyms, keys)) {
    return explicit;
  }

  return '';
}

function keysLookLikeDistrict(keys) {
  return (keys || []).some((key) => String(key || '').endsWith('구'));
}

function hubContradicts(hubId, sido, coords, homonyms, keys) {
  const hub = resolveCityAttractionHub(hubId);
  if (!hub) return true;
  const area = hubSidoCode(hub);
  if (sido && area && area !== sido) return true;
  if (!coords) return false;
  const km = hubDistanceKm(hub, coords);
  if (!Number.isFinite(km) || km <= HOMONYM_MAX_KM) return false;
  const closer = (homonyms || []).some((other) => {
    if (String(other.hubId).toLowerCase() === String(hubId).toLowerCase()) return false;
    return hubDistanceKm(other, coords) + 30 < km;
  });
  if (closer) return true;
  return keysLookLikeDistrict(keys) || keysLookLikeDistrict(sigunguLabelKeys(hub.name));
}

function pickHomonymHub(homonyms, sido, coords, keys) {
  if (!homonyms.length) return '';
  let pool = homonyms.slice();
  if (sido) {
    const known = pool.filter((hub) => hubSidoCode(hub));
    const matched = known.filter((hub) => hubSidoCode(hub) === sido);
    if (matched.length) pool = matched;
    else if (known.length) return '';
  }
  if (pool.length === 1) {
    const only = pool[0];
    const km = coords ? hubDistanceKm(only, coords) : 0;
    if (homonyms.length > 1 && coords && km > HOMONYM_MAX_KM) return '';
    if (coords && keysLookLikeDistrict(keys) && km > HOMONYM_MAX_KM) return '';
    return String(only.hubId).toLowerCase();
  }
  if (!coords) return '';
  const ranked = pool
    .map((hub) => ({ hub, km: hubDistanceKm(hub, coords) }))
    .sort((a, b) => a.km - b.km);
  const best = ranked[0];
  const second = ranked[1];
  if (!best || !Number.isFinite(best.km)) return '';
  if (best.km <= HOMONYM_MAX_KM || (second && best.km + 30 < second.km)) {
    return String(best.hub.hubId).toLowerCase();
  }
  return '';
}
