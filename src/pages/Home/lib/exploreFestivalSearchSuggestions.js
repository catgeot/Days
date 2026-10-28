import { filterBySearchQuery } from '../../Korea/festivalSearch.js';
import { fetchKoreaFestivalsRolling12 } from '../../Korea/fetchKoreaFestivalsWindow.js';
import { mergeManualFestivalsIntoFestivalItems } from '../../Korea/manualFestivalEntries.js';
import { formatFestivalDetailDateRange } from '../../Korea/festivalDateFilter.js';
import { festivalGridPlaceLabel } from '../../Korea/festivalGridPlaceLabel.js';
import { festivalListDisplayTitleLines } from '../../Korea/festivalDisplayTitle.js';
import { festivalItemThumbSrc } from '../../Korea/festivalListThumb.js';
import { EXPLORE_BADGE_FESTIVAL } from '../../../i18n/exploreUi.js';

const DEFAULT_LIMIT = 5;

/** @type {Promise<object[]> | null} */
let festivalSearchPoolPromise = null;

export function resetExploreFestivalSearchPoolForTests() {
  festivalSearchPoolPromise = null;
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
 * @param {{ limit?: number, locale?: string }} [opts]
 */
export function buildExploreFestivalSuggestionsFromPool(pool, query, opts = {}) {
  const q = String(query || '').trim();
  if (!q) return [];
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const locale = opts.locale || 'ko';
  const hits = filterBySearchQuery(pool || [], q).slice(0, limit);
  return hits.map((item) => festivalItemToExploreSuggestion(item, locale));
}

/**
 * @param {string} query
 * @param {{ limit?: number, locale?: string, now?: Date }} [opts]
 */
export async function buildExploreFestivalSearchSuggestions(query, opts = {}) {
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
