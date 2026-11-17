import { resolveCityAttractionHub } from '../../Home/lib/cityAttractionHubs.js';
import { resolveFestivalThemeCrossLinks } from '../../Home/lib/koreaThemeCrossLinks.js';
import { extractTourAttractionSigungu } from '../../Home/lib/koreaTourAttractionLocality.js';
import { stripKoAdminSuffix } from '../../../utils/mrtStayQuery.js';
import { detectSidoCode } from '../festivalRegionTags.js';
import { festivalLngLat } from '../koreaFestivalCorridors.js';
import { areaCodeForHubId } from '../koreaHubSeeds.js';

/** 축제 좌표와 허브 좌표. 이 안이고 행정구역이 같을 때만 링크. */
export const FESTIVAL_CITY_PLACE_MAX_KM = 30;
/**
 * 군은 읍·면 허브와 행사장이 30km를 넘을 수 있다.
 * 평창군 32.7km는 다른 시·도 오탐이 아니라 같은 군 안의 centroid 차이라 50km까지 허용한다.
 * 구·시는 30km를 유지한다.
 */
export const FESTIVAL_CITY_PLACE_SAME_COUNTY_MAX_KM = 50;

const SIDO_QUALIFIERS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '경북',
  '경남',
  '전북',
  '전남',
  '제주',
  '경상남',
  '경상북',
  '전라남',
  '전라북',
  '충청남',
  '충청북',
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function compact(value) {
  return String(value || '').replace(/\s+/g, '');
}

function sigunguCore(token) {
  const raw = String(token || '').trim();
  if (!raw) return '';
  const stripped = stripKoAdminSuffix(raw);
  return stripped || raw;
}

function festivalAdmin(item) {
  const addr = String(item?.addr1 || '').trim();
  return {
    sido: detectSidoCode(addr),
    sigungu: extractTourAttractionSigungu(item?.addr1, item?.addr2),
  };
}

function hubSidoCode(hub) {
  const mapped = areaCodeForHubId(hub?.hubId);
  if (mapped) return String(mapped);
  const pieces = [hub?.name, hub?.name_en, ...(hub?.aliases || [])];
  for (const piece of pieces) {
    const code = detectSidoCode(String(piece || ''));
    if (code) return String(code);
  }
  return '';
}

function aliasHasSigungu(alias, sigungu, core) {
  const text = String(alias || '').trim();
  if (!text) return false;
  if (text === sigungu || text === core) return true;
  const tokens = text.split(/\s+/);
  if (tokens.some((token) => token === sigungu || token === core || sigunguCore(token) === core)) {
    return true;
  }
  const folded = compact(text);
  if (folded === sigungu || folded === core) return true;
  return SIDO_QUALIFIERS.some((prefix) => (
    folded === `${prefix}${sigungu}`
    || folded === `${prefix}${core}`
    || folded === `${sigungu}${prefix}`
    || folded === `${core}${prefix}`
  ));
}

function hubMatchesSigungu(hub, sigungu) {
  const token = String(sigungu || '').trim();
  const core = sigunguCore(token);
  if (!token || !core) return false;
  if (aliasHasSigungu(hub?.name, token, core)) return true;
  const aliases = Array.isArray(hub?.aliases) ? hub.aliases : [];
  return aliases.some((alias) => aliasHasSigungu(alias, token, core));
}

function hubIsSidoCity(hub, sido) {
  const name = String(hub?.name || '').trim();
  if (!name || !sido) return false;
  if (/(?:구|군)$/u.test(name)) return false;
  const fromAddr = detectSidoCode(name) || detectSidoCode(`${name}광역시`) || detectSidoCode(`${name}특별시`);
  if (fromAddr && String(fromAddr) === String(sido)) return true;
  const aliases = Array.isArray(hub?.aliases) ? hub.aliases : [];
  return aliases.some((alias) => {
    const code = detectSidoCode(String(alias || ''));
    if (!code || String(code) !== String(sido)) return false;
    const folded = compact(alias);
    return folded.startsWith(compact(name));
  });
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @param {Record<string, unknown> | null | undefined} hub
 * @returns {{ ok: true, km: number } | { ok: false, reason: string }}
 */
export function festivalCityPlaceHubGate(item, hub) {
  const admin = festivalAdmin(item);
  if (!admin.sido) return { ok: false, reason: 'no-sido' };
  const hubSido = hubSidoCode(hub);
  if (!hubSido || hubSido !== String(admin.sido)) return { ok: false, reason: 'sido-mismatch' };
  const sigunguOk = admin.sigungu
    ? hubMatchesSigungu(hub, admin.sigungu)
    : hubIsSidoCity(hub, admin.sido);
  if (!sigunguOk) return { ok: false, reason: 'sigungu-mismatch' };

  const pt = festivalLngLat(item?.mapx, item?.mapy);
  const lat = Number(hub?.lat);
  const lng = Number(hub?.lng);
  if (!pt || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, reason: 'no-coords' };
  }
  const km = haversineKm(pt.lat, pt.lng, lat, lng);
  const county = /군$/u.test(admin.sigungu);
  const limit = county ? FESTIVAL_CITY_PLACE_SAME_COUNTY_MAX_KM : FESTIVAL_CITY_PLACE_MAX_KM;
  if (!Number.isFinite(km) || km > limit) return { ok: false, reason: 'too-far', km };
  return { ok: true, km };
}

/**
 * First nearby hub that matches the festival's sido+sigungu and the distance cap.
 * A metro fallback in another sido never becomes the link.
 * @param {Record<string, unknown> | null | undefined} festivalCross
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {{ slug: string } | null}
 */
export function festivalCityPlaceFromCross(festivalCross, item) {
  const rows = Array.isArray(festivalCross?.nearbyHubs) ? festivalCross.nearbyHubs : [];
  for (const row of rows) {
    const hubId = String(row?.hubId || '').trim().toLowerCase();
    if (!hubId) continue;
    const hub = resolveCityAttractionHub(hubId);
    const slug = String(hub?.hubId || '').trim().toLowerCase();
    if (!slug) continue;
    const gate = festivalCityPlaceHubGate(item, hub);
    if (!gate.ok) continue;
    return { slug };
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {{ slug: string } | null}
 */
export function resolveFestivalCityPlaceLink(item) {
  if (!item || typeof item !== 'object') return null;
  const cross = resolveFestivalThemeCrossLinks(item, {
    areaCode: item.areaCode ?? item.areacode,
  });
  return festivalCityPlaceFromCross(cross, item);
}

/** @param {string} slug @param {boolean} isEnglish */
export function festivalCityPlaceHref(slug, isEnglish) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return '';
  return isEnglish ? `/place/${key}?lang=en` : `/place/${key}`;
}
