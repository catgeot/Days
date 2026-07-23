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
  const addr1 = pickStr(item, "addr1", "galPhotographyLocation");
  const mapx = pickStr(item, "mapx", "mapX");
  const mapy = pickStr(item, "mapy", "mapY");
  const contentTypeId = pickStr(item, "contenttypeid", "contentTypeId");
  const galTitle = pickStr(item, "galTitle", "galtitle");

  const out: Record<string, unknown> = {};
  if (contentId) out.contentId = contentId;
  if (title) out.title = title;
  if (galTitle && !title) out.title = galTitle;
  if (firstimage) out.firstimage = firstimage;
  if (originimgurl) out.originimgurl = originimgurl;
  if (smallimageurl) out.smallimageurl = smallimageurl;
  if (galWebImageUrl) out.galWebImageUrl = galWebImageUrl;
  if (overview) out.overview = overview;
  if (addr1) out.addr1 = addr1;
  if (mapx) out.mapx = mapx;
  if (mapy) out.mapy = mapy;
  if (contentTypeId) out.contentTypeId = contentTypeId;

  if (action === "searchPhoto") {
    const imageUrl = galWebImageUrl || firstimage;
    if (imageUrl) out.imageUrl = imageUrl;
  } else if (action === "detailImage") {
    const imageUrl = originimgurl || smallimageurl || firstimage;
    if (imageUrl) out.imageUrl = imageUrl;
  } else {
    const imageUrl = firstimage || originimgurl || galWebImageUrl;
    if (imageUrl) out.imageUrl = imageUrl;
  }

  return out;
}

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

  const res = await fetch(url);
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
    const result = await callTourApi(typedAction, query, serviceKey);

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
