import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import catalog from "./placeVideoCatalog.json" with { type: "json" };
import { clientIp } from "../_shared/placeVideoClientIp.ts";

const corsBase = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const BASE_URL = "https://www.googleapis.com/youtube/v3";
const DAY_MS = 24 * 60 * 60 * 1000;
// search.list = 100 units. Ceiling stays well under the 10,000 unit daily quota.
// p_cost needs 20261006123000 (4-arg, no default). The 3-arg function from 3v stays.
// Deploy: 3v 20261006113000 → cost migration 20261006123000 → this function.
// Rollback: this function → 20261006123000 → 3v.
// Reverting 3v first makes this function 503 (it always passes p_cost).
// Edge first on deploy also returns 503 for the same reason.
const YT_SEARCH_UNITS = 100;
const LIMIT_GLOBAL_UNITS = 6000;
// detailCommon does not spend the YouTube global budget.
const LIMIT_DETAIL_GLOBAL_UNITS = 400;
const LIMIT_DETAIL_IP_UNITS = 200;
const LIMIT_IP_DAILY_UNITS_DEFAULT = 1000;
const LIMIT_IP_PER_MINUTE = 6;
const LIMIT_PLACE_NEW_PER_DAY = 2;
const LIMIT_PAGE_IP_PLACE = 3;
const LIMIT_PAGE_PLACE = 30;

const PREVIEW_ORIGIN_RE = /^https:\/\/days-git-[a-z0-9-]+-catgeots-projects\.vercel\.app$/;
const FORBIDDEN_QUERY_RES = [
  /https?:\/\//i,
  /javascript:/i,
  /\b(?:site|cache|related|link|inurl|intitle):/i,
  /\b(?:porn|xxx)\b/i,
  /음란|야동|포르노/,
];
const HTML_TAG_TOKEN = /^(?:\/?(?:a|b|br|div|em|font|i|p|span|strong|u))$/i;
const FREE_SEARCH_ID_RE = /^(loc|search|city|label)-/i;

const PLACES = catalog.places as Record<string, string>;
const SCENIC = catalog.scenic as Record<string, string>;
const WORLD_EVENTS = catalog.worldEvents as Record<string, string>;

type DbError = { message?: string; code?: string } | null;
type PlaceVideoRow = {
  videos: unknown[] | null;
  fail_count: number | null;
  last_error: string | null;
  next_retry_at: string | null;
  last_updated: string | null;
};
type FestivalCacheRow = { cache_key?: string; payload?: unknown };
type AdminClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: DbError }>;
      };
      in: (col: string, vals: string[]) => Promise<{ data: FestivalCacheRow[] | null; error: DbError }>;
      like: (col: string, pattern: string) => Promise<{ data: FestivalCacheRow[] | null; error: DbError }>;
    };
    upsert: (payload: Record<string, unknown>) => Promise<{ error: DbError }>;
  };
  rpc: (
    fn: string,
    args: { p_key: string; p_window_seconds: number; p_limit: number; p_cost: number },
  ) => Promise<{ data: boolean | null; error: DbError }>;
};
type YtSnippet = {
  title?: string;
  description?: string;
  channelTitle?: string;
  publishedAt?: string;
};
type YtItem = { id?: { videoId?: string }; snippet?: YtSnippet };
type YtSearch = { items?: YtItem[]; nextPageToken?: string };
type ResolvedPlace = {
  placeId: string;
  query: string;
  mode: "place" | "festival";
  fallback: string;
};
type TitleHit = { title: string; year: string };

class YtError extends Error {
  status: number;
  reason: string;
  constructor(status: number, reason: string) {
    super(reason);
    this.status = status;
    this.reason = reason;
  }
}

class LimitError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function clampMaxResults(n: unknown, opts?: { raiseCap?: boolean }): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return 5;
  const cap = opts?.raiseCap ? 20 : 10;
  return Math.min(cap, Math.floor(v));
}

function decodeHtmlEntities(input: string): string {
  if (!input) return "";
  return input.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const numStr = isHex ? body.slice(2) : body.slice(1);
      const code = parseInt(numStr, isHex ? 16 : 10);
      if (!Number.isFinite(code)) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named: Record<string, string> = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      apos: "'",
      "#39": "'",
    };
    const lower = body.toLowerCase();
    if (Object.hasOwn(named, body)) return named[body];
    if (Object.hasOwn(named, lower)) return named[lower];
    return match;
  });
}

