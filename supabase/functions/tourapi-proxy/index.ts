import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const KOR_BASE = "https://apis.data.go.kr/B551011/KorService2";
const PHOTO_BASE = "https://apis.data.go.kr/B551011/PhotoGalleryService1";

const ACTIONS = {
  searchKeyword: { base: KOR_BASE, path: "searchKeyword2" },
  detailCommon: { base: KOR_BASE, path: "detailCommon2" },
  detailImage: { base: KOR_BASE, path: "detailImage2" },
  searchPhoto: { base: PHOTO_BASE, path: "gallerySearchList1" },
  searchFestival: { base: KOR_BASE, path: "searchFestival2" },
  areaBasedList: { base: KOR_BASE, path: "areaBasedList2" },
  areaCode: { base: KOR_BASE, path: "areaCode2" },
  detailIntro: { base: KOR_BASE, path: "detailIntro2" },
  detailInfo: { base: KOR_BASE, path: "detailInfo2" },
} as const;

type Action = keyof typeof ACTIONS;

/** Composite cache actions — not direct TourAPI paths */
const CACHE_ACTIONS = new Set(["festivalWindow", "festivalDetail"]);

const MAX_KEYWORD_LEN = 80;
const MAX_CONTENT_ID_LEN = 32;
const DEFAULT_ROWS = 10;
const MAX_ROWS = 50;

const LIST_FRESH_MS = 12 * 60 * 60 * 1000;
const LIST_STALE_MS = 7 * 24 * 60 * 60 * 1000;
const DETAIL_FRESH_MS = 7 * 24 * 60 * 60 * 1000;
const DETAIL_STALE_MS = 30 * 24 * 60 * 60 * 1000;
const FESTIVAL_WINDOW_MAX_PAGES = 12;
const FESTIVAL_WINDOW_PAGE_ROWS = 50;
const FESTIVAL_CONTENT_TYPE_ID = "15";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asItemArray(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (typeof raw === "object") return [raw as Record<string, unknown>];
  return [];
}

