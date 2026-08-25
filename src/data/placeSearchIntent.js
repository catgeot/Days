/**
 * External search intent SSOT — Google/Naver 「지명+의도」→ PlaceCard tab URL.
 * @see plans/en-seo-followup-plan.md §1.2 · #2
 */

/** @typedef {'gallery'|'video'|'planner'|'wiki'|'reviews'} PlaceSearchTab */

/**
 * @typedef {Object} PlaceSearchIntent
 * @property {string} intentId
 * @property {PlaceSearchTab} tab
 * @property {string[]} koQuerySuffix
 * @property {string[]} enQuerySuffix
 * @property {number} [sitemapPriorityOffset] tier base 대비 offset (primary intent only)
 * @property {number} [staticLinkTier] index.html 정적 링크 tier (1=tier1 slug, #8)
 * @property {string} [koTitle] `{name}` placeholder — tab primary title (one per tab)
 * @property {string} [enTitle]
 * @property {string} [koDescLead] rich desc 앞 lead-in
 * @property {string} [enDescLead]
 */

/** @type {PlaceSearchIntent[]} */
export const PLACE_SEARCH_INTENTS = [
  {
    intentId: 'gallery',
    tab: 'gallery',
    koQuerySuffix: ['사진', '갤러리', '여행', '여행 사진'],
    enQuerySuffix: ['photos', 'gallery', 'pictures', 'travel'],
    koTitle: '{name} 여행 사진 · 갤러리',
    enTitle: '{name} travel photos · gallery',
    koDescLead: '{name} 여행 사진과 갤러리.',
    enDescLead: 'Browse {name} travel photos and gallery images.',
    sitemapPriorityOffset: -0.05,
    staticLinkTier: 1,
  },
  {
    intentId: 'travel',
    tab: 'planner',
    koQuerySuffix: ['여행', '관광'],
    enQuerySuffix: ['travel'],
    sitemapPriorityOffset: -0.1,
    staticLinkTier: 1,
  },
  {
    intentId: 'planner',
    tab: 'planner',
    koQuerySuffix: ['플래너', '여행 준비', '여행 가이드', '여행 계획'],
    enQuerySuffix: ['trip planner', 'plan a trip', 'trip planning'],
    koTitle: '{name} 여행 · 준비 가이드',
    enTitle: '{name} travel · trip planner',
    koDescLead: '{name} 여행 준비·항공·숙소·현지 팁.',
    enDescLead: 'Plan a trip to {name} — flights, stays, and local tips.',
  },
  {
    intentId: 'flight-route',
    tab: 'planner',
    koQuerySuffix: ['항공', '항공 경로', '항공편', '직항', '비행'],
    enQuerySuffix: ['flights', 'flight route', 'air route', 'nonstop'],
  },
  {
    intentId: 'video',
    tab: 'video',
    koQuerySuffix: ['여행', '영상', '여행 영상'],
    enQuerySuffix: ['travel', 'video', 'videos', 'travel videos'],
    koTitle: '{name} 여행 영상',
    enTitle: '{name} travel videos',
    koDescLead: '{name} 여행 영상과 현장 Vlog.',
    enDescLead: 'Watch {name} travel videos and on-the-ground footage.',
  },
  {
    intentId: 'reviews',
    tab: 'reviews',
    koQuerySuffix: ['여행', '후기', '리뷰'],
    enQuerySuffix: ['travel', 'reviews'],
    koTitle: '{name} 여행 후기',
    enTitle: '{name} travel reviews',
    koDescLead: '{name} 여행 후기와 평점.',
    enDescLead: 'Read traveler reviews for {name}.',
  },
  {
    intentId: 'wiki',
    tab: 'wiki',
    koQuerySuffix: ['여행', '여행 스케치', '가이드'],
    enQuerySuffix: ['travel guide', 'travel sketch'],
    koTitle: '{name} 여행 스케치',
    enTitle: '{name} travel sketch · guide',
  },
];

const INTENTS_BY_TAB = PLACE_SEARCH_INTENTS.reduce((acc, intent) => {
  if (!acc[intent.tab]) acc[intent.tab] = [];
  acc[intent.tab].push(intent);
  return acc;
}, /** @type {Record<string, PlaceSearchIntent[]>} */ ({}));

const DEFAULT_KO_TITLE = '{name} 여행 가이드';
const DEFAULT_EN_TITLE = '{name} travel guide';

export function getPlaceSearchIntentsForTab(tabKey) {
  return INTENTS_BY_TAB[tabKey] || [];
}

export function getPrimaryPlaceSearchIntent(tabKey) {
  const intents = getPlaceSearchIntentsForTab(tabKey);
  return intents.find((i) => i.koTitle || i.enTitle) || intents[0] || null;
}

export function getPlaceSearchQuerySuffixes(tabKey, locale = 'ko') {
  const key = locale === 'en' ? 'enQuerySuffix' : 'koQuerySuffix';
  return [...new Set(getPlaceSearchIntentsForTab(tabKey).flatMap((i) => i[key] || []))];
}

export function getPlaceSearchSitemapPriorityOffset(tabKey) {
  const intents = getPlaceSearchIntentsForTab(tabKey);
  const withOffset = intents.find((i) => typeof i.sitemapPriorityOffset === 'number');
  return withOffset?.sitemapPriorityOffset ?? 0;
}

export function getPlaceSearchStaticLinkTier(tabKey) {
  const intents = getPlaceSearchIntentsForTab(tabKey);
  const tiers = intents.map((i) => i.staticLinkTier).filter((t) => typeof t === 'number');
  return tiers.length ? Math.min(...tiers) : null;
}

export function formatPlaceSearchTemplate(template, name) {
  return String(template || '').replace(/\{name\}/g, name);
}

export function getPlaceSearchTabTitle(location, locale, tabKey) {
  const koName = location?.name || '';
  const enName = location?.name_en || koName;
  const primary = getPrimaryPlaceSearchIntent(tabKey);
  const isEn = locale === 'en';
  const name = isEn ? enName : koName;
  const template = isEn
    ? primary?.enTitle || DEFAULT_EN_TITLE
    : primary?.koTitle || DEFAULT_KO_TITLE;
  return formatPlaceSearchTemplate(template, name);
}

export function getPlaceSearchTabDescLead(location, locale, tabKey) {
  const koName = location?.name || '';
  const enName = location?.name_en || koName;
  const primary = getPrimaryPlaceSearchIntent(tabKey);
  const isEn = locale === 'en';
  const name = isEn ? enName : koName;
  const template = isEn ? primary?.enDescLead : primary?.koDescLead;
  return template ? formatPlaceSearchTemplate(template, name) : null;
}
