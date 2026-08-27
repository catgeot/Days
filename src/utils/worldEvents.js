import worldEventsData from '../pages/Home/data/worldEvents.json' with { type: 'json' };
import travelSpotsList from '../pages/Home/data/travelSpots-list.json' with { type: 'json' };
import { resolveWorldEventHubRegionId } from '../pages/WorldEvents/worldEventHubRegions.js';

/** @typedef {import('../../scripts/lib/world-event-schema.mjs').WorldEventOverride} WorldEvent */

const placeLabelBySlug = new Map();

for (const spot of travelSpotsList ?? []) {
  const slug = String(spot.slug || '').trim().toLowerCase();
  if (!slug) continue;
  placeLabelBySlug.set(slug, {
    name: spot.name || '',
    name_en: spot.name_en || '',
    country: spot.country || '',
  });
}

const eventsById = new Map();
const eventsBySlug = new Map();

for (const event of worldEventsData.events ?? []) {
  const eventId = String(event.id || '').trim();
  if (eventId) {
    eventsById.set(eventId, event);
  }
  const slug = String(event.slug || '').trim().toLowerCase();
  if (!slug) continue;
  const list = eventsBySlug.get(slug) ?? [];
  list.push(event);
  eventsBySlug.set(slug, list);
}

for (const [slug, list] of eventsBySlug) {
  list.sort((a, b) => {
    const pa = Number(a.priority ?? 99);
    const pb = Number(b.priority ?? 99);
    if (pa !== pb) return pa - pb;
    return String(a.startDate).localeCompare(String(b.startDate));
  });
  eventsBySlug.set(slug, list);
}

/**
 * @param {string | null | undefined} eventId
 * @returns {WorldEvent | null}
 */
export function getWorldEventById(eventId) {
  const key = String(eventId || '').trim();
  if (!key) return null;
  return eventsById.get(key) ?? null;
}

/**
 * @param {string | null | undefined} slug
 * @returns {WorldEvent[]}
 */
export function getWorldEventsForSlug(slug) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return [];
  return eventsBySlug.get(key) ?? [];
}

/**
 * @param {WorldEvent} event
 * @param {string} [locale]
 */
export function getWorldEventTitle(event, locale = 'ko') {
  if (!event) return '';
  if (locale === 'en' && event.titleEn) return event.titleEn;
  return event.title || event.titleEn || '';
}

/**
 * @param {string} ymd
 * @param {string} [locale]
 */
export function formatWorldEventYmd(ymd, locale = 'ko') {
  const raw = String(ymd || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return raw;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * @param {WorldEvent} event
 * @param {string} [locale]
 */
export function formatWorldEventDateRange(event, locale = 'ko') {
  if (!event) return '';
  const start = formatWorldEventYmd(event.startDate, locale);
  const end = formatWorldEventYmd(event.endDate, locale);
  if (!start) return '';
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}

/** @returns {WorldEvent[]} */
export function getAllWorldEvents() {
  return [...(worldEventsData.events ?? [])].sort((a, b) => {
    const pa = Number(a.priority ?? 99);
    const pb = Number(b.priority ?? 99);
    if (pa !== pb) return pa - pb;
    return String(a.startDate).localeCompare(String(b.startDate));
  });
}

/**
 * @param {string | null | undefined} slug
 * @param {string} [locale]
 */
export function getWorldEventPlaceLabel(slug, locale = 'ko') {
  const key = String(slug || '').trim().toLowerCase();
  const spot = placeLabelBySlug.get(key);
  if (!spot) return key;
  if (locale === 'en' && spot.name_en) return spot.name_en;
  return spot.name || spot.name_en || key;
}

/**
 * @param {string | null | undefined} slug
 * @param {string} [locale]
 */
export function getWorldEventPlaceMeta(slug, locale = 'ko') {
  const key = String(slug || '').trim().toLowerCase();
  const spot = placeLabelBySlug.get(key);
  if (!spot) {
    return { label: key, country: '' };
  }
  return {
    label: getWorldEventPlaceLabel(key, locale),
    country: spot.country || '',
  };
}

/**
 * MRT 숙소·항공 위젯용 location (slug → travelSpots-list).
 * @param {string | null | undefined} slug
 */
export function getWorldEventLocation(slug) {
  const key = String(slug || '').trim().toLowerCase();
  const spot = placeLabelBySlug.get(key);
  if (!spot) {
    return { slug: key, name: key, name_en: key, country: '' };
  }
  return {
    slug: key,
    name: spot.name || key,
    name_en: spot.name_en || spot.name || key,
    country: spot.country || '',
  };
}

/**
 * @param {WorldEvent} event
 * @returns {string | null}
 */
export function getWorldEventRegionId(event) {
  if (!event) return null;
  return resolveWorldEventHubRegionId(event.slug);
}

/**
 * @param {string | null | undefined} regionId — `all` or empty = 전체
 * @returns {WorldEvent[]}
 */
export function getWorldEventsForHubRegion(regionId) {
  const events = getAllWorldEvents();
  const key = String(regionId || '').trim();
  if (!key || key === 'all') return events;
  return events.filter((event) => getWorldEventRegionId(event) === key);
}
