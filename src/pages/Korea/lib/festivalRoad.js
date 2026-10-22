import roadsJson from '../data/koreaFestivalRoads.json' with { type: 'json' };
import { resolveCityAttractionHub } from '../../Home/lib/cityAttractionHubs.js';
import { listsForHub } from '../../Home/lib/koreaLocalScenicLists.js';
import { areaCodeForHubId } from '../koreaHubSeeds.js';
import { matchSigungu, resolveFestivalItemSidoCode } from '../koreaAreaFilter.js';
import { festivalLngLat } from '../koreaFestivalCorridors.js';
import {
  festivalDateSheetWeekRangeFromYmd,
  isYmd,
  seoulTodayYmd,
} from '../festivalDateFilter.js';
import { rangesOverlap } from '../festivalTimeFilter.js';

/** Fixed map slot height. The line is a separate chunk, drawn only with 2+ points. */
export const FESTIVAL_ROAD_MAP_SLOT_PX = 160;

/** Fewer points than this: the slot is not rendered. */
export const FESTIVAL_ROAD_MAP_MIN_POINTS = 2;

const NEARBY_LABEL_LIMIT = 4;

export const FESTIVAL_ROAD_BELTS = Array.isArray(roadsJson?.belts) ? roadsJson.belts : [];

/**
 * @param {object | null | undefined} hub
 * @returns {string[]}
 */
function hubAdminNames(hub) {
  const names = new Set();
  const base = String(hub?.name || '').trim();
  if (base) {
    names.add(`${base}시`);
    names.add(`${base}군`);
  }
  for (const alias of hub?.aliases || []) {
    const text = String(alias || '').trim();
    if (/(?:시|군)$/u.test(text) && text.length >= 3) names.add(text);
  }
  return [...names];
}

/**
 * @param {object} item
 * @param {object} hub
 */
function festivalMatchesHub(item, hub) {
  const addr = String(item?.addr1 || '');
  if (!addr || !hub?.hubId) return false;
  const expectedArea = areaCodeForHubId(hub.hubId);
  const itemArea = resolveFestivalItemSidoCode(item);
  if (expectedArea && itemArea && String(itemArea) !== String(expectedArea)) return false;
  return hubAdminNames(hub).some((name) => matchSigungu(addr, name));
}

/**
 * @param {object} item
 * @param {string[]} names
 */
function longestAdminHit(item, names) {
  const addr = String(item?.addr1 || '');
  let best = 0;
  for (const name of names) {
    if (matchSigungu(addr, name) && name.length > best) best = name.length;
  }
  return best;
}

/**
 * @param {object} item
 * @param {{ hubId: string, hub: object | null }[]} stops
 * @returns {number}
 */
function matchFestivalStopIndex(item, stops) {
  let best = -1;
  let bestLen = 0;
  for (let index = 0; index < stops.length; index += 1) {
    const hub = stops[index]?.hub;
    if (!hub || !festivalMatchesHub(item, hub)) continue;
    const len = longestAdminHit(item, hubAdminNames(hub));
    if (len > bestLen) {
      bestLen = len;
      best = index;
    }
  }
  return best;
}

/**
 * @param {object[]} festivals
 */
function uniqueFestivals(festivals) {
  const seen = new Set();
  const out = [];
  for (const item of festivals || []) {
    if (!item || typeof item !== 'object') continue;
    const id = String(item.contentId || '').trim();
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(item);
  }
  return out;
}

/**
 * @param {object} item
 * @param {{ startYmd?: string, endYmd?: string }} range
 */
function festivalInRoadPeriod(item, range) {
  const start = String(range?.startYmd || '');
  const end = String(range?.endYmd || '');
  if (!isYmd(start) || !isYmd(end)) return false;
  return rangesOverlap(item?.eventStartDate, item?.eventEndDate, start, end);
}

/**
 * @param {object} belt
 */
function resolvedStops(belt) {
  const stops = Array.isArray(belt?.stops) ? belt.stops : [];
  return stops.map((hubId) => {
    const id = String(hubId || '').trim();
    return { hubId: id, hub: id ? resolveCityAttractionHub(id) : null };
  });
}

/**
 * First pilot belt that contains the festival's region.
 * 원주 sits on two belts — the earlier belt in the pilot list wins.
 * @param {object | null | undefined} item
 * @param {object[]} [belts]
 */
export function beltForFestival(item, belts = FESTIVAL_ROAD_BELTS) {
  if (!item) return null;
  for (const belt of belts || []) {
    const index = matchFestivalStopIndex(item, resolvedStops(belt));
    if (index >= 0) return belt;
  }
  return null;
}

