import { normalizeFestivalQuery } from '../../Korea/festivalSearch.js';
import { fetchKoreaFestivalsRolling12 } from '../../Korea/fetchKoreaFestivalsWindow.js';
import { mergeManualFestivalsIntoFestivalItems } from '../../Korea/manualFestivalEntries.js';
import { formatFestivalDetailDateRange } from '../../Korea/festivalDateFilter.js';
import { festivalGridPlaceLabel } from '../../Korea/festivalGridPlaceLabel.js';
import { festivalListDisplayTitleLines } from '../../Korea/festivalDisplayTitle.js';
import { festivalItemThumbSrc } from '../../Korea/festivalListThumb.js';
import { isFestivalEnded } from '../../Korea/festivalDeepLinkItem.js';
import { isGateoSiteSearchEnabled } from '../../../shared/gateoFeatureFlags.js';
import { EXPLORE_BADGE_FESTIVAL } from '../../../i18n/exploreUi.js';

const MAX_ACTIVE = 5;
const MAX_ENDED = 2;

/** @type {Promise<object[]> | null} */
let festivalSearchPoolPromise = null;

export function resetExploreFestivalSearchPoolForTests() {
  festivalSearchPoolPromise = null;
}

/**
 * Explore-only spaced query tokens (does not change /korea `filterBySearchQuery`).
 * @param {string} query
 * @returns {string[]}
 */
export function exploreFestivalSearchTokens(query) {
  const raw = String(query || '').trim();
  if (!raw) return [];
  if (/\s/.test(raw)) {
    const spaced = raw.split(/\s+/).map((part) => normalizeFestivalQuery(part)).filter(Boolean);
    if (spaced.length > 1 && spaced.every((tok) => tok.length >= 2)) {
      return spaced;
    }
  }
  const single = normalizeFestivalQuery(raw);
  return single ? [single] : [];
}

/**
 * @param {object[]} items
 * @param {string} query
 */
export function filterExploreFestivalSearchQuery(items, query) {
  const tokens = exploreFestivalSearchTokens(query);
  if (!tokens.length) return [];
  if (tokens.length === 1) {
    const q = tokens[0];
    return (items || []).filter((item) => {
      const title = normalizeFestivalQuery(item?.title);
      const addr = normalizeFestivalQuery(item?.addr1);
      return title.includes(q) || addr.includes(q);
    });
  }
  return (items || []).filter((item) => {
    const title = normalizeFestivalQuery(item?.title);
    const addr = normalizeFestivalQuery(item?.addr1);
    return tokens.every((tok) => title.includes(tok) || addr.includes(tok));
  });
}

/**
 * @param {object[]} hits
 * @param {Date} [now]
 * @param {{ maxActive?: number, maxEnded?: number }} [opts]
 */
export function rankExploreFestivalSearchHits(hits, now = new Date(), opts = {}) {
  const maxActive = opts.maxActive ?? MAX_ACTIVE;
  const maxEnded = opts.maxEnded ?? MAX_ENDED;
  /** @type {object[]} */
  const active = [];
  /** @type {object[]} */
  const ended = [];
  for (const item of hits || []) {
    if (isFestivalEnded(item?.eventEndDate, now)) ended.push(item);
    else active.push(item);
  }
  active.sort((a, b) =>
    String(a?.eventStartDate || '').localeCompare(String(b?.eventStartDate || '')),
  );
  ended.sort((a, b) =>
    String(b?.eventEndDate || '').localeCompare(String(a?.eventEndDate || '')),
  );
  return [...active.slice(0, maxActive), ...ended.slice(0, maxEnded)];
}

/**
 * @param {Date} [now]
 * @returns {Promise<object[]>}
 */
export async function loadExploreFestivalSearchPool(now = new Date()) {
  if (!festivalSearchPoolPromise) {
    festivalSearchPoolPromise = fetchKoreaFestivalsRolling12({ now })
      .then((res) => {
        if (!res?.ok || !Array.isArray(res.items)) return [];
        return mergeManualFestivalsIntoFestivalItems(res.items, now);
      })
      .catch(() => []);
  }
  return festivalSearchPoolPromise;
}

