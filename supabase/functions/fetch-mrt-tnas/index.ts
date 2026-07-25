import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MRT_BASE = "https://partner-ext-api.myrealtrip.com";
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;

type TnaItem = {
  gid: string;
  itemName: string;
  salePrice: number | null;
  priceDisplay: string | null;
  category: string | null;
  reviewScore: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  productUrl: string;
};

type CacheEntry<T> = { expires: number; value: T };

const searchCache = new Map<string, CacheEntry<{
  items: TnaItem[];
  totalCount: number;
  page: number;
  perPage: number;
  hasNextPage: boolean;
}>>();
const inflight = new Map<string, Promise<unknown>>();

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const e = map.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expires) {
    map.delete(key);
    return undefined;
  }
  return e.value;
}

function setCached<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number) {
  map.set(key, { expires: Date.now() + ttlMs, value });
}

async function withDedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function uniqueKeywords(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const k = String(raw || "").trim();
    if (!k || k.length > 100) continue;
    const key = norm(k);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
  }
  return out;
}

async function mrtPost(path: string, apiKey: string, body: Record<string, unknown>) {
  const res = await fetch(`${MRT_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function mapTnaItems(rawItems: Array<Record<string, unknown>>): TnaItem[] {
  const mapped: TnaItem[] = [];
  for (const it of rawItems) {
    const gid = String(it?.gid ?? it?.itemId ?? it?.id ?? "").trim();
    if (!gid) continue;
    const rawUrl = String(
      it?.productUrl || it?.productURL || it?.url || "",
    ).trim();
    const productUrl = rawUrl ||
      `https://experiences.myrealtrip.com/products/${gid}`;
    const salePriceNum = Number(it?.salePrice);
    const reviewScoreNum = Number(it?.reviewScore);
    const reviewCountNum = Number(it?.reviewCount);
    mapped.push({
      gid,
      itemName: String(it?.itemName || it?.title || it?.name || ""),
      salePrice: Number.isFinite(salePriceNum) && salePriceNum > 0 ? salePriceNum : null,
      priceDisplay: it?.priceDisplay != null ? String(it.priceDisplay) : null,
      category: it?.category != null ? String(it.category) : null,
      reviewScore: Number.isFinite(reviewScoreNum) ? reviewScoreNum : null,
      reviewCount: Number.isFinite(reviewCountNum) ? reviewCountNum : null,
      imageUrl: it?.imageUrl
        ? String(it.imageUrl)
        : (it?.thumbnailUrl ? String(it.thumbnailUrl) : null),
      productUrl,
    });
  }
  return mapped;
}

async function searchTnas(
  apiKey: string,
  params: {
    keyword: string;
    page: number;
    size: number;
    sort?: string;
  },
): Promise<
  | {
    ok: true;
    items: TnaItem[];
    totalCount: number;
    page: number;
    perPage: number;
    hasNextPage: boolean;
  }
  | { ok: false; detail: string; httpStatus: number }
