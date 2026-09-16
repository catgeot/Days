/**
 * MRT 숙소 — Edge `fetch-mrt-stays` (region-autocomplete → search).
 * 브라우저에 MYREALTRIP / VITE_ MRT 키 사용 금지.
 * 숙소 `itemName`은 파트너 API 한글 SSOT — `?lang=en`·Accept-Language로 EN 목록 분기·재호출 금지.
 */
import { supabase } from '../shared/api/supabase';
import {
  canShowMrtStayStrip,
  expandMrtCountryHintAlts,
  isMrtDomesticLocation,
  mergeMrtStayFetchQuery,
  normalizeMrtCountryHint,
  resolveMrtCityHints,
  resolveMrtStayQuery,
  stripKoAdminSuffix,
} from './mrtStayQuery.js';
import { resolveMrtStayOrigin } from './mrtStayDistance.js';
import {
  dropLegacyMrtStayListingCaches,
  hydrateMrtStayCoords,
  itemsNeedingStayGeocode,
  mergeMrtStayCoords,
  mrtStayListingCacheKey,
  persistMrtStayCoords,
  readMrtStayListingCache,
  writeMrtStayListingCache,
  orderStayItemsForGeocode,
} from './mrtStayCache.js';

export {
  canShowMrtStayStrip,
  expandMrtCountryHintAlts,
  isMrtDomesticLocation,
  mergeMrtStayFetchQuery,
  normalizeMrtCountryHint,
  resolveMrtCityHints,
  resolveMrtStayQuery,
  stripKoAdminSuffix,
};

/** countryHint·keyword override 변경 시 무효화 · v23: 목록 캐시에서 원점 분리 */
const MAX_STAY_NIGHTS = 30;
const MAX_ADULTS = 8;
const MAX_CHILDREN = 8;
/** 파트너 accommodation/search size 상한 */
export const MRT_STAY_FETCH_SIZE = 50;
/** 게이트오 목록 최초·추가 노출 단위(요금有 우선 정렬 후 · 더보기) */
export const MRT_STAY_PAGE_SIZE = 20;

export function normalizeMrtGuestCounts(adultCount, childCount) {
  const adults = Math.max(1, Math.min(MAX_ADULTS, Number(adultCount) || 2));
  const children = Math.max(0, Math.min(MAX_CHILDREN, Number(childCount) || 0));
  return { adultCount: adults, childCount: children };
}

/** 해당 일정에 요금이 있어 바로 예약 후보인 숙소 */
export function isMrtStayPriced(item) {
  const n = Number(item?.salePrice);
  return Number.isFinite(n) && n > 0;
}

/**
 * 게이트오 목록과 같은 조건의 MRT 숙소 검색 결과 페이지.
 * (파트너 API search와 동일 regionId·일정·인원 — 소비자 사이트 union/products)
 *
 * @param {{
 *   keyword?: string,
 *   regionId?: number|string|null,
 *   isDomestic?: boolean,
 *   checkIn?: string,
 *   checkOut?: string,
 *   adultCount?: number,
 *   childCount?: number,
 *   mrtKeyName?: string|null,
 *   mylinkId?: string|number|null,
 * }} opts
 * @returns {string|null}
 */
export function buildMrtStayListUrl(opts = {}) {
  const keyword = String(opts.keyword || '').trim();
  const regionId = opts.regionId != null && opts.regionId !== ''
    ? Number(opts.regionId)
    : null;
  if (!keyword && !(Number.isFinite(regionId) && regionId > 0)) return null;

  const { checkIn, checkOut } = normalizeMrtStayDates(opts.checkIn, opts.checkOut);
  const { adultCount, childCount } = normalizeMrtGuestCounts(
    opts.adultCount,
    opts.childCount,
  );
  const params = new URLSearchParams({
    isDomestic: opts.isDomestic ? 'true' : 'false',
    checkIn,
    checkOut,
    adultCount: String(adultCount),
    childCount: String(childCount),
    roomCount: '1',
  });
  if (keyword) params.set('keyword', keyword);
  if (Number.isFinite(regionId) && regionId > 0) {
    params.set('regionId', String(regionId));
  }
  const mrtKeyName = String(opts.mrtKeyName || '').trim();
  if (mrtKeyName) params.set('mrtKeyName', mrtKeyName);
  const mylinkId = String(opts.mylinkId ?? '').trim();
  if (mylinkId) {
    params.set('utm_source', 'mktpartner');
    params.set('mylink_id', mylinkId);
  }

  return `https://accommodation.myrealtrip.com/union/products?${params.toString()}`;
}

