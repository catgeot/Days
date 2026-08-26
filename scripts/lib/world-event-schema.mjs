/** @typedef {'festival'|'opera'|'concert'|'season'|'heritage'} WorldEventType */
/** @typedef {'annual'|'fixed'|'tbd'} WorldEventRecurrence */
/** @typedef {'tourapi'|'curated'|'official_url'} WorldEventSource */

/**
 * @typedef {{
 *   name: string,
 *   lat?: number,
 *   lng?: number,
 * }} WorldEventVenue
 */

/**
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   hubId?: string,
 *   type: WorldEventType,
 *   title: string,
 *   titleEn?: string,
 *   startDate: string,
 *   endDate: string,
 *   recurrence: WorldEventRecurrence,
 *   recurrenceNote?: string,
 *   venue?: WorldEventVenue,
 *   source: WorldEventSource,
 *   sourceUrl?: string,
 *   bookingHints?: string,
 *   priority?: number,
 * }} WorldEventOverride
 */

export const WORLD_EVENT_TYPES = new Set([
  'festival',
  'opera',
  'concert',
  'season',
  'heritage',
]);

export const WORLD_EVENT_RECURRENCES = new Set(['annual', 'fixed', 'tbd']);

export const WORLD_EVENT_SOURCES = new Set(['tourapi', 'curated', 'official_url']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {unknown} raw
 * @param {{ index?: number, slugSet?: Set<string>, hubIdSet?: Set<string> }} ctx
 * @returns {WorldEventOverride}
 */
export function normalizeWorldEventOverride(raw, ctx = {}) {
  const label = ctx.index != null ? `override[${ctx.index}]` : 'override';

  if (!raw || typeof raw !== 'object') {
    throw new Error(`[world-events] ${label}: entry must be object`);
  }

  const id = String(raw.id || '').trim();
  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`[world-events] ${label}: id required (lowercase slug-like)`);
  }

  const slug = String(raw.slug || '').trim();
  if (!slug) {
    throw new Error(`[world-events] ${id}: slug required`);
  }
  if (ctx.slugSet && !ctx.slugSet.has(slug)) {
    throw new Error(`[world-events] ${id}: slug not in travelSpots: ${slug}`);
  }

  const hubId = raw.hubId != null ? String(raw.hubId).trim() : undefined;
  if (hubId && ctx.hubIdSet && !ctx.hubIdSet.has(hubId)) {
    throw new Error(`[world-events] ${id}: hubId not in cityAttractionHubs: ${hubId}`);
  }

  const type = String(raw.type || '').trim();
  if (!WORLD_EVENT_TYPES.has(type)) {
    throw new Error(`[world-events] ${id}: invalid type ${raw.type}`);
  }

  const title = String(raw.title || '').trim();
  if (!title) {
    throw new Error(`[world-events] ${id}: title required`);
  }

  const titleEn = raw.titleEn != null ? String(raw.titleEn).trim() : undefined;

  const startDate = String(raw.startDate || '').trim();
  const endDate = String(raw.endDate || '').trim();
  if (!ISO_DATE.test(startDate)) {
    throw new Error(`[world-events] ${id}: startDate must be YYYY-MM-DD`);
  }
  if (!ISO_DATE.test(endDate)) {
    throw new Error(`[world-events] ${id}: endDate must be YYYY-MM-DD`);
  }
  if (startDate > endDate) {
    throw new Error(`[world-events] ${id}: startDate must be <= endDate`);
  }

  const recurrence = String(raw.recurrence || '').trim();
  if (!WORLD_EVENT_RECURRENCES.has(recurrence)) {
    throw new Error(`[world-events] ${id}: invalid recurrence ${raw.recurrence}`);
  }

  const recurrenceNote =
    raw.recurrenceNote != null ? String(raw.recurrenceNote).trim() : undefined;

  const source = String(raw.source || '').trim();
  if (!WORLD_EVENT_SOURCES.has(source)) {
    throw new Error(`[world-events] ${id}: invalid source ${raw.source}`);
  }

  const sourceUrl = raw.sourceUrl != null ? String(raw.sourceUrl).trim() : undefined;
  if (recurrence === 'tbd' && !sourceUrl) {
    throw new Error(`[world-events] ${id}: recurrence tbd requires sourceUrl`);
  }

  let venue;
  if (raw.venue != null) {
    if (typeof raw.venue !== 'object') {
      throw new Error(`[world-events] ${id}: venue must be object`);
    }
    const name = String(raw.venue.name || '').trim();
    if (!name) {
      throw new Error(`[world-events] ${id}: venue.name required when venue set`);
    }
    venue = { name };
    if (raw.venue.lat != null) venue.lat = Number(raw.venue.lat);
    if (raw.venue.lng != null) venue.lng = Number(raw.venue.lng);
    if (
      (venue.lat != null && !Number.isFinite(venue.lat)) ||
      (venue.lng != null && !Number.isFinite(venue.lng))
    ) {
      throw new Error(`[world-events] ${id}: venue lat/lng must be finite numbers`);
    }
  }

  const bookingHints =
    raw.bookingHints != null ? String(raw.bookingHints).trim() : undefined;

  let priority;
  if (raw.priority != null) {
    priority = Number(raw.priority);
    if (!Number.isFinite(priority) || !Number.isInteger(priority) || priority < 0) {
      throw new Error(`[world-events] ${id}: priority must be non-negative integer`);
    }
  }

  /** @type {WorldEventOverride} */
  const event = {
    id,
    slug,
    type,
    title,
    startDate,
    endDate,
    recurrence,
    source,
  };

  if (hubId) event.hubId = hubId;
  if (titleEn) event.titleEn = titleEn;
  if (recurrenceNote) event.recurrenceNote = recurrenceNote;
  if (venue) event.venue = venue;
  if (sourceUrl) event.sourceUrl = sourceUrl;
  if (bookingHints) event.bookingHints = bookingHints;
  if (priority != null) event.priority = priority;

  return event;
}

/**
 * @param {WorldEventOverride[]} events
 */
export function sortWorldEvents(events) {
  return [...events].sort((a, b) => {
    const pa = a.priority ?? 999;
    const pb = b.priority ?? 999;
    if (pa !== pb) return pa - pb;
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    return a.id.localeCompare(b.id);
  });
}
