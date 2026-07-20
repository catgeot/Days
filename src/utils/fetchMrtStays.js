/**
 * MRT 숙소 — Edge `fetch-mrt-stays` (region-autocomplete → search).
 * 브라우저에 MYREALTRIP / VITE_ MRT 키 사용 금지.
 */
import { supabase } from '../shared/api/supabase';
import { isPlaceholderCountry } from './travelSpotResolve';

const CACHE_PREFIX = 'gateo:mrt-stays:v8:';
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

/**
 * 동명·오탐이 심한 slug — 1차 키워드·대안 (Edge가 countryHint로도 재시도).
 * @type {Record<string, { keyword?: string, altKeywords?: string[] }>}
 */
const MRT_STAY_KEYWORD_OVERRIDES = {
  palau: { keyword: '코로르', altKeywords: ['Koror', '팔라우'] },
};

const KO_ADMIN_SUFFIX_RE =
  /(특별자치시|특별자치도|광역시|특별시|자치시|자치군|시|군|구|읍|면|동)$/;

/**
 * @param {object} location
 * @returns {boolean}
 */
export function isMrtDomesticLocation(location) {
  const country = String(location?.country || '').trim();
  const countryEn = String(location?.country_en || '').trim().toLowerCase();
  if (!country && !countryEn) return false;
  if (country === '한국' || country === '대한민국' || country.includes('한국')) return true;
  return (
    countryEn === 'korea' ||
    countryEn === 'south korea' ||
    countryEn === 'republic of korea' ||
    countryEn.includes('korea')
  );
}

/** MRT subName head는 「한국」— Nominatim「대한민국」을 맞춰 보냄 */
export function normalizeMrtCountryHint(country, isDomestic = false) {
  const c = String(country || '').trim();
  if (isDomestic) return '한국';
  if (c === '대한민국' || c.includes('한국')) return '한국';
  return c;
}

function pushUnique(list, seen, raw) {
  const k = String(raw || '').trim().slice(0, 100);
  if (!k) return;
  const key = k.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(k);
}

/** 춘천시 → 춘천 등 — MRT CITY 매칭용 */
export function stripKoAdminSuffix(name) {
  const s = String(name || '').trim();
  if (!s || s.length < 3) return '';
  const stripped = s.replace(KO_ADMIN_SUFFIX_RE, '').trim();
  if (!stripped || stripped === s || stripped.length < 2) return '';
  return stripped;
}

/**
 * Edge cityHint용 — 동명 동(퇴계동→안동) 거부.
 * 해외는 state(Western Division 등)를 넣지 않음 — MRT blob에 없어 탈락 유발.
 * @param {object} admin
 * @param {{ isDomestic?: boolean }} [opts]
 * @returns {string[]}
 */
export function resolveMrtCityHints(admin, opts = {}) {
  const a = admin && typeof admin === 'object' ? admin : {};
  const isDomestic = Boolean(opts.isDomestic);
  const hints = [];
  const seen = new Set();
  pushUnique(hints, seen, a.city);
  pushUnique(hints, seen, stripKoAdminSuffix(a.city));
  pushUnique(hints, seen, a.cityEn);
  pushUnique(hints, seen, a.county);
  pushUnique(hints, seen, stripKoAdminSuffix(a.county));
  if (isDomestic) {
    pushUnique(hints, seen, a.state);
    pushUnique(hints, seen, stripKoAdminSuffix(a.state));
  }
  return hints.slice(0, 8);
}

/**
 * @param {object} location
 * @returns {{ keyword: string, altKeywords: string[], countryHint: string, countryHintAlts: string[], nameEn: string, cityHints: string[] }}
 */
export function resolveMrtStayQuery(location) {
  const slug = String(location?.slug || '').trim().toLowerCase();
  const override = MRT_STAY_KEYWORD_OVERRIDES[slug];
  const name = String(location?.name || '').trim();
  const nameEn = String(location?.name_en || '').trim();
  const nameKo = String(location?.name_ko || '').trim();
  const isDomestic = isMrtDomesticLocation(location);
  const countryHint = normalizeMrtCountryHint(location?.country, isDomestic);
  const countryEn = String(location?.country_en || '').trim();
  const admin = location?.stayAdmin && typeof location.stayAdmin === 'object'
    ? location.stayAdmin
    : {};

  const ladder = [];
  const seen = new Set();

  if (override?.keyword) pushUnique(ladder, seen, override.keyword);
  for (const k of override?.altKeywords || []) pushUnique(ladder, seen, k);

  const fineGrain = /[동읍면]$/.test(name) || /[동읍면]$/.test(admin.neighbourhood || '');

  const pushCityLadder = () => {
    pushUnique(ladder, seen, admin.city);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.city));
    pushUnique(ladder, seen, admin.cityEn);
    pushUnique(ladder, seen, admin.county);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.county));
  };

  const pushFineLadder = () => {
    pushUnique(ladder, seen, name);
    pushUnique(ladder, seen, nameKo);
    pushUnique(ladder, seen, admin.neighbourhood);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.neighbourhood || name));
    pushUnique(ladder, seen, admin.district);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.district));
  };

  // 국내 동·읍·면: 시·군 우선 — 「퇴계동」이 안동에 먼저 매칭되던 오탐 방지
  // 해외·비세밀: 세밀 키워드 우선
  if (fineGrain && isDomestic) {
    pushCityLadder();
    pushFineLadder();
  } else if (fineGrain) {
    pushFineLadder();
    pushCityLadder();
  } else {
    pushFineLadder();
    pushUnique(ladder, seen, admin.district);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.district));
    pushCityLadder();
  }

  pushUnique(ladder, seen, nameEn);
  if (isDomestic) {
    pushUnique(ladder, seen, admin.state);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.state));
  }

  const keyword = String(ladder[0] || '').trim();
  const altKeywords = ladder.slice(1, 10);
  const cityHints = resolveMrtCityHints(admin, { isDomestic });

  /** MRT subName 한·영 혼용 — Edge countryMatches가 둘 다 허용 */
  const countryHintAlts = [];
  const altSeen = new Set([countryHint.toLowerCase()]);
  for (const raw of [countryEn, admin.country]) {
    const c = String(raw || '').trim();
    if (!c || altSeen.has(c.toLowerCase())) continue;
    if (normalizeMrtCountryHint(c, isDomestic) === countryHint) continue;
    altSeen.add(c.toLowerCase());
    countryHintAlts.push(c);
  }

  return { keyword, altKeywords, countryHint, countryHintAlts, nameEn, cityHints };
}

/**
 * 숙소 토글 노출 — slug SSOT + uiPlace(국가·키워드 있을 때).
 * @param {object} location
 * @param {{ hidden?: boolean }} [opts]
 */
export function canShowMrtStayStrip(location, opts = {}) {
  if (opts.hidden || !location || location.isScanning) return false;
  if (isPlaceholderCountry(location.country) && isPlaceholderCountry(location.country_en)) {
    return false;
  }
  const query = resolveMrtStayQuery(location);
  return Boolean(query.keyword);
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
    ? params.countryHintAlts.map((k) => String(k || '').trim()).filter(Boolean).slice(0, 4)
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
