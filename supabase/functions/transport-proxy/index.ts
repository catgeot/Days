// TAGO transport card. Separate from tourapi-proxy (KorService2): different
// upstream paths, bus same-day rule, and route cache. CORS and verify_jwt
// match tourapi-proxy (public POST, no JWT).
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DESTINATION_ORDER, DESTINATIONS, TAGO_OPS } from "./catalog.mjs";
import {
  MAX_UPSTREAM_PER_REQUEST,
  buildFestivalTransportCard,
  cacheFresh,
  cardCacheFresh,
  cardCacheKey,
  itemsFromTagoBody,
  kstYmd,
  parseDateInput,
  planQueries,
  redactSecrets,
  serverTimingHeader,
  splitSentinel,
  trainDateAllowed,
} from "./normalize.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "Server-Timing",
};

const UPSTREAM_CONCURRENCY = 8;
const PAGE_ROWS = 100;
const IP_PER_MINUTE = 6;
const GLOBAL_PER_MINUTE = 30;

function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip")?.trim() ?? "";
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const cleaned = (cf || xff).replace(/[^0-9a-fA-F:.]/g, "").slice(0, 64);
  return cleaned || "unknown";
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

async function allowRequest(sb: ReturnType<typeof serviceClient>, ip: string) {
  const gates: Array<[string, number, number]> = [
    [`transport:ip:${ip}:m`, 60, IP_PER_MINUTE],
    ["transport:global:m", 60, GLOBAL_PER_MINUTE],
  ];
  let hits;
  try {
    hits = await Promise.all(gates.map(([key, windowSeconds, limit]) => sb!.rpc("edge_rate_limit_hit", {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_limit: limit,
      p_cost: 1,
    })));
  } catch {
    return "unavailable" as const;
  }
  if (hits.some((hit) => hit.error)) return "unavailable" as const;
  if (hits.some((hit) => hit.data !== true)) return "limited" as const;
  return "ok" as const;
}

type RouteRow = {
  queried: boolean;
  ok: boolean;
  items: Record<string, unknown>[];
  totalCount: number;
  rawCount: number;
  fromCache: boolean;
  resultCode: string;
  resultMsg?: string;
};

type CacheQuery = { key: string; mode: string; depId: string; arrId: string; date: string };

async function readCacheBatch(
  sb: NonNullable<ReturnType<typeof serviceClient>>,
  queries: CacheQuery[],
) {
  const hits = new Map<string, RouteRow>();
  if (!queries.length) return hits;
  const { data, error } = await sb
    .from("tago_route_cache")
    .select("cache_key, payload, fetched_at")
    .in("cache_key", queries.map((query) => query.key));
  if (error || !data) return hits;
  const byKey = new Map(queries.map((query) => [query.key, query]));
  for (const row of data) {
    const query = byKey.get(String(row.cache_key));
    if (!query) continue;
    if (!cacheFresh(query.mode, String(row.fetched_at), query.date)) continue;
    const payload = row.payload as { items?: unknown; totalCount?: number; resultCode?: string } | null;
    const items = Array.isArray(payload?.items) ? payload.items as Record<string, unknown>[] : [];
    hits.set(query.key, {
      queried: true,
      ok: true,
      items,
      totalCount: Number(payload?.totalCount ?? items.length),
      rawCount: items.length,
      fromCache: true,
      resultCode: String(payload?.resultCode ?? "00"),
    });
  }
  return hits;
}

async function writeCacheBatch(
  sb: NonNullable<ReturnType<typeof serviceClient>>,
  rows: Array<{ query: CacheQuery; row: RouteRow }>,
) {
  if (!rows.length) return;
  const fetchedAt = new Date().toISOString();
  const { error } = await sb.from("tago_route_cache").upsert(rows.map(({ query, row }) => ({
    cache_key: query.key,
    mode: query.mode,
    dep_id: query.depId,
    arr_id: query.arrId,
    service_date: query.date,
    payload: { items: row.items, totalCount: row.totalCount, resultCode: row.resultCode },
    fetched_at: fetchedAt,
  })), { onConflict: "cache_key" });
  if (error) console.error("[transport-proxy] cache write", error.message);
}

type StoredCard = {
  card: Record<string, unknown>;
  queries: Array<Record<string, unknown>>;
  legCount: number;
};

