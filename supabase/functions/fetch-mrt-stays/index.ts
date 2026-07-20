import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MRT_BASE = "https://partner-ext-api.myrealtrip.com";

/** Warm-instance TTL — 콜드스타트 시 비움 */
const REGION_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;

type Region = {
  regionId: number;
  name?: string;
  subName?: string;
  enName?: string;
  type?: string;
};

type StayItem = {
  itemId: number;
  itemName: string;
  salePrice: number | null;
  originalPrice: number | null;
  starRating: number | null;
  reviewScore: string | null;
  reviewCount: number | null;
  imageUrl: string | null;
  productUrl: string;
};

type CacheEntry<T> = { expires: number; value: T };

const regionListCache = new Map<string, CacheEntry<Region[]>>();
const searchCache = new Map<string, CacheEntry<{ items: StayItem[]; totalCount: number }>>();
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

function hasPricedStay(it: { salePrice?: unknown }) {
  const n = Number(it?.salePrice);
  return Number.isFinite(n) && n > 0;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultStayDates() {
  const checkIn = new Date();
  checkIn.setUTCDate(checkIn.getUTCDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setUTCDate(checkOut.getUTCDate() + 2);
  return { checkIn: ymd(checkIn), checkOut: ymd(checkOut) };
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function regionBlob(r: Region) {
  return [r.name, r.subName, r.enName].filter(Boolean).join(" ").toLowerCase();
}

/** Nominatim「대한민국」↔ MRT subName「한국」등 */
function isKoreaLabel(s: string) {
  const n = norm(s);
  return (
    n === "한국" ||
    n === "대한민국" ||
    n === "korea" ||
    n === "south korea" ||
    n === "republic of korea" ||
    n === "kr"
  );
}

/**
 * 국가는 subName 첫 세그먼트 기준.
 * - 코로르 subName "팔라우, 코로르" → OK
 * - 태국 POI "태국, …" / 사르디니아 "이탈리아, …, 팔라우" → 거부
 * - 국내: Nominatim countryHint「대한민국」↔ MRT「한국, 강원」
 * - 해외: countryHints에 한·영을 함께 넘김 (피지↔Fiji)
 */
function countryMatches(r: Region, countryHints: string[]) {
  const hints = (countryHints || []).map(norm).filter(Boolean);
  if (!hints.length) return true;
  const sub = norm(r.subName || "");
  if (!sub) return false;
  const head = sub.split(/[,/|]/)[0]?.trim() || "";
  if (!head) return false;
  for (const c of hints) {
    if (head === c || head.startsWith(c) || c.startsWith(head)) return true;
    if (isKoreaLabel(c) && isKoreaLabel(head)) return true;
  }
  return false;
}

function collectCountryHints(countryHint: string, countryHintAlts: string[]) {
  return uniqueKeywords([countryHint, ...(countryHintAlts || [])]);
}

/**
 * 시·군·도 힌트 — subName/name에 포함되면 OK.
 * 예: cityHints=["춘천","강원"] → "한국, 강원, 춘천" OK · "한국, 경북, 안동" 거부
 */
function cityMatches(r: Region, cityHints: string[]) {
  if (!cityHints?.length) return true;
  const blob = regionBlob(r);
  if (!blob) return false;
  for (const raw of cityHints) {
    const h = norm(raw);
    if (!h || h.length < 2) continue;
    if (blob.includes(h)) return true;
  }
  return false;
}

/** countryHint·cityHints로 동명 이국/타시 오탐 억제 */
function scoreRegion(
  r: Region,
  keyword: string,
  countryHints: string[],
  cityHints: string[],
): number {
  let score = 0;
  const kw = norm(keyword);
  const name = norm(r.name || "");

  if (r.type === "CITY") score += 30;
  else if (r.type === "NEIGHBORHOOD") score += 15;
  else if (r.type === "AIRPORT") score += 8;
  else if (r.type === "POINT_OF_INTEREST") score += 0;

  if (name === kw) score += 12;
  else if (name.includes(kw) || kw.includes(name)) score += 4;

  if (countryHints.length) {
    if (countryMatches(r, countryHints)) score += 55;
    else score -= 45;
  }

  if (cityHints.length) {
    if (cityMatches(r, cityHints)) score += 40;
    else score -= 50;
  }

  return score;
}

function pickRegion(
  regions: Region[],
  keyword: string,
  countryHints: string[],
  cityHints: string[],
  isDomestic: boolean,
): Region | null {
  if (!regions?.length) return null;

  let best: Region | null = null;
  let bestScore = -Infinity;
  for (const r of regions) {
    const s = scoreRegion(r, keyword, countryHints, cityHints);
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  }

  if (!best) return null;

  // 국가 힌트가 있는데 후보 전부가 불일치면 재시도 유도
  if (countryHints.length && !countryMatches(best, countryHints) && bestScore < 20) {
    return null;
  }

  // 국내만 시·군 하드 거부 (퇴계동→안동). 해외는 Nominatim state(Western Division 등)가
  // MRT blob에 없어 피지 등 국가 단위 검색이 전부 탈락하는 경우가 있음 → 점수만 반영
  if (isDomestic && cityHints.length && !cityMatches(best, cityHints)) {
    return null;
  }

  return best;
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

async function fetchRegionList(
  apiKey: string,
  isDomestic: boolean,
  keyword: string,
): Promise<Region[]> {
  const cacheKey = `ac:${isDomestic ? "d" : "i"}:${norm(keyword)}`;
  const hit = getCached(regionListCache, cacheKey);
  if (hit) return hit;

  return withDedupe(cacheKey, async () => {
    const cached = getCached(regionListCache, cacheKey);
    if (cached) return cached;

    const ac = await mrtPost("/v1/products/accommodation/region-autocomplete", apiKey, {
      keyword,
      isDomestic,
    });
    const acResult = ac.data?.result || {};
    if (ac.status !== 200 || acResult.status !== 200) {
      return [];
    }
    const regions = (ac.data?.data?.regions || []) as Region[];
    setCached(regionListCache, cacheKey, regions, REGION_CACHE_TTL_MS);
    return regions;
  });
}

async function resolveRegion(
  apiKey: string,
  isDomestic: boolean,
  keywords: string[],
  countryHints: string[],
  cityHints: string[],
): Promise<{ region: Region | null; usedKeyword: string | null }> {
  for (const kw of keywords) {
    const regions = await fetchRegionList(apiKey, isDomestic, kw);
    if (!regions.length) continue;
    const region = pickRegion(regions, kw, countryHints, cityHints, isDomestic);
    if (region?.regionId) {
      return { region, usedKeyword: kw };
    }
  }
  return { region: null, usedKeyword: null };
}

async function searchStays(
  apiKey: string,
  params: {
    regionId: number;
    checkIn: string;
    checkOut: string;
    adultCount: number;
    childCount: number;
    page: number;
    size: number;
  },
): Promise<{ ok: true; items: StayItem[]; totalCount: number } | { ok: false; detail: string }> {
  const {
    regionId,
    checkIn,
    checkOut,
    adultCount,
    childCount,
    page,
    size,
  } = params;
  const cacheKey =
    `search:${regionId}|${checkIn}|${checkOut}|${adultCount}|${childCount}|${size}|${page}`;
  const hit = getCached(searchCache, cacheKey);
  if (hit) return { ok: true, ...hit };

  return withDedupe(cacheKey, async () => {
    const cached = getCached(searchCache, cacheKey);
    if (cached) return { ok: true, ...cached };

    const search = await mrtPost("/v1/products/accommodation/search", apiKey, {
      regionId,
      checkIn,
      checkOut,
      adultCount,
      childCount,
      page,
      size,
    });
    const searchResult = search.data?.result || {};
    if (search.status !== 200 || searchResult.status !== 200) {
      return {
        ok: false as const,
        detail: searchResult.message || `HTTP ${search.status}`,
      };
    }

    const rawItems = (search.data?.data?.items || []) as Array<Record<string, unknown>>;
    // 가격 있는(해당 일정 예약 가능) 숙소 우선 · 가격 없는 숙소도 유지
    // (오지·박재고 지역에서 「취급 없음」 오해 방지 — 일정 조정 후 예약 유도)
    const mapped: StayItem[] = rawItems
      .filter((it) => it?.itemId != null && it?.productUrl)
      .map((it) => ({
        itemId: Number(it.itemId),
        itemName: String(it.itemName || ""),
        salePrice: hasPricedStay(it) ? Number(it.salePrice) : null,
        originalPrice: it.originalPrice != null ? Number(it.originalPrice) : null,
        starRating: it.starRating != null ? Number(it.starRating) : null,
        reviewScore: it.reviewScore != null ? String(it.reviewScore) : null,
        reviewCount: it.reviewCount != null ? Number(it.reviewCount) : null,
        imageUrl: it.imageUrl ? String(it.imageUrl) : null,
        productUrl: String(it.productUrl),
      }));
    const items = mapped.sort((a, b) => {
      const ap = a.salePrice != null && a.salePrice > 0 ? 1 : 0;
      const bp = b.salePrice != null && b.salePrice > 0 ? 1 : 0;
      return bp - ap;
    });

    const payload = {
      items,
      totalCount: Number(search.data?.data?.totalCount ?? items.length),
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

    const isDomestic = Boolean(body?.isDomestic);
    const countryHint = String(body?.countryHint ?? "").trim();
    const countryHintAlts = Array.isArray(body?.countryHintAlts)
      ? body.countryHintAlts.map((k: unknown) => String(k ?? "").trim())
      : [];
    const countryHints = collectCountryHints(countryHint, countryHintAlts);
    const nameEn = String(body?.nameEn ?? "").trim();
    const altKeywords = Array.isArray(body?.altKeywords)
      ? body.altKeywords.map((k: unknown) => String(k ?? "").trim())
      : [];
    const cityHints = uniqueKeywords(
      Array.isArray(body?.cityHints)
        ? body.cityHints.map((k: unknown) => String(k ?? "").trim())
        : [],
    ).slice(0, 8);

    // countryHint·cityHints는 scoreRegion 필터 전용 — 검색 키워드에 넣지 않음
    const keywords = uniqueKeywords([
      keyword,
      ...altKeywords,
      nameEn,
    ]);

    const defaults = defaultStayDates();
    const checkIn = String(body?.checkIn || defaults.checkIn);
    const checkOut = String(body?.checkOut || defaults.checkOut);
    const adultCount = Math.max(1, Math.min(8, Number(body?.adultCount) || 2));
    const childCount = Math.max(0, Math.min(8, Number(body?.childCount) || 0));
    const size = Math.max(1, Math.min(20, Number(body?.size) || 20));
    const page = Math.max(0, Number(body?.page) || 0);

    const { region, usedKeyword } = await resolveRegion(
      apiKey,
      isDomestic,
      keywords,
      countryHints,
      cityHints,
    );

    if (!region?.regionId) {
      return jsonResponse({
        ok: true,
        region: null,
        items: [],
        checkIn,
        checkOut,
        totalCount: 0,
        usedKeyword,
      });
    }

    const search = await searchStays(apiKey, {
      regionId: region.regionId,
      checkIn,
      checkOut,
      adultCount,
      childCount,
      page,
      size,
    });

    if (!search.ok) {
      return jsonResponse({
        ok: false,
        error: "accommodation/search failed",
        detail: search.detail,
        region: {
          regionId: region.regionId,
          name: region.name ?? null,
          subName: region.subName ?? null,
          type: region.type ?? null,
        },
      }, 502);
    }

    return jsonResponse({
      ok: true,
      region: {
        regionId: region.regionId,
        name: region.name ?? null,
        subName: region.subName ?? null,
        type: region.type ?? null,
      },
      items: search.items,
      checkIn,
      checkOut,
      adultCount,
      childCount,
      totalCount: search.totalCount,
      usedKeyword,
    });
  } catch (err) {
    console.error("[fetch-mrt-stays]", err);
    return jsonResponse({
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    }, 500);
  }
});