/**
 * @param {object} item
 * @param {string} [locale]
 */
export function festivalItemToExploreSuggestion(item, locale = 'ko') {
  const contentId = String(item?.contentId || '').trim();
  const titleLines = festivalListDisplayTitleLines(item, locale) || {
    primary: String(item?.title || '').trim(),
  };
  const enLocale = String(locale || '').startsWith('en');
  const range = formatFestivalDetailDateRange(
    item?.eventStartDate,
    item?.eventEndDate,
    undefined,
    enLocale ? 'en' : 'ko',
  );
  const place = festivalGridPlaceLabel(item, {
    areaCode: 'all',
    cityName: 'all',
    locale,
  });
  const metaLine = [range, place].filter(Boolean).join(' · ');
  const primary = String(titleLines.primary || item?.title || '').trim();
  const secondary = String(titleLines.secondary || '').trim();
  const thumbUrl = festivalItemThumbSrc(item);

  return {
    id: `festival-${contentId}`,
    kind: 'festival',
    badge: EXPLORE_BADGE_FESTIVAL,
    name: primary,
    name_en: secondary || String(item?.titleEn || primary).trim(),
    festivalContentId: contentId,
    exploreHref: `/korea?festival=${encodeURIComponent(contentId)}`,
    desc: metaLine,
    searchOverlayDesc: metaLine,
    country: '대한민국',
    country_en: 'South Korea',
    source: 'korea-festival',
    ...(thumbUrl ? { thumbUrl, imageUrl: thumbUrl } : {}),
  };
}

/**
 * @param {object[]} pool
 * @param {string} query
 * @param {{ locale?: string, now?: Date, maxActive?: number, maxEnded?: number }} [opts]
 */
export function buildExploreFestivalSuggestionsFromPool(pool, query, opts = {}) {
  if (!isGateoSiteSearchEnabled()) return [];
  const q = String(query || '').trim();
  if (!q) return [];
  const locale = opts.locale || 'ko';
  const now = opts.now instanceof Date ? opts.now : new Date();
  const hits = rankExploreFestivalSearchHits(
    filterExploreFestivalSearchQuery(pool || [], q),
    now,
    opts,
  );
  return hits.map((item) => festivalItemToExploreSuggestion(item, locale));
}

/**
 * Gated by `VITE_GATEO_SITE_SEARCH` (=1 in prod).
 * @param {string} query
 * @param {{ locale?: string, now?: Date }} [opts]
 */
export async function buildExploreFestivalSearchSuggestions(query, opts = {}) {
  if (!isGateoSiteSearchEnabled()) return [];
  const q = String(query || '').trim();
  if (!q) return [];
  const pool = await loadExploreFestivalSearchPool(
    opts.now instanceof Date ? opts.now : new Date(),
  );
  return buildExploreFestivalSuggestionsFromPool(pool, q, opts);
}

/**
 * @param {object[]} festivals
 * @param {object[]} items
 * @param {{ maxItems?: number }} [opts]
 */
export function prependExploreFestivalSuggestions(festivals, items, opts = {}) {
  if (!festivals?.length) return items || [];
  const maxItems = opts.maxItems ?? 24;
  const festIds = new Set(festivals.map((row) => row.id));
  const rest = (items || []).filter((row) => !festIds.has(row.id));
  return [...festivals, ...rest].slice(0, maxItems);
}

/**
 * /explore typing list only — async merge after hybrid suggestions.
 * @param {string} query
 * @param {object[]} hybridItems
 * @param {{ locale?: string, now?: Date }} [opts]
 */
export async function mergeExploreFestivalIntoHybridSuggestions(query, hybridItems, opts = {}) {
  if (!isGateoSiteSearchEnabled()) return hybridItems || [];
  const festivals = await buildExploreFestivalSearchSuggestions(query, opts).catch(() => []);
  return prependExploreFestivalSuggestions(festivals, hybridItems, opts);
}
