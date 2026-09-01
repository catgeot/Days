import beltsSsot from './data/koreaFestivalBelts.json' with { type: 'json' };
import { listCityAttractionHubs } from '../Home/lib/cityAttractionHubs.js';
import { nearbyHubsForFestival } from './nearbyFestivalHubs.js';

/**
 * @typedef {import('./data/koreaFestivalBelts.json').belts[number]} FestivalBelt
 * @typedef {FestivalBelt['stops'][number]} FestivalBeltStop
 */

/**
 * @typedef {{
 *   stopIndex: number,
 *   hubId: string,
 *   stop: FestivalBeltStop,
 *   nextLabel: string | null,
 *   items: Record<string, unknown>[],
 *   empty: boolean,
 * }} FestivalBeltLeg
 */

/** @returns {Array<{ hubId: string, name: string, lat: number, lng: number }>} */
export function buildFestivalHubList() {
  return listCityAttractionHubs()
    .filter(
      (h) =>
        h?.hubId &&
        Number.isFinite(Number(h.lat)) &&
        Number.isFinite(Number(h.lng)),
    )
    .map((h) => ({
      hubId: String(h.hubId).toLowerCase(),
      name: String(h.name || h.hubId),
      lat: Number(h.lat),
      lng: Number(h.lng),
    }));
}

/**
 * @param {FestivalBelt | null | undefined} belt
 * @param {string} [locale]
 */
export function localizedBeltLabel(belt, locale) {
  if (!belt) return '';
  if (locale === 'en') {
    return String(belt.labelEn || belt.label || belt.id || '').trim();
  }
  return String(belt.label || belt.id || '').trim();
}

/**
 * @param {FestivalBeltLeg[]} legs
 * @param {string} [locale]
 */
export function beltLegsToPanelGroups(legs, locale) {
  return (legs || []).map((leg) => ({
    id: leg.hubId || `stop-${leg.stopIndex}`,
    label:
      locale === 'en'
        ? String(leg.stop?.nameEn || leg.stop?.name || leg.hubId || '').trim()
        : String(leg.stop?.name || leg.hubId || '').trim(),
    items: leg.items || [],
    stopIndex: leg.stopIndex,
    empty: leg.empty,
    nextLabel: leg.nextLabel,
  }));
}

/**
 * @param {FestivalBelt} belt
 * @param {Record<string, unknown>[]} items
 * @param {ReturnType<typeof buildFestivalHubList>} hubList
 * @param {{ maxKm?: number }} [opts]
 */
export function summarizeBeltFestivals(belt, items, hubList, opts = {}) {
  const legs = groupFestivalsForBelt(belt, items, hubList, opts);
  const festivalCount = legs.reduce((n, leg) => n + leg.items.length, 0);
  const activeStopCount = legs.filter((leg) => !leg.empty).length;
  return { legs, festivalCount, activeStopCount };
}

/** @returns {FestivalBelt[]} */
export function getFestivalBelts() {
  const belts = beltsSsot?.belts;
  return Array.isArray(belts) ? belts : [];
}

/**
 * @param {string} id
 * @returns {FestivalBelt | null}
 */
export function getFestivalBeltById(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  return getFestivalBelts().find((belt) => belt.id === key) || null;
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @param {Array<{ hubId: string, name?: string, lat?: number, lng?: number }>} hubList
 * @param {{ maxKm?: number }} [opts]
 * @returns {string | null}
 */
export function primaryHubIdForFestival(item, hubList, opts = {}) {
  const nearby = nearbyHubsForFestival(item, hubList, {
    limit: 1,
    maxKm: opts.maxKm ?? 120,
  });
  const hubId = nearby[0]?.hubId;
  return hubId ? String(hubId).toLowerCase() : null;
}

function compareFestivalsForLeg(a, b) {
  const startA = String(a?.eventStartDate || '');
  const startB = String(b?.eventStartDate || '');
  if (startA !== startB) return startA.localeCompare(startB);
  return String(a?.title || '').localeCompare(String(b?.title || ''), 'ko');
}

/**
 * 벨트 정류장 순서대로 leg[] — 축제는 primary hub가 해당 stop과 일치할 때만 배치.
 * sparse stop(축제 0건)도 빈 leg로 유지해 동선·지역 매칭이 끊기지 않게 함.
 *
 * @param {FestivalBelt | null | undefined} belt
 * @param {Record<string, unknown>[]} items
 * @param {Array<{ hubId: string, name?: string, lat?: number, lng?: number }>} hubList
 * @param {{ maxKm?: number }} [opts]
 * @returns {FestivalBeltLeg[]}
 */
export function groupFestivalsForBelt(belt, items, hubList, opts = {}) {
  const stops = belt?.stops;
  if (!Array.isArray(stops) || !stops.length) return [];

  /** @type {Map<string, FestivalBeltLeg>} */
  const legByHub = new Map();
  /** @type {FestivalBeltLeg[]} */
  const legs = [];

  for (let i = 0; i < stops.length; i += 1) {
    const stop = stops[i];
    const hubId = String(stop.hubId || '').toLowerCase();
    const nextStop = stops[i + 1];
    const nextLabel = nextStop ? String(nextStop.name || nextStop.hubId || '').trim() || null : null;
    const leg = {
      stopIndex: Number.isInteger(stop.stopIndex) ? stop.stopIndex : i,
      hubId,
      stop,
      nextLabel,
      items: [],
      empty: true,
    };
    legs.push(leg);
    legByHub.set(hubId, leg);
  }

  const beltHubIds = new Set(legByHub.keys());
  const seen = new Set();

  for (const item of items || []) {
    const contentId = item?.contentId != null ? String(item.contentId) : '';
    const dedupeKey = contentId || String(item?.title || '');
    if (dedupeKey && seen.has(dedupeKey)) continue;

    const hubId = primaryHubIdForFestival(item, hubList, opts);
    if (!hubId || !beltHubIds.has(hubId)) continue;

    const leg = legByHub.get(hubId);
    if (!leg) continue;

    leg.items.push(item);
    if (dedupeKey) seen.add(dedupeKey);
  }

  for (const leg of legs) {
    leg.items.sort(compareFestivalsForLeg);
    leg.empty = leg.items.length === 0;
  }

  return legs;
}
