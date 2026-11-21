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

/** 유네스코 한국의 서원. 이 순서 그대로 유형 검색 맨 앞. */
const UNESCO_KOREA_SEOWON = [
  '소수서원',
  '남계서원',
  '옥산서원',
  '도산서원',
  '필암서원',
  '도동서원',
  '병산서원',
  '무성서원',
  '돈암서원',
];

function seowonAcademyIdentity(name) {
  const t = compactKey(name);
  for (const key of UNESCO_KOREA_SEOWON) {
    const idx = t.indexOf(key);
    if (idx < 0) continue;
    const after = t.slice(idx + key.length);
    if (!after || /^\([^)]*\)$/u.test(after) || /^\[유네스코세계(?:문화)?유산\]$/u.test(after)) {
      return key;
    }
  }
  return t;
}

function seowonRankIndex(name) {
  const idx = UNESCO_KOREA_SEOWON.indexOf(seowonAcademyIdentity(name));
  return idx >= 0 ? idx : UNESCO_KOREA_SEOWON.length;
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

  const seowonRank = parsed.type === '서원' && parsed.isTypeOnly;
  const seen = new Set();
  const out = [];
  const push = (item) => {
    if (!item?.name) return;
    const k = seowonRank ? seowonAcademyIdentity(item.name) : compactKey(item.name);
    if (!k || seen.has(k)) return;
    seen.add(k);
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
      fetchAll: seowonRank,
    });
  }

  for (const row of rows || []) {
    if (!rowMatchesParsedPoi(row, parsed)) continue;
    push(tourAttractionToPoiSuggestion(row));
  }

  out.sort((a, b) => {
    if (seowonRank) {
      const ds = seowonRankIndex(a.name) - seowonRankIndex(b.name);
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