/** 선택 일정에 요금 있어 바로 예약 가능한 숙소만 */
export function filterBookableMrtStays(items) {
  return (Array.isArray(items) ? items : []).filter(isMrtStayPriced);
}

/** 요금 있는 숙소 우선 · 요금 없는 숙소도 유지(MRT 홈·일정 변경 유도) */
export function sortMrtStaysPricedFirst(items) {
  const list = Array.isArray(items) ? items.slice() : [];
  return list.sort((a, b) => {
    const ap = isMrtStayPriced(a) ? 1 : 0;
    const bp = isMrtStayPriced(b) ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return 0;
  });
}

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYmdLocal(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Edge defaultStayDates와 동일 — 체크인 +14일(보름) · 3박 · 성인2·아동0은 guests 기본값 */
export function defaultMrtStayDates() {
  const checkIn = new Date();
  checkIn.setHours(12, 0, 0, 0);
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  return { checkIn: ymdLocal(checkIn), checkOut: ymdLocal(checkOut) };
}

export function mrtStayNights(checkIn, checkOut) {
  const a = parseYmdLocal(checkIn);
  const b = parseYmdLocal(checkOut);
  if (!a || !b) return 0;
  const nights = Math.round((b.getTime() - a.getTime()) / 86400000);
  return nights > 0 ? nights : 0;
}

/**
 * 체크인≥오늘 · 체크아웃>체크인 · 최대 30박.
 * @returns {{ checkIn: string, checkOut: string }}
 */
export function normalizeMrtStayDates(checkIn, checkOut) {
  const defaults = defaultMrtStayDates();
  const today = ymdLocal(new Date());
  let cin = parseYmdLocal(checkIn) ? String(checkIn).trim() : defaults.checkIn;
  let cout = parseYmdLocal(checkOut) ? String(checkOut).trim() : defaults.checkOut;
  if (cin < today) cin = today;

  let inDate = parseYmdLocal(cin);
  let outDate = parseYmdLocal(cout);
  if (!inDate || !outDate || outDate <= inDate) {
    outDate = new Date(inDate);
    outDate.setDate(outDate.getDate() + 1);
  }

  const maxOut = new Date(inDate);
  maxOut.setDate(maxOut.getDate() + MAX_STAY_NIGHTS);
  if (outDate > maxOut) outDate = maxOut;

  return { checkIn: ymdLocal(inDate), checkOut: ymdLocal(outDate) };
}

/** date input min용 — 체크인+1일 */
export function mrtStayMinCheckOut(checkIn) {
  const inDate = parseYmdLocal(checkIn) || parseYmdLocal(defaultMrtStayDates().checkIn);
  const next = new Date(inDate);
  next.setDate(next.getDate() + 1);
  return ymdLocal(next);
}

function listingCacheKeyFromParams({
  keyword,
  isDomestic,
  countryHint,
  countryHintAlts,
  cityHints,
  checkIn,
  checkOut,
  adultCount,
  childCount,
}) {
  return mrtStayListingCacheKey({
    keyword,
    isDomestic,
    countryHint,
    countryHintAlts,
    cityHints,
    checkIn,
    checkOut,
    adultCount,
    childCount,
  });
}

/**
 * fetch 원본 → 요금有 우선 정렬 · 최대 FETCH_SIZE 전부 반환.
 * UI는 PAGE_SIZE씩 더보기로 자른다 · bookableCount는 fetch 전체 기준(CTA).
 */
function shapeMrtStayResult(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const listed = Array.isArray(payload.items) ? payload.items : [];
  const sorted = sortMrtStaysPricedFirst(listed).slice(0, MRT_STAY_FETCH_SIZE);
  const bookableCount = filterBookableMrtStays(sorted).length;
  return {
    ...payload,
    items: sorted,
    listedCount: sorted.length,
    bookableCount,
    totalCount: Number(payload.apiTotalCount) || listed.length,
    moreWithDateChange: bookableCount < sorted.length,
  };
}

function listingBody(params) {
  return {
    keyword: params.keyword,
    isDomestic: params.isDomestic,
    size: params.size,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adultCount: params.adultCount,
    childCount: params.childCount,
    ...(params.countryHint ? { countryHint: params.countryHint } : {}),
    ...(params.countryHintAlts?.length ? { countryHintAlts: params.countryHintAlts } : {}),
    ...(params.nameEn ? { nameEn: params.nameEn } : {}),
    ...(params.altKeywords?.length ? { altKeywords: params.altKeywords } : {}),
    ...(params.cityHints?.length ? { cityHints: params.cityHints } : {}),
  };
}

function originPair(params) {
  const lat = Number(params?.originLat);
  const lng = Number(params?.originLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function invokeStayGeocodeItems(missing, origin) {
  const { data } = await supabase.functions.invoke('fetch-mrt-stays', {
    body: {
      geocodeItems: missing.map((it) => ({
        itemId: it.itemId,
        itemName: it.itemName,
      })),
      originLat: origin.lat,
      originLng: origin.lng,
    },
  });
  if (data?.ok && Array.isArray(data.items) && data.items.length) return data.items;
  return null;
}

function withHydratedCoords(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const items = hydrateMrtStayCoords(payload.items);
  persistMrtStayCoords(items);
  return { ...payload, items };
}

async function enrichMrtStayCoords(payload, params) {
  const origin = originPair(params);
  let items = Array.isArray(payload?.items) ? payload.items : [];
  const missing = itemsNeedingStayGeocode(items);
  if (!origin || !missing.length) return payload;

  const ordered = orderStayItemsForGeocode(items, missing);
  const head = ordered.slice(0, MRT_STAY_PAGE_SIZE);
  const tail = ordered.slice(MRT_STAY_PAGE_SIZE);
  const onPartial = typeof params?.onPartialResult === 'function' ? params.onPartialResult : null;

  const mergeSourced = (sourced) => {
    if (!Array.isArray(sourced) || !sourced.length) return false;
    items = mergeMrtStayCoords(items, sourced);
    persistMrtStayCoords(items);
    return true;
  };

  let got = false;
  try {
    got = mergeSourced(await invokeStayGeocodeItems(head, origin)) || got;
    if (got && onPartial) {
      try {
        onPartial(shapeMrtStayResult({ ...payload, items }));
      } catch {
        /* caller */
      }
    }
    if (tail.length) {
      got = mergeSourced(await invokeStayGeocodeItems(tail, origin)) || got;
    }
  } catch {
    /* keep coords already merged */
  }

  if (!got) {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-mrt-stays', {
        body: {
          ...listingBody(params),
          originLat: origin.lat,
          originLng: origin.lng,
        },
      });
      if (!error && data?.ok && Array.isArray(data.items)) {
        got = mergeSourced(data.items) || got;
      }
    } catch {
      /* listing+origin fallback */
    }
  }

  if (!got) return payload;

  persistMrtStayCoords(items, {
    misses: missing.filter((it) => !parseStayItemCoord(it, items)),
  });
  return { ...payload, items };
}

