import {
  filterByTimeTab,
  monthRangeYmd,
  rangesOverlap,
  toYmd,
} from '../../Korea/festivalTimeFilter.js';
import { listCityAttractionHubs } from './cityAttractionHubs.js';
import { areaCodeForHubId } from '../../Korea/koreaHubSeeds.js';

export const LONG_TERM_FESTIVAL_MAX_DAYS = 60;
export const LONG_TERM_FESTIVAL_KEYWORD_RE = /상시|연중|연중무휴|기간제한없/;

/**
 * @param {string} ymd
 */
function ymdToDate(ymd) {
  if (!/^\d{8}$/.test(String(ymd || ''))) return null;
  const s = String(ymd);
  return new Date(
    Number(s.slice(0, 4)),
    Number(s.slice(4, 6)) - 1,
    Number(s.slice(6, 8)),
  );
}

/**
 * @param {object} item
 */
export function festivalDurationDays(item) {
  const start = String(item?.eventStartDate || '');
  const endRaw = String(item?.eventEndDate || '');
  const end = /^\d{8}$/.test(endRaw) ? endRaw : start;
  if (!/^\d{8}$/.test(start)) return 0;
  const s = ymdToDate(start);
  const e = ymdToDate(end);
  if (!s || !e) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

/**
 * @param {object} item
 */
export function isLongTermFestival(item) {
  const title = String(item?.title || '');
  if (LONG_TERM_FESTIVAL_KEYWORD_RE.test(title)) return true;
  return festivalDurationDays(item) > LONG_TERM_FESTIVAL_MAX_DAYS;
}

/**
 * @param {object} a
 * @param {object} b
 */
export function compareFestivalsByStartDesc(a, b) {
  const sa = String(a?.eventStartDate || '');
  const sb = String(b?.eventStartDate || '');
  if (sa !== sb) return sb.localeCompare(sa);
  return String(a?.title || '').localeCompare(String(b?.title || ''), 'ko');
}

/**
 * @param {Date} [now]
 */
export function currentWeekRangeYmd(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startYmd: toYmd(start), endYmd: toYmd(end) };
}

/**
 * @param {object[]} items
 * @param {{ startYmd: string, endYmd: string }} range
 */
function filterByWeekOverlap(items, range) {
  return (items || []).filter((item) =>
    rangesOverlap(item?.eventStartDate, item?.eventEndDate, range.startYmd, range.endYmd),
  );
}

/**
 * @param {object[]} items
 * @param {Date} [now]
 */
function filterByMonthOverlap(items, now = new Date()) {
  const range = monthRangeYmd(now.getFullYear(), now.getMonth());
  return (items || []).filter((item) =>
    rangesOverlap(
      item?.eventStartDate,
      item?.eventEndDate,
      range.eventStartDate,
      range.eventEndDate,
    ),
  );
}

/**
 * @param {object[]} items
 * @param {{ now?: Date, limit?: number }} [opts]
 */
export function pickGlobeBannerFestivals(items, opts = {}) {
  const list = Array.isArray(items) ? items : [];
  const now = opts.now instanceof Date ? opts.now : new Date();
  const limit = Math.min(Math.max(Number(opts.limit) || 3, 1), 6);
  const eligible = list.filter((item) => {
    const contentId = String(item?.contentId || '').trim();
    const title = String(item?.title || '').trim();
    return contentId && title && !isLongTermFestival(item);
  });

  const weekRange = currentWeekRangeYmd(now);
  const tiers = [
    filterByTimeTab('now', eligible, now),
    filterByWeekOverlap(eligible, weekRange),
    filterByMonthOverlap(eligible, now),
  ];

  /** @type {object[]} */
  const picked = [];
  const seen = new Set();

  for (const tier of tiers) {
    const sorted = [...tier].sort(compareFestivalsByStartDesc);
    for (const item of sorted) {
      const id = String(item.contentId);
      if (seen.has(id)) continue;
      seen.add(id);
      picked.push(item);
      if (picked.length >= limit) break;
    }
    if (picked.length >= limit) break;
  }

  return picked.slice(0, limit).map((item) => ({
    id: `festival:${item.contentId}`,
    topic: 'festival',
    label: String(item.title || '').trim(),
    href: `/korea?festival=${encodeURIComponent(String(item.contentId))}`,
  }));
}

/**
 * @param {{ now?: Date, limit?: number }} [opts]
 */
export function pickGlobeBannerScenicItems(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const limit = Math.min(Math.max(Number(opts.limit) || 3, 1), 6);
  const dayIndex = Math.floor(now.getTime() / 86400000);

  const krHubs = listCityAttractionHubs().filter(
    (hub) =>
      hub?.country === '대한민국'
      && hub?.hubId
      && Array.isArray(hub.attractions)
      && hub.attractions.length > 0,
  );

  if (krHubs.length === 0) return [];

  const startHub = dayIndex % krHubs.length;
  /** @type {{ id: string, topic: string, label: string, href: string }[]} */
  const out = [];

  for (let i = 0; i < krHubs.length && out.length < limit; i += 1) {
    const hub = krHubs[(startHub + i) % krHubs.length];
    const attractions = hub.attractions || [];
    const attrIdx = Math.floor((dayIndex + i) / krHubs.length) % attractions.length;
    const attraction = attractions[attrIdx];
    if (!attraction?.name) continue;

    const hubName = String(hub.name || hub.hubId || '').trim();
    const areaCode = areaCodeForHubId(hub.hubId);
    const href = areaCode
      ? `/korea/theme/scenic?area=${encodeURIComponent(areaCode)}`
      : '/korea/theme/scenic';

    out.push({
      id: `scenic:${hub.hubId}:${attraction.name}`,
      topic: 'scenic',
      label: hubName ? `${hubName} · ${attraction.name}` : attraction.name,
      href,
    });
  }

  return out;
}

/**
 * @param {object[]} festivalItems
 * @param {object[]} scenicItems
 */
export function mixGlobeBannerItems(festivalItems, scenicItems) {
  const festivals = Array.isArray(festivalItems) ? festivalItems : [];
  const scenics = Array.isArray(scenicItems) ? scenicItems : [];
  /** @type {object[]} */
  const mixed = [];
  const maxLen = Math.max(festivals.length, scenics.length);

  for (let i = 0; i < maxLen; i += 1) {
    if (festivals[i]) mixed.push(festivals[i]);
    if (scenics[i]) mixed.push(scenics[i]);
  }

  return mixed;
}
