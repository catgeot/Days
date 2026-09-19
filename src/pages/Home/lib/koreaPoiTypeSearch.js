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
import {
  parseKoreaPoiTypeQuery,
  shouldExpandKoreaPoiTypeSearch,
  titleMatchesPoiType,
} from './koreaPoiTypeQuery.js';
import { extractTourAttractionSigungu } from './koreaTourAttractionLocality.js';

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
      const names = [attraction.name, attraction.name_en, ...(attraction.aliases || [])];
      if (!names.some((n) => titleMatchesPoiType(n, parsed.type))) continue;
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
  const sigungu = extractTourAttractionSigungu(spot.addr1, spot.addr2);
  if (!sigungu) return null;
  return (
    resolveCityAttractionHub(sigungu) ||
    resolveCityAttractionHub(String(sigungu).replace(/(시|군|구)$/u, ''))
  );
}

export function tourAttractionToPoiSuggestion(spot) {
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
  const contentId = String(spot.contentId || '').trim();
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
    slug: placeUrlSlug(spot.attractionNameEn || name, name),
    hubId: hub?.hubId || undefined,
    source: 'tourapi',
    uiPlace: true,
    parentCity: parentCity || undefined,
    ...(contentId ? { contentId } : {}),
    ...(thumb ? { firstImage: thumb, imageUrl: thumb, thumbUrl: thumb } : {}),
    ...(groupTitle ? { groupTitle } : {}),
    desc: String(spot.blurb || spot.addr1 || '').trim() || undefined,
  };
}

function rowMatchesParsedPoi(spot, parsed) {
  if (!titleMatchesPoiType(spot?.name || spot?.title, parsed.type)) return false;
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

  const seen = new Set();
  const out = [];
  const push = (item) => {
    if (!item?.name) return;
    const k = compactKey(item.name);
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
    });
  }

  for (const row of rows || []) {
    if (!rowMatchesParsedPoi(row, parsed)) continue;
    push(tourAttractionToPoiSuggestion(row));
  }

  out.sort((a, b) => {
    const g = String(a.groupTitle || a.parentCity || '').localeCompare(
      String(b.groupTitle || b.parentCity || ''),
      'ko',
    );
    if (g) return g;
    return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
  });

  return out.slice(0, parsed.isTypeOnly ? 180 : 12);
}

export { parseKoreaPoiTypeQuery, shouldExpandKoreaPoiTypeSearch };
