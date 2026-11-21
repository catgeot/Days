/**
 * 향교·서원 등 — 허브 큐레이션 + TourAPI title 다후보.
 * 도시 exact 스냅보다 앞.
 */
import {
  attractionToSuggestion,
  listCityAttractionHubs,
  placeUrlSlug,
  resolveCityAttractionHub,
} from './cityAttractionHubs.js';
import { resolveKoreaTourContentId } from './koreaTourAttractions.js';
import { isHiddenHubScenicAttraction } from './koreaScenicSpotVisibility.js';
import {
  parseKoreaPoiTypeQuery,
  shouldExpandKoreaPoiTypeSearch,
  titleMatchesPoiType,
  titleMatchesSeowonAcademy,
} from './koreaPoiTypeQuery.js';
import { extractTourAttractionSigungu } from './koreaTourAttractionLocality.js';
import { resolveCityAttractionHubFromTourAddr } from './resolveCityAttractionHubFromTourAddr.js';
import { isExploreRestaurantItem } from '../../../shared/search/tourRestaurantDetect.js';
import { tourRestaurantToExploreSuggestion } from './tourRestaurantExploreSuggestion.js';

function compactKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function hubMatchesCityPrefix(hub, cityPrefix) {
  const prefix = compactKey(cityPrefix);
  if (!prefix) return true;
  const keys = [hub.name, hub.name_en, hub.hubId, ...(hub.aliases || [])].map(compactKey);
  return keys.some((k) => {
    if (!k) return false;
    if (k === prefix) return true;
    if (k === `${prefix}시` || k === `${prefix}군` || k === `${prefix}구`) return true;
    return k.replace(/(시|군|구)$/u, '') === prefix;
  });
}

function collectHubPoiTypeSuggestions(parsed) {
  const out = [];
  for (const hub of listCityAttractionHubs()) {
    if (parsed.cityPrefix && !hubMatchesCityPrefix(hub, parsed.cityPrefix)) continue;
    for (const attraction of hub.attractions || []) {
      if (isHiddenHubScenicAttraction(hub.hubId, attraction.name)) continue;
      const names = [attraction.name, attraction.name_en, ...(attraction.aliases || [])];
      const matchesType =
        parsed.type === '서원'
          ? names.some((n) => titleMatchesSeowonAcademy(n))
          : names.some((n) => titleMatchesPoiType(n, parsed.type));
      if (!matchesType) continue;
      const item = attractionToSuggestion(hub, attraction);
      if (hub.name && !item.groupTitle) {
        item.groupTitle = `${hub.name} 명소`;
      }
      out.push(item);
    }
  }
  return out;
}

function resolveHubFromTourSpot(spot) {
  return resolveCityAttractionHubFromTourAddr(spot?.addr1, spot?.addr2);
}

/**
 * 유네스코 «한국의 서원» 9곳. 이 순서 그대로 유형 검색 맨 앞.
 * lat가 있는 4곳은 tourapi_attraction에 공식 행이 없다.
 * 허브 명소(소수·도산·무성)와 같이 좌표 핀만 두고, 운영 DB는 쓰지 않는다.
 */
const UNESCO_KOREA_SEOWON = [
  { key: '소수서원', hubId: 'yeongju', regions: ['영주'] },
  { key: '남계서원', hubId: 'hamyang', regions: ['함양'] },
  {
    key: '옥산서원',
    hubId: 'gyeongju',
    regions: ['경주'],
    nameEn: 'Oksan Seowon',
    lat: 36.0117011,
    lng: 129.1633833,
    addr: '경상북도 경주시 안강읍',
  },
  { key: '도산서원', hubId: 'andong', regions: ['안동'] },
  {
    key: '필암서원',
    hubId: 'jangseong',
    regions: ['장성'],
    nameEn: 'Piram Seowon',
    lat: 35.310604,
    lng: 126.7516729,
    addr: '전라남도 장성군 황룡면',
  },
  {
    key: '도동서원',
    hubId: 'dalseong',
    regions: ['달성'],
    nameEn: 'Dodong Seowon',
    lat: 35.7009217,
    lng: 128.3719049,
    addr: '대구광역시 달성군 현풍읍 구지서로',
  },
  { key: '병산서원', hubId: 'andong', regions: ['안동'] },
  { key: '무성서원', hubId: 'jeongeup', regions: ['정읍'] },
  {
    key: '돈암서원',
    hubId: 'nonsan',
    regions: ['논산'],
    nameEn: 'Donam Seowon',
    lat: 36.2090961,
    lng: 127.180548,
    addr: '충청남도 논산시 연산면',
  },
];

function academyCoreName(name) {
  return compactKey(name)
    .replace(/\[유네스코세계(?:문화)?유산\]$/u, '')
    .replace(/\([^)]*\)$/u, '');
}

