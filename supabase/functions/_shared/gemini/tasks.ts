import {
  GEMINI_FAST,
  GEMINI_PROXY_MODELS,
  GEMINI_QUALITY,
  resolveGeminiModelId,
} from "../geminiModels.ts";
import { KO } from "./mooniPromptBundleData.js";
import {
  renderCuration,
  renderIntro,
  renderLogbook,
  renderMooniSystem,
  renderReview,
  renderSearchIntent,
  wrapUserTurn,
} from "./templates.js";

export const AUTH_TASKS = new Set(["logbook_polish", "review_draft"]);
export const PERSONAS = ["INSPIRER", "PLANNER", "ARCHITECT", "CONCIERGE", "GENERAL"];
export const CTA_CODES = [
  "none_transport",
  "none_quiet",
  "prep_transfer",
  "prep_preTravel",
  "prep_accommodation",
  "prep_flight",
  "prep_safety",
  "prep_default",
  "transport",
  "transport_flight",
  "both",
  "both_flight",
  "shown_empty",
];
const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_MAX = Math.floor(1.5 * 1024 * 1024);
const CHIP_IDS = new Set(Object.keys(KO.chips));

export type TaskBuild =
  | { ok: true; task: string; model: string; maxOutputTokens: number; parts: unknown[]; tier: string | null }
  | { ok: false; status: number; error: string };

function str(value: unknown, max: number): string | null {
  if (value == null) return "";
  if (typeof value !== "string") return null;
  if (value.length > max) return null;
  return value;
}

function optStr(value: unknown, max: number): string | null | undefined {
  if (value == null || value === "") return "";
  return str(value, max);
}

export function normalizeHistory(raw: unknown): { role: string; text: string }[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return null;
  const turns: { role: string; text: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const text = (item as { text?: unknown }).text;
    if (role !== "user" && role !== "model") return null;
    if (typeof text !== "string" || text.length > 2000) return null;
    turns.push({ role, text });
  }
  let kept = turns.slice(-12);
  while (kept.reduce((sum, turn) => sum + turn.text.length, 0) > 12_000 && kept.length > 1) {
    kept = kept.slice(1);
  }
  if (kept.reduce((sum, turn) => sum + turn.text.length, 0) > 12_000) return null;
  return kept;
}

function flightFacts(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const arrivalIata = optStr(src.arrivalIata, 200);
  const toolkitIatas = optStr(src.toolkitIatas, 400);
  const flightSearch = optStr(src.flightSearch, 500);
  const routeNote = optStr(src.routeNote, 800);
  const journeyTimeline = optStr(src.journeyTimeline, 2000);
  const flightAdvice = optStr(src.flightAdvice, 400);
  if ([arrivalIata, toolkitIatas, flightSearch, routeNote, journeyTimeline, flightAdvice].includes(null)) {
    return null;
  }
  let departure: { label: string; extra: string } | null = null;
  if (src.departure != null) {
    if (!src.departure || typeof src.departure !== "object") return null;
    const dep = src.departure as Record<string, unknown>;
    const label = str(dep.label, 200);
    const extra = optStr(dep.extra, 200);
    if (label == null || extra == null) return null;
    departure = { label, extra: extra || "" };
  }
  return {
    arrivalIata: arrivalIata || null,
    toolkitIatas: toolkitIatas || null,
    flightSearch: flightSearch || null,
    routeNote: routeNote || null,
    journeyTimeline: journeyTimeline || null,
    flightAdvice: flightAdvice || null,
    departure,
    departureDefault: src.departureDefault === true,
  };
}

function profileFacts(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const ferryStep = optStr(src.ferryStep, 200);
  const preTravel = optStr(src.preTravel, 400);
  if (ferryStep == null || preTravel == null) return null;
  return {
    ferryRequired: src.ferryRequired === true,
    noCarOnIsland: src.noCarOnIsland === true,
    ferryStep: ferryStep || null,
    preTravel: preTravel || null,
  };
}

function tripSession(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const fields = [
    "stayLabel",
    "arrivalAirportLabel",
    "arrivalIata",
    "departureAirportLabel",
    "departureIata",
    "arrivalTime",
    "flightNumber",
    "condition",
    "companions",
    "currentArea",
  ];
  const out: Record<string, unknown> = {};
  for (const key of fields) {
    const value = optStr(src[key], 120);
    if (value == null) return null;
    if (value) out[key] = value;
  }
  if (src.nights != null) {
    const nights = Number(src.nights);
    if (!Number.isInteger(nights) || nights < 0 || nights > 60) return null;
    out.nights = nights;
  }
  if (src.days != null) {
    const days = Number(src.days);
    if (!Number.isInteger(days) || days < 0 || days > 60) return null;
    out.days = days;
  }
  if (src.notes != null) {
    if (!Array.isArray(src.notes) || src.notes.length > 6) return null;
    const notes: string[] = [];
    for (const note of src.notes) {
      const text = str(note, 120);
      if (text == null) return null;
      notes.push(text);
    }
    out.notes = notes;
  }
  return out;
}

