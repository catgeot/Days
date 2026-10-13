import {
  festivalDetailAsOf,
  festivalItemFromDetail,
  isFestivalEnded,
  todayYmdKst,
} from './festivalDeepLinkItem.js';
import { filterByRegion } from './festivalRegionTags.js';

function pickStr(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 */
export function hasFestivalThumbnail(item) {
  return Boolean(
    pickStr(item?.firstimage, item?.firstImage, item?.imageUrl, item?.firstimage2),
  );
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 */
export function normalizeFestivalItemImages(item) {
  if (!item || item.contentId == null) return item;
  let firstimage = pickStr(item.firstimage, item.firstImage, item.imageUrl);
  let imageUrl = pickStr(item.imageUrl, item.firstimage, item.firstimage2);
  if (!firstimage && imageUrl) firstimage = imageUrl;
  if (!imageUrl && firstimage) imageUrl = firstimage;
  if (firstimage.startsWith('//')) firstimage = `https:${firstimage}`;
  if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
  if (firstimage.startsWith('http://')) {
    firstimage = firstimage.replace(/^http:\/\//i, 'https://');
  }
  if (imageUrl.startsWith('http://')) {
    imageUrl = imageUrl.replace(/^http:\/\//i, 'https://');
  }
  return { ...item, firstimage, imageUrl };
}

/**
 * @param {Record<string, unknown> | null | undefined} primary
 * @param {Record<string, unknown> | null | undefined} overlay
 */
export function mergeFestivalRowItem(primary, overlay) {
  if (!primary) return overlay ? normalizeFestivalItemImages(overlay) : null;
  if (!overlay) return normalizeFestivalItemImages(primary);
  const firstimage = pickStr(
    primary.firstimage,
    primary.firstImage,
    overlay.firstimage,
    overlay.firstImage,
    primary.imageUrl,
    overlay.imageUrl,
  );
  const imageUrl = pickStr(
    primary.imageUrl,
    overlay.imageUrl,
    primary.firstimage,
    overlay.firstimage,
    primary.firstimage2,
    overlay.firstimage2,
  );
  return normalizeFestivalItemImages({
    ...primary,
    ...overlay,
    title: pickStr(overlay.title, primary.title),
    titleEn: pickStr(overlay.titleEn, primary.titleEn),
    firstimage,
    imageUrl,
    eventStartDate: pickStr(overlay.eventStartDate, primary.eventStartDate),
    eventEndDate: pickStr(overlay.eventEndDate, primary.eventEndDate),
    addr1: pickStr(overlay.addr1, primary.addr1),
    detailAsOf: overlay.detailAsOf || primary.detailAsOf,
    contentId: String(overlay.contentId || primary.contentId),
  });
}

function ymdFromKstDateString(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(0, 8) : '';
}

/**
 * @param {string} ymd
 * @param {string} fromYmd
 * @param {string} untilYmd
 */
export function isYmdWithinInclusive(ymd, fromYmd, untilYmd) {
  if (!/^\d{8}$/.test(ymd)) return false;
  if (/^\d{8}$/.test(fromYmd) && ymd < fromYmd) return false;
  if (/^\d{8}$/.test(untilYmd) && ymd > untilYmd) return false;
  return true;
}

/**
 * @param {{ showFrom?: string, showUntil?: string }} entry
 * @param {Date | string | number} [now]
 */
export function isSocialPromoEntryInWindow(entry, now = new Date()) {
  const today = todayYmdKst(now);
  const from = ymdFromKstDateString(entry?.showFrom);
  const until = ymdFromKstDateString(entry?.showUntil);
  return isYmdWithinInclusive(today, from, until);
}

/**
 * @param {Record<string, unknown>} item
 * @param {{ showFrom?: string, showUntil?: string }} entry
 * @param {Date | string | number} [now]
 */
export function shouldShowSocialPromoItem(item, entry, now = new Date()) {
  if (!item?.contentId) return false;
  if (!isSocialPromoEntryInWindow(entry, now)) return false;
  if (isFestivalEnded(item.eventEndDate, now)) return false;
  return true;
}

/**
 * @param {object | null | undefined} detail
 * @returns {Record<string, unknown> | null}
 */
export function festivalItemFromDetailWithAsOf(detail) {
  const built = festivalItemFromDetail(detail);
  if (!built) return null;
  const detailAsOf = festivalDetailAsOf(detail);
  const withAsOf = detailAsOf ? { ...built, detailAsOf } : built;
  return normalizeFestivalItemImages(withAsOf);
}

/**
 * @param {Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>} itemById
 * @param {string} contentId
 */
export function resolveSocialPromoItem(itemById, contentId) {
  const id = String(contentId || '').trim();
  if (!id) return null;
  if (itemById instanceof Map) return itemById.get(id) || null;
  return itemById[id] || null;
}

/**
 * @param {Array<{ contentId: string, showFrom?: string, showUntil?: string }>} entries
 * @param {Map<string, Record<string, unknown>>} itemById
 * @param {Date | string | number} [now]
 * @param {number} [maxCards]
 */
export function pickVisibleSocialPromoCards(
  entries,
  itemById,
  now = new Date(),
  maxCards = 2,
) {
  const row = resolveSocialPromoRow(entries, itemById, now, maxCards);
  return row.status === 'ready' ? row.cards : [];
}

/**
 * Promo home row — JSON order, no partial card list while loading.
 * @returns {{ status: 'loading' | 'ready' | 'empty', cards: Array<{ entry: object, item: object | null }> }}
 */
export function resolveSocialPromoRow(
  entries,
  itemById,
  now = new Date(),
  maxCards = 2,
) {
  const configured = (entries || []).slice(0, maxCards);
  if (!configured.length) return { status: 'empty', cards: [] };

  const allResolved = configured.every((entry) =>
    resolveSocialPromoItem(itemById, entry.contentId),
  );
  if (!allResolved) {
    return {
      status: 'loading',
      cards: configured.map((entry) => ({ entry, item: null })),
    };
  }

  const cards = [];
  for (const entry of configured) {
    const item = normalizeFestivalItemImages(
      resolveSocialPromoItem(itemById, entry.contentId),
    );
    if (!shouldShowSocialPromoItem(item, entry, now)) continue;
    cards.push({ entry, item });
  }
  if (!cards.length) return { status: 'empty', cards: [] };
  return { status: 'ready', cards };
}

/** Promo strip only on default festival home (not search results). */
export function shouldShowSocialPromoHomeRow(searchActive) {
  return !searchActive;
}

/**
 * Session pin row: default 전국 list only (no search, no sido/city chip).
 * @param {boolean} searchActive
 * @param {string | undefined} areaCode
 * @param {string | undefined} cityName
 */
export function shouldShowSessionPinnedHomeRow(
  searchActive,
  areaCode,
  cityName,
) {
  if (searchActive) return false;
  return isNationwideRegionFilter(areaCode, cityName);
}

/**
 * @param {string | undefined} areaCode
 * @param {string | undefined} cityName
 */
export function isNationwideRegionFilter(areaCode, cityName) {
  const area = String(areaCode ?? 'all').trim() || 'all';
  const city = String(cityName ?? 'all').trim() || 'all';
  return area === 'all' && city === 'all';
}

/**
 * @param {Array<{ entry: object, item: object | null }>} cards
 * @param {{ areaCode?: string, cityName?: string }} regionFilter
 */
export function filterSocialPromoCardsByRegion(cards, regionFilter = {}) {
  if (!Array.isArray(cards) || !cards.length) return [];
  if (
    isNationwideRegionFilter(regionFilter.areaCode, regionFilter.cityName)
  ) {
    return cards;
  }
  return cards.filter(({ item }) =>
    filterByRegion([item], regionFilter).length > 0,
  );
}

/**
 * @param {{ status: string, cards: Array<{ entry: object, item: object | null }> }} row
 * @param {{ searchActive?: boolean, areaCode?: string, cityName?: string }} ctx
 */
export function resolveSocialPromoPresentation(row, ctx = {}) {
  const searchActive = Boolean(ctx.searchActive);
  const regionFilter = {
    areaCode: ctx.areaCode,
    cityName: ctx.cityName,
  };
  if (!shouldShowSocialPromoHomeRow(searchActive)) {
    return { show: false, cards: [], loading: false };
  }
  if (!row || row.status === 'empty') {
    return { show: false, cards: [], loading: false };
  }
  const nationwide = isNationwideRegionFilter(
    regionFilter.areaCode,
    regionFilter.cityName,
  );
  if (row.status === 'loading') {
    if (!nationwide) {
      return { show: false, cards: [], loading: false };
    }
    return { show: true, cards: row.cards, loading: true };
  }
  if (row.status === 'ready') {
    const cards = filterSocialPromoCardsByRegion(row.cards, regionFilter);
    return { show: cards.length > 0, cards, loading: false };
  }
  return { show: false, cards: [], loading: false };
}

/**
 * Skip session pin when the same festival is already in the promo row.
 * @param {string | null | undefined} pinnedId
 * @param {Array<{ item?: { contentId?: unknown } }>} promoCards
 */
export function shouldShowSessionPinnedRow(pinnedId, promoCards) {
  const id = String(pinnedId || '').trim();
  if (!id) return false;
  return !(promoCards || []).some(
    (card) => String(card?.item?.contentId || '') === id,
  );
}

/**
 * Merge configured promo IDs missing from the window list (not ended).
 * @param {object[]} baseItems
 * @param {Array<{ contentId: string, showFrom?: string, showUntil?: string }>} entries
 * @param {Map<string, Record<string, unknown>>} supplementalById
 * @param {Date | string | number} [now]
 */
export function mergeSocialPromoIntoFestivalItems(
  baseItems,
  entries,
  supplementalById,
  now = new Date(),
) {
  const list = Array.isArray(baseItems) ? [...baseItems] : [];
  const seen = new Set(list.map((row) => String(row?.contentId || '')));

  for (const entry of entries || []) {
    const id = String(entry?.contentId || '').trim();
    if (!id || seen.has(id)) continue;

    const fromList = list.find((row) => String(row?.contentId || '') === id);
    const supplemental = resolveSocialPromoItem(supplementalById, id);
    const candidate = mergeFestivalRowItem(fromList, supplemental);
    if (!candidate) continue;
    if (!shouldShowSocialPromoItem(candidate, entry, now)) continue;

    list.push(candidate);
    seen.add(id);
  }

  return list;
}

/**
 * @param {object[]} baseItems
 * @param {Array<{ contentId: string }>} entries
 */
export function socialPromoIdsMissingFromWindow(baseItems, entries) {
  const seen = new Set(
    (baseItems || []).map((row) => String(row?.contentId || '')),
  );
  return (entries || [])
    .map((entry) => String(entry?.contentId || '').trim())
    .filter((id) => id && !seen.has(id));
}

/**
 * Configured promo IDs that still need a detail fetch (missing from window or thumbnail).
 * @param {object[]} baseItems
 * @param {Array<{ contentId: string }>} entries
 * @param {Map<string, Record<string, unknown>>} detailById
 */
export function socialPromoIdsNeedingDetailFetch(baseItems, entries, detailById) {
  const windowById = new Map();
  for (const row of baseItems || []) {
    const id = String(row?.contentId || '').trim();
    if (id) windowById.set(id, row);
  }
  return (entries || [])
    .map((entry) => String(entry?.contentId || '').trim())
    .filter((id) => {
      if (!id || detailById?.get?.(id)) return false;
      const windowItem = windowById.get(id);
      if (windowItem && hasFestivalThumbnail(windowItem)) return false;
      return true;
    });
}

/**
 * Promo strip duplicates the same festivals in the list below — hide those rows when the strip is visible.
 * @param {object[]} items
 * @param {Set<string> | string[]} excludeIds
 */
export function excludeFestivalsByContentId(items, excludeIds) {
  const set =
    excludeIds instanceof Set
      ? excludeIds
      : new Set((excludeIds || []).map((id) => String(id)));
  if (!set.size) return Array.isArray(items) ? items : [];
  return (items || []).filter((row) => !set.has(String(row?.contentId || '')));
}

/**
 * @param {Array<{ item?: { contentId?: unknown } }>} cards
 */
export function contentIdsFromPromoCards(cards) {
  const ids = new Set();
  for (const card of cards || []) {
    const id = String(card?.item?.contentId || '').trim();
    if (id) ids.add(id);
  }
  return ids;
}
