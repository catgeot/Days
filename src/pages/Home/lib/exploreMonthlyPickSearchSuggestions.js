import { MONTHLY_PICKS } from '../data/spotTraits';
import {
  buildVisibleMonthlyPickCards,
  exploreV2MonthlyPickHeadline,
  monthlyPickHeadingMonthLabel,
  resolveExploreMonthlyPickHeroUrl,
} from './exploreMonthlyPicks.js';

const EN_MONTH_BY_NAME = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const GENERIC_TOKENS = new Set([
  '여행',
  '여행지',
  '추천',
  '휴가',
  '관광',
  '명소',
  '가볼만한곳',
  '가볼만한',
  '이달',
  '이달의',
  '해외',
  '국내',
  'travel',
  'trip',
  'trips',
  'destination',
  'destinations',
  'vacation',
  'holiday',
  'holidays',
  'recommended',
  'recommendation',
  'best',
  'places',
  'place',
  'overseas',
  'domestic',
  'international',
  'the',
  'and',
  'for',
  'with',
  'in',
  'of',
  'to',
  'go',
  'a',
  'an',
]);

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

function hasTravelIntent(raw) {
  return /여행|추천|휴가|가볼|해외|국내|travel|trip|destination|vacation|holiday/i.test(raw);
}

function parseMonthKey(monthKey) {
  const m = String(monthKey || '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

/**
 * @param {string} query
 */
export function parseExploreMonthlyPickSearchQuery(query) {
  const raw = String(query || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();

  let year = null;
  const yearMatch = lower.match(/(20\d{2})/);
  if (yearMatch) year = Number(yearMatch[1]);

  let month = null;
  const koMonth = lower.match(/(\d{1,2})\s*월/);
  if (koMonth) month = Number(koMonth[1]);
  if (!month) {
    const enMonth = lower.match(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/,
    );
    if (enMonth) month = EN_MONTH_BY_NAME[enMonth[1]] || null;
  }
  if (month && (month < 1 || month > 12)) month = null;

  const travelIntent = hasTravelIntent(raw);
  const monthOnly =
    Boolean(month) &&
    !travelIntent &&
    /^(?:20\d{2}\s*년\s*)?\d{1,2}\s*월(?:의)?(?:\s*여행지)?$/.test(raw.replace(/\s+/g, ' ').trim()) ||
    Boolean(month) &&
      !travelIntent &&
      /^(?:20\d{2}\s*)?(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+20\d{2})?$/.test(lower);

  if (month && !travelIntent && !monthOnly) return null;
  if (!month && !travelIntent) return null;

  let rest = lower
    .replace(/20\d{2}\s*년?/g, ' ')
    .replace(/\d{1,2}\s*월/g, ' ')
    .replace(
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/g,
      ' ',
    );

  const scope = /해외|overseas|international/.test(lower)
    ? 'overseas'
    : /국내|domestic/.test(lower)
      ? 'domestic'
      : null;

  const specificTokens = [];
  for (const part of rest.split(/[^0-9a-z가-힣]+/i)) {
    let token = part.trim();
    if (!token) continue;
    token = token
      .replace(/여행지/g, '')
      .replace(/해외여행/g, '')
      .replace(/국내여행/g, '')
      .replace(/여행/g, '')
      .replace(/추천/g, '');
    if (token.length < 2 || GENERIC_TOKENS.has(token)) continue;
    if (!specificTokens.includes(token)) specificTokens.push(token);
  }

  if (!month && specificTokens.length === 0) return null;

  return { year, month, specificTokens, scope, travelIntent };
}

function isDomesticSpot(spot) {
  const country = `${spot?.country || ''} ${spot?.country_en || ''}`;
  return /한국|대한민국|south\s*korea|\bkorea\b/i.test(country);
}

function everyTokenIn(tokens, field) {
  const key = normalizeKey(field);
  return tokens.every((tok) => key.includes(normalizeKey(tok)));
}

function cardToSuggestion(monthKey, { entry, spot }) {
  const headline = exploreV2MonthlyPickHeadline(monthKey);
  const reason = String(entry?.reason || '').trim();
  const heroUrl = resolveExploreMonthlyPickHeroUrl(spot);
  return {
    id: `monthly-pick-${monthKey}-${String(entry?.slug || spot?.slug || '').toLowerCase()}`,
    kind: 'spot',
    source: 'monthly-pick',
    badge: '여행지',
    groupTitle: headline,
    monthlyPickMonthKey: monthKey,
    name: spot?.name,
    name_en: spot?.name_en || spot?.name,
    country: spot?.country || 'Explore',
    country_en: spot?.country_en || 'Explore',
    lat: spot?.lat,
    lng: spot?.lng,
    slug: spot?.slug || entry?.slug,
    ...(reason ? { searchOverlayDesc: reason } : {}),
    ...(heroUrl ? { thumbUrl: heroUrl, imageUrl: heroUrl } : {}),
  };
}

/**
 * Pure core — cards are derived from MONTHLY_PICKS by the wrapper below, so a
 * new pick/month needs no separate search registration.
 * @param {string} query
 * @param {Record<string, ReturnType<typeof buildVisibleMonthlyPickCards>>} cardsByMonth
 * @param {{ maxItems?: number }} [opts]
 */
export function buildMonthlyPickSearchSuggestionsFromCards(query, cardsByMonth, opts = {}) {
  const parsed = parseExploreMonthlyPickSearchQuery(query);
  if (!parsed || !cardsByMonth) return [];
  const maxItems = opts.maxItems ?? 12;

  const monthKeys = Object.keys(cardsByMonth)
    .filter((monthKey) => {
      const parsedKey = parseMonthKey(monthKey);
      if (!parsedKey) return false;
      if (parsed.year && parsedKey.year !== parsed.year) return false;
      if (parsed.month && parsedKey.month !== parsed.month) return false;
      return true;
    })
    .sort((a, b) => b.localeCompare(a));

  const out = [];
  for (const monthKey of monthKeys) {
    const headline = exploreV2MonthlyPickHeadline(monthKey);
    const monthLabel = monthlyPickHeadingMonthLabel(monthKey);
    for (const card of cardsByMonth[monthKey] || []) {
      const { entry, spot } = card || {};
      if (!spot?.name) continue;
      if (parsed.scope === 'overseas' && isDomesticSpot(spot)) continue;
      if (parsed.scope === 'domestic' && !isDomesticSpot(spot)) continue;

      if (parsed.specificTokens.length) {
        const field = parsed.month
          ? [
              entry?.reason,
              headline,
              monthLabel,
              spot.name,
              spot.name_en,
              spot.country,
              spot.country_en,
            ].join(' ')
          : [entry?.reason, headline, monthLabel].join(' ');
        if (!everyTokenIn(parsed.specificTokens, field)) continue;
      }

      out.push(cardToSuggestion(monthKey, card));
      if (out.length >= maxItems) return out;
    }
    if (!parsed.month && out.length >= maxItems) break;
  }
  return out;
}

/**
 * @param {string} query
 * @param {{ maxItems?: number }} [opts]
 */
export function buildExploreMonthlyPickSearchSuggestions(query, opts = {}) {
  const cardsByMonth = {};
  for (const monthKey of Object.keys(MONTHLY_PICKS || {})) {
    cardsByMonth[monthKey] = buildVisibleMonthlyPickCards(monthKey);
  }
  return buildMonthlyPickSearchSuggestionsFromCards(query, cardsByMonth, opts);
}

export function hasExploreMonthlyPickSearchMatch(query) {
  return buildExploreMonthlyPickSearchSuggestions(query).length > 0;
}
