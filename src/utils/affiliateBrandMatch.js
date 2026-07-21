/**
 * AI 스마트 링크 텍스트 → 제휴사 홈 URL.
 * 부분 문자열 매칭 금지 — 정규화 후 별칭 정확 일치만.
 */

import {
  BIKESBOOKING_AFFILIATE_HOME_URL,
  BOUNCE_AFFILIATE_HOME_URL,
  get12GoHomeUrl,
  getAiraloHomeUrl,
  getAffiliateLink,
  getDirectFerriesAffiliateUrl,
  getGygHomeUrl,
  getHolaflyHomeUrl,
  getKlookSiteHomeUrl,
  getMrtHomeAffiliateUrl,
  getTripcomHomeUrl,
} from './affiliate.js';

/** @typedef {'klook' | 'tripcom' | 'twelve_go' | 'direct_ferries' | 'airalo' | 'holafly' | 'tiqets' | 'bounce' | 'bikesbooking' | 'mrt' | 'getyourguide'} AffiliateBrandProvider */

/**
 * 정규화용 별칭 → provider.
 * 키는 {@link normalizeBrandKey} 결과와 동일해야 함.
 * @type {Record<string, AffiliateBrandProvider>}
 */
const BRAND_ALIAS_TO_PROVIDER = {
  klook: 'klook',
  클룩: 'klook',

  tripcom: 'tripcom',
  tripdotcom: 'tripcom',
  'trip.com': 'tripcom',
  트립닷컴: 'tripcom',
  트립컴: 'tripcom',

  '12go': 'twelve_go',
  twelvego: 'twelve_go',
  '12goasia': 'twelve_go',
  '12고': 'twelve_go',

  directferries: 'direct_ferries',
  다이렉트페리스: 'direct_ferries',
  다이렉트페리: 'direct_ferries',

  airalo: 'airalo',
  에어알로: 'airalo',
  에어알로esim: 'airalo',

  holafly: 'holafly',
  홀라플라이: 'holafly',
  홀리플라이: 'holafly',
  홀라플라이esim: 'holafly',
  홀리플라이esim: 'holafly',

  tiqets: 'tiqets',
  티켓스: 'tiqets',

  getyourguide: 'getyourguide',
  gyg: 'getyourguide',
  겟유어가이드: 'getyourguide',

  bounce: 'bounce',
  바운스: 'bounce',

  bikesbooking: 'bikesbooking',
  바이크스부킹: 'bikesbooking',

  myrealtrip: 'mrt',
  마이리얼트립: 'mrt',
  mrt: 'mrt',
};

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeBrandKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim().toLowerCase();
  // 흔한 접미사·수식어 제거 (정확 매칭 전)
  s = s.replace(/\b(app|앱|공식|official|홈|home|사이트|site)\b/gi, ' ');
  // 공백·하이픈·언더스코어 제거 (영문 별칭 통합). 점은 trip.com 유지용으로 남김.
  s = s.replace(/[\s_\-]+/g, '');
  return s.trim();
}

/**
 * AI가 `클룩(Klook)` / `[@클룩(Klook)@]`처럼 괄호 병기를 한 덩어리로 넣을 때
 * 전체·괄호 밖·괄호 안을 각각 후보로 펼친다.
 *
 * @param {string} raw
 * @returns {string[]}
 */
function expandBrandCandidates(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const out = [trimmed];
  // 반각/전각 괄호: 클룩(Klook) · 클룩（Klook）
  const paren = trimmed.match(/^(.+?)\s*[\(（]\s*([^）)]+?)\s*[\)）]\s*$/);
  if (paren) {
    const outside = paren[1].trim();
    const inside = paren[2].trim();
    if (outside) out.push(outside);
    if (inside) out.push(inside);
  }
  return out;
}

/**
 * @param {AffiliateBrandProvider} provider
 * @param {{ locationName?: string, campaign?: string }} [options]
 * @returns {string}
 */
function buildHomeUrlForProvider(provider, options = {}) {
  const { locationName, campaign } = options;
  switch (provider) {
    case 'klook':
      return getKlookSiteHomeUrl();
    case 'tripcom':
      return getTripcomHomeUrl({ locationName, campaign });
    case 'twelve_go':
      return get12GoHomeUrl({
        subId: campaign ? String(campaign).slice(0, 64) : 'gateo-smart-link',
      });
    case 'direct_ferries':
      return getDirectFerriesAffiliateUrl();
    case 'airalo':
      // eSIM: 목적지 검색바 딥링크 불가 → 제휴 홈만
      return getAiraloHomeUrl({ locationName, campaign });
    case 'holafly':
      // eSIM: 목적지 검색바 딥링크 불가 → 제휴 홈만
      return getHolaflyHomeUrl({ locationName, campaign });
    case 'tiqets':
      return getAffiliateLink('https://www.tiqets.com/', 'tiqets', {
        locationName,
        campaign,
      });
    case 'getyourguide':
      // cmp는 제휴 대시보드 기준 `gateo_planer` 고정 (광고 파라미터 제외 클린 URL)
      return getGygHomeUrl();
    case 'bounce':
      return BOUNCE_AFFILIATE_HOME_URL;
    case 'bikesbooking':
      return BIKESBOOKING_AFFILIATE_HOME_URL;
    case 'mrt':
      return getMrtHomeAffiliateUrl();
    default:
      return '';
  }
}

/**
 * 스마트 링크 영문/한글 표기 → 제휴 홈 URL.
 * word·koreanName 중 하나라도 별칭과 정확 일치하면 매칭.
 *
 * @param {string} [word]
 * @param {string} [koreanName]
 * @param {{ locationName?: string, campaign?: string }} [options]
 * @returns {string | null}
 */
export function resolveAffiliateHomeFromBrandText(word, koreanName, options = {}) {
  const seeds = [word, koreanName].filter(
    (v) => typeof v === 'string' && v.trim().length > 0
  );
  const candidates = [];
  for (const seed of seeds) {
    for (const part of expandBrandCandidates(seed)) {
      if (!candidates.includes(part)) candidates.push(part);
    }
  }

  for (const candidate of candidates) {
    const key = normalizeBrandKey(candidate);
    if (!key) continue;
    const provider = BRAND_ALIAS_TO_PROVIDER[key];
    if (!provider) continue;
    const url = buildHomeUrlForProvider(provider, options);
    if (url) return url;
  }

  return null;
}