function pickStr(item: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = item[k];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function clampRows(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return DEFAULT_ROWS;
  return Math.min(Math.floor(v), MAX_ROWS);
}

function guardKeyword(keyword: unknown): string {
  if (typeof keyword !== "string") {
    throw new Error("keyword is required");
  }
  const k = keyword.trim();
  if (!k) throw new Error("keyword is required");
  if (k.length > MAX_KEYWORD_LEN) {
    throw new Error(`keyword too long (max ${MAX_KEYWORD_LEN})`);
  }
  return k;
}

function guardContentId(contentId: unknown): string {
  if (contentId == null || contentId === "") {
    throw new Error("contentId is required");
  }
  const id = String(contentId).trim();
  if (!/^\d{1,32}$/.test(id) || id.length > MAX_CONTENT_ID_LEN) {
    throw new Error("contentId must be numeric");
  }
  return id;
}

function guardYyyymmdd(value: unknown, field: string): string {
  if (value == null || value === "") {
    throw new Error(`${field} is required`);
  }
  const s = String(value).trim();
  if (!/^\d{8}$/.test(s)) {
    throw new Error(`${field} must be YYYYMMDD`);
  }
  return s;
}

function optionalYyyymmdd(value: unknown, field: string): string | null {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (!/^\d{8}$/.test(s)) {
    throw new Error(`${field} must be YYYYMMDD`);
  }
  return s;
}

function optionalCode(value: unknown, field: string): string | null {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (!/^\d{1,10}$/.test(s)) {
    throw new Error(`${field} must be numeric`);
  }
  return s;
}

function guardContentTypeId(contentTypeId: unknown): string {
  if (contentTypeId == null || contentTypeId === "") {
    throw new Error("contentTypeId is required");
  }
  const id = String(contentTypeId).trim();
  if (!/^\d{1,4}$/.test(id)) {
    throw new Error("contentTypeId must be numeric");
  }
  return id;
}

function normalizeItem(
  action: Action,
  item: Record<string, unknown>,
): Record<string, unknown> {
  const contentId = pickStr(item, "contentid", "contentId");
  const title = pickStr(item, "title", "galTitle");
  const firstimage = pickStr(item, "firstimage", "firstImage", "firstimage2");
  const originimgurl = pickStr(item, "originimgurl", "originImgUrl");
  const smallimageurl = pickStr(item, "smallimageurl", "smallImageUrl");
  const galWebImageUrl = pickStr(item, "galWebImageUrl", "galwebimageurl");
  const overview = pickStr(item, "overview");
  const homepage = pickStr(item, "homepage", "homePage");
  const addr1 = pickStr(item, "addr1", "galPhotographyLocation");
  const mapx = pickStr(item, "mapx", "mapX");
  const mapy = pickStr(item, "mapy", "mapY");
  const contentTypeId = pickStr(item, "contenttypeid", "contentTypeId");
  const galTitle = pickStr(item, "galTitle", "galtitle");
  const photographer = pickStr(
    item,
    "galPhotographer",
    "galphotographer",
    "photographer",
  );
  const eventStartDate = pickStr(item, "eventstartdate", "eventStartDate");
  const eventEndDate = pickStr(item, "eventenddate", "eventEndDate");
  const areaCode = pickStr(item, "areacode", "areaCode");
  const sigunguCode = pickStr(item, "sigungucode", "sigunguCode");
  const tel = pickStr(item, "tel");
  const code = pickStr(item, "code");
  const name = pickStr(item, "name");
  const eventplace = pickStr(item, "eventplace", "eventPlace");
  const playtime = pickStr(item, "playtime", "playTime");
  const usetimefestival = pickStr(item, "usetimefestival", "useTimeFestival");
  const sponsor1 = pickStr(item, "sponsor1");
  const sponsor1tel = pickStr(item, "sponsor1tel", "sponsor1Tel");
  const sponsor2 = pickStr(item, "sponsor2");
  const sponsor2tel = pickStr(item, "sponsor2tel", "sponsor2Tel");
  const eventhomepage = pickStr(item, "eventhomepage", "eventHomepage");
  const program = pickStr(item, "program");
  const agelimit = pickStr(item, "agelimit", "ageLimit");
  const spendtimefestival = pickStr(
    item,
    "spendtimefestival",
    "spendTimeFestival",
  );
  const discountinfofestival = pickStr(
    item,
    "discountinfofestival",
    "discountInfoFestival",
  );
  const bookingplace = pickStr(item, "bookingplace", "bookingPlace");
  const placeinfo = pickStr(item, "placeinfo", "placeInfo");
  const subevent = pickStr(item, "subevent", "subEvent");
  const infoname = pickStr(item, "infoname", "infoName");
  const infotext = pickStr(item, "infotext", "infoText");
  const serialnum = pickStr(item, "serialnum", "serialNum");
  const fldgubun = pickStr(item, "fldgubun", "fldGubun");
  const subnum = pickStr(item, "subnum", "subNum");
  const subcontentid = pickStr(item, "subcontentid", "subContentId");
  const subname = pickStr(item, "subname", "subName");
  const subdetailoverview = pickStr(
    item,
    "subdetailoverview",
    "subDetailOverview",
  );
  const subdetailimg = pickStr(item, "subdetailimg", "subDetailImg");
  const subdetailalt = pickStr(item, "subdetailalt", "subDetailAlt");
  const distance = pickStr(item, "distance");
  const schedule = pickStr(item, "schedule");
  const taketime = pickStr(item, "taketime", "takeTime");
  const theme = pickStr(item, "theme");

  const out: Record<string, unknown> = {};
  if (contentId) out.contentId = contentId;
  if (title) out.title = title;
  if (galTitle && !title) out.title = galTitle;
  if (firstimage) out.firstimage = firstimage;
  if (originimgurl) out.originimgurl = originimgurl;
  if (smallimageurl) out.smallimageurl = smallimageurl;
  if (galWebImageUrl) out.galWebImageUrl = galWebImageUrl;
  if (photographer) {
    out.photographer = photographer;
    out.galPhotographer = photographer;
  }
  if (overview) out.overview = overview;
  if (homepage) out.homepage = homepage;
  if (addr1) out.addr1 = addr1;
  if (mapx) out.mapx = mapx;
  if (mapy) out.mapy = mapy;
  if (contentTypeId) out.contentTypeId = contentTypeId;
  if (eventStartDate) out.eventStartDate = eventStartDate;
  if (eventEndDate) out.eventEndDate = eventEndDate;
  if (areaCode) out.areaCode = areaCode;
  if (sigunguCode) out.sigunguCode = sigunguCode;
  if (tel) out.tel = tel;
  if (code) out.code = code;
  if (name) out.name = name;
  if (eventplace) out.eventplace = eventplace;
  if (playtime) out.playtime = playtime;
  if (usetimefestival) out.usetimefestival = usetimefestival;
  if (sponsor1) out.sponsor1 = sponsor1;
  if (sponsor1tel) out.sponsor1tel = sponsor1tel;
  if (sponsor2) out.sponsor2 = sponsor2;
  if (sponsor2tel) out.sponsor2tel = sponsor2tel;
  if (eventhomepage) out.eventhomepage = eventhomepage;
  if (program) out.program = program;
  if (agelimit) out.agelimit = agelimit;
  if (spendtimefestival) out.spendtimefestival = spendtimefestival;
  if (discountinfofestival) out.discountinfofestival = discountinfofestival;
  if (bookingplace) out.bookingplace = bookingplace;
  if (placeinfo) out.placeinfo = placeinfo;
  if (subevent) out.subevent = subevent;
  if (infoname) out.infoname = infoname;
  if (infotext) out.infotext = infotext;
  if (serialnum) out.serialnum = serialnum;
  if (fldgubun) out.fldgubun = fldgubun;
  if (subnum) out.subnum = subnum;
  if (subcontentid) out.subcontentid = subcontentid;
  if (subname) out.subname = subname;
  if (subdetailoverview) out.subdetailoverview = subdetailoverview;
  if (subdetailimg) out.subdetailimg = subdetailimg;
  if (subdetailalt) out.subdetailalt = subdetailalt;
  if (distance) out.distance = distance;
  if (schedule) out.schedule = schedule;
  if (taketime) out.taketime = taketime;
  if (theme) out.theme = theme;

  if (action === "searchPhoto") {
    const imageUrl = galWebImageUrl || firstimage;
    if (imageUrl) out.imageUrl = imageUrl;
  } else if (action === "detailImage") {
    const imageUrl = originimgurl || smallimageurl || firstimage;
    if (imageUrl) out.imageUrl = imageUrl;
  } else if (
    action !== "areaCode" &&
    action !== "detailIntro" &&
    action !== "detailInfo"
  ) {
    const imageUrl = firstimage || originimgurl || galWebImageUrl;
    if (imageUrl) out.imageUrl = imageUrl;
  }

  return out;
}

const UPSTREAM_TIMEOUT_MS = 10_000;

async function callTourApi(
  action: Action,
  query: Record<string, string>,
  serviceKey: string,
) {
  const { base, path } = ACTIONS[action];
  const params = new URLSearchParams({
    MobileOS: "ETC",
    MobileApp: "gateo",
    _type: "json",
    ...query,
  });
  // serviceKey: raw as_is — do not URLSearchParams-encode (may double-encode)
  const url = `${base}/${path}?serviceKey=${serviceKey}&${params.toString()}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  const text = await res.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    parsed = null;
  }

  const response = parsed?.response as Record<string, unknown> | undefined;
  const header = response?.header as Record<string, unknown> | undefined;
  const body = response?.body as Record<string, unknown> | undefined;
  const itemsWrap = body?.items as Record<string, unknown> | string | undefined;
  const rawItems =
    itemsWrap && typeof itemsWrap === "object"
      ? (itemsWrap as Record<string, unknown>).item
      : undefined;
  const arr = asItemArray(rawItems);
  const resultCode = header?.resultCode != null ? String(header.resultCode) : null;
  const resultMsg = header?.resultMsg != null ? String(header.resultMsg) : null;

  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      message: resultMsg || `TourAPI HTTP ${res.status}`,
      resultCode,
      items: [] as Record<string, unknown>[],
      rawCount: 0,
    };
  }

  if (resultCode && resultCode !== "0000" && resultCode !== "0") {
    return {
      ok: false as const,
      status: res.status,
      message: resultMsg || `TourAPI resultCode ${resultCode}`,
      resultCode,
      items: [] as Record<string, unknown>[],
      rawCount: 0,
    };
  }

  const totalCount = Number(body?.totalCount ?? arr.length) || arr.length;
  return {
    ok: true as const,
    status: res.status,
    message: resultMsg || "OK",
    resultCode: resultCode || "0000",
    items: arr.map((it) => normalizeItem(action, it)),
    rawCount: totalCount,
  };
}

function buildUpstreamQuery(
  action: Action,
  body: Record<string, unknown>,
): Record<string, string> {
  const numOfRows = String(clampRows(body.numOfRows));
  const pageNo = String(
    Math.max(1, Math.floor(Number(body.pageNo) || 1)),
  );

  switch (action) {
    case "searchKeyword":
      return {
        keyword: guardKeyword(body.keyword),
        numOfRows,
        pageNo,
      };
    case "detailCommon":
      return { contentId: guardContentId(body.contentId) };
    case "detailImage":
      return {
        contentId: guardContentId(body.contentId),
        numOfRows,
        pageNo,
        imageYN: "Y",
      };
    case "searchPhoto":
      return {
        keyword: guardKeyword(body.keyword),
        numOfRows,
        pageNo,
      };
    case "searchFestival": {
      const q: Record<string, string> = {
        eventStartDate: guardYyyymmdd(body.eventStartDate, "eventStartDate"),
        numOfRows,
        pageNo,
      };
      const eventEndDate = optionalYyyymmdd(body.eventEndDate, "eventEndDate");
      if (eventEndDate) q.eventEndDate = eventEndDate;
      const areaCode = optionalCode(body.areaCode, "areaCode");
      if (areaCode) q.areaCode = areaCode;
      const sigunguCode = optionalCode(body.sigunguCode, "sigunguCode");
      if (sigunguCode) q.sigunguCode = sigunguCode;
      return q;
    }
    case "areaBasedList": {
      const areaCode = optionalCode(body.areaCode, "areaCode");
      if (!areaCode) throw new Error("areaCode is required");
      const q: Record<string, string> = {
        areaCode,
        numOfRows,
        pageNo,
      };
      const contentTypeId = optionalCode(body.contentTypeId, "contentTypeId");
      if (contentTypeId) q.contentTypeId = contentTypeId;
      const sigunguCode = optionalCode(body.sigunguCode, "sigunguCode");
      if (sigunguCode) q.sigunguCode = sigunguCode;
      return q;
    }
    case "areaCode": {
      const q: Record<string, string> = { numOfRows, pageNo };
      const areaCode = optionalCode(body.areaCode, "areaCode");
      if (areaCode) q.areaCode = areaCode;
      return q;
    }
    case "detailIntro":
      return {
        contentId: guardContentId(body.contentId),
        contentTypeId: guardContentTypeId(body.contentTypeId),
      };
    case "detailInfo":
      return {
        contentId: guardContentId(body.contentId),
        contentTypeId: guardContentTypeId(body.contentTypeId),
        numOfRows,
        pageNo,
      };
    default:
      throw new Error("unsupported action");
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

/** Match client festivalTimeFilter.rolling12MonthRangeYmd */
function rolling12MonthRangeYmd(now = new Date()): {
  eventStartDate: string;
  eventEndDate: string;
} {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 12, 0);
  return { eventStartDate: toYmd(start), eventEndDate: toYmd(end) };
}

function ageMs(fetchedAt: string | null | undefined): number {
  if (!fetchedAt) return Number.POSITIVE_INFINITY;
  const t = Date.parse(fetchedAt);
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return Date.now() - t;
}

function getServiceRoleClient() {
  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

type CacheRow = {
  cache_key: string;
  payload: unknown;
  fetched_at: string;
};

async function readFestivalCache(
  cacheKey: string,
): Promise<CacheRow | null> {
  const sb = getServiceRoleClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("tourapi_festival_cache")
    .select("cache_key, payload, fetched_at")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  if (error) {
    console.error("[tourapi-proxy] cache read", error.message);
    return null;
  }
  return (data as CacheRow | null) ?? null;
}

async function writeFestivalCache(
  cacheKey: string,
  payload: unknown,
): Promise<boolean> {
  const sb = getServiceRoleClient();
  if (!sb) return false;
  const now = new Date().toISOString();
  const { error } = await sb.from("tourapi_festival_cache").upsert(
    {
      cache_key: cacheKey,
      payload,
      fetched_at: now,
      source: "tourapi",
      updated_at: now,
    },
    { onConflict: "cache_key" },
  );
  if (error) {
    console.error("[tourapi-proxy] cache write", error.message);
    return false;
  }
  return true;
}

function mergeFestivalPages(
  pages: Awaited<ReturnType<typeof callTourApi>>[],
): Record<string, unknown>[] {
  const seen = new Set<string>();
  const merged: Record<string, unknown>[] = [];
  for (const data of pages) {
    if (!data?.ok || !Array.isArray(data.items)) continue;
    for (const item of data.items) {
      const key = String(
        item?.contentId || `${item?.title}-${item?.eventStartDate}`,
      );
      if (!key || seen.has(key)) continue;
      if (
        !item?.title ||
        !/^\d{8}$/.test(String(item.eventStartDate || ""))
      ) {
        continue;
      }
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

async function fetchFestivalWindowLive(
  serviceKey: string,
  eventStartDate: string,
  eventEndDate: string,
): Promise<{
  ok: boolean;
  items: Record<string, unknown>[];
  message?: string;
}> {
  const pages: Awaited<ReturnType<typeof callTourApi>>[] = [];
  for (let pageNo = 1; pageNo <= FESTIVAL_WINDOW_MAX_PAGES; pageNo += 1) {
    let page: Awaited<ReturnType<typeof callTourApi>>;
    try {
      page = await callTourApi(
        "searchFestival",
        {
          eventStartDate,
          eventEndDate,
          numOfRows: String(FESTIVAL_WINDOW_PAGE_ROWS),
          pageNo: String(pageNo),
        },
        serviceKey,
      );
    } catch (err) {
      const msg = (err as Error)?.message || "upstream fetch failed";
      if (pages.some((p) => p?.ok)) break;
      return { ok: false, items: [], message: msg };
    }
    pages.push(page);
    if (!page.ok) {
      if (pages.some((p) => p?.ok)) break;
      return {
        ok: false,
        items: [],
        message: page.message || "searchFestival failed",
      };
    }
    const count = Array.isArray(page.items) ? page.items.length : 0;
    if (count < FESTIVAL_WINDOW_PAGE_ROWS) break;
  }

  const anyOk = pages.some((p) => p?.ok);
  if (!anyOk) {
    return {
      ok: false,
      items: [],
      message: pages[0]?.message || "searchFestival failed",
    };
  }
  return { ok: true, items: mergeFestivalPages(pages) };
}

async function handleFestivalWindow(
  body: Record<string, unknown>,
  serviceKey: string,
): Promise<Response> {
  const force = body.force === true;
  let eventStartDate: string;
  let eventEndDate: string;
  if (body.eventStartDate != null || body.eventEndDate != null) {
    eventStartDate = guardYyyymmdd(body.eventStartDate, "eventStartDate");
    eventEndDate = guardYyyymmdd(body.eventEndDate, "eventEndDate");
  } else {
    const range = rolling12MonthRangeYmd();
    eventStartDate = range.eventStartDate;
    eventEndDate = range.eventEndDate;
  }
  const cacheKey = `list:rolling12:${eventStartDate}:${eventEndDate}`;
  const cached = await readFestivalCache(cacheKey);
  const cachedAge = ageMs(cached?.fetched_at);
  const cachedItems = Array.isArray(
    (cached?.payload as { items?: unknown } | null)?.items,
  )
    ? ((cached!.payload as { items: Record<string, unknown>[] }).items)
    : null;

  if (!force && cachedItems && cachedAge <= LIST_FRESH_MS) {
    return jsonResponse({
      ok: true,
      action: "festivalWindow",
      items: cachedItems,
      rawCount: cachedItems.length,
      fromCache: true,
      stale: false,
      fetchedAt: cached!.fetched_at,
      eventStartDate,
      eventEndDate,
    });
  }

  const live = await fetchFestivalWindowLive(
    serviceKey,
    eventStartDate,
    eventEndDate,
  );
  if (live.ok) {
    await writeFestivalCache(cacheKey, { items: live.items });
    return jsonResponse({
      ok: true,
      action: "festivalWindow",
      items: live.items,
      rawCount: live.items.length,
      fromCache: false,
      stale: false,
      fetchedAt: new Date().toISOString(),
      eventStartDate,
      eventEndDate,
    });
  }

  if (cachedItems && cachedAge <= LIST_STALE_MS) {
    return jsonResponse({
      ok: true,
      action: "festivalWindow",
      items: cachedItems,
      rawCount: cachedItems.length,
      fromCache: true,
      stale: true,
      fetchedAt: cached!.fetched_at,
      eventStartDate,
      eventEndDate,
      message: live.message || "serving stale festival window",
    });
  }

  return jsonResponse({
    ok: false,
    action: "festivalWindow",
    items: [],
    rawCount: 0,
    fromCache: false,
    stale: false,
    message: live.message || "축제 목록을 불러오지 못했습니다.",
    eventStartDate,
    eventEndDate,
  });
}

async function handleFestivalDetail(
  body: Record<string, unknown>,
  serviceKey: string,
): Promise<Response> {
  const force = body.force === true;
  const contentId = guardContentId(body.contentId);
  const contentTypeId =
    body.contentTypeId != null && String(body.contentTypeId).trim()
      ? guardContentTypeId(body.contentTypeId)
      : FESTIVAL_CONTENT_TYPE_ID;
  const cacheKey = `detail:${contentId}`;
  const cached = await readFestivalCache(cacheKey);
  const cachedAge = ageMs(cached?.fetched_at);
  const cachedPayload = cached?.payload as {
    intro?: Record<string, unknown> | null;
    common?: Record<string, unknown> | null;
    info?: Record<string, unknown>[];
  } | null;

  if (
    !force &&
    cachedPayload &&
    cachedAge <= DETAIL_FRESH_MS &&
    (cachedPayload.intro || cachedPayload.common ||
      (Array.isArray(cachedPayload.info) && cachedPayload.info.length > 0))
  ) {
    return jsonResponse({
      ok: true,
      action: "festivalDetail",
      contentId,
      intro: cachedPayload.intro || null,
      common: cachedPayload.common || null,
      info: Array.isArray(cachedPayload.info) ? cachedPayload.info : [],
      items: cachedPayload.intro ? [cachedPayload.intro] : [],
      rawCount: 1,
      fromCache: true,
      stale: false,
      fetchedAt: cached!.fetched_at,
    });
  }

  let introResult: Awaited<ReturnType<typeof callTourApi>> | null = null;
  let commonResult: Awaited<ReturnType<typeof callTourApi>> | null = null;
  let infoResult: Awaited<ReturnType<typeof callTourApi>> | null = null;
  let liveError = "";

  try {
    const [intro, common, info] = await Promise.all([
      callTourApi(
        "detailIntro",
        { contentId, contentTypeId },
        serviceKey,
      ),
      callTourApi("detailCommon", { contentId }, serviceKey),
      callTourApi(
        "detailInfo",
        {
          contentId,
          contentTypeId,
          numOfRows: "30",
          pageNo: "1",
        },
        serviceKey,
      ),
    ]);
    introResult = intro;
    commonResult = common;
    infoResult = info;
  } catch (err) {
    liveError = (err as Error)?.message || "upstream fetch failed";
  }

  const intro = introResult?.ok ? (introResult.items[0] || null) : null;
  const common = commonResult?.ok ? (commonResult.items[0] || null) : null;
  const info = infoResult?.ok && Array.isArray(infoResult.items)
    ? infoResult.items
    : [];
  const anyOk = Boolean(intro || common || info.length > 0);

  if (anyOk) {
    const payload = { intro, common, info };
    await writeFestivalCache(cacheKey, payload);
    return jsonResponse({
      ok: true,
      action: "festivalDetail",
      contentId,
      intro,
      common,
      info,
      items: intro ? [intro] : [],
      rawCount: intro ? 1 : 0,
      fromCache: false,
      stale: false,
      fetchedAt: new Date().toISOString(),
    });
  }

  if (
    cachedPayload &&
    cachedAge <= DETAIL_STALE_MS &&
    (cachedPayload.intro || cachedPayload.common ||
      (Array.isArray(cachedPayload.info) && cachedPayload.info.length > 0))
  ) {
    return jsonResponse({
      ok: true,
      action: "festivalDetail",
      contentId,
      intro: cachedPayload.intro || null,
      common: cachedPayload.common || null,
      info: Array.isArray(cachedPayload.info) ? cachedPayload.info : [],
      items: cachedPayload.intro ? [cachedPayload.intro] : [],
      rawCount: 1,
      fromCache: true,
      stale: true,
      fetchedAt: cached!.fetched_at,
      message: liveError ||
        introResult?.message ||
        commonResult?.message ||
        infoResult?.message ||
        "serving stale festival detail",
    });
  }

  return jsonResponse({
    ok: false,
    action: "festivalDetail",
    contentId,
    intro: null,
    common: null,
    info: [],
    items: [],
    rawCount: 0,
    fromCache: false,
    stale: false,
    message: liveError ||
      introResult?.message ||
      commonResult?.message ||
      infoResult?.message ||
      "상세 정보를 불러오지 못했습니다.",
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

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object") {
      return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const action = body.action;
    const isCacheAction =
      typeof action === "string" && CACHE_ACTIONS.has(action);
    const isUpstreamAction =
      typeof action === "string" && action in ACTIONS;

    if (!isCacheAction && !isUpstreamAction) {
      return jsonResponse(
        {
          ok: false,
          error: `action must be one of: ${[
            ...Object.keys(ACTIONS),
            ...CACHE_ACTIONS,
          ].join(", ")}`,
        },
        400,
      );
    }

    const serviceKey = Deno.env.get("TOUR_API_SERVICE_KEY")?.trim();
    if (!serviceKey) {
      return jsonResponse(
        { ok: false, error: "TOUR_API_SERVICE_KEY is not configured" },
        500,
      );
    }

    if (action === "festivalWindow") {
      return await handleFestivalWindow(body, serviceKey);
    }
    if (action === "festivalDetail") {
      return await handleFestivalDetail(body, serviceKey);
    }

    const typedAction = action as Action;

    const query = buildUpstreamQuery(typedAction, body);
    let result: Awaited<ReturnType<typeof callTourApi>>;
    try {
      result = await callTourApi(typedAction, query, serviceKey);
    } catch (upstreamErr) {
      const msg = (upstreamErr as Error)?.message || "upstream fetch failed";
      const timedOut = /abort|timeout/i.test(msg);
      return jsonResponse({
        ok: false,
        action: typedAction,
        status: timedOut ? 504 : 502,
        message: timedOut
          ? `TourAPI upstream timeout (${UPSTREAM_TIMEOUT_MS}ms)`
          : msg,
        resultCode: null,
        items: [],
        rawCount: 0,
      });
    }

    if (!result.ok) {
      return jsonResponse({
        ok: false,
        action: typedAction,
        status: result.status,
        message: result.message,
        resultCode: result.resultCode,
        items: [],
        rawCount: 0,
      });
    }

    return jsonResponse({
      ok: true,
      action: typedAction,
      items: result.items,
      rawCount: result.rawCount,
      resultCode: result.resultCode,
    });
  } catch (error) {
    const err = error as Error;
    console.error("[tourapi-proxy]", err.message);
    return jsonResponse(
      { ok: false, error: err.message || "Unknown error" },
      200,
    );
  }
});
