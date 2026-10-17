import {
  formatFestivalMonthDay,
  formatFestivalRangeLabel,
  formatWindow30RangeSuffix,
  formatWindow30UntilMetaLabel,
  seoulTodayYmd,
  upcomingWeekendRangeYmd,
  window30RangeYmd,
} from './festivalDateFilter.js';
import { seasonRangeById } from './festivalTimeFilter.js';

const SEASON_IDS = new Set(['spring', 'summer', 'autumn', 'winter']);

/**
 * Flag-on list window. Default `thisMonth` uses the Seoul 30-day window
 * (today..today+29), the same range as «한 달 이내», not rolling30DayRangeYmd.
 * @param {string} timeId
 * @param {Date} [now]
 * @param {{ start?: string, end?: string } | null} [customRange]
 * @returns {{ eventStartDate: string, eventEndDate: string } | null}
 */
export function festivalHubFlagOnRangeYmd(timeId, now = new Date(), customRange = null) {
  if (timeId === 'thisMonth' || timeId === 'window30') return window30RangeYmd(now);
  if (timeId === 'date') {
    return {
      eventStartDate: String(customRange?.start || ''),
      eventEndDate: String(customRange?.end || ''),
    };
  }
  return null;
}

/**
 * Period token for the flag-on meta line (#486 slot: after place, before count).
 * Unselected default keeps `~11.15`. The «한 달 이내» chip uses `11.15까지`.
 * @param {{
 *   timeTab: string,
 *   now?: Date,
 *   seoulToday?: string,
 *   customRange?: { start?: string, end?: string } | null,
 *   locale?: string,
 * }} p
 */
export function festivalHubPeriodMetaLabel({
  timeTab,
  now = new Date(),
  seoulToday,
  customRange = null,
  locale = 'ko',
}) {
  const today = seoulToday || seoulTodayYmd(now);
  const en = String(locale || '').startsWith('en');
  if (timeTab === 'thisMonth' || timeTab === 'window30') {
    const range = window30RangeYmd(now);
    const end = formatFestivalMonthDay(range.eventEndDate, today);
    if (!end) return '';
    if (timeTab === 'window30' || en) return formatWindow30UntilMetaLabel(end, locale);
    return formatWindow30RangeSuffix(end);
  }
  if (timeTab === 'date') {
    return formatFestivalRangeLabel(customRange?.start, customRange?.end, today);
  }
  if (timeTab === 'now') return formatFestivalMonthDay(today, today);
  if (timeTab === 'weekend') {
    const { startYmd, endYmd } = upcomingWeekendRangeYmd(now);
    return formatFestivalRangeLabel(startYmd, endYmd, today);
  }
  if (SEASON_IDS.has(timeTab)) {
    const range = seasonRangeById(timeTab, now);
    return formatFestivalRangeLabel(range.eventStartDate, range.eventEndDate, today);
  }
  return '';
}