function seowonRegionBlob(item) {
  return compactKey(
    [item?.name, item?.addr1, item?.addr2, item?.parentCity, item?.groupTitle, item?.desc]
      .filter(Boolean)
      .join(' '),
  );
}

function matchingUnescoSeowon(item) {
  const core = academyCoreName(item?.name);
  return UNESCO_KOREA_SEOWON.find((rule) => rule.key === core) || null;
}

function isCanonicalUnescoSeowon(item, rule = matchingUnescoSeowon(item)) {
  if (!rule || academyCoreName(item?.name) !== rule.key) return false;
  if (item?.hubId && item.hubId === rule.hubId) return true;
  const blob = seowonRegionBlob(item);
  return rule.regions.some((region) => blob.includes(compactKey(region)));
}

function seowonRankIndex(item) {
  const rule = matchingUnescoSeowon(item);
  if (rule && isCanonicalUnescoSeowon(item, rule)) return UNESCO_KOREA_SEOWON.indexOf(rule);
  return UNESCO_KOREA_SEOWON.length;
}

function distanceMeters(a, b) {
  const lat1 = Number(a?.lat);
  const lng1 = Number(a?.lng);
  const lat2 = Number(b?.lat);
  const lng2 = Number(b?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return Infinity;
  const dy = (lat1 - lat2) * 111_320;
  const dx = (lng1 - lng2) * 111_320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

/** 같은 서원(유네스코 행·허브·괄호 표기)만 합친다. 하동 옥산·김천 도동은 남긴다. */
function sameSeowonPlace(a, b) {
  const core = academyCoreName(a?.name);
  if (!core || core !== academyCoreName(b?.name)) return false;
  const rule = UNESCO_KOREA_SEOWON.find((row) => row.key === core);
  if (rule && isCanonicalUnescoSeowon(a, rule) && isCanonicalUnescoSeowon(b, rule)) return true;
  return distanceMeters(a, b) <= 2500;
}

function shortSeowonRegion(item) {
  const city = String(item?.parentCity || '').trim();
  const sigungu = city || extractTourAttractionSigungu(item?.addr1, item?.addr2);
  return String(sigungu || '').replace(/(특별자치시|광역시|특별시|자치시|시|군|구)$/u, '');
}

function disambiguateHomonymSeowonNames(items) {
  const groups = new Map();
  for (const item of items) {
    const core = academyCoreName(item?.name);
    if (!core) continue;
    const list = groups.get(core) || [];
    list.push(item);
    groups.set(core, list);
  }
  for (const [core, group] of groups) {
    if (group.length < 2) continue;
    const rule = UNESCO_KOREA_SEOWON.find((row) => row.key === core);
    for (const item of group) {
      if (rule && isCanonicalUnescoSeowon(item, rule)) continue;
      if (/\([^)]*\)/.test(String(item.name || ''))) continue;
      const region = shortSeowonRegion(item);
      if (!region || compactKey(item.name).includes(compactKey(region))) continue;
      item.name = `${core}(${region})`;
    }
  }
}

function unescoSeowonSuggestion(rule) {
  const hub = resolveCityAttractionHub(rule.hubId);
  if (!hub || !Number.isFinite(rule.lat) || !Number.isFinite(rule.lng)) return null;
  const item = attractionToSuggestion(hub, {
    name: rule.key,
    name_en: rule.nameEn || rule.key,
    kind: 'landmark',
    lat: rule.lat,
    lng: rule.lng,
  });
  if (rule.addr) {
    item.addr1 = rule.addr;
    item.desc = rule.addr;
  }
  if (!item.groupTitle) item.groupTitle = `${hub.name} 명소`;
  return item;
}

export function isUnescoKoreaSeowonQuery(query) {
  const key = compactKey(query);
  return UNESCO_KOREA_SEOWON.some((rule) => rule.key === key);
}

export function tourAttractionToPoiSuggestion(spot, opts = {}) {
  if (isExploreRestaurantItem(spot)) {
    return tourRestaurantToExploreSuggestion(spot, opts);
  }
  const lat = Number(spot?.lat);
  const lng = Number(spot?.lng);
  const name = String(spot?.name || spot?.title || '').trim();
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const hub = resolveHubFromTourSpot(spot);
  const sigungu = extractTourAttractionSigungu(spot.addr1, spot.addr2);
  const parentCity =
    hub?.name ||
    String(sigungu || '')
      .replace(/(시|군|구)$/u, '')
      .trim() ||
    String(spot.locality || '').split(/\s+/)[0] ||
    '';
  const thumb = String(spot.firstImage || spot.imageUrl || '').trim() || null;
  const contentId = resolveKoreaTourContentId(spot.contentId || spot.id || '');
  const tourSlug = contentId ? `tour-${contentId}` : '';
  const groupTitle = parentCity ? `${parentCity} 명소` : '';
  return {
    id: `tour-attr-${contentId || `${lat}-${lng}`}`,
    kind: 'attraction',
    badge: '명소',
    name,
    name_en: String(spot.attractionNameEn || spot.name_en || '').trim() || name,
    country: '대한민국',
    country_en: 'South Korea',
    lat,
    lng,
    slug: tourSlug || placeUrlSlug(spot.attractionNameEn || name, name),
    ...(tourSlug ? { canonical_slug: tourSlug } : {}),
    hubId: hub?.hubId || undefined,
    source: 'tourapi',
    uiPlace: true,
    parentCity: parentCity || undefined,
    ...(spot?.addr1 ? { addr1: String(spot.addr1) } : {}),
    ...(spot?.addr2 ? { addr2: String(spot.addr2) } : {}),
    ...(spot?.areaCode != null && String(spot.areaCode).trim() !== ''
      ? { areaCode: String(spot.areaCode) }
      : {}),
    ...(contentId ? { contentId } : {}),
    ...(thumb ? { firstImage: thumb, imageUrl: thumb, thumbUrl: thumb } : {}),
    ...(groupTitle ? { groupTitle } : {}),
    desc: String(spot.blurb || spot.addr1 || '').trim() || undefined,
  };
}

function rowTitleMatchesParsedType(title, type) {
  if (type === '서원') return titleMatchesSeowonAcademy(title);
  return titleMatchesPoiType(title, type);
}

function rowMatchesParsedPoi(spot, parsed) {
  if (!rowTitleMatchesParsedType(spot?.name || spot?.title, parsed.type)) return false;
  if (!parsed.cityPrefix) return true;
  const prefix = parsed.cityPrefix;
  const title = compactKey(spot?.name || spot?.title);
  const addr = compactKey(spot?.addr1);
  return title.includes(prefix) || addr.includes(prefix);
}

/**
 * @param {string} query
 * @param {{ lookupTourAttractions?: (parsed: object) => Promise<object[]> }} [opts]
 */
export async function collectKoreaPoiTypeSearchCandidates(query, opts = {}) {
  const parsed = parseKoreaPoiTypeQuery(query);
  if (!shouldExpandKoreaPoiTypeSearch(parsed)) return [];

  const seowonRank = parsed.type === '서원' && (parsed.isTypeOnly || isUnescoKoreaSeowonQuery(query));
  const seen = new Set();
  const out = [];
  const push = (item) => {
    if (!item?.name) return;
    if (!seowonRank) {
      const k = compactKey(item.name);
      if (!k || seen.has(k)) return;
      seen.add(k);
      out.push(item);
      return;
    }
    const idx = out.findIndex((row) => sameSeowonPlace(row, item));
    if (idx >= 0) {
      if (seowonRankIndex(item) < seowonRankIndex(out[idx])) out[idx] = item;
      return;
    }
    out.push(item);
  };

  for (const item of collectHubPoiTypeSuggestions(parsed)) push(item);

  let rows = [];
  if (typeof opts.lookupTourAttractions === 'function') {
    rows = await opts.lookupTourAttractions(parsed);
  } else {
    const { lookupKoreaTourAttractionsMatchingTitle } = await import('./koreaTourAttractions.js');
    const title = parsed.isTypeOnly ? parsed.type : `${parsed.cityPrefix}${parsed.type}`;
    rows = await lookupKoreaTourAttractionsMatchingTitle(title, {
      limit: parsed.isTypeOnly ? 250 : 24,
      fetchAll: parsed.type === '서원' && parsed.isTypeOnly,
    });
  }

  for (const row of rows || []) {
    if (!rowMatchesParsedPoi(row, parsed)) continue;
    push(tourAttractionToPoiSuggestion(row));
  }

  if (seowonRank) {
    const pins = parsed.isTypeOnly
      ? UNESCO_KOREA_SEOWON
      : UNESCO_KOREA_SEOWON.filter((rule) => rule.key === compactKey(query));
    for (const rule of pins) {
      if (out.some((item) => isCanonicalUnescoSeowon(item, rule))) continue;
      push(unescoSeowonSuggestion(rule));
    }
    disambiguateHomonymSeowonNames(out);
  }

  out.sort((a, b) => {
    if (seowonRank) {
      const ds = seowonRankIndex(a) - seowonRankIndex(b);
      if (ds) return ds;
    }
    const g = String(a.groupTitle || a.parentCity || '').localeCompare(
      String(b.groupTitle || b.parentCity || ''),
      'ko',
    );
    if (g) return g;
    return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
  });

  if (seowonRank) return out;
  return out.slice(0, parsed.isTypeOnly ? 180 : 12);
}

export { parseKoreaPoiTypeQuery, shouldExpandKoreaPoiTypeSearch };