/**
 * Numbered stops in belt order. Empty stops stay. Out-of-period festivals stay, marked dim.
 * @param {object | null | undefined} belt
 * @param {object[]} festivals
 * @param {{ startYmd?: string, endYmd?: string }} [range]
 * @returns {{
 *   stopIndex: number,
 *   hubId: string,
 *   label: string,
 *   nextLabel: string | null,
 *   items: { item: object, inPeriod: boolean }[],
 *   empty: boolean,
 * }[]}
 */
export function groupFestivalsForBelt(belt, festivals, range = {}) {
  const stops = resolvedStops(belt);
  /** @type {{ item: object, inPeriod: boolean }[][]} */
  const buckets = stops.map(() => []);
  for (const item of uniqueFestivals(festivals)) {
    const index = matchFestivalStopIndex(item, stops);
    if (index < 0) continue;
    buckets[index].push({ item, inPeriod: festivalInRoadPeriod(item, range) });
  }
  return stops.map((stop, index) => {
    const items = buckets[index];
    const next = stops[index + 1];
    return {
      stopIndex: index + 1,
      hubId: stop.hubId,
      label: String(stop.hub?.name || stop.hubId),
      nextLabel: next ? String(next.hub?.name || next.hubId) : null,
      items,
      empty: !items.some((row) => row.inPeriod),
    };
  });
}

/**
 * @param {number} weeksAhead 0 = 이번주, 1 = 다음주
 * @param {Date} [now]
 */
export function festivalRoadPeriodRange(weeksAhead, now = new Date()) {
  const today = seoulTodayYmd(now);
  const { startYmd, endYmd } = festivalDateSheetWeekRangeFromYmd(weeksAhead, today);
  return { startYmd, endYmd };
}

/**
 * @param {{ empty?: boolean }[]} legs
 */
export function festivalRoadAllEmpty(legs) {
  return Array.isArray(legs) && legs.length > 0 && legs.every((leg) => leg.empty);
}

/**
 * Month/day of a festival start, for an out-of-period row. Null when the date is missing.
 * @param {object | null | undefined} item
 * @returns {{ month: number, day: number } | null}
 */
export function festivalRoadStartMonthDay(item) {
  const ymd = String(item?.eventStartDate || '');
  if (!isYmd(ymd)) return null;
  return {
    month: Number(ymd.slice(4, 6)),
    day: Number(ymd.slice(6, 8)),
  };
}

/**
 * Local scenic sights for a gray stop. contentId opens place detail; lat/lng is the map fallback.
 * @param {string} hubId
 * @param {number} [limit]
 */
export function beltStopNearbySights(hubId, limit = NEARBY_LABEL_LIMIT) {
  const cap = Math.max(0, Number(limit) || 0);
  const id = String(hubId || '').trim();
  /** @type {{ name: string, hubId: string, listId: string, contentId: string, lat: number | null, lng: number | null }[]} */
  const sights = [];
  const seen = new Set();
  for (const list of listsForHub(id)) {
    for (const member of list?.members || []) {
      const name = String(member?.attractionName || '').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const lat = Number(member?.lat);
      const lng = Number(member?.lng);
      sights.push({
        name,
        hubId: id,
        listId: String(list?.listId || ''),
        contentId: String(member?.contentId || '').trim(),
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      });
      if (sights.length >= cap) return sights;
    }
  }
  return sights;
}

/**
 * Local scenic names already used as 주변 볼거리. No extra empty row when none exist.
 * @param {string} hubId
 * @param {number} [limit]
 * @returns {string[]}
 */
export function beltStopNearbyLabels(hubId, limit = NEARBY_LABEL_LIMIT) {
  return beltStopNearbySights(hubId, limit).map((sight) => sight.name);
}

/**
 * Map link when a sight has no place detail id.
 * @param {{ name?: string, lat?: number | null, lng?: number | null }} sight
 * @returns {string}
 */
