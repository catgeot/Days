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
 *   name: string,
 *   mrtKeyword?: string,
 *   note?: string,
 * }} WorldEventStayArea
 */

/**
 * @typedef {'official' | 'map' | 'search'} WorldEventActionChipKind
 */

/**
 * @typedef {{
 *   id: string,
 *   labelKo: string,
 *   labelEn?: string,
 *   href: string,
 *   kind?: WorldEventActionChipKind,
 * }} WorldEventActionChip
 */

/**
 * @typedef {{
 *   id: string,
 *   promptKo: string,
 *   promptEn?: string,
 * }} WorldEventMooniChip
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
 *   detailOverview?: string,
 *   highlights?: string[],
 *   stayAreas?: WorldEventStayArea[],
 *   recommendedNights?: number,
 *   heroImage?: string,
 *   actionChips?: WorldEventActionChip[],
 *   mooniChips?: WorldEventMooniChip[],
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

  const detailOverview =
    raw.detailOverview != null ? String(raw.detailOverview).trim() : undefined;

  let highlights;
  if (raw.highlights != null) {
    if (!Array.isArray(raw.highlights)) {
      throw new Error(`[world-events] ${id}: highlights must be array`);
    }
    highlights = raw.highlights
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    if (!highlights.length) {
      throw new Error(`[world-events] ${id}: highlights must not be empty when set`);
    }
  }

  let stayAreas;
  if (raw.stayAreas != null) {
    if (!Array.isArray(raw.stayAreas)) {
      throw new Error(`[world-events] ${id}: stayAreas must be array`);
    }
    stayAreas = raw.stayAreas.map((area, areaIndex) => {
      if (!area || typeof area !== 'object') {
        throw new Error(`[world-events] ${id}: stayAreas[${areaIndex}] must be object`);
      }
      const name = String(area.name || '').trim();
      if (!name) {
        throw new Error(`[world-events] ${id}: stayAreas[${areaIndex}].name required`);
      }
      /** @type {WorldEventStayArea} */
      const normalizedArea = { name };
      if (area.mrtKeyword != null) {
        normalizedArea.mrtKeyword = String(area.mrtKeyword).trim();
      }
      if (area.note != null) {
        normalizedArea.note = String(area.note).trim();
      }
      return normalizedArea;
    });
    if (!stayAreas.length) {
      throw new Error(`[world-events] ${id}: stayAreas must not be empty when set`);
    }
  }

  let recommendedNights;
  if (raw.recommendedNights != null) {
    recommendedNights = Number(raw.recommendedNights);
    if (
      !Number.isFinite(recommendedNights) ||
      !Number.isInteger(recommendedNights) ||
      recommendedNights < 1 ||
      recommendedNights > 30
    ) {
      throw new Error(`[world-events] ${id}: recommendedNights must be integer 1..30`);
    }
  }

  const heroImage = raw.heroImage != null ? String(raw.heroImage).trim() : undefined;

  let actionChips;
  if (raw.actionChips != null) {
    if (!Array.isArray(raw.actionChips)) {
      throw new Error(`[world-events] ${id}: actionChips must be array`);
    }
    actionChips = raw.actionChips.map((chip, chipIndex) => {
      if (!chip || typeof chip !== 'object') {
        throw new Error(`[world-events] ${id}: actionChips[${chipIndex}] must be object`);
      }
      const chipId = String(chip.id || '').trim();
      const labelKo = String(chip.labelKo || '').trim();
      const href = String(chip.href || '').trim();
      if (!chipId) {
        throw new Error(`[world-events] ${id}: actionChips[${chipIndex}].id required`);
      }
      if (!labelKo) {
        throw new Error(`[world-events] ${id}: actionChips[${chipIndex}].labelKo required`);
      }
      if (!href || !/^https?:\/\//i.test(href)) {
        throw new Error(`[world-events] ${id}: actionChips[${chipIndex}].href must be http(s) URL`);
      }
      /** @type {WorldEventActionChip} */
      const normalizedChip = { id: chipId, labelKo, href };
      const labelEn = chip.labelEn != null ? String(chip.labelEn).trim() : undefined;
      if (labelEn) normalizedChip.labelEn = labelEn;
      const kind = chip.kind != null ? String(chip.kind).trim() : undefined;
      if (kind) {
        if (!['official', 'map', 'search'].includes(kind)) {
          throw new Error(`[world-events] ${id}: actionChips[${chipIndex}].kind invalid`);
        }
        normalizedChip.kind = /** @type {WorldEventActionChipKind} */ (kind);
      }
      return normalizedChip;
    });
    if (!actionChips.length) {
      throw new Error(`[world-events] ${id}: actionChips must not be empty when set`);
    }
  }

  let mooniChips;
  if (raw.mooniChips != null) {
    if (!Array.isArray(raw.mooniChips)) {
      throw new Error(`[world-events] ${id}: mooniChips must be array`);
    }
    mooniChips = raw.mooniChips.map((chip, chipIndex) => {
      if (!chip || typeof chip !== 'object') {
        throw new Error(`[world-events] ${id}: mooniChips[${chipIndex}] must be object`);
      }
      const chipId = String(chip.id || '').trim();
      const promptKo = String(chip.promptKo || '').trim();
      if (!chipId) {
        throw new Error(`[world-events] ${id}: mooniChips[${chipIndex}].id required`);
      }
      if (!promptKo) {
        throw new Error(`[world-events] ${id}: mooniChips[${chipIndex}].promptKo required`);
      }
      /** @type {WorldEventMooniChip} */
      const normalizedChip = { id: chipId, promptKo };
      const promptEn = chip.promptEn != null ? String(chip.promptEn).trim() : undefined;
      if (promptEn) normalizedChip.promptEn = promptEn;
      return normalizedChip;
    });
    if (!mooniChips.length) {
      throw new Error(`[world-events] ${id}: mooniChips must not be empty when set`);
    }
  }

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
  if (detailOverview) event.detailOverview = detailOverview;
  if (highlights) event.highlights = highlights;
  if (stayAreas) event.stayAreas = stayAreas;
  if (recommendedNights != null) event.recommendedNights = recommendedNights;
  if (heroImage) event.heroImage = heroImage;
  if (actionChips) event.actionChips = actionChips;
  if (mooniChips) event.mooniChips = mooniChips;
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