function stripRealTags(input: string): string {
  return input.replace(/<\/?[a-zA-Z][^>]*>/g, " ");
}

function sanitizeQuery(input: string): string {
  // Real tags first, then entities. `&lt;탈춤&gt;` is not a tag and must keep 탈춤.
  const decoded = stripRealTags(decodeHtmlEntities(stripRealTags(input)));
  let out = "";
  for (const ch of decoded) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "<" || ch === ">" || code < 32 || code === 127) {
      out += " ";
      continue;
    }
    out += ch;
  }
  const text = out
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token && !HTML_TAG_TOKEN.test(token))
    .join(" ");
  if (!text) return "";
  return text.length > 180 ? text.slice(0, 180).trim() : text;
}

function queryRejected(q: string): boolean {
  if (!q) return true;
  return FORBIDDEN_QUERY_RES.some((re) => re.test(q));
}

function allowedOriginSet(): Set<string> {
  const raw = Deno.env.get("FETCH_PLACE_VIDEOS_ALLOWED_ORIGINS")
    ?? "https://www.gateo.kr,https://gateo.kr";
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

function originAllowed(origin: string): boolean {
  if (!origin) return false;
  if (allowedOriginSet().has(origin)) return true;
  return PREVIEW_ORIGIN_RE.test(origin);
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    ...corsBase,
    "Access-Control-Allow-Origin": originAllowed(origin) ? origin : "https://www.gateo.kr",
  };
}