function stringList(raw: unknown, maxItems: number, maxLen: number): string[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > maxItems) return null;
  const out: string[] = [];
  for (const item of raw) {
    const text = str(item, maxLen);
    if (text == null) return null;
    if (text.trim()) out.push(text.trim());
  }
  return out;
}

function images(raw: unknown): { mimeType: string; data: string }[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 4) return null;
  const out: { mimeType: string; data: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const mimeType = (item as { mimeType?: unknown }).mimeType;
    const data = (item as { data?: unknown }).data;
    if (typeof mimeType !== "string" || !IMAGE_MIME.has(mimeType)) return null;
    if (typeof data !== "string" || data.length === 0 || data.length > IMAGE_MAX) return null;
    out.push({ mimeType, data });
  }
  return out;
}

export function buildTask(task: string, params: unknown, role: string | null): TaskBuild {
  const input = (params && typeof params === "object" ? params : {}) as Record<string, unknown>;
  if (AUTH_TASKS.has(task) && role !== "authenticated") {
    return { ok: false, status: 403, error: "login_required" };
  }

  if (task === "health_ping") {
    return {
      ok: true,
      task,
      model: GEMINI_FAST,
      maxOutputTokens: 16,
      parts: [{ text: "ping" }],
      tier: null,
    };
  }

  if (task === "mooni_chat") {
    const persona = input.persona;
    if (typeof persona !== "string" || !PERSONAS.includes(persona)) {
      return { ok: false, status: 400, error: "bad_request" };
    }
    const tier = input.tier === "quality" ? "quality" : input.tier === "fast" || input.tier == null ? "fast" : null;
    if (!tier) return { ok: false, status: 400, error: "bad_request" };
    const userText = str(input.userText, 1000);
    if (!userText || !userText.trim()) return { ok: false, status: 400, error: "bad_request" };
    const history = normalizeHistory(input.history);
    if (!history) return { ok: false, status: 400, error: "bad_request" };
    const locationName = optStr(input.locationName, 80);
    const boundPlaceName = optStr(input.boundPlaceName, 80);
    const ctaPlace = optStr(input.ctaPlace, 80);
    if (locationName == null || boundPlaceName == null || ctaPlace == null) {
      return { ok: false, status: 400, error: "bad_request" };
    }
    const chipId = input.chipId == null || input.chipId === "" ? null : String(input.chipId);
    if (chipId && !CHIP_IDS.has(chipId)) return { ok: false, status: 400, error: "bad_request" };
    const cta = input.cta == null || input.cta === "" ? null : String(input.cta);
    if (cta && !CTA_CODES.includes(cta)) return { ok: false, status: 400, error: "bad_request" };
    const facts = (input.facts && typeof input.facts === "object" ? input.facts : {}) as Record<string, unknown>;
    const flight = flightFacts(facts.flight);
    const profile = profileFacts(facts.profile);
    if (facts.flight != null && !flight) return { ok: false, status: 400, error: "bad_request" };
    if (facts.profile != null && !profile) return { ok: false, status: 400, error: "bad_request" };
    const arrivalAirport = optStr(facts.arrivalAirport, 200);
    if (arrivalAirport == null) return { ok: false, status: 400, error: "bad_request" };
    const session = tripSession(input.tripSession);
    if (input.tripSession != null && !session) return { ok: false, status: 400, error: "bad_request" };
    const system = renderMooniSystem({
      locale: input.locale,
      persona,
      locationName,
      boundPlaceName,
      isMooni: input.isMooni === true,
      tripSession: session,
      chipId,
      chipFacts: { flight, profile, arrivalAirport: arrivalAirport || null },
      cta,
      ctaPlace,
    });
    return {
      ok: true,
      task,
      model: tier === "quality" ? GEMINI_QUALITY : GEMINI_FAST,
      maxOutputTokens: tier === "quality" ? 2048 : 1536,
      parts: [{ text: wrapUserTurn(system, history, userText) }],
      tier,
    };
  }

  if (task === "place_intro") {
    const placeName = str(input.placeName, 80);
    if (!placeName || !placeName.trim() || /[\r\n{}[\]]/.test(placeName)) {
      return { ok: false, status: 400, error: "bad_request" };
    }
    const rendered = renderIntro(input.locale, placeName.trim());
    return {
      ok: true,
      task,
      model: GEMINI_QUALITY,
      maxOutputTokens: 512,
      parts: [{ text: wrapUserTurn(rendered.system, [], rendered.userText) }],
      tier: null,
    };
  }

  if (task === "search_intent") {
    const mode = input.mode;
    if (mode !== "typo" && mode !== "mood" && mode !== "facility") {
      return { ok: false, status: 400, error: "bad_request" };
    }
    const query = str(input.query, 100);
    if (!query || !query.trim()) return { ok: false, status: 400, error: "bad_request" };
    const rendered = renderSearchIntent(mode, query);
    return {
      ok: true,
      task,
      model: GEMINI_FAST,
      maxOutputTokens: 512,
      parts: [{ text: wrapUserTurn(rendered.system, [], rendered.userText) }],
      tier: null,
    };
  }

  if (task === "review_draft") {
    const placeName = str(input.placeName, 80);
    const draft = str(input.draft ?? "", 2000);
    const rating = Number(input.rating);
    if (!placeName || draft == null || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { ok: false, status: 400, error: "bad_request" };
    }
    const rendered = renderReview(placeName, rating, draft);
    return {
      ok: true,
      task,
      model: GEMINI_QUALITY,
      maxOutputTokens: 768,
      parts: [{ text: wrapUserTurn(rendered.system, [], rendered.userText) }],
      tier: null,
    };
  }

  if (task === "logbook_polish") {
    const mode = input.mode;
    if (mode !== "essay" && mode !== "sns") return { ok: false, status: 400, error: "bad_request" };
    const date = optStr(input.date, 20);
    const location = optStr(input.location, 80);
    const memo = str(input.memo ?? "", 4000);
    const pics = images(input.images);
    if (date == null || location == null || memo == null || !pics) {
      return { ok: false, status: 400, error: "bad_request" };
    }
    const rendered = renderLogbook(mode, date, location, memo, pics.length);
    return {
      ok: true,
      task,
      model: GEMINI_QUALITY,
      maxOutputTokens: 2048,
      parts: [
        { text: wrapUserTurn(rendered.system, [], rendered.userText) },
        ...pics.map((pic) => ({ inlineData: pic })),
      ],
      tier: null,
    };
  }

  if (task === "curation") {
    const reports = stringList(input.reports, 20, 80);
    const saved = stringList(input.saved, 20, 80);
    const exclude = stringList(input.exclude, 20, 80);
    const rejected = stringList(input.rejected, 20, 80);
    const recentSearches = stringList(input.recentSearches, 20, 80);
    const recentVisited = stringList(input.recentVisited, 20, 80);
    const tasteTags = stringList(input.tasteTags, 12, 40);
    if (!reports || !saved || !exclude || !rejected || !recentSearches || !recentVisited || !tasteTags) {
      return { ok: false, status: 400, error: "bad_request" };
    }
    if (tasteTags.some((tag) => !/^[a-z0-9_]{1,40}$/.test(tag))) {
      return { ok: false, status: 400, error: "bad_request" };
    }
    const system = renderCuration({
      locale: input.locale,
      reports,
      saved,
      exclude,
      rejected,
      recentSearches,
      recentVisited,
      tasteTags,
    });
    return {
      ok: true,
      task,
      model: GEMINI_QUALITY,
      maxOutputTokens: 1024,
      parts: [{ text: wrapUserTurn(system, [], "") }],
      tier: null,
    };
  }

  return { ok: false, status: 400, error: "unknown_task" };
}

