/**
 * MRT TNA(투어·티켓) — Edge `fetch-mrt-tnas`.
 * 브라우저에 MYREALTRIP / VITE_ MRT 키 사용 금지.
 */
import { supabase } from '../shared/api/supabase';
import { buildMrtMylinkUrl, getMrtSearchUrl } from './affiliate';
import {
  canShowMrtTnaStrip,
  hasMoreNearbyExpand,
  isMrtDomesticLocation,
  isMrtTnaNearbyKeyword,
  nextNearbyExpandIndex,
  resolveMrtTnaQuery,
} from './mrtTnaQuery.js';

export {
  canShowMrtTnaStrip,
  hasMoreNearbyExpand,
  isMrtDomesticLocation,
  isMrtTnaNearbyKeyword,
  nextNearbyExpandIndex,
  resolveMrtTnaQuery,
};

/** v3: ≤3 시 nearbyKeywords[0] 보강 머지 */
const CACHE_PREFIX = 'gateo:mrt-tnas:v3:';
const CACHE_TTL_MS = 30 * 60 * 1000;
/** 파트너 tna/search size 상한 100 · 모달은 20~50 */
export const MRT_TNA_FETCH_SIZE = 20;
export const MRT_TNA_PLANNER_SIZE = 3;

function cacheKey(ladderKey, nearbyKey, page, size, sort) {
  return `${CACHE_PREFIX}${ladderKey}|n${nearbyKey}|p${page}|s${size}|${sort || ''}`;
}

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.expires || Date.now() > parsed.expires) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ expires: Date.now() + CACHE_TTL_MS, value }),
    );
  } catch {
    /* quota */
  }
}

/**
 * @param {object} item
 * @returns {string}
 */
export function buildMrtTnaProductUrl(item) {
  const url = String(item?.productUrl || '').trim();
  if (url) return buildMrtMylinkUrl(url);
  const gid = String(item?.gid || '').trim();
  if (gid) {
    return buildMrtMylinkUrl(`https://experiences.myrealtrip.com/products/${gid}`);
  }
  return getMrtSearchUrl('');
}

/**
 * @param {string} keyword
 * @returns {string}
 */
export function buildMrtTnaSearchMoreUrl(keyword) {
  const q = String(keyword || '').trim();
  return q ? getMrtSearchUrl(q) : getMrtSearchUrl('국내 투어');
}

/**
 * @param {{
 *   keyword: string,
 *   altKeywords?: string[],
 *   nearbyKeywords?: string[],
 *   page?: number,
 *   size?: number,
 *   sort?: string,
 * }} params
 */
export async function fetchMrtTnas(params) {
  const keyword = String(params?.keyword || '').trim();
  if (!keyword) return null;

  const altKeywords = Array.isArray(params?.altKeywords)
    ? params.altKeywords.map((k) => String(k || '').trim()).filter(Boolean).slice(0, 10)
    : [];
  const nearbyKeywords = Array.isArray(params?.nearbyKeywords)
    ? params.nearbyKeywords.map((k) => String(k || '').trim()).filter(Boolean).slice(0, 8)
    : [];
  const page = Math.max(1, Number(params?.page) || 1);
  const size = Math.max(1, Math.min(50, Number(params?.size) || MRT_TNA_FETCH_SIZE));
  const sort = String(params?.sort || '').trim() || undefined;
  const ladderKey = [keyword, ...altKeywords].join('|');
  const nearbyKey = nearbyKeywords.join('|');
  const key = cacheKey(ladderKey, nearbyKey, page, size, sort);

  const hit = readCache(key);
  if (hit) return hit;

  try {
    const { data, error } = await supabase.functions.invoke('fetch-mrt-tnas', {
      body: {
        keyword,
        page,
        size,
        ...(altKeywords.length ? { altKeywords } : {}),
        ...(nearbyKeywords.length ? { nearbyKeywords } : {}),
        ...(sort ? { sort } : {}),
      },
    });

    if (error || !data?.ok) {
      return null;
    }

    const listed = Array.isArray(data.items) ? data.items : [];
    const payload = {
      ok: true,
      items: listed,
      totalCount: Number(data.totalCount) || listed.length,
      page: Number(data.page) || page,
      perPage: Number(data.perPage) || size,
      hasNextPage: Boolean(data.hasNextPage),
      keywordUsed: data.keywordUsed ?? keyword,
      nearbyExpanded: Boolean(data.nearbyExpanded),
      primaryKeywordUsed: data.primaryKeywordUsed || null,
      primaryCount: Number.isFinite(Number(data.primaryCount))
        ? Number(data.primaryCount)
        : null,
    };

    if (listed.length > 0) {
      writeCache(key, payload);
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * 국내 여행지·명소 TNA. 해외·스캔 중이면 null.
 * @param {object} location
 * @param {{ page?: number, size?: number, sort?: string }} [opts]
 */
export async function fetchMrtTnasForLocation(location, opts = {}) {
  if (!location || location.isScanning) return null;
  if (!canShowMrtTnaStrip(location)) return null;

  const query = resolveMrtTnaQuery(location);
  if (!query.keyword) return null;

  return fetchMrtTnas({
    ...query,
    page: opts.page,
    size: opts.size ?? MRT_TNA_FETCH_SIZE,
    sort: opts.sort,
  });
}

/**
 * Phase 2 「인근지역 더보기」— 단일 인근 키워드만 (nearbyKeywords 미전달 → Edge 재보강 없음).
 * @param {string} keyword
 * @param {{ page?: number, size?: number, sort?: string }} [opts]
 */
export async function fetchMrtTnasNearbyKeyword(keyword, opts = {}) {
  const kw = String(keyword || '').trim();
  if (!kw) return null;
  return fetchMrtTnas({
    keyword: kw,
    page: opts.page,
    size: opts.size ?? MRT_TNA_FETCH_SIZE,
    sort: opts.sort,
  });
}

/**
 * @param {object[]} existing
 * @param {object[]} incoming
 * @param {number} [maxSize]
 */
export function mergeMrtTnaItemsByGid(existing, incoming, maxSize) {
  const seen = new Set();
  const out = [];
  const cap =
    Number.isFinite(Number(maxSize)) && Number(maxSize) > 0
      ? Number(maxSize)
      : Infinity;
  for (const it of [...(existing || []), ...(incoming || [])]) {
    const gid = String(it?.gid || '').trim();
    if (gid) {
      if (seen.has(gid)) continue;
      seen.add(gid);
    }
    out.push(it);
    if (out.length >= cap) break;
  }
  return out;
}
