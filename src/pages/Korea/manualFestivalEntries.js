import entries from './data/manualFestivalEntries.json';
import { formatFestivalAsOfDate, isFestivalEnded } from './festivalDeepLinkItem.js';
import { festivalIntervalYmd, pickLatestFestivalInterval } from './festivalDateFilter.js';
import { mergeFestivalRowItem, normalizeFestivalItemImages } from './socialPromoFestivalsLogic.js';
import { extractTourAttractionSigungu } from '../Home/lib/koreaTourAttractionLocality.js';

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

/** Official manual SSOT — hide TourAPI playtime when fee copy lives in usetimefestival (e.g. 638576). */
export function festivalOmitsOfficialEventHours(item) {
  if (!item?.detailAsOf?.fromManualOfficial) return false;
  const entry = getManualFestivalEntry(item?.contentId);
  return Boolean(entry?.omitTourApiPlaytime);
}

/**
 * Ended badge / strips — manual edition dates beat stale TourAPI list rows.
 * @param {Record<string, unknown> | null | undefined} item
 * @param {Record<string, unknown> | null | undefined} [intro]
 * @param {Date | string | number} [now]
 */
export function festivalEditionEndedForItem(item, intro, now = new Date()) {
  const manual = getManualFestivalEntry(item?.contentId || intro?.contentId);
  const intervals = [];
  if (manual?.eventEndDate) {
    intervals.push({
      eventStartDate: manual.eventStartDate,
      eventEndDate: manual.eventEndDate,
    });
  }
  if (item?.eventEndDate) {
    intervals.push({
      eventStartDate: item.eventStartDate,
      eventEndDate: item.eventEndDate,
    });
  }
  const introEnd = intro?.eventEndDate || intro?.eventenddate;
  if (introEnd) {
    intervals.push({
      eventStartDate: intro?.eventStartDate || intro?.eventstartdate,
      eventEndDate: introEnd,
    });
  }
  const latest = pickLatestFestivalInterval(intervals);
  return isFestivalEnded(latest?.end || '', now);
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
      playtime: entry.playtime || '',
      playtimeEn: entry.playtimeEn || '',
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
/** Manual-only ids minted when TourAPI had no row yet (e.g. 9026112001). */
export function isSyntheticFestivalContentId(contentId) {
  return /^9\d{9}$/.test(String(contentId || '').trim());
}

export function normalizeFestivalEditionName(title) {
  return String(title || '')
    .normalize('NFKC')
    .replace(/제\s*\d+\s*회/gu, '')
    .replace(/\s+/gu, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}

export function festivalEditionStartYmd(item) {
  const digits = String(item?.eventStartDate || item?.eventstartdate || '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(0, 8) : '';
}

/** Same festival edition: normalized name + start date, and 시군 when both rows have one. */
export function festivalRowsShareEdition(a, b) {
  const nameA = normalizeFestivalEditionName(a?.title);
  const nameB = normalizeFestivalEditionName(b?.title);
  if (!nameA || nameA !== nameB) return false;
  const startA = festivalEditionStartYmd(a);
  const startB = festivalEditionStartYmd(b);
  if (!startA || startA !== startB) return false;
  const sigA = extractTourAttractionSigungu(a?.addr1, a?.addr2);
  const sigB = extractTourAttractionSigungu(b?.addr1, b?.addr2);
  if (sigA && sigB && sigA !== sigB) return false;
  return true;
}

/**
 * Drop a synthetic-id manual row once a TourAPI row for the same edition is present.
 * The TourAPI row stays.
 */
export function dropSyntheticFestivalShadows(items) {
  const list = Array.isArray(items) ? items : [];
  return list.filter((row, index) => {
    if (!isSyntheticFestivalContentId(row?.contentId)) return true;
    return !list.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        !isSyntheticFestivalContentId(other?.contentId) &&
        festivalRowsShareEdition(row, other),
    );
  });
}

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
      const tourTwin = list.some(
        (row) =>
          String(row?.contentId || '') !== id &&
          festivalRowsShareEdition(row, manualItem),
      );
      if (tourTwin) continue;
      list.push(manualItem);
      indexById.set(id, list.length - 1);
      continue;
    }
    const tourRow = list[index];
    if (shouldManualWinOverTourApiRow(tourRow, entry, now)) {
      list[index] = mergeFestivalRowItem(tourRow, manualItem);
    }
  }
  return dropSyntheticFestivalShadows(list);
}
