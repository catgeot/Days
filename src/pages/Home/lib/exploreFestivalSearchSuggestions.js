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

/** Max wait for festival pool before first hybrid paint (prepend if ready). */
export const EXPLORE_FESTIVAL_MERGE_WAIT_MS = 300;

/**
 * Index after SSOT/city/hub/settlement block — before Mapbox geocode rows.
 * @param {object[]} items
 */
export function explorePlaceBlockInsertIndex(items) {
  for (let i = 0; i < (items || []).length; i += 1) {
    const src = String(items[i]?.source || '');
    if (src === 'mapbox' || src === 'mapbox-geocode') return i;
  }
  return (items || []).length;
}

/**
 * Late festival merge: below curated city/place rows (no shift above insert index).
 * @param {object[]} festivals
 * @param {object[]} items
 * @param {{ maxItems?: number }} [opts]
 */
export function appendExploreFestivalBelowPlaceBlock(festivals, items, opts = {}) {
  if (!festivals?.length) return items || [];
  const maxItems = opts.maxItems ?? 24;
  const festIds = new Set(festivals.map((row) => row.id));
  const base = (items || []).filter((row) => !festIds.has(row.id));
  const idx = explorePlaceBlockInsertIndex(base);
  return [...base.slice(0, idx), ...festivals, ...base.slice(idx)].slice(0, maxItems);
}

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
 * Normalized search fields for explore festival matching (KO title/addr + EN title/region labels).
 * @param {object} item
 * @param {string} [locale]
 */
export function exploreFestivalSearchFields(item, locale = 'ko') {
  const chunks = [
    item?.title,
    item?.titleEn,
    item?.addr1,
    festivalGridPlaceLabel(item, { areaCode: 'all', cityName: 'all', locale: 'ko' }),
    festivalGridPlaceLabel(item, { areaCode: 'all', cityName: 'all', locale: 'en' }),
  ];
  if (String(locale || '').startsWith('en')) {
    chunks.push(
      festivalGridPlaceLabel(item, { areaCode: 'all', cityName: 'all', locale }),
    );
  }
  const seen = new Set();
  const out = [];
  for (const chunk of chunks) {
    const norm = normalizeFestivalQuery(chunk);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

function exploreItemMatchesTokens(item, tokens, locale) {
  const fields = exploreFestivalSearchFields(item, locale);
  return tokens.every((tok) => fields.some((field) => field.includes(tok)));
}

/**
 * @param {object[]} items
 * @param {string} query
 * @param {{ locale?: string }} [opts]
 */
export function filterExploreFestivalSearchQuery(items, query, opts = {}) {
  const tokens = exploreFestivalSearchTokens(query);
  if (!tokens.length) return [];
  const locale = opts.locale || 'ko';
  return (items || []).filter((item) => exploreItemMatchesTokens(item, tokens, locale));
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
    filterExploreFestivalSearchQuery(pool || [], q, { locale }),
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
 * /explore typing list — anti layout-shift merge (300ms prepend window, else append below place block).
 * @param {string} query
 * @param {object[]} hybridItems
 * @param {{ locale?: string, now?: Date, startedAt?: number, festPromise?: Promise<object[]>, maxItems?: number }} [opts]
 * @returns {Promise<{ items: object[], late: (() => Promise<object[]>) | null }>}
 */
export async function applyExploreFestivalMergeStrategy(query, hybridItems, opts = {}) {
  if (!isGateoSiteSearchEnabled()) {
    return { items: hybridItems || [], late: null };
  }
  const t0 = typeof opts.startedAt === 'number' ? opts.startedAt : Date.now();
  const festP =
    opts.festPromise ||
    buildExploreFestivalSearchSuggestions(query, opts).catch(() => []);

  const elapsed = Date.now() - t0;
  const remain = Math.max(0, EXPLORE_FESTIVAL_MERGE_WAIT_MS - elapsed);

  if (remain > 0) {
    const raced = await Promise.race([
      festP.then((festivals) => ({ festivals, settled: true })),
      new Promise((resolve) => {
        setTimeout(() => resolve({ festivals: null, settled: false }), remain);
      }),
    ]);
    if (raced.settled && raced.festivals?.length) {
      return {
        items: prependExploreFestivalSuggestions(raced.festivals, hybridItems, opts),
        late: null,
      };
    }
    if (raced.settled) {
      return { items: hybridItems || [], late: null };
    }
  }

  return {
    items: hybridItems || [],
    late: async () => {
      const festivals = await festP;
      if (!festivals?.length) return hybridItems || [];
      return appendExploreFestivalBelowPlaceBlock(festivals, hybridItems, opts);
    },
  };
}

/**
 * /explore typing list only — async merge after hybrid suggestions.
 * @param {string} query
 * @param {object[]} hybridItems
 * @param {{ locale?: string, now?: Date }} [opts]
 */
export async function mergeExploreFestivalIntoHybridSuggestions(query, hybridItems, opts = {}) {
  if (!isGateoSiteSearchEnabled()) return hybridItems || [];
  const { items, late } = await applyExploreFestivalMergeStrategy(query, hybridItems, opts);
  if (!late) return items;
  return late();
}
