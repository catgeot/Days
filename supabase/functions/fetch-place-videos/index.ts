import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import canonicalPlaceIdMap from "../_shared/canonicalPlaceIdMap.json" with { type: "json" };

const corsBase = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const DAY_MS = 24 * 60 * 60 * 1000;
const QUERY_MAX_CHARS = 180;
// pageToken/skipUpsert는 신규 검색(placeId 일 2)과 따로 둔다. brief는 숫자만 비워 두었다.
// 장소 탭 더 보기의 세션 상한이 3이라, 장소당 하루 6으로 둔다.
const LIMIT_IP_PER_MINUTE = 6;
const LIMIT_IP_PER_DAY = 60;
const LIMIT_PLACE_NEW_PER_DAY = 2;
const LIMIT_PLACE_PAGE_PER_DAY = 6;
const LIMIT_GLOBAL_PER_DAY = 80;

const PREVIEW_ORIGIN_RE = /^https:\/\/days-git-[a-z0-9-]+-catgeots-projects\.vercel\.app$/;
const FESTIVAL_RE = /^festival:\d{1,32}$/;
const SCENIC_DIGITS_RE = /^scenic:\d{1,32}$/;
// 상세 모달은 contentId가 없는 명소를 scenic:<placeSlug>로 보낸다.
const SCENIC_SLUG_RE = /^scenic:[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WORLD_EVENT_RE = /^world-event:[a-z0-9]+(?:-[a-z0-9]+)*:(?:ko|en)$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FORBIDDEN_QUERY_RES = [
  /https?:\/\//i,
  /javascript:/i,
  /[<>]/,
  /\b(?:site|cache|related|link|inurl|intitle):/i,
  /\b(?:porn|xxx)\b/i,
  /음란|야동|포르노/,
];

const SLUGS = canonicalPlaceIdMap as Record<string, string>;

type DbError = { message?: string; code?: string } | null;
type PlaceVideoRow = {
  videos: unknown[] | null;
  fail_count: number | null;
  last_error: string | null;
  next_retry_at: string | null;
  last_updated: string | null;
};
type AdminClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: PlaceVideoRow | null; error: DbError }>;
      };
    };
    upsert: (payload: Record<string, unknown>) => Promise<{ error: DbError }>;
  };
  rpc: (
    fn: string,
    args: { p_key: string; p_window_seconds: number; p_limit: number },
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

class YtError extends Error {
  status: number;
  reason: string;
  constructor(status: number, reason: string) {
    super(reason);
    this.status = status;
    this.reason = reason;
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

function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const raw = real || fwd || "unknown";
  const cleaned = raw.replace(/[^0-9a-fA-F:.\-]/g, "").slice(0, 64);
  return cleaned || "unknown";
}

function hasControlChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) < 32) return true;
  }
  return false;
}

function queryRejected(q: string): boolean {
  const text = q.trim();
  if (!text || text.length > QUERY_MAX_CHARS || hasControlChar(text)) return true;
  return FORBIDDEN_QUERY_RES.some((re) => re.test(text));
}