export function festivalRoadNearbyMapHref(sight) {
  const lat = Number(sight?.lat);
  const lng = Number(sight?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  const name = String(sight?.name || '').trim();
  if (!name) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

/**
 * Gray stop: nearby sights only. No sights: 가는 법 only when a festival exists. No blank slot.
 * @param {{ empty?: boolean, items?: { item: object, inPeriod: boolean }[] } | null | undefined} leg
 * @param {string[]} nearbyLabels
 */
export function festivalRoadFill(leg, nearbyLabels) {
  const labels = (Array.isArray(nearbyLabels) ? nearbyLabels : []).filter(Boolean);
  if (!leg) {
    return { showNearby: false, showAccess: false, accessItem: null, nearbyLabels: [] };
  }
  const inPeriod = (leg.items || []).find((row) => row.inPeriod)?.item || null;
  const anyItem = leg.items?.[0]?.item || null;
  if (leg.empty) {
    if (labels.length) {
      return { showNearby: true, showAccess: false, accessItem: null, nearbyLabels: labels };
    }
    return {
      showNearby: false,
      showAccess: Boolean(anyItem),
      accessItem: anyItem,
      nearbyLabels: [],
    };
  }
  return {
    showNearby: labels.length > 0,
    showAccess: Boolean(inPeriod),
    accessItem: inPeriod,
    nearbyLabels: labels,
  };
}

/**
 * @param {object | null | undefined} item
 * @returns {{ lng: number, lat: number } | null}
 */
function festivalItemPoint(item) {
  return festivalLngLat(item?.mapx, item?.mapy);
}

/**
 * First scenic member on this stop that has a Korea coordinate.
 * @param {string} hubId
 * @returns {{ lng: number, lat: number, label: string } | null}
 */
function firstSightPoint(hubId) {
  for (const list of listsForHub(hubId)) {
    for (const member of list?.members || []) {
      const point = festivalLngLat(member?.lng, member?.lat);
      if (!point) continue;
      return { ...point, label: String(member?.attractionName || '').trim() };
    }
  }
  return null;
}

/**
 * Numbered pins in stop order. In-period festival, else any festival, else a sight, else the hub.
 * @param {{ stopIndex?: number, hubId?: string, label?: string, items?: { item: object, inPeriod: boolean }[] }[]} legs
 * @returns {{ stopIndex: number, hubId: string, label: string, kind: 'festival' | 'sight' | 'hub', lng: number, lat: number }[]}
 */
export function festivalRoadMapPoints(legs) {
  /** @type {{ stopIndex: number, hubId: string, label: string, kind: 'festival' | 'sight' | 'hub', lng: number, lat: number }[]} */
  const points = [];
  for (const leg of legs || []) {
    const rows = Array.isArray(leg?.items) ? leg.items : [];
    const inPeriod = rows.find((row) => row?.inPeriod && festivalItemPoint(row.item));
    const anyFestival = rows.find((row) => festivalItemPoint(row?.item));
    const festival = inPeriod || anyFestival;
    const hubId = String(leg?.hubId || '');
    const stopIndex = Number(leg?.stopIndex);
    if (!Number.isFinite(stopIndex)) continue;
    if (festival) {
      const point = festivalItemPoint(festival.item);
      if (!point) continue;
      points.push({
        stopIndex,
        hubId,
        label: String(festival.item?.title || leg?.label || ''),
        kind: 'festival',
        lng: point.lng,
        lat: point.lat,
      });
      continue;
    }
    const sight = firstSightPoint(hubId);
    if (sight) {
      points.push({
        stopIndex,
        hubId,
        label: sight.label || String(leg?.label || ''),
        kind: 'sight',
        lng: sight.lng,
        lat: sight.lat,
      });
      continue;
    }
    const hub = hubId ? resolveCityAttractionHub(hubId) : null;
    const hubPoint = festivalLngLat(hub?.lng, hub?.lat);
    if (!hubPoint) continue;
    points.push({
      stopIndex,
      hubId,
      label: String(leg?.label || hub?.name || hubId),
      kind: 'hub',
      lng: hubPoint.lng,
      lat: hubPoint.lat,
    });
  }
  return points;
}

/**
 * Line vertices sorted along the belt axis (first stop → last) to avoid zigzag chords.
 * Pin markers still use belt stop order via {@link festivalRoadMapPoints}.
 * @param {{ stopIndex: number, lng: number, lat: number }[]} points
 */
export function festivalRoadLineOrder(points) {
  if (!Array.isArray(points) || points.length < 2) return points || [];
  const ordered = [...points].sort((a, b) => a.stopIndex - b.stopIndex);
  if (ordered.length < 3) return ordered;
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const dx = last.lng - first.lng;
  const dy = last.lat - first.lat;
  const denom = dx * dx + dy * dy || 1;
  const projection = (point) =>
    ((point.lng - first.lng) * dx + (point.lat - first.lat) * dy) / denom;
  return [...ordered].sort((a, b) => projection(a) - projection(b));
}