export function buildLegacy(body: Record<string, unknown>, legacyEnabled: boolean): TaskBuild {
  if (!legacyEnabled) return { ok: false, status: 400, error: "legacy_disabled" };
  const parts = body.parts;
  if (!Array.isArray(parts) || parts.length === 0 || parts.length > 5) {
    return { ok: false, status: 400, error: "bad_request" };
  }
  let textLen = 0;
  let images = 0;
  for (const part of parts) {
    if (!part || typeof part !== "object") return { ok: false, status: 400, error: "bad_request" };
    const text = (part as { text?: unknown }).text;
    const inline = (part as { inlineData?: { mimeType?: unknown; data?: unknown } }).inlineData;
    if (typeof text === "string") textLen += text.length;
    if (inline) {
      images += 1;
      if (images > 4) return { ok: false, status: 400, error: "bad_request" };
      if (typeof inline.mimeType !== "string" || !IMAGE_MIME.has(inline.mimeType)) {
        return { ok: false, status: 400, error: "bad_request" };
      }
      if (typeof inline.data !== "string" || inline.data.length > IMAGE_MAX) {
        return { ok: false, status: 400, error: "bad_request" };
      }
    }
  }
  if (textLen > 24_000) return { ok: false, status: 400, error: "bad_request" };
  const model = resolveGeminiModelId(typeof body.modelId === "string" ? body.modelId : undefined);
  if (!GEMINI_PROXY_MODELS.includes(model)) return { ok: false, status: 400, error: "bad_request" };
  return {
    ok: true,
    task: "legacy",
    model,
    maxOutputTokens: 2048,
    parts,
    tier: null,
  };
}
