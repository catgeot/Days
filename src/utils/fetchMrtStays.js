/**
 * MRT 숙소 — Edge `fetch-mrt-stays` (region-autocomplete → search).
 * 브라우저에 MYREALTRIP / VITE_ MRT 키 사용 금지.
 */
import { supabase } from '../shared/api/supabase';

const CACHE_PREFIX = 'gateo:mrt-stays:v2:';
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * 동명·오탐이 심한 slug — 1차 키워드·대안 (Edge가 countryHint로도 재시도).
 * @type {Record<string, { keyword?: string, altKeywords?: string[] }>}
 */
const MRT_STAY_KEYWORD_OVERRIDES = {
  palau: { keyword: '코로르', altKeywords: ['Koror', '팔라우'] },
};

/**
 * @param {object} location
 * @returns {boolean}
 */
export function isMrtDomesticLocation(location) {
  const country = String(location?.country || '').trim();
  if (!country) return false;
  return country === '한국' || country === '대한민국' || country.includes('한국');
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
  const countryHint = String(location?.country || '').trim();

  const keyword = String(override?.keyword || name || nameEn || '').trim().slice(0, 100);
  const altKeywords = [
    ...(override?.altKeywords || []),
    name && name !== keyword ? name : '',
    nameEn && nameEn !== keyword ? nameEn : '',
  ]
    .map((k) => String(k || '').trim())
    .filter(Boolean)
    .slice(0, 6);

  return { keyword, altKeywords, countryHint, nameEn };
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
  const key = cacheKey(keyword, isDomestic, countryHint);

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
 * slug 여행지 포커스용 — 실패·빈 결과는 null (스트립 숨김).
 * @param {object} location
 */
export async function fetchMrtStaysForLocation(location) {
  if (!location?.slug || location?.uiPlace || location?.isScanning) return null;
  const query = resolveMrtStayQuery(location);
  if (!query.keyword) return null;
  return fetchMrtStays({
    ...query,
    isDomestic: isMrtDomesticLocation(location),
    size: 8,
  });
}