function normalizePlaceId(raw: string): string | null {
  const id = raw.trim();
  if (FESTIVAL_RE.test(id)) return id;
  if (SCENIC_DIGITS_RE.test(id)) return id;
  if (SCENIC_SLUG_RE.test(id.toLowerCase())) return id.toLowerCase();
  const world = id.match(/^world-event:([a-z0-9]+(?:-[a-z0-9]+)*):(ko|en)$/i);
  if (world && WORLD_EVENT_RE.test(`world-event:${world[1].toLowerCase()}:${world[2].toLowerCase()}`)) {
    return `world-event:${world[1].toLowerCase()}:${world[2].toLowerCase()}`;
  }
  const slug = id.toLowerCase();
  if (SLUG_RE.test(slug) && Object.hasOwn(SLUGS, slug)) return slug;
  return null;
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

  const placeId = normalizePlaceId(String(body.placeId ?? ""));
  if (!placeId) return json(req, { success: false, error: "bad_place_id" }, 400);

  const queryRaw = String(body.query ?? "");
  if (queryRejected(queryRaw)) return json(req, { success: false, error: "bad_query" }, 400);
  if (body.fallbackQuery != null && String(body.fallbackQuery).trim() && queryRejected(String(body.fallbackQuery))) {
    return json(req, { success: false, error: "bad_query" }, 400);
  }

  const mode = body.mode === "festival" ? "festival" : "place";
  const pageToken = typeof body.pageToken === "string" && body.pageToken.trim()
    ? body.pageToken.trim()
    : "";
  const skipUpsert = Boolean(pageToken) || body.skipUpsert === true;
  const maxResults = clampMaxResults(body.maxResults, { raiseCap: skipUpsert && !pageToken });
  const relevanceLanguage = typeof body.relevanceLanguage === "string" && body.relevanceLanguage.trim()
    ? body.relevanceLanguage.trim()
    : "ko";
  const regionCode = typeof body.regionCode === "string" && body.regionCode.trim()
    ? body.regionCode.trim()
    : relevanceLanguage === "en"
      ? "US"
      : "KR";
  const query = queryRaw.trim();

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  ) as unknown as AdminClient;

  const loaded = await supabaseAdmin
    .from("place_videos")
    .select("videos, fail_count, last_error, next_retry_at, last_updated")
    .eq("place_id", placeId)
    .maybeSingle();
  if (loaded.error) {
    logFail(placeId, "place_videos_read_failed", null);
    return json(req, { success: false, error: "cache_unavailable" }, 503);
  }
  const row = loaded.data;

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

  const youtubeApiKey = Deno.env.get("VITE_YOUTUBE_API_KEY") || Deno.env.get("YOUTUBE_API_KEY");
  if (!youtubeApiKey) {
    logFail(placeId, "youtube_key_missing", null);
    return json(req, { success: false, error: "youtube_not_configured" }, 500);
  }

  const ip = clientIp(req);
  const pagination = Boolean(pageToken) || body.skipUpsert === true;
  const gates: Array<[string, number, number]> = [
    [`ip:${ip}:m`, 60, LIMIT_IP_PER_MINUTE],
    [`ip:${ip}:d`, 86400, LIMIT_IP_PER_DAY],
    pagination
      ? [`place:${placeId}:page:d`, 86400, LIMIT_PLACE_PAGE_PER_DAY]
      : [`place:${placeId}:new:d`, 86400, LIMIT_PLACE_NEW_PER_DAY],
    ["global:yt:d", 86400, LIMIT_GLOBAL_PER_DAY],
  ];
  for (const [key, windowSeconds, limit] of gates) {
    const hit = await supabaseAdmin.rpc("edge_rate_limit_hit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_limit: limit,
    });
    if (hit.error || hit.data !== true) {
      if (hit.error) {
        logFail(placeId, "rate_limit_rpc_failed", null);
        return json(req, { success: false, error: "rate_limit_unavailable" }, 503);
      }
      logFail(placeId, "rate_limited", null);
      return json(req, { success: false, error: "rate_limited" }, 429);
    }
  }

  const primaryQ = mode === "festival" ? query : `${query} 여행 브이로그`;
  const fallbackQ = body.fallbackQuery
    ? String(body.fallbackQuery).trim()
    : (mode === "festival" ? query : `${query} travel vlog`);

  const fetchSearch = async (q: string, token?: string): Promise<YtSearch> => {
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
    const yt = error instanceof YtError ? error : new YtError(502, "youtube_network");
    const status = yt.status >= 400 && yt.status <= 599 ? yt.status : 502;
    await writeFailure(yt.reason, false);
    logFail(placeId, yt.reason, yt.status === 502 && yt.reason === "youtube_network" ? null : yt.status);
    return json(req, { success: false, error: yt.reason }, status);
  }

  const tagBase = mode === "festival" ? ["#축제", "#festival"] : ["#여행", "#vlog"];
  const excludeSet = new Set<string>();
  if (Array.isArray(body.excludeVideoIds)) {
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
