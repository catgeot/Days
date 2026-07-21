/**
 * MRT 숙소 — Edge `fetch-mrt-stays` (region-autocomplete → search).
 * 브라우저에 MYREALTRIP / VITE_ MRT 키 사용 금지.
 */
import { supabase } from '../shared/api/supabase';
import {
  canShowMrtStayStrip,
  expandMrtCountryHintAlts,
  isMrtDomesticLocation,
  normalizeMrtCountryHint,
  resolveMrtCityHints,
  resolveMrtStayQuery,
  stripKoAdminSuffix,
} from './mrtStayQuery.js';

export {
  canShowMrtStayStrip,
  expandMrtCountryHintAlts,
  isMrtDomesticLocation,
  normalizeMrtCountryHint,
  resolveMrtCityHints,
  resolveMrtStayQuery,
  stripKoAdminSuffix,
};

/** countryHint·keyword override 변경 시 무효화 */
const CACHE_PREFIX = 'gateo:mrt-stays:v9:';
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_STAY_NIGHTS = 30;
const MAX_ADULTS = 8;
const MAX_CHILDREN = 8;

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

/** 가격 있는 숙소 먼저 · 일정 미가용(가격 없음)은 뒤에 */
export function sortMrtStaysPricedFirst(items) {
  const list = Array.isArray(items) ? items.slice() : [];
  return list.sort((a, b) => {
    const ap = isMrtStayPriced(a) ? 1 : 0;
    const bp = isMrtStayPriced(b) ? 1 : 0;
    return bp - ap;
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

/** Edge defaultStayDates와 동일 — 체크인 +14일 · 2박 */
export function defaultMrtStayDates() {
  const checkIn = new Date();
  checkIn.setHours(12, 0, 0, 0);
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);
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

function cacheKey(
  keyword,
  isDomestic,
  countryHint,
  countryHintAlts,
  cityHints,
  checkIn,
  checkOut,
  adultCount,
  childCount,
) {
  const cityKey = Array.isArray(cityHints) && cityHints.length
    ? cityHints.join(',')
    : '-';
  const countryKey = [countryHint, ...(Array.isArray(countryHintAlts) ? countryHintAlts : [])]
    .map((c) => String(c || '').trim())
    .filter(Boolean)
    .join('|') || '-';
  return `${CACHE_PREFIX}${isDomestic ? 'd' : 'i'}:${countryKey}:${cityKey}:${checkIn}:${checkOut}:a${adultCount}c${childCount}:${keyword}`;
}

function readCache(key) {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.fetchedAt || Date.now() - parsed.fetchedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.payload ?? null;
  } catch {
    return null;
  }
}

function writeCache(key, payload) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), payload }));
  } catch {
    /* quota */
  }
}

/**
 * @param {{ keyword: string, isDomestic: boolean, countryHint?: string, countryHintAlts?: string[], nameEn?: string, altKeywords?: string[], cityHints?: string[], checkIn?: string, checkOut?: string, adultCount?: number, childCount?: number, size?: number }} params
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
  const size = Math.max(1, Math.min(20, Number(params?.size) || 20));
  const ladderKey = [keyword, ...altKeywords].join('|');
  const key = cacheKey(
    ladderKey,
    isDomestic,
    countryHint,
    countryHintAlts,
    cityHints,
    checkIn,
    checkOut,
    adultCount,
    childCount,
  );

  const hit = readCache(key);
  if (hit) return hit;

  try {
    const { data, error } = await supabase.functions.invoke('fetch-mrt-stays', {
      body: {
        keyword,
        isDomestic,
        size,
        checkIn,
        checkOut,
        adultCount,
        childCount,
        ...(countryHint ? { countryHint } : {}),
        ...(countryHintAlts.length ? { countryHintAlts } : {}),
        ...(nameEn ? { nameEn } : {}),
        ...(altKeywords.length ? { altKeywords } : {}),
        ...(cityHints.length ? { cityHints } : {}),
      },
    });

    if (error || !data?.ok) {
      return null;
    }

    const items = sortMrtStaysPricedFirst(Array.isArray(data.items) ? data.items : []);
    const payload = {
      ok: true,
      region: data.region ?? null,
      items,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      adultCount: data.adultCount ?? adultCount,
      childCount: data.childCount ?? childCount,
      totalCount: data.totalCount ?? items.length,
      usedKeyword: data.usedKeyword ?? keyword,
    };

    if (payload.items.length > 0) {
      writeCache(key, payload);
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * 홈 Summary 숙소 — SSOT slug + uiPlace. 실패·빈 결과는 호출측에서 empty 처리.
 * @param {object} location
 * @param {{ checkIn?: string, checkOut?: string, adultCount?: number, childCount?: number }} [opts]
 */
export async function fetchMrtStaysForLocation(location, opts = {}) {
  if (!location || location.isScanning) return null;
  if (!canShowMrtStayStrip(location)) return null;

  const query = resolveMrtStayQuery(location);
  if (!query.keyword) return null;

  const isDomestic = isMrtDomesticLocation(location);
  const normalized = normalizeMrtStayDates(opts.checkIn, opts.checkOut);
  const guests = normalizeMrtGuestCounts(opts.adultCount, opts.childCount);
  return fetchMrtStays({
    ...query,
    countryHint: normalizeMrtCountryHint(query.countryHint || location?.country, isDomestic),
    isDomestic,
    ...normalized,
    ...guests,
    size: 20,
  });
}
