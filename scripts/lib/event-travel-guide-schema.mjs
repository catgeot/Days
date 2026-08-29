/** @typedef {'0.2'} EventTravelGuideSchemaVersion */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   nights: number,
 *   timing_hint: string,
 *   rationale: string,
 * }} EventTravelGuideTripPreset
 */

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   content: string,
 * }} EventTravelGuideSection
 */

/**
 * v0.2 — Tier3 only. summary/recommended_nights live in static Tier0~0.5.
 * @typedef {{
 *   schema_version: EventTravelGuideSchemaVersion,
 *   event_id: string,
 *   trip_presets: EventTravelGuideTripPreset[],
 *   sections: EventTravelGuideSection[],
 *   booking_tips: string[],
 *   cautions?: string[],
 * }} EventTravelGuide
 */

export const EVENT_TRAVEL_GUIDE_SCHEMA_VERSION = '0.2';
export const MAX_PRESET_NIGHTS = 10;

/** Wave1.5 pilot — Preview QA only until G2 freeze. */
export const EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS = [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'bali-galungan-season-2026',
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {unknown} raw
 * @param {{ label?: string }} [ctx]
 * @returns {EventTravelGuide}
 */
export function normalizeEventTravelGuide(raw, ctx = {}) {
  const label = ctx.label || 'guide';

  if (!raw || typeof raw !== 'object') {
    throw new Error(`[event-travel-guide] ${label}: must be object`);
  }

  const row = raw;
  const schemaVersion = String(row.schema_version ?? '').trim();
  if (schemaVersion !== EVENT_TRAVEL_GUIDE_SCHEMA_VERSION) {
    throw new Error(
      `[event-travel-guide] ${label}: schema_version must be ${EVENT_TRAVEL_GUIDE_SCHEMA_VERSION}`,
    );
  }

  if (row.summary != null && String(row.summary).trim()) {
    throw new Error(`[event-travel-guide] ${label}: summary forbidden in v0.2 (use static detailOverview)`);
  }
  if (row.recommended_nights != null) {
    throw new Error(
      `[event-travel-guide] ${label}: recommended_nights forbidden in v0.2 (use static recommendedNights)`,
    );
  }

  const eventId = String(row.event_id ?? '').trim();
  if (!eventId) {
    throw new Error(`[event-travel-guide] ${label}: event_id required`);
  }

  const tripPresets = normalizeTripPresets(row.trip_presets, label);
  const sections = normalizeSections(row.sections, label);
  const bookingTips = normalizeStringList(row.booking_tips, `${label}.booking_tips`, 1);
  const cautions = normalizeStringList(row.cautions, `${label}.cautions`, 0, true);

  return {
    schema_version: EVENT_TRAVEL_GUIDE_SCHEMA_VERSION,
    event_id: eventId,
    trip_presets: tripPresets,
    sections,
    booking_tips: bookingTips,
    ...(cautions.length > 0 ? { cautions } : {}),
  };
}

/**
 * @param {unknown} raw
 * @param {string} label
 */
function normalizeTripPresets(raw, label) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`[event-travel-guide] ${label}: trip_presets must be non-empty array`);
  }

  return raw.map((item, index) => {
    const rowLabel = `${label}.trip_presets[${index}]`;
    if (!item || typeof item !== 'object') {
      throw new Error(`[event-travel-guide] ${rowLabel}: must be object`);
    }

    const id = String(item.id ?? '').trim();
    const presetLabel = String(item.label ?? '').trim();
    const timingHint = String(item.timing_hint ?? '').trim();
    const rationale = String(item.rationale ?? '').trim();
    const nights = Number(item.nights);

    if (!id || !presetLabel || !timingHint || !rationale) {
      throw new Error(`[event-travel-guide] ${rowLabel}: id, label, timing_hint, rationale required`);
    }
    if (!Number.isFinite(nights) || nights < 1 || nights > MAX_PRESET_NIGHTS) {
      throw new Error(
        `[event-travel-guide] ${rowLabel}: nights must be 1..${MAX_PRESET_NIGHTS}`,
      );
    }

    return { id, label: presetLabel, nights, timing_hint: timingHint, rationale };
  });
}

/**
 * @param {unknown} raw
 * @param {string} label
 */
function normalizeSections(raw, label) {
  if (!Array.isArray(raw) || raw.length < 2) {
    throw new Error(`[event-travel-guide] ${label}: sections must have at least 2 items`);
  }

  return raw.map((item, index) => {
    const rowLabel = `${label}.sections[${index}]`;
    if (!item || typeof item !== 'object') {
      throw new Error(`[event-travel-guide] ${rowLabel}: must be object`);
    }

    const id = String(item.id ?? '').trim();
    const title = String(item.title ?? '').trim();
    const content = String(item.content ?? '').trim();

    if (!id || !title || !content) {
      throw new Error(`[event-travel-guide] ${rowLabel}: id, title, content required`);
    }

    return { id, title, content };
  });
}