function json(req: Request, body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function hasBearerJwt(req: Request): boolean {
  const raw = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const m = raw.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const parts = m[1].trim().split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function ipDailyUnits(): number {
  const raw = Deno.env.get("FETCH_PLACE_VIDEOS_IP_DAILY_UNITS");
  if (raw == null || raw.trim() === "") return LIMIT_IP_DAILY_UNITS_DEFAULT;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 100 || n > 10000) return LIMIT_IP_DAILY_UNITS_DEFAULT;
  return n;
}

function rowFresh(row: PlaceVideoRow | null): boolean {
  if (!row || !Array.isArray(row.videos)) return false;
  if (row.next_retry_at == null || row.next_retry_at === "") return true;
  const t = Date.parse(row.next_retry_at);
  if (!Number.isFinite(t)) return true;
  return t > Date.now();
}

function backoffMs(failCount: number): number {
  const days = failCount <= 1 ? 1 : failCount === 2 ? 3 : failCount === 3 ? 7 : 30;
  return days * DAY_MS;
}

function preservedVideos(row: PlaceVideoRow | null): unknown[] {
  return Array.isArray(row?.videos) ? row.videos : [];
}

function logFail(placeId: string, reason: string, ytStatus: number | null): void {
  console.error(JSON.stringify({ placeId, reason, yt_status: ytStatus }));
}

function placeMode(query: string): ResolvedPlace | null {
  const q = sanitizeQuery(query);
  if (queryRejected(q)) return null;
  return {
    placeId: "",
    query: q,
    mode: "place",
    fallback: sanitizeQuery(`${q} travel vlog`),
  };
}

function resolvedFromTitle(placeId: string, hit: TitleHit, mode: "place" | "festival"): ResolvedPlace | null {
  let query = sanitizeQuery(hit.title);
  if (hit.year && !query.includes(hit.year)) query = sanitizeQuery(`${query} ${hit.year}`);
  if (mode === "festival" && query && !query.includes("축제")) query = sanitizeQuery(`${query} 축제`);
  if (mode === "festival") {
    if (queryRejected(query)) return null;
    return {
      placeId,
      query,
      mode,
      fallback: sanitizeQuery(`${sanitizeQuery(hit.title)} festival`),
    };
  }
  const resolved = placeMode(query);
  if (!resolved) return null;
  resolved.placeId = placeId;
  return resolved;
}

function resolveStaticPlace(raw: string): ResolvedPlace | null {
  const id = raw.trim();
  const scenicKey = id.startsWith("scenic:") ? id.slice("scenic:".length) : "";
  if (scenicKey && !/^\d{1,32}$/.test(scenicKey)) {
    const q = SCENIC[scenicKey] ?? SCENIC[scenicKey.toLowerCase()];
    if (!q) return null;
    const resolved = placeMode(q);
    if (!resolved) return null;
    resolved.placeId = `scenic:${scenicKey.toLowerCase()}`;
    return resolved;
  }
  if (scenicKey) {
    const q = SCENIC[scenicKey];
    if (!q) return null;
    const resolved = placeMode(q);
    if (!resolved) return null;
    resolved.placeId = `scenic:${scenicKey}`;
    return resolved;
  }
  const world = id.match(/^world-event:([a-z0-9]+(?:-[a-z0-9]+)*):(ko|en)$/i);
  if (world) {
    const key = `${world[1].toLowerCase()}:${world[2].toLowerCase()}`;
    const q = sanitizeQuery(WORLD_EVENTS[key] ?? "");
    if (queryRejected(q)) return null;
    const other = world[2].toLowerCase() === "en"
      ? WORLD_EVENTS[`${world[1].toLowerCase()}:ko`]
      : WORLD_EVENTS[`${world[1].toLowerCase()}:en`];
    return {
      placeId: `world-event:${key}`,
      query: q,
      mode: "festival",
      fallback: sanitizeQuery(other && other !== q ? other : `${q} festival`),
    };
  }
  if (id.includes(":")) return null;
  const slug = id.toLowerCase();
  const q = PLACES[slug];
  if (!q) return null;
  const resolved = placeMode(q);
  if (!resolved) return null;
  resolved.placeId = slug;
  return resolved;
}

function recordTitle(row: Record<string, unknown>, contentId: string, keyed: boolean, items: boolean): TitleHit | null {
  const rowId = String(row.contentId ?? row.contentid ?? "").trim();
  if (!keyed && rowId !== contentId) return null;
  if (keyed && rowId && rowId !== contentId && items) return null;
  const title = String(row.title ?? "").trim();
  if (!title) return null;
  const ymd = String(row.eventStartDate ?? row.eventstartdate ?? "");
  const year = /^\d{8}$/.test(ymd) ? ymd.slice(0, 4) : "";
  return { title, year };
}

function festivalTitleFromPayload(payload: unknown, contentId: string, keyed: boolean): TitleHit | null {
  if (!payload || typeof payload !== "object") return null;
  const rec = payload as Record<string, unknown>;
  const rows: Record<string, unknown>[] = [];
  if (rec.common && typeof rec.common === "object") rows.push(rec.common as Record<string, unknown>);
  if (Array.isArray(rec.items)) {
    for (const item of rec.items) {
      if (item && typeof item === "object") rows.push(item as Record<string, unknown>);
    }
  }
  if (rec.intro && typeof rec.intro === "object") rows.push(rec.intro as Record<string, unknown>);
  if (typeof rec.title === "string") rows.push(rec);
  const items = Array.isArray(rec.items);
  for (const row of rows) {
    const hit = recordTitle(row, contentId, keyed, items);
    if (hit) return hit;
  }
  return null;
}

async function festivalDetailHit(admin: AdminClient, contentId: string): Promise<TitleHit | null> {
  const detailKeys = [`detail:ko:${contentId}`, `detail:en:${contentId}`];
  const details = await admin.from("tourapi_festival_cache").select("cache_key, payload").in("cache_key", detailKeys);
  if (details.error) throw new Error("festival_cache");
  for (const row of details.data ?? []) {
    const key = String(row.cache_key ?? "");
    const hit = festivalTitleFromPayload(row.payload, contentId, key.endsWith(`:${contentId}`));
    if (hit) return hit;
  }
  return null;
}

async function festivalListHit(admin: AdminClient, contentId: string): Promise<TitleHit | null> {
  const lists = await admin.from("tourapi_festival_cache").select("cache_key, payload").like("cache_key", "list:%");
  if (lists.error) throw new Error("festival_cache");
  for (const row of lists.data ?? []) {
    const hit = festivalTitleFromPayload(row.payload, contentId, false);
    if (hit) return hit;
  }
  return null;
}

async function attractionHit(admin: AdminClient, contentId: string): Promise<TitleHit | null> {
  const row = await admin.from("tourapi_attraction").select("content_id, title").eq("content_id", contentId).maybeSingle();
  if (row.error) throw new Error("attraction_cache");
  const title = String(row.data?.title ?? "").trim();
  if (!title) return null;
  return { title, year: "" };
}

type ProxyDetail = { ok: true; hit: TitleHit } | { ok: false; unknown: boolean };

async function proxyDetailHit(contentId: string): Promise<ProxyDetail> {
  const base = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!base || !key) return { ok: false, unknown: false };
  let res: Response;
  try {
    res = await fetch(`${base}/functions/v1/tourapi-proxy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "detailCommon", contentId }),
    });
  } catch {
    return { ok: false, unknown: false };
  }
  if (!res.ok) return { ok: false, unknown: false };
  const body = await res.json().catch(() => null) as { ok?: unknown; items?: unknown } | null;
  // tourapi-proxy answers HTTP 200 { ok:false, items:[] } on timeout and quota.
  // That is transient. A negative cache is only a confirmed empty hit.
  if (!body || body.ok !== true) return { ok: false, unknown: false };
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return { ok: false, unknown: true };
  const item = items[0];
  if (!item || typeof item !== "object") return { ok: false, unknown: false };
  const rec = item as Record<string, unknown>;
  const id = String(rec.contentid ?? rec.contentId ?? "").trim();
  const title = String(rec.title ?? "").trim();
  if (id !== contentId || !title) return { ok: false, unknown: false };
  return { ok: true, hit: { title, year: "" } };
}

function primaryQuery(resolved: ResolvedPlace): string {
  if (resolved.mode === "festival") return resolved.query;
  return sanitizeQuery(`${resolved.query} 여행 브이로그`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("Origin") ?? "";
    if (!originAllowed(origin)) return json(req, { success: false, error: "forbidden_origin" }, 403);
    return new Response("ok", { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return json(req, { success: false, error: "method not allowed" }, 405);
  if (!hasBearerJwt(req)) return json(req, { success: false, error: "unauthorized" }, 401);

  const origin = req.headers.get("Origin") ?? "";
  if (!originAllowed(origin)) return json(req, { success: false, error: "forbidden_origin" }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { success: false, error: "invalid json" }, 400);
  }

  const rawPlaceId = String(body.placeId ?? "").trim();
  if (FREE_SEARCH_ID_RE.test(rawPlaceId)) {
    return json(req, { success: false, error: "bad_place_id" }, 400);
  }
  const festivalMatch = rawPlaceId.match(/^festival:(\d{1,32})$/);
  const scenicDigits = rawPlaceId.match(/^scenic:(\d{1,32})$/);
  const festivalId = festivalMatch ? festivalMatch[1] : "";
  const scenicId = scenicDigits && !SCENIC[scenicDigits[1]] ? scenicDigits[1] : "";

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  ) as unknown as AdminClient;

  let resolved: ResolvedPlace | null = festivalId || scenicId ? null : resolveStaticPlace(rawPlaceId);
  try {
    if (festivalId && !resolved) {
      const hit = await festivalDetailHit(supabaseAdmin, festivalId);
      if (hit) resolved = resolvedFromTitle(`festival:${festivalId}`, hit, "festival");
    }
    if (scenicId && !resolved) {
      const hit = await attractionHit(supabaseAdmin, scenicId) ?? await festivalDetailHit(supabaseAdmin, scenicId);
      if (hit) resolved = resolvedFromTitle(`scenic:${scenicId}`, hit, "place");
    }
  } catch {
    logFail(rawPlaceId, "tour_cache_read_failed", null);
    return json(req, { success: false, error: "cache_unavailable" }, 503);
  }

  const placeId = resolved?.placeId
    || (festivalId ? `festival:${festivalId}` : scenicId ? `scenic:${scenicId}` : "");
  if (!placeId) return json(req, { success: false, error: "bad_place_id" }, 400);

  const pageToken = typeof body.pageToken === "string" && body.pageToken.trim()
    ? body.pageToken.trim()
    : "";
  const skipUpsert = Boolean(pageToken) || body.skipUpsert === true;
  const maxResults = clampMaxResults(body.maxResults, { raiseCap: skipUpsert && !pageToken });
  const langRaw = typeof body.relevanceLanguage === "string" ? body.relevanceLanguage.trim().toLowerCase() : "";
  const relevanceLanguage = langRaw === "en" || langRaw === "ko" ? langRaw : "ko";
  const regionRaw = typeof body.regionCode === "string" ? body.regionCode.trim().toUpperCase() : "";
  const regionCode = /^[A-Z]{2}$/.test(regionRaw)
    ? regionRaw
    : relevanceLanguage === "en"
      ? "US"
      : "KR";

  const loaded = await supabaseAdmin
    .from("place_videos")
    .select("videos, fail_count, last_error, next_retry_at, last_updated")
    .eq("place_id", placeId)
    .maybeSingle();
  if (loaded.error) {
    logFail(placeId, "place_videos_read_failed", null);
    return json(req, { success: false, error: "cache_unavailable" }, 503);
  }
  const row = loaded.data as PlaceVideoRow | null;

  if (!skipUpsert && rowFresh(row)) {
    const retryAt = row?.next_retry_at && Date.parse(row.next_retry_at) > Date.now()
      ? row.next_retry_at
      : null;
    return json(req, {
      success: true,
      videos: preservedVideos(row),
      nextPageToken: null,
      paginationSource: null,
      retry_after: retryAt,
    }, 200);
  }

  const ip = clientIp(req);
  const pagination = Boolean(pageToken) || body.skipUpsert === true;
  const charge = async (
    key: string,
    windowSeconds: number,
    limit: number,
    cost: number,
    limitedCode: string,
  ) => {
    const hit = await supabaseAdmin.rpc("edge_rate_limit_hit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_limit: limit,
      p_cost: cost,
    });
    if (hit.error) {
      logFail(placeId, "rate_limit_rpc_failed", null);
      return json(req, { success: false, error: "rate_limit_unavailable" }, 503);
    }
    if (hit.data !== true) {
      logFail(placeId, limitedCode, null);
      return json(req, { success: false, error: limitedCode }, 429);
    }
    return null;
  };

  const preGates: Array<[string, number, number, string]> = [
    [`ip:${ip}:m`, 60, LIMIT_IP_PER_MINUTE, "rate_limited"],
  ];
  if (pagination) {
    preGates.push([`page:ip:${ip}:${placeId}`, 86400, LIMIT_PAGE_IP_PLACE, "page_ip_limited"]);
    preGates.push([`page:place:${placeId}`, 86400, LIMIT_PAGE_PLACE, "page_place_limited"]);
  } else {
    preGates.push([`place:${placeId}:new:d`, 86400, LIMIT_PLACE_NEW_PER_DAY, "rate_limited"]);
  }
  for (const [key, windowSeconds, limit, code] of preGates) {
    const denied = await charge(key, windowSeconds, limit, 1, code);
    if (!denied) continue;
    // Per-minute rejection still shows videos already stored for this place.
    if (key.endsWith(":m")) {
      const videos = preservedVideos(row);
      if (!skipUpsert && videos.length > 0) {
        return json(req, {
          success: true,
          videos,
          stale: true,
          nextPageToken: null,
          paginationSource: null,
        }, 200);
      }
    }
    return denied;
  }

  const youtubeApiKey = Deno.env.get("VITE_YOUTUBE_API_KEY") || Deno.env.get("YOUTUBE_API_KEY");
  if (!resolved && (festivalId || scenicId) && !youtubeApiKey) {
    logFail(placeId, "youtube_key_missing", null);
    return json(req, { success: false, error: "youtube_not_configured" }, 500);
  }

  const chargeDetailUnits = async () => {
    const gates: Array<[string, number, string]> = [
      [`ip:${ip}:detail`, LIMIT_DETAIL_IP_UNITS, "rate_limited"],
      ["global:detail:u", LIMIT_DETAIL_GLOBAL_UNITS, "rate_limited"],
    ];
    for (const [key, limit, code] of gates) {
      const hit = await supabaseAdmin.rpc("edge_rate_limit_hit", {
        p_key: key,
        p_window_seconds: 86400,
        p_limit: limit,
        p_cost: YT_SEARCH_UNITS,
      });
      if (hit.error) throw new YtError(503, "rate_limit_unavailable");
      if (hit.data !== true) throw new LimitError(code);
    }
  };

  const chargeSearchUnits = async () => {
    const gates: Array<[string, number, string]> = [
      [`ip:${ip}:u`, ipDailyUnits(), "ip_quota"],
      ["global:yt:u", LIMIT_GLOBAL_UNITS, "global_quota"],
    ];
    for (const [key, limit, code] of gates) {
      const hit = await supabaseAdmin.rpc("edge_rate_limit_hit", {
        p_key: key,
        p_window_seconds: 86400,
        p_limit: limit,
        p_cost: YT_SEARCH_UNITS,
      });
      if (hit.error) throw new YtError(503, "rate_limit_unavailable");
      if (hit.data !== true) throw new LimitError(code);
    }
  };

  const staleVideos = () => {
    const videos = preservedVideos(row);
    if (skipUpsert || videos.length === 0) return null;
    return json(req, {
      success: true,
      videos,
      stale: true,
      nextPageToken: null,
      paginationSource: null,
    }, 200);
  };

  try {
    if (!resolved && festivalId) {
      const hit = await festivalListHit(supabaseAdmin, festivalId);
      if (hit) resolved = resolvedFromTitle(`festival:${festivalId}`, hit, "festival");
    }
    if (!resolved && scenicId) {
      await chargeDetailUnits();
      const proxied = await proxyDetailHit(scenicId);
      if (proxied.ok) {
        resolved = resolvedFromTitle(`scenic:${scenicId}`, proxied.hit, "place");
      } else if (proxied.unknown) {
        const existing = preservedVideos(row);
        const { error } = await supabaseAdmin.from("place_videos").upsert({
          place_id: placeId,
          videos: existing,
          last_updated: existing.length
            ? (row?.last_updated ?? new Date().toISOString())
            : new Date().toISOString(),
          last_error: "unknown_content",
          fail_count: 0,
          next_retry_at: new Date(Date.now() + DAY_MS).toISOString(),
        });
        if (error) logFail(placeId, "place_videos_write_failed", null);
        const stale = staleVideos();
        if (stale) return stale;
        return json(req, { success: false, error: "bad_place_id" }, 400);
      } else {
        const stale = staleVideos();
        if (stale) return stale;
      }
    }
  } catch (error) {
    if (error instanceof LimitError) {
      logFail(placeId, error.code, null);
      const stale = staleVideos();
      if (stale) return stale;
      return json(req, { success: false, error: error.code }, 429);
    }
    if (error instanceof YtError && error.reason === "rate_limit_unavailable") {
      logFail(placeId, "rate_limit_rpc_failed", null);
      return json(req, { success: false, error: "rate_limit_unavailable" }, 503);
    }
    logFail(placeId, "tour_cache_read_failed", null);
    return json(req, { success: false, error: "cache_unavailable" }, 503);
  }
  if (!resolved) return json(req, { success: false, error: "bad_place_id" }, 400);

  const mode = resolved.mode;
  const query = resolved.query;
  const primaryQ = primaryQuery(resolved);
  const fallbackQ = resolved.fallback || primaryQ;
  if (!youtubeApiKey) {
    logFail(placeId, "youtube_key_missing", null);
    return json(req, { success: false, error: "youtube_not_configured" }, 500);
  }

  const fetchSearch = async (q: string, token?: string): Promise<YtSearch> => {
    await chargeSearchUnits();
    const p = new URLSearchParams({
      part: "snippet",
      q,
      maxResults: String(maxResults),
      type: "video",
      relevanceLanguage,
      regionCode,
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      key: youtubeApiKey,
    });
    if (token) p.set("pageToken", token);
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/search?${p.toString()}`);
    } catch {
      throw new YtError(502, "youtube_network");
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errBody = errorData as { error?: { message?: string; errors?: Array<{ reason?: string }> } };
      const reason = errBody.error?.errors?.[0]?.reason || errBody.error?.message || "youtube_error";
      throw new YtError(res.status, String(reason).slice(0, 300));
    }
    return res.json();
  };

  const writeFailure = async (reason: string, emptyPlaceTab: boolean) => {
    if (skipUpsert) return;
    const nextFail = Math.min(1000, Math.max(0, Number(row?.fail_count ?? 0)) + 1);
    const ms = emptyPlaceTab ? 3 * DAY_MS : backoffMs(nextFail);
    const { error } = await supabaseAdmin.from("place_videos").upsert({
      place_id: placeId,
      videos: preservedVideos(row),
      last_updated: row?.last_updated ?? new Date().toISOString(),
      last_error: reason.slice(0, 300),
      fail_count: nextFail,
      next_retry_at: new Date(Date.now() + ms).toISOString(),
    });
    if (error) logFail(placeId, "place_videos_write_failed", null);
  };

  let data: YtSearch;
  let paginationSource: "primary" | "fallback" | null = null;
  try {
    if (pageToken) {
      const useFallback = body.paginationSource === "fallback";
      const q = useFallback ? fallbackQ : primaryQ;
      data = await fetchSearch(q, pageToken);
      paginationSource = useFallback ? "fallback" : "primary";
    } else {
      data = await fetchSearch(primaryQ);
      paginationSource = "primary";
      if (!data.items || data.items.length === 0) {
        data = await fetchSearch(fallbackQ);
        paginationSource = "fallback";
      }
    }
  } catch (error) {
    if (error instanceof LimitError) {
      logFail(placeId, error.code, null);
      const stale = staleVideos();
      if (stale) return stale;
      return json(req, { success: false, error: error.code }, 429);
    }
    if (error instanceof YtError && error.reason === "rate_limit_unavailable") {
      logFail(placeId, "rate_limit_rpc_failed", null);
      return json(req, { success: false, error: "rate_limit_unavailable" }, 503);
    }
    const yt = error instanceof YtError ? error : new YtError(502, "youtube_network");
    const status = yt.status >= 400 && yt.status <= 599 ? yt.status : 502;
    logFail(placeId, yt.reason, yt.status === 502 && yt.reason === "youtube_network" ? null : yt.status);
    const stale = staleVideos();
    if (stale) return stale;
    return json(req, { success: false, error: yt.reason }, status);
  }

  const tagBase = mode === "festival" ? ["#축제", "#festival"] : ["#여행", "#vlog"];
  const excludeSet = new Set<string>();
  // Forged excludes on the first search must not empty the cached row (72h negative cache).
  if (skipUpsert && Array.isArray(body.excludeVideoIds)) {
    for (const rawId of body.excludeVideoIds) {
      if (typeof rawId === "string" && rawId.trim()) excludeSet.add(rawId.trim());
    }
  }

  const mapSnippetItems = (items: YtItem[]) =>
    (items || []).map((item) => ({
      id: item?.id?.videoId,
      title: decodeHtmlEntities(item?.snippet?.title || ""),
      location_keyword: query,
      channelTitle: item?.snippet?.channelTitle || null,
      publishedAt: item?.snippet?.publishedAt || null,
      ai_context: {
        summary: item?.snippet?.description || "영상 설명이 없습니다.",
        tags: [`#${query}`, ...tagBase],
        best_moment: { time: "00:00", desc: "자동 생성된 영상" },
        timeline: [],
      },
    })).filter((v) => Boolean(v.id));

  let collected = mapSnippetItems(data.items || []);
  if (excludeSet.size > 0) {
    collected = collected.filter((v) => v.id && !excludeSet.has(v.id));
  }

  const nextPageToken = typeof data.nextPageToken === "string" && data.nextPageToken
    ? data.nextPageToken
    : null;
  const videosToCache = collected.slice(0, maxResults);
  const paginationSourceOut = nextPageToken && paginationSource ? paginationSource : null;

  if (!skipUpsert && videosToCache.length === 0) {
    const placeTabEmpty = mode !== "festival" && !placeId.includes(":");
    await writeFailure("empty", placeTabEmpty);
    return json(req, {
      success: true,
      videos: preservedVideos(row),
      nextPageToken: null,
      paginationSource: null,
      retry_after: null,
    }, 200);
  }

  if (!skipUpsert) {
    const { error: dbError } = await supabaseAdmin.from("place_videos").upsert({
      place_id: placeId,
      videos: videosToCache,
      last_updated: new Date().toISOString(),
      last_error: null,
      fail_count: 0,
      next_retry_at: null,
    });
    if (dbError) {
      logFail(placeId, "place_videos_write_failed", null);
      return json(req, { success: false, error: "cache_write_failed" }, 500);
    }
  }

  return json(req, {
    success: true,
    videos: videosToCache,
    nextPageToken,
    paginationSource: paginationSourceOut,
  }, 200);
});
