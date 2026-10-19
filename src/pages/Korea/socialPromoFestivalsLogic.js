import {
  festivalDetailAsOf,
  festivalItemFromDetail,
  isFestivalEnded,
  todayYmdKst,
} from './festivalDeepLinkItem.js';
import { filterByRegion, extractSubregionLabels, sidoLabel } from './festivalRegionTags.js';
import { resolveFestivalItemSidoCode } from './koreaAreaFilter.js';
import { festivalLngLat } from './koreaFestivalCorridors.js';

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

function promoKm(origin, item) {
  const point = festivalLngLat(item?.mapx, item?.mapy);
  if (!origin || !point) return null;
  const lat = Number(origin.lat);
  const lng = Number(origin.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(point.lat - lat);
  const dLng = toRad(point.lng - lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat)) * Math.cos(toRad(point.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Short place for the one-line recommendation. 함평군 → 함평. */
export function socialPromoPlaceLabel(item) {
  const areaCode = resolveFestivalItemSidoCode(item);
  const labels = extractSubregionLabels(item?.addr1, areaCode);
  const raw = String(labels[0] || '').trim();
  if (!raw) return '';
  return raw.replace(/(특별자치시|광역시|특별시|자치시|시|군|구)$/u, '') || raw;
}

/** Promo card region hint — 시도 chip label + 시·군 (e.g. 전남 함평, 경남 창원). */
export function socialPromoRegionPlaceLabel(item) {
  const areaCode = resolveFestivalItemSidoCode(item);
  const sido = sidoLabel(areaCode);
  const place = socialPromoPlaceLabel(item);
  if (sido && place) return `${sido} ${place}`;
  return place || sido || '';
}

/**
 * Nearest in-window promo festival. No distance → earliest start.
 * If that festival is already in the nearby list, return null.
 * @param {Array<{ item?: object }>} cards
 * @param {{ origin?: { lat: number, lng: number } | null, listedIds?: Iterable<string> }} [opts]
 */
export function pickSocialPromoNearRecommendation(cards, opts = {}) {
  const pool = (cards || []).filter((card) => card?.item?.contentId);
  if (!pool.length) return null;
  const ranked = [...pool].sort((a, b) => {
    const kmA = promoKm(opts.origin, a.item);
    const kmB = promoKm(opts.origin, b.item);
    if (kmA != null && kmB != null && kmA !== kmB) return kmA - kmB;
    if (kmA != null && kmB == null) return -1;
    if (kmA == null && kmB != null) return 1;
    return String(a.item.eventStartDate || '').localeCompare(String(b.item.eventStartDate || ''));
  });
  const best = ranked[0];
  const listed = opts.listedIds instanceof Set
    ? opts.listedIds
    : new Set([...(opts.listedIds || [])].map((id) => String(id)));
  if (listed.has(String(best.item.contentId))) return null;
  return best;
}

function hiddenPromo() {
  return { show: false, cards: [], loading: false, nearLine: null };
}

/**
 * Featured strip: this month, not searching, not 내 주변.
 * 내 주변 sets the sido chip too, so the region filter would drop the strip.
 * @param {{ status: string, cards: Array<{ entry: object, item: object | null }> }} row
 * @param {{ searchActive?: boolean, areaCode?: string, cityName?: string, timeTab?: string, nearActive?: boolean, nearOrigin?: { lat: number, lng: number } | null, nearListIds?: Iterable<string> }} ctx
 */
export function resolveSocialPromoPresentation(row, ctx = {}) {
  const searchActive = Boolean(ctx.searchActive);
  const nearActive = Boolean(ctx.nearActive);
  const timeTab = ctx.timeTab == null || ctx.timeTab === '' ? 'thisMonth' : String(ctx.timeTab);
  if (!shouldShowSocialPromoHomeRow(searchActive) || timeTab !== 'thisMonth') {
    return hiddenPromo();
  }
  if (!row || row.status === 'empty') return hiddenPromo();
  if (nearActive) {
    if (row.status !== 'ready') return hiddenPromo();
    return {
      show: false,
      cards: [],
      loading: false,
      nearLine: pickSocialPromoNearRecommendation(row.cards, {
        origin: ctx.nearOrigin,
        listedIds: ctx.nearListIds,
      }),
    };
  }
  if (row.status === 'loading') {
    return { show: true, cards: row.cards, loading: true, nearLine: null };
  }
  if (row.status === 'ready') {
    const cards = row.cards || [];
    return { show: cards.length > 0, cards, loading: false, nearLine: null };
  }
  return hiddenPromo();
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