/**
 * @param {unknown} raw
 * @param {string} label
 * @param {number} min
 * @param {boolean} [optional]
 */
function normalizeStringList(raw, label, min, optional = false) {
  if (raw == null || raw === '') {
    if (optional || min === 0) return [];
    throw new Error(`[event-travel-guide] ${label}: required`);
  }
  if (!Array.isArray(raw)) {
    throw new Error(`[event-travel-guide] ${label}: must be array`);
  }

  const items = raw.map((v) => String(v ?? '').trim()).filter(Boolean);
  if (items.length < min) {
    throw new Error(`[event-travel-guide] ${label}: need at least ${min} item(s)`);
  }
  return items;
}

/**
 * Tier0 facts only — Edge input + hallucination audit anchor.
 * @param {Record<string, unknown>} event
 */
export function buildWorldEventTier0Facts(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('[event-travel-guide] event facts: event required');
  }

  const facts = {
    event_id: String(event.id ?? '').trim(),
    slug: String(event.slug ?? '').trim(),
    hub_id: String(event.hubId ?? event.slug ?? '').trim(),
    type: String(event.type ?? '').trim(),
    title: String(event.title ?? '').trim(),
    title_en: String(event.titleEn ?? '').trim(),
    start_date: String(event.startDate ?? '').trim(),
    end_date: String(event.endDate ?? '').trim(),
    recurrence: String(event.recurrence ?? '').trim(),
    recurrence_note: String(event.recurrenceNote ?? '').trim(),
    venue_name: String(event.venue?.name ?? '').trim(),
    source_url: String(event.sourceUrl ?? '').trim(),
    booking_hints: String(event.bookingHints ?? '').trim(),
    detail_overview: String(event.detailOverview ?? '').trim(),
    highlights: Array.isArray(event.highlights)
      ? event.highlights.map((h) => String(h ?? '').trim()).filter(Boolean)
      : [],
    stay_areas: Array.isArray(event.stayAreas)
      ? event.stayAreas.map((area) => ({
          name: String(area?.name ?? '').trim(),
          mrt_keyword: String(area?.mrtKeyword ?? '').trim(),
          note: String(area?.note ?? '').trim(),
        }))
      : [],
    recommended_nights:
      event.recommendedNights != null ? Number(event.recommendedNights) : undefined,
  };

  if (!facts.event_id) {
    throw new Error('[event-travel-guide] event facts: event_id required');
  }
  if (!ISO_DATE.test(facts.start_date) || !ISO_DATE.test(facts.end_date)) {
    throw new Error('[event-travel-guide] event facts: start_date/end_date ISO required');
  }

  return facts;
}

/**
 * @param {EventTravelGuide} guide
 * @param {ReturnType<typeof buildWorldEventTier0Facts>} facts
 * @returns {string[]} warnings (non-fatal)
 */
export function auditEventTravelGuideAgainstFacts(guide, facts) {
  const warnings = [];

  if (guide.event_id !== facts.event_id) {
    throw new Error(`event_id mismatch: guide=${guide.event_id} facts=${facts.event_id}`);
  }

  const spanNights = nightsBetween(facts.start_date, facts.end_date);

  for (const preset of guide.trip_presets) {
    if (preset.nights > spanNights && spanNights > 0) {
      warnings.push(`preset ${preset.id} nights=${preset.nights} exceeds event span ${spanNights}d`);
    }
    if (
      facts.recommended_nights != null &&
      preset.nights > facts.recommended_nights + 2
    ) {
      warnings.push(
        `preset ${preset.id} nights=${preset.nights} drifts from static recommendedNights=${facts.recommended_nights}`,
      );
    }
  }

  const staticText = [
    facts.detail_overview,
    facts.booking_hints,
    ...(facts.highlights ?? []),
    ...(facts.stay_areas ?? []).flatMap((a) => [a.name, a.note]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const tip of guide.booking_tips) {
    const normalized = String(tip).trim().toLowerCase();
    if (normalized.length >= 24 && staticText.includes(normalized.slice(0, 24))) {
      warnings.push(`booking_tip may duplicate static Tier0~0.5: ${tip.slice(0, 40)}…`);
    }
  }

  if (facts.venue_name) {
    const guideText = JSON.stringify(guide).toLowerCase();
    if (!guideText.includes(facts.venue_name.toLowerCase().slice(0, 12))) {
      warnings.push(`venue may be missing from guide: ${facts.venue_name}`);
    }
  }

  return warnings;
}

/**
 * @param {string} start
 * @param {string} end
 */
function nightsBetween(start, end) {
  const a = new Date(`${start}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.ceil((b - a) / (24 * 60 * 60 * 1000));
}
