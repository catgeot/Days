import {
  festivalDetailAsOf,
  festivalItemFromDetail,
  isFestivalEnded,
  todayYmdKst,
} from './festivalDeepLinkItem.js';

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
  if (!detailAsOf) return built;
  return { ...built, detailAsOf };
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
  const cards = [];
  for (const entry of entries || []) {
    if (cards.length >= maxCards) break;
    const item = resolveSocialPromoItem(itemById, entry.contentId);
    if (!item) continue;
    if (!shouldShowSocialPromoItem(item, entry, now)) continue;
    cards.push({ entry, item });
  }
  return cards;
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
    const candidate = fromList || supplemental;
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
