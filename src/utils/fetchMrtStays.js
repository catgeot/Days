/**
 * MRT 숙소 — Edge `fetch-mrt-stays` (region-autocomplete → search).
 * 브라우저에 MYREALTRIP / VITE_ MRT 키 사용 금지.
 */
import { supabase } from '../shared/api/supabase';
import { isPlaceholderCountry } from './travelSpotResolve';

const CACHE_PREFIX = 'gateo:mrt-stays:v4:';
const CACHE_TTL_MS = 30 * 60 * 1000;

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
 * @param {object} location
 * @returns {{ keyword: string, altKeywords: string[], countryHint: string, nameEn: string }}
 */
export function resolveMrtStayQuery(location) {
  const slug = String(location?.slug || '').trim().toLowerCase();
  const override = MRT_STAY_KEYWORD_OVERRIDES[slug];
  const name = String(location?.name || '').trim();
  const nameEn = String(location?.name_en || '').trim();
  const nameKo = String(location?.name_ko || '').trim();
  const isDomestic = isMrtDomesticLocation(location);
  const countryHint = normalizeMrtCountryHint(location?.country, isDomestic);
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

  // 동·읍·면: 시·군을 바로 이어 붙여 소도시(춘천 퇴계동) 빈 결과를 줄임
  // 대도시 동은 여전히 세밀 키워드를 먼저 시도
  if (fineGrain) {
    pushFineLadder();
    pushCityLadder();
  } else {
    pushFineLadder();
    pushUnique(ladder, seen, admin.district);
    pushUnique(ladder, seen, stripKoAdminSuffix(admin.district));
    pushCityLadder();
  }

  pushUnique(ladder, seen, nameEn);
  pushUnique(ladder, seen, admin.state);
  pushUnique(ladder, seen, stripKoAdminSuffix(admin.state));

  const keyword = String(ladder[0] || '').trim();
  const altKeywords = ladder.slice(1, 10);

  return { keyword, altKeywords, countryHint, nameEn };
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

function cacheKey(keyword, isDomestic, countryHint) {
  return `${CACHE_PREFIX}${isDomestic ? 'd' : 'i'}:${countryHint || '-'}:${keyword}`;
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
 * @param {{ keyword: string, isDomestic: boolean, countryHint?: string, nameEn?: string, altKeywords?: string[], size?: number }} params
 */
export async function fetchMrtStays(params) {
  const keyword = String(params?.keyword || '').trim();
  if (!keyword) return null;

  const isDomestic = Boolean(params?.isDomestic);
  const countryHint = String(params?.countryHint || '').trim();
  const nameEn = String(params?.nameEn || '').trim();
  const altKeywords = Array.isArray(params?.altKeywords) ? params.altKeywords : [];
  const size = Math.max(1, Math.min(20, Number(params?.size) || 8));
  const ladderKey = [keyword, ...altKeywords].join('|');
  const key = cacheKey(ladderKey, isDomestic, countryHint);

  const hit = readCache(key);
  if (hit) return hit;

  try {
    const { data, error } = await supabase.functions.invoke('fetch-mrt-stays', {
      body: {
        keyword,
        isDomestic,
        size,
        ...(countryHint ? { countryHint } : {}),
        ...(nameEn ? { nameEn } : {}),
        ...(altKeywords.length ? { altKeywords } : {}),
      },
    });

    if (error || !data?.ok) {
      return null;
    }

    const payload = {
      ok: true,
      region: data.region ?? null,
      items: Array.isArray(data.items) ? data.items : [],
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      totalCount: data.totalCount ?? 0,
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
 */
export async function fetchMrtStaysForLocation(location) {
  if (!location || location.isScanning) return null;
  if (!canShowMrtStayStrip(location)) return null;

  const query = resolveMrtStayQuery(location);
  if (!query.keyword) return null;

  const isDomestic = isMrtDomesticLocation(location);
  return fetchMrtStays({
    ...query,
    countryHint: normalizeMrtCountryHint(query.countryHint || location?.country, isDomestic),
    isDomestic,
    size: 12,
  });
}
