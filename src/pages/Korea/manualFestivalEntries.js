import entries from './data/manualFestivalEntries.json';
import { formatFestivalAsOfDate } from './festivalDeepLinkItem.js';
import { normalizeFestivalItemImages } from './socialPromoFestivalsLogic.js';

const byId = new Map(
  Object.entries(entries).map(([id, row]) => [String(id), { ...row, contentId: String(id) }]),
);

export function getManualFestivalEntry(contentId) {
  const id = String(contentId || '').trim();
  return id ? byId.get(id) || null : null;
}

export function listManualFestivalContentIds() {
  return [...byId.keys()];
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
export function manualFestivalListItem(entry) {
  if (!entry?.contentId) return null;
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
      eventplace: entry.eventplace || '',
      eventhomepage: entry.officialHomepage || '',
      program: entry.program || '',
      sponsor1tel: entry.tel || '',
    },
    common: {
      contentId: entry.contentId,
      title: entry.title,
      addr1: entry.addr1,
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

export function buildInitialManualPromoMap() {
  const map = new Map();
  for (const id of listManualFestivalContentIds()) {
    const entry = getManualFestivalEntry(id);
    const item = manualFestivalListItem(entry);
    if (item) map.set(id, item);
  }
  return map;
}