> {
  const { keyword, page, size, sort } = params;
  const cacheKey = `tna:${norm(keyword)}|${page}|${size}|${sort || ""}`;
  const hit = getCached(searchCache, cacheKey);
  if (hit) return { ok: true, ...hit };

  return withDedupe(cacheKey, async () => {
    const cached = getCached(searchCache, cacheKey);
    if (cached) return { ok: true, ...cached };

    const body: Record<string, unknown> = {
      keyword,
      page,
      size,
    };
    if (sort) body.sort = sort;

    const search = await mrtPost("/v1/products/tna/search", apiKey, body);
    const searchResult = search.data?.result || {};
    if (search.status !== 200 || searchResult.status !== 200) {
      return {
        ok: false as const,
        detail: searchResult.message || `HTTP ${search.status}`,
        httpStatus: search.status,
      };
    }

    const dataNode = search.data?.data || {};
    const rawItems = (
      dataNode.items ||
      dataNode.products ||
      search.data?.items ||
      []
    ) as Array<Record<string, unknown>>;
    const items = mapTnaItems(rawItems);
    const totalCount = Number(dataNode.totalCount ?? search.data?.meta?.totalCount ?? items.length);
    const resPage = Number(dataNode.page ?? page);
    const perPage = Number(dataNode.perPage ?? dataNode.size ?? size);
    const hasNextPage = Boolean(
      dataNode.hasNextPage ??
        (Number.isFinite(totalCount) && Number.isFinite(resPage) && Number.isFinite(perPage) &&
          resPage * perPage < totalCount),
    );

    const payload = {
      items,
      totalCount: Number.isFinite(totalCount) ? totalCount : items.length,
      page: Number.isFinite(resPage) ? resPage : page,
      perPage: Number.isFinite(perPage) ? perPage : size,
      hasNextPage,
    };
    setCached(searchCache, cacheKey, payload, SEARCH_CACHE_TTL_MS);
    return { ok: true as const, ...payload };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ ok: false, error: "POST required" }, 405);
    }

    const apiKey = Deno.env.get("MYREALTRIP_API_KEY");
    if (!apiKey) {
      return jsonResponse({ ok: false, error: "MYREALTRIP_API_KEY missing" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const keyword = String(body?.keyword ?? "").trim();
    if (!keyword || keyword.length > 100) {
      return jsonResponse({ ok: false, error: "keyword required (max 100)" }, 400);
    }

    const altKeywords = Array.isArray(body?.altKeywords)
      ? body.altKeywords.map((k: unknown) => String(k ?? "").trim())
      : [];
    const keywords = uniqueKeywords([keyword, ...altKeywords]);
    /** TNA page is 1-based (unlike accommodation 0-based) */
    const page = Math.max(1, Number(body?.page) || 1);
    const size = Math.max(1, Math.min(50, Number(body?.size) || 20));
    const sortRaw = String(body?.sort ?? "").trim();
    const sort = [
      "price_asc",
      "price_desc",
      "review_score_desc",
      "selling_count_desc",
    ].includes(sortRaw)
      ? sortRaw
      : undefined;

    let lastEmpty: {
      items: TnaItem[];
      totalCount: number;
      page: number;
      perPage: number;
      hasNextPage: boolean;
      keywordUsed: string;
    } | null = null;

    for (const kw of keywords) {
      const search = await searchTnas(apiKey, { keyword: kw, page, size, sort });
      if (!search.ok) {
        // Auth / partner scope failures should surface, not silently empty
        if (search.httpStatus === 401 || search.httpStatus === 403) {
          return jsonResponse({
            ok: false,
            error: "tna/search unauthorized",
            detail: search.detail,
          }, 502);
        }
        if (search.httpStatus === 404) {
          return jsonResponse({
            ok: false,
            error: "tna/search not found",
            detail: search.detail,
          }, 502);
        }
        continue;
      }

      if (search.items.length > 0 || search.totalCount > 0) {
        return jsonResponse({
          ok: true,
          items: search.items,
          totalCount: search.totalCount,
          page: search.page,
          perPage: search.perPage,
          hasNextPage: search.hasNextPage,
          keywordUsed: kw,
        });
      }

      lastEmpty = {
        items: search.items,
        totalCount: search.totalCount,
        page: search.page,
        perPage: search.perPage,
        hasNextPage: search.hasNextPage,
        keywordUsed: kw,
      };
    }

    return jsonResponse({
      ok: true,
      items: lastEmpty?.items || [],
      totalCount: lastEmpty?.totalCount || 0,
      page: lastEmpty?.page || page,
      perPage: lastEmpty?.perPage || size,
      hasNextPage: lastEmpty?.hasNextPage || false,
      keywordUsed: lastEmpty?.keywordUsed || keyword,
    });
  } catch (err) {
    console.error("[fetch-mrt-tnas]", err);
    return jsonResponse({
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    }, 500);
  }
});
