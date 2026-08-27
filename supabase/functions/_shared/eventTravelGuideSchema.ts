export const EVENT_TRAVEL_GUIDE_SCHEMA_VERSION = "0.1";
export const MAX_RECOMMENDED_NIGHTS = 10;
export const MAX_PRESET_NIGHTS = 10;

export type EventTravelGuideFacts = {
  event_id: string;
  slug: string;
  hub_id: string;
  type: string;
  title: string;
  title_en: string;
  start_date: string;
  end_date: string;
  recurrence: string;
  recurrence_note: string;
  venue_name: string;
  source_url: string;
  booking_hints: string;
  detail_overview: string;
  highlights: string[];
  stay_areas: Array<{ name: string; mrt_keyword: string; note: string }>;
  recommended_nights?: number;
};

export type EventTravelGuideTripPreset = {
  id: string;
  label: string;
  nights: number;
  timing_hint: string;
  rationale: string;
};

export type EventTravelGuideSection = {
  id: string;
  title: string;
  content: string;
};

export type EventTravelGuide = {
  schema_version: typeof EVENT_TRAVEL_GUIDE_SCHEMA_VERSION;
  event_id: string;
  summary: string;
  recommended_nights: number;
  trip_presets: EventTravelGuideTripPreset[];
  sections: EventTravelGuideSection[];
  booking_tips: string[];
  cautions?: string[];
};

function normalizeStringList(raw: unknown, min: number, optional = false): string[] {
  if (raw == null || raw === "") {
    if (optional || min === 0) return [];
    throw new Error("string list required");
  }
  if (!Array.isArray(raw)) throw new Error("string list must be array");
  const items = raw.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (items.length < min) throw new Error(`need at least ${min} items`);
  return items;
}

export function normalizeEventTravelGuide(raw: unknown): EventTravelGuide {
  if (!raw || typeof raw !== "object") throw new Error("guide must be object");

  const row = raw as Record<string, unknown>;
  const schemaVersion = String(row.schema_version ?? "").trim();
  if (schemaVersion !== EVENT_TRAVEL_GUIDE_SCHEMA_VERSION) {
    throw new Error(`schema_version must be ${EVENT_TRAVEL_GUIDE_SCHEMA_VERSION}`);
  }

  const eventId = String(row.event_id ?? "").trim();
  const summary = String(row.summary ?? "").trim();
  if (!eventId || !summary) throw new Error("event_id and summary required");

  const recommendedNights = Number(row.recommended_nights);
  if (!Number.isFinite(recommendedNights) || recommendedNights < 1 || recommendedNights > MAX_RECOMMENDED_NIGHTS) {
    throw new Error(`recommended_nights must be 1..${MAX_RECOMMENDED_NIGHTS}`);
  }

  const tripPresetsRaw = row.trip_presets;
  if (!Array.isArray(tripPresetsRaw) || tripPresetsRaw.length === 0) {
    throw new Error("trip_presets required");
  }
  const trip_presets = tripPresetsRaw.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error(`trip_presets[${i}] invalid`);
    const p = item as Record<string, unknown>;
    const nights = Number(p.nights);
    if (!Number.isFinite(nights) || nights < 1 || nights > MAX_PRESET_NIGHTS) {
      throw new Error(`trip_presets[${i}].nights invalid`);
    }
    return {
      id: String(p.id ?? "").trim(),
      label: String(p.label ?? "").trim(),
      nights,
      timing_hint: String(p.timing_hint ?? "").trim(),
      rationale: String(p.rationale ?? "").trim(),
    };
  });

  const sectionsRaw = row.sections;
  if (!Array.isArray(sectionsRaw) || sectionsRaw.length < 2) {
    throw new Error("sections need >= 2");
  }
  const sections = sectionsRaw.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error(`sections[${i}] invalid`);
    const s = item as Record<string, unknown>;
    return {
      id: String(s.id ?? "").trim(),
      title: String(s.title ?? "").trim(),
      content: String(s.content ?? "").trim(),
    };
  });

  const booking_tips = normalizeStringList(row.booking_tips, 1);
  const cautions = normalizeStringList(row.cautions, 0, true);

  return {
    schema_version: EVENT_TRAVEL_GUIDE_SCHEMA_VERSION,
    event_id: eventId,
    summary,
    recommended_nights: recommendedNights,
    trip_presets,
    sections,
    booking_tips,
    ...(cautions.length > 0 ? { cautions } : {}),
  };
}

export function buildEventTravelGuideFactsFromBody(event: Record<string, unknown>): EventTravelGuideFacts {
  const eventId = String(event.event_id ?? event.id ?? "").trim();
  if (!eventId) throw new Error("event_id required");

  return {
    event_id: eventId,
    slug: String(event.slug ?? "").trim(),
    hub_id: String(event.hub_id ?? event.hubId ?? event.slug ?? "").trim(),
    type: String(event.type ?? "").trim(),
    title: String(event.title ?? "").trim(),
    title_en: String(event.title_en ?? event.titleEn ?? "").trim(),
    start_date: String(event.start_date ?? event.startDate ?? "").trim(),
    end_date: String(event.end_date ?? event.endDate ?? "").trim(),
    recurrence: String(event.recurrence ?? "").trim(),
    recurrence_note: String(event.recurrence_note ?? event.recurrenceNote ?? "").trim(),
    venue_name: String(event.venue_name ?? (event.venue as { name?: string })?.name ?? "").trim(),
    source_url: String(event.source_url ?? event.sourceUrl ?? "").trim(),
    booking_hints: String(event.booking_hints ?? event.bookingHints ?? "").trim(),
    detail_overview: String(event.detail_overview ?? event.detailOverview ?? "").trim(),
    highlights: Array.isArray(event.highlights)
      ? event.highlights.map((h) => String(h ?? "").trim()).filter(Boolean)
      : [],
    stay_areas: Array.isArray(event.stay_areas ?? event.stayAreas)
      ? (event.stay_areas ?? event.stayAreas as Array<Record<string, unknown>>).map((area) => ({
          name: String(area?.name ?? "").trim(),
          mrt_keyword: String(area?.mrt_keyword ?? area?.mrtKeyword ?? "").trim(),
          note: String(area?.note ?? "").trim(),
        }))
      : [],
    recommended_nights:
      event.recommended_nights != null
        ? Number(event.recommended_nights)
        : event.recommendedNights != null
        ? Number(event.recommendedNights)
        : undefined,
  };
}