async function readCardCache(
  sb: NonNullable<ReturnType<typeof serviceClient>>,
  key: string,
  busDate: string,
) {
  try {
    const { data, error } = await sb
      .from("tago_card_cache")
      .select("payload, fetched_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (error || !data) return null;
    if (!cardCacheFresh(String(data.fetched_at), busDate)) return null;
    const payload = data.payload as StoredCard | null;
    if (!payload?.card || payload.card.ok !== true) return null;
    return payload;
  } catch {
    return null;
  }
}

async function writeCardCache(
  sb: NonNullable<ReturnType<typeof serviceClient>>,
  row: { key: string; contentId: string; busDate: string; trainDate: string; payload: StoredCard },
) {
  const { error } = await sb.from("tago_card_cache").upsert({
    cache_key: row.key,
    content_id: row.contentId,
    bus_date: row.busDate,
    train_date: row.trainDate,
    payload: row.payload,
    fetched_at: new Date().toISOString(),
  }, { onConflict: "cache_key" });
  if (error) console.error("[transport-proxy] card cache", error.message);
}

async function fetchPage(serviceKey: string, query: { mode: string; depId: string; arrId: string; date: string }, pageNo: number) {
  const spec = TAGO_OPS[query.mode as keyof typeof TAGO_OPS];
  const qs = new URLSearchParams({
    _type: "json",
    numOfRows: String(PAGE_ROWS),
    pageNo: String(pageNo),
    [spec.depParam]: query.depId,
    [spec.arrParam]: query.arrId,
    depPlandTime: query.date.replace(/-/g, ""),
  });
  const url = `https://apis.data.go.kr/1613000/${spec.service}/${spec.op}?serviceKey=${encodeURIComponent(serviceKey)}&${qs}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  const parsed = itemsFromTagoBody(json);
  parsed.resultMsg = redactSecrets(parsed.resultMsg, serviceKey);
  if (!parsed.ok && /serviceKey|SERVICE_KEY/i.test(text)) {
    parsed.resultMsg = "upstream rejected";
  }
  return { httpStatus: res.status, ...parsed };
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "POST required" }, 405);

  const marks = { rl: 0, cache: 0, upstream: 0, build: 0 };
  let cacheDesc = "";
  const respond = (body: unknown, status = 200, extra: Record<string, string> = {}) => jsonResponse(body, status, {
    "Server-Timing": serverTimingHeader(marks, { cacheDesc }),
    ...extra,
  });
  async function span<T>(name: keyof typeof marks, fn: () => Promise<T>): Promise<T> {
    const started = performance.now();
    try {
      return await fn();
    } finally {
      marks[name] += performance.now() - started;
    }
  }

  try {
    const declared = Number(req.headers.get("content-length") || "0");
    if (declared > 8000) return respond({ ok: false, error: "body too large" }, 400);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const contentId = String(body.contentId ?? body.festivalId ?? "").trim();
    if (!/^\d{1,12}$/.test(contentId)) {
      return respond({ ok: false, error: "contentId required" }, 400);
    }
    const destination = DESTINATIONS[contentId as keyof typeof DESTINATIONS];
    if (!destination) {
      return respond({
        ok: false,
        error: "unknown contentId",
        knownContentIds: DESTINATION_ORDER,
      }, 400);
    }

    const today = kstYmd();
    const requestedTrain = body.trainDate == null || body.trainDate === ""
      ? today
      : parseDateInput(body.trainDate);
    if (!requestedTrain || !trainDateAllowed(requestedTrain, today)) {
      return respond({ ok: false, error: "trainDate must be today through +60 days (KST)" }, 400);
    }
    const busDateIgnored = body.busDate != null && body.busDate !== "";
    const plan = planQueries(destination, { trainDate: requestedTrain, busDate: today });

    const serviceKey = Deno.env.get("TOUR_API_SERVICE_KEY")?.trim();
    if (!serviceKey) {
      return respond({ ok: false, error: "TOUR_API_SERVICE_KEY is not configured" }, 500);
    }
    const sb = serviceClient();
    if (!sb) return respond({ ok: false, error: "rate_limit_unavailable" }, 503);

    const cardKey = cardCacheKey(contentId, today, requestedTrain);
    const [gate, stored] = await Promise.all([
      span("rl", () => allowRequest(sb, clientIp(req))),
      span("cache", () => readCardCache(sb, cardKey, today)),
    ]);
    if (gate === "limited") {
      return respond({ ok: false, error: "rate_limited" }, 429, { "Retry-After": "60" });
    }
    if (gate === "unavailable") {
      return respond({ ok: false, error: "rate_limit_unavailable" }, 503);
    }
    if (
      stored
      && stored.card.trainDate === requestedTrain
      && stored.card.busDate === today
      && stored.card.contentId === contentId
    ) {
      cacheDesc = "card";
      const queries = Array.isArray(stored.queries) ? stored.queries : [];
      return respond({
        ...stored.card,
        busDateIgnored,
        upstreamCalls: 0,
        cacheHits: Number(stored.legCount) || plan.queries.length,
        queries: queries.map((query) => ({ ...query, fromCache: true })),
      });
    }
    cacheDesc = "legs";

    let upstreamCalls = 0;
    let cacheHits = 0;
    const results: Record<string, RouteRow> = {};
    const queryMeta: Array<Record<string, unknown>> = [];
    const pendingWrites: Array<{ query: CacheQuery; row: RouteRow }> = [];

    const cached = await span("cache", () => readCacheBatch(sb, plan.queries));
    const misses = [];
    for (const query of plan.queries) {
      const hit = cached.get(query.key);
      if (!hit) {
        misses.push(query);
        continue;
      }
      cacheHits += 1;
      results[query.key] = hit;
      const sentinel = splitSentinel(hit.items);
      queryMeta.push({
        key: query.key,
        mode: query.mode,
        date: query.date,
        fromCache: true,
        resultCode: hit.resultCode,
        itemCount: sentinel.kept.length,
        droppedSentinel: sentinel.droppedSentinel,
      });
    }

    await span("upstream", () => mapPool(misses, UPSTREAM_CONCURRENCY, async (query) => {
      if (upstreamCalls >= MAX_UPSTREAM_PER_REQUEST) {
        results[query.key] = {
          queried: false,
          ok: false,
          items: [],
          totalCount: 0,
          rawCount: 0,
          fromCache: false,
          resultCode: "",
          resultMsg: "upstream_budget",
        };
        queryMeta.push({ key: query.key, mode: query.mode, date: query.date, skipped: "upstream_budget" });
        return;
      }

      upstreamCalls += 1;
      let page;
      try {
        page = await fetchPage(serviceKey, query, 1);
      } catch (error) {
        const message = redactSecrets((error as Error)?.message || "upstream fetch failed", serviceKey);
        console.error("[transport-proxy] upstream", query.key, message);
        results[query.key] = {
          queried: true,
          ok: false,
          items: [],
          totalCount: 0,
          rawCount: 0,
          fromCache: false,
          resultCode: "",
          resultMsg: message,
        };
        queryMeta.push({ key: query.key, mode: query.mode, date: query.date, error: "upstream" });
        return;
      }

      let items = page.items;
      if (page.ok && page.totalCount > items.length && page.totalCount <= 200 && upstreamCalls < MAX_UPSTREAM_PER_REQUEST) {
        upstreamCalls += 1;
        try {
          const second = await fetchPage(serviceKey, query, 2);
          if (second.ok) items = items.concat(second.items);
        } catch (error) {
          const pageMessage = redactSecrets((error as Error)?.message || "", serviceKey);
          console.error("[transport-proxy] upstream page2", query.key, pageMessage);
        }
      }

      const row: RouteRow = {
        queried: true,
        ok: page.ok,
        items: page.ok ? items : [],
        totalCount: page.totalCount,
        rawCount: page.ok ? items.length : 0,
        fromCache: false,
        resultCode: page.resultCode,
        resultMsg: page.resultMsg,
      };
      results[query.key] = row;
      if (page.ok) pendingWrites.push({ query, row });
      const sentinel = splitSentinel(row.items);
      queryMeta.push({
        key: query.key,
        mode: query.mode,
        date: query.date,
        fromCache: false,
        resultCode: page.resultCode || null,
        itemCount: sentinel.kept.length,
        droppedSentinel: sentinel.droppedSentinel,
        truncated: page.ok && page.totalCount > items.length,
      });
    }));
    await span("cache", () => writeCacheBatch(sb, pendingWrites));

    const buildStarted = performance.now();
    const card = buildFestivalTransportCard({
      destination,
      trainDate: requestedTrain,
      busDate: today,
      checkedAt: today,
      results,
    });
    marks.build += performance.now() - buildStarted;

    const complete = !plan.truncatedPlan && plan.queries.every((query) => {
      const row = results[query.key];
      return row?.queried === true && row.ok === true;
    });
    if (complete) {
      await span("cache", () => writeCardCache(sb, {
        key: cardKey,
        contentId,
        busDate: today,
        trainDate: requestedTrain,
        payload: { card, queries: queryMeta, legCount: plan.queries.length },
      }));
    }

    return respond({
      ...card,
      busDateIgnored,
      upstreamCalls,
      cacheHits,
      queries: queryMeta,
    });
  } catch (error) {
    console.error("[transport-proxy]", (error as Error)?.message || "error");
    return respond({ ok: false, error: "transport proxy failed" }, 500);
  }
});
