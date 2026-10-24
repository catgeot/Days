import entries from './data/manualFestivalEntries.json';
import { formatFestivalAsOfDate, isFestivalEnded } from './festivalDeepLinkItem.js';
import { festivalIntervalYmd } from './festivalDateFilter.js';
import { mergeFestivalRowItem, normalizeFestivalItemImages } from './socialPromoFestivalsLogic.js';

const byId = new Map(
  Object.entries(entries).map(([id, row]) => [String(id), { ...row, contentId: String(id) }]),
);

function e2eManualEntryPatch(contentId) {
  if (import.meta.env.PROD) return null;
  if (typeof globalThis === 'undefined') return null;
  const table = globalThis.__GATEO_E2E_MANUAL_FESTIVAL_PATCH__;
  if (!table || typeof table !== 'object') return null;
  const row = table[contentId];
  return row && typeof row === 'object' ? row : null;
}

export function getManualFestivalEntry(contentId) {
  const id = String(contentId || '').trim();
  const patched = e2eManualEntryPatch(id);
  if (patched) return { ...patched, contentId: id };
  return id ? byId.get(id) || null : null;
}

/**
 * List injection ends only when `expiresAfter` (YYYYMMDD) is set and past in KST.
 * Omit `expiresAfter` to keep a manual row until the SSOT entry is removed (not `eventEndDate`).
 * @param {Date | string | number} [now]
 */
export function isManualFestivalActive(entry, now = new Date()) {
  if (!entry?.contentId) return false;
  const until = String(entry.expiresAfter || '').trim();
  if (!/^\d{8}$/.test(until)) return true;
  return !isFestivalEnded(until, now);
}

/**
 * TourAPI rolling window can keep an old edition; manual SSOT wins when API dates are missing or older.
 * @param {Record<string, unknown> | null | undefined} tourRow
 * @param {ReturnType<typeof getManualFestivalEntry>} manualEntry
 * @param {Date | string | number} [now]
 */
export function shouldManualWinOverTourApiRow(tourRow, manualEntry, now = new Date()) {
  if (!manualEntry?.contentId) return false;
  const manualInterval = festivalIntervalYmd(manualEntry);
  if (!manualInterval) return false;
  const tourInterval = festivalIntervalYmd(tourRow);
  if (!tourInterval) return true;
  if (tourInterval.end < manualInterval.end) return true;
  if (
    tourInterval.end === manualInterval.end
    && tourInterval.start < manualInterval.start
  ) {
    return true;
  }
  if (
    isFestivalEnded(tourInterval.end, now)
    && !isFestivalEnded(manualInterval.end, now)
  ) {
    return true;
  }
  return false;
}

export function listManualFestivalContentIds(now = new Date()) {
  return [...byId.keys()].filter((id) =>
    isManualFestivalActive(byId.get(id), now),
  );
}

export function isManualFestivalContentId(contentId) {
  return Boolean(getManualFestivalEntry(contentId));
}

/** Official manual SSOT — do not show TourAPI/cache playtime in UI or MOONi. */
export function festivalOmitsOfficialEventHours(item) {
  return Boolean(item?.detailAsOf?.fromManualOfficial);
}

/**
 * @param {ReturnType<typeof getManualFestivalEntry>} entry
 */
export function manualFestivalDetailAsOf(entry) {
  if (!entry?.officialHomepage) return null;
  const checkedOnDate = formatFestivalAsOfDate(entry.checkedOn);
  if (!checkedOnDate) return null;
  return {
    fromDetailDeepLink: true,
    fromManualOfficial: true,
    checkedOnDate,
    homepage: String(entry.officialHomepage).trim(),
  };
}

/**
 * @param {ReturnType<typeof getManualFestivalEntry>} entry
 */
export function manualFestivalListItem(entry, now = new Date()) {
  if (!entry?.contentId) return null;
  if (!isManualFestivalActive(entry, now)) return null;
  const first = entry.images?.[0]?.url || '';
  const detailAsOf = manualFestivalDetailAsOf(entry);
  return normalizeFestivalItemImages({
    contentId: entry.contentId,
    title: entry.title,
    titleEn: entry.titleEn,
    eventStartDate: entry.eventStartDate,
    eventEndDate: entry.eventEndDate,
    addr1: entry.addr1,
    mapx: entry.mapx,
    mapy: entry.mapy,
    tel: entry.tel,
    firstimage: first,
    imageUrl: first,
    contentTypeId: '15',
    detailAsOf,
  });
}

/**
 * TourAPI-shaped detail for the festival sheet (no network).
 * @param {ReturnType<typeof getManualFestivalEntry>} entry
 */
export function manualFestivalTourDetail(entry) {
  if (!entry?.contentId) return null;
  const first = entry.images?.[0]?.url || '';
  return {
    ok: true,
    manual: true,
    contentId: entry.contentId,
    intro: {
      contentId: entry.contentId,
      eventStartDate: entry.eventStartDate,
      eventEndDate: entry.eventEndDate,
      playtime: '',
      usetimefestival: entry.usetimefestival || '',
      usetimefestivalEn: entry.usetimefestivalEn || '',
      eventplace: entry.eventplace || '',
      eventplaceEn: entry.eventplaceEn || '',
      eventhomepage: entry.officialHomepage || '',
      program: entry.program || '',
      sponsor1tel: entry.tel || '',
    },
    common: {
      contentId: entry.contentId,
      title: entry.title,
      addr1: entry.addr1,
      addr1En: entry.addr1En || '',
      mapx: entry.mapx,
      mapy: entry.mapy,
      tel: entry.tel,
      homepage: entry.officialHomepage || '',
      overview: entry.overview || '',
      firstimage: first,
    },
    manualImages: Array.isArray(entry.images) ? entry.images : [],
  };
}

export function buildInitialManualPromoMap(now = new Date()) {
  const map = new Map();
  for (const id of listManualFestivalContentIds(now)) {
    const entry = getManualFestivalEntry(id);
    const item = manualFestivalListItem(entry, now);
    if (item) map.set(id, item);
  }
  return map;
}

/**
 * Inject active manual rows missing from the TourAPI rolling window.
 * @param {object[]} baseItems
 * @param {Date | string | number} [now]
 */
export function mergeManualFestivalsIntoFestivalItems(baseItems, now = new Date()) {
  const list = Array.isArray(baseItems) ? [...baseItems] : [];
  const indexById = new Map(
    list.map((row, index) => [String(row?.contentId || ''), index]),
  );
  for (const id of listManualFestivalContentIds(now)) {
    const entry = getManualFestivalEntry(id);
    const manualItem = manualFestivalListItem(entry, now);
    if (!manualItem) continue;
    const index = indexById.get(id);
    if (index === undefined) {
      list.push(manualItem);
      indexById.set(id, list.length - 1);
      continue;
    }
    const tourRow = list[index];
    if (shouldManualWinOverTourApiRow(tourRow, entry, now)) {
      list[index] = mergeFestivalRowItem(tourRow, manualItem);
    }
  }
  return list;
}