function parseStayItemCoord(probe, merged) {
  const id = Number(probe?.itemId);
  const hit = (Array.isArray(merged) ? merged : []).find((it) => Number(it?.itemId) === id);
  const lat = Number(hit?.lat);
  const lng = Number(hit?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

/**
 * @param {{ keyword: string, isDomestic: boolean, countryHint?: string, countryHintAlts?: string[], nameEn?: string, altKeywords?: string[], cityHints?: string[], checkIn?: string, checkOut?: string, adultCount?: number, childCount?: number, size?: number, originLat?: number, originLng?: number, skipGeocode?: boolean, onPartialResult?: function }} params
 */
export async function fetchMrtStays(params) {
  const keyword = String(params?.keyword || '').trim();
  if (!keyword) return null;

  const isDomestic = Boolean(params?.isDomestic);
  const countryHint = String(params?.countryHint || '').trim();
  const countryHintAlts = Array.isArray(params?.countryHintAlts)
    ? params.countryHintAlts.map((k) => String(k || '').trim()).filter(Boolean).slice(0, 8)
    : [];
  const nameEn = String(params?.nameEn || '').trim();
  const altKeywords = Array.isArray(params?.altKeywords) ? params.altKeywords : [];
  const cityHints = Array.isArray(params?.cityHints)
    ? params.cityHints.map((k) => String(k || '').trim()).filter(Boolean).slice(0, 8)
    : [];
  const { checkIn, checkOut } = normalizeMrtStayDates(params?.checkIn, params?.checkOut);
  const { adultCount, childCount } = normalizeMrtGuestCounts(
    params?.adultCount,
    params?.childCount,
  );
  const size = Math.max(
    1,
    Math.min(MRT_STAY_FETCH_SIZE, Number(params?.size) || MRT_STAY_FETCH_SIZE),
  );
  const ladderKey = [keyword, ...altKeywords].join('|');
  const key = listingCacheKeyFromParams({
    keyword: ladderKey,
    isDomestic,
    countryHint,
    countryHintAlts,
    cityHints,
    checkIn,
    checkOut,
    adultCount,
    childCount,
  });
  const invokeParams = {
    keyword,
    isDomestic,
    size,
    checkIn,
    checkOut,
    adultCount,
    childCount,
    countryHint,
    countryHintAlts,
    nameEn,
    altKeywords,
    cityHints,
    originLat: params?.originLat,
    originLng: params?.originLng,
  };

  dropLegacyMrtStayListingCaches();

  const cached = readMrtStayListingCache(key);
  let payload = cached ? withHydratedCoords(cached) : null;

  if (!payload) {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-mrt-stays', {
        body: listingBody(invokeParams),
      });

      if (error || !data?.ok) {
        return null;
      }

      const listed = Array.isArray(data.items) ? data.items : [];
      const apiTotalCount = Number(data.totalCount);
      payload = withHydratedCoords({
        ok: true,
        region: data.region ?? null,
        items: listed,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        adultCount: data.adultCount ?? adultCount,
        childCount: data.childCount ?? childCount,
        usedKeyword: data.usedKeyword ?? keyword,
        apiTotalCount: Number.isFinite(apiTotalCount) ? apiTotalCount : listed.length,
      });

      if (listed.length > 0) {
        writeMrtStayListingCache(key, payload);
      }
    } catch {
      return null;
    }
  }

  const partial = shapeMrtStayResult(payload);
  if (typeof params?.onPartialResult === 'function') {
    try {
      params.onPartialResult(partial);
    } catch {
      /* caller */
    }
  }

  if (params?.skipGeocode) return partial;

  const enrichedPayload = await enrichMrtStayCoords(payload, {
    ...invokeParams,
    onPartialResult: params?.onPartialResult,
  });
  if (enrichedPayload !== payload && Array.isArray(enrichedPayload.items)) {
    writeMrtStayListingCache(key, enrichedPayload);
  }
  return shapeMrtStayResult(enrichedPayload);
}

