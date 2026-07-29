import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
} as const;

type Action = keyof typeof ACTIONS;

const MAX_KEYWORD_LEN = 80;
const MAX_CONTENT_ID_LEN = 32;
const DEFAULT_ROWS = 10;
const MAX_ROWS = 50;

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
  const eventhomepage = pickStr(item, "eventhomepage", "eventHomepage");

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
  if (eventhomepage) out.eventhomepage = eventhomepage;

  if (action === "searchPhoto") {
    const imageUrl = galWebImageUrl || firstimage;
    if (imageUrl) out.imageUrl = imageUrl;
  } else if (action === "detailImage") {
    const imageUrl = originimgurl || smallimageurl || firstimage;
    if (imageUrl) out.imageUrl = imageUrl;
  } else if (action !== "areaCode" && action !== "detailIntro") {
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
    default:
      throw new Error("unsupported action");
  }
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
    if (typeof action !== "string" || !(action in ACTIONS)) {
      return jsonResponse(
        {
          ok: false,
          error: `action must be one of: ${Object.keys(ACTIONS).join(", ")}`,
        },
        400,
      );
    }
    const typedAction = action as Action;

    const serviceKey = Deno.env.get("TOUR_API_SERVICE_KEY")?.trim();
    if (!serviceKey) {
      return jsonResponse(
        { ok: false, error: "TOUR_API_SERVICE_KEY is not configured" },
        500,
      );
    }

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