/**
 * 홈 Summary 숙소 — SSOT slug + uiPlace. 실패·빈 결과는 호출측에서 empty 처리.
 * @param {object} location
 * @param {{ checkIn?: string, checkOut?: string, adultCount?: number, childCount?: number, keywordOverride?: string, altKeywords?: string[], skipGeocode?: boolean, onPartialResult?: function }} [opts]
 */
export async function fetchMrtStaysForLocation(location, opts = {}) {
  if (!location || location.isScanning) return null;
  if (!canShowMrtStayStrip(location)) return null;

  const query = mergeMrtStayFetchQuery(location, opts);
  const keyword = String(query.keyword || '').trim();
  if (!keyword) return null;

  const isDomestic = isMrtDomesticLocation(location);
  const normalized = normalizeMrtStayDates(opts.checkIn, opts.checkOut);
  const guests = normalizeMrtGuestCounts(opts.adultCount, opts.childCount);
  const origin = resolveMrtStayOrigin(location);
  return fetchMrtStays({
    ...query,
    keyword,
    countryHint: normalizeMrtCountryHint(query.countryHint || location?.country, isDomestic),
    isDomestic,
    ...normalized,
    ...guests,
    size: MRT_STAY_FETCH_SIZE,
    skipGeocode: Boolean(opts.skipGeocode),
    ...(typeof opts.onPartialResult === 'function'
      ? { onPartialResult: opts.onPartialResult }
      : {}),
    ...(origin ? { originLat: origin.lat, originLng: origin.lng } : {}),
  });
}
