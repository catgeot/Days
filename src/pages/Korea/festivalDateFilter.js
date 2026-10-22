/**
 * Festival period chips — Asia/Seoul calendar, YYYYMMDD string math only.
 * Device timezone never enters the day arithmetic.
 */

const YMD_RE = /^\d{8}$/;

/** Inclusive length of «30일 안»: today through today+29. */
export const WINDOW30_INCLUSIVE_DAYS = 30;

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isYmd(value) {
  const s = String(value || '');
  if (!YMD_RE.test(s)) return false;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(4, 6));
  const day = Number(s.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

/**
 * Calendar date in Asia/Seoul for an absolute instant.
 * @param {Date} [now]
 * @returns {string} YYYYMMDD
 */
export function seoulTodayYmd(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  const ymd = `${year}${month}${day}`;
  return isYmd(ymd) ? ymd : '';
}

/**
 * @param {Date} [now]
 * @returns {number} milliseconds, at least 1000
 */
export function msUntilNextSeoulMidnight(now = new Date()) {
  const ymd = seoulTodayYmd(now);
  if (!isYmd(ymd)) return 60_000;
  const next = addDaysYmd(ymd, 1);
  const midnightUtc = Date.UTC(
    Number(next.slice(0, 4)),
    Number(next.slice(4, 6)) - 1,
    Number(next.slice(6, 8)),
  ) - 9 * 60 * 60 * 1000;
  return Math.max(1000, midnightUtc - now.getTime() + 20);
}

/**
 * @param {string} ymd
 * @param {number} days
 * @returns {string} YYYYMMDD, or '' when ymd is not a real day
 */
export function addDaysYmd(ymd, days) {
  if (!isYmd(ymd)) return '';
  const delta = Math.trunc(Number(days) || 0);
  const utc = new Date(
    Date.UTC(
      Number(ymd.slice(0, 4)),
      Number(ymd.slice(4, 6)) - 1,
      Number(ymd.slice(6, 8)),
    ),
  );
  utc.setUTCDate(utc.getUTCDate() + delta);
  const year = String(utc.getUTCFullYear());
  const month = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * @param {string} todayYmd Seoul today
 * @returns {{ eventStartDate: string, eventEndDate: string }}
 */
export function window30RangeFromYmd(todayYmd) {
  const start = isYmd(todayYmd) ? todayYmd : '';
  const end = start ? addDaysYmd(start, WINDOW30_INCLUSIVE_DAYS - 1) : '';
  return { eventStartDate: start, eventEndDate: end };
}

/**
 * @param {Date} [now]
 */
export function window30RangeYmd(now = new Date()) {
  return window30RangeFromYmd(seoulTodayYmd(now));
}

/**
 * Missing or invalid end counts as the start day.
 * Drop when start is missing/invalid, or a valid end is before the start.
 * @param {{ eventStartDate?: unknown, eventEndDate?: unknown }} item
 * @returns {{ start: string, end: string } | null}
 */
export function festivalIntervalYmd(item) {
  const start = String(item?.eventStartDate || '');
  if (!isYmd(start)) return null;
  const endRaw = String(item?.eventEndDate || '');
  const end = isYmd(endRaw) ? endRaw : start;
  if (end < start) return null;
  return { start, end };
}

/**
 * Closed-interval overlap. Ongoing festivals that touch any day are kept.
 * @param {object[]} items
 * @param {string} winStart
 * @param {string} winEnd
 */
export function filterFestivalsByYmdRange(items, winStart, winEnd) {
  if (!isYmd(winStart) || !isYmd(winEnd) || winEnd < winStart) return [];
  return (items || []).filter((item) => {
    const interval = festivalIntervalYmd(item);
    if (!interval) return false;
    return interval.start <= winEnd && interval.end >= winStart;
  });
}

/**
 * Latest valid end in the loaded list, at least `todayYmd`.
 * @param {object[]} items
 * @param {string} todayYmd
 */
export function loadedFestivalDataEndYmd(items, todayYmd) {
  let max = isYmd(todayYmd) ? todayYmd : '';
  for (const item of items || []) {
    const interval = festivalIntervalYmd(item);
    if (!interval) continue;
    if (!max || interval.end > max) max = interval.end;
  }
  return max;
}

/**
 * Inclusive bounds of the Seoul calendar month containing `todayYmd`.
 * @param {string} todayYmd
 * @returns {{ start: string, end: string }}
 */
export function seoulMonthBoundsYmd(todayYmd) {
  if (!isYmd(todayYmd)) return { start: '', end: '' };
  const year = Number(todayYmd.slice(0, 4));
  const month = Number(todayYmd.slice(4, 6));
  const monthStart = `${todayYmd.slice(0, 6)}01`;
  const last = daysInMonth(year, month);
  const monthEnd = `${todayYmd.slice(0, 6)}${String(last).padStart(2, '0')}`;
  return { start: monthStart, end: monthEnd };
}

/**
 * @param {string} startYmd
 * @param {string} endYmd
 * @param {string} todayYmd
 */
export function festivalRangeOverlapsSeoulMonth(startYmd, endYmd, todayYmd) {
  if (!isYmd(startYmd) || !isYmd(endYmd) || !isYmd(todayYmd)) return false;
  const { start: monthStart, end: monthEnd } = seoulMonthBoundsYmd(todayYmd);
  return startYmd <= monthEnd && endYmd >= monthStart;
}

/**
 * When true, both ends of the range omit a year prefix (ongoing · starts this month · overlaps this month).
 * @param {string} startYmd
 * @param {string} endYmd
 * @param {string} todayYmd
 */
export function festivalRangeOmitsYearPrefix(startYmd, endYmd, todayYmd) {
  if (!isYmd(startYmd) || !isYmd(todayYmd)) return false;
  const end = isYmd(endYmd) ? endYmd : startYmd;
  if (todayYmd >= startYmd && todayYmd <= end) return true;
  if (startYmd.slice(0, 6) === todayYmd.slice(0, 6)) return true;
  return festivalRangeOverlapsSeoulMonth(startYmd, end, todayYmd);
}

/**
 * @param {string} ymd
 * @param {boolean} withYear
 */
function formatFestivalMonthDayPart(ymd, withYear) {
  const month = Number(ymd.slice(4, 6));
  const day = Number(ymd.slice(6, 8));
  const monthDay = `${month}.${day}`;
  return withYear ? `${ymd.slice(0, 4)}.${monthDay}` : monthDay;
}

/**
 * `10.3` when the range omits year; `2026.12.15` for a lone day outside the current month window.
 * Pass `rangeStart`/`rangeEnd` when formatting one endpoint of a known interval (e.g. window30 end).
 * @param {string} ymd
 * @param {string} todayYmd
 * @param {{ showYear?: boolean, rangeStart?: string, rangeEnd?: string }} [opts]
 */
export function formatFestivalMonthDay(ymd, todayYmd, opts = {}) {
  if (!isYmd(ymd)) return '';
  if (opts.showYear !== undefined) return formatFestivalMonthDayPart(ymd, opts.showYear);
  const rangeStart = isYmd(opts.rangeStart) ? opts.rangeStart : ymd;
  const rangeEnd = isYmd(opts.rangeEnd) ? opts.rangeEnd : ymd;
  const omit = festivalRangeOmitsYearPrefix(rangeStart, rangeEnd, todayYmd);
  return formatFestivalMonthDayPart(ymd, !omit);
}

/**
 * `10.23–11.8` (overlaps Seoul month) · `2026.1.9–1.31` · `2026.12.28–2027.1.4`.
 * @param {string} startYmd
 * @param {string} endYmd
 * @param {string} todayYmd
 */
export function formatFestivalRangeLabel(startYmd, endYmd, todayYmd) {
  const start = String(startYmd || '').trim();
  if (!isYmd(start)) return '';
  const end = isYmd(String(endYmd || '')) ? String(endYmd) : start;
  if (end < start) return formatFestivalMonthDay(start, todayYmd);

  if (festivalRangeOmitsYearPrefix(start, end, todayYmd)) {
    const startLabel = formatFestivalMonthDayPart(start, false);
    if (end === start) return startLabel;
    return `${startLabel}\u2013${formatFestivalMonthDayPart(end, false)}`;
  }

  const startLabel = formatFestivalMonthDayPart(start, true);
  if (end === start) return startLabel;
  const endWithYear = end.slice(0, 4) !== start.slice(0, 4);
  return `${startLabel}\u2013${formatFestivalMonthDayPart(end, endWithYear)}`;
}

/**
 * Detail sheet · 인근 축제 rows — uses Seoul today when `todayYmd` is omitted.
 * @param {string} startYmd
 * @param {string} endYmd
 * @param {string} [todayYmd]
 */
export function formatFestivalDetailDateRange(startYmd, endYmd, todayYmd = seoulTodayYmd()) {
  if (!isYmd(String(startYmd || '')) && !isYmd(String(endYmd || ''))) return '';
  const range = formatFestivalRangeLabel(
    String(startYmd || ''),
    String(endYmd || startYmd || ''),
    todayYmd,
  );
  if (range) return range;
  const single = formatFestivalMonthDay(String(startYmd || endYmd || ''), todayYmd);
  return single;
}

/**
 * Subline range suffix for «한 달 이내» (e.g. `~11.14`).
 * @param {string} endMonthDay `11.14` or `2027.11.14`
 */
export function formatWindow30RangeSuffix(endMonthDay) {
  const end = String(endMonthDay || '').replace(/^~/, '').trim();
  if (!end) return '';
  return `~${end}`;
}

/**
 * Panel meta line for «한 달 이내» — `11.14까지` / EN `until 11.14`.
 * @param {string} endMonthDay
 * @param {string} [locale]
 */
export function formatWindow30UntilMetaLabel(endMonthDay, locale) {
  const end = String(endMonthDay || '').replace(/^~/, '').trim();
  if (!end) return '';
  if (String(locale || '').startsWith('en')) return `until ${end}`;
  return `${end}까지`;
}

/**
 * «30일 안» replaces «이번 달»; «날짜» follows it. Weekend and seasons stay put.
 * Optional `headline` is the one-line list title (chip label may differ).
 * @param {{ id: string, label: string }[]} tabs
 * @param {{ window30Label: string, window30Headline?: string, dateLabel: string, dateHeadline?: string }} labels
 */
export function replaceMonthTabWithDateChips(tabs, labels) {
  /** @type {{ id: string, label: string, headline?: string }[]} */
  const out = [];
  let replaced = false;
  const window30 = {
    id: 'window30',
    label: labels.window30Label,
    ...(labels.window30Headline ? { headline: labels.window30Headline } : {}),
  };
  const date = {
    id: 'date',
    label: labels.dateLabel,
    ...(labels.dateHeadline ? { headline: labels.dateHeadline } : {}),
  };
  for (const tab of tabs || []) {
    if (tab?.id === 'thisMonth') {
      out.push(window30, date);
      replaced = true;
    } else if (tab?.id) {
      out.push(tab);
    }
  }
  if (!replaced) out.push(window30, date);
  return out;
}

/**
 * @param {string} todayYmd
 * @param {string} maxYmd
 * @returns {{ year: number, month: number }[]}
 */
export function eachMonthInYmdRange(todayYmd, maxYmd) {
  if (!isYmd(todayYmd) || !isYmd(maxYmd) || maxYmd < todayYmd) return [];
  /** @type {{ year: number, month: number }[]} */
  const out = [];
  let year = Number(todayYmd.slice(0, 4));
  let month = Number(todayYmd.slice(4, 6));
  const endYear = Number(maxYmd.slice(0, 4));
  const endMonth = Number(maxYmd.slice(4, 6));
  while (year < endYear || (year === endYear && month <= endMonth)) {
    out.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}

/**
 * Sunday = 0. UTC so the weekday does not follow the device timezone.
 * @param {string} ymd
 */
export function weekdayIndexYmd(ymd) {
  if (!isYmd(ymd)) return 0;
  return new Date(
    Date.UTC(
      Number(ymd.slice(0, 4)),
      Number(ymd.slice(4, 6)) - 1,
      Number(ymd.slice(6, 8)),
    ),
  ).getUTCDay();
}

/**
 * @param {number} year
 * @param {number} month 1–12
 */
export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * @param {number} year
 * @param {number} month 1–12
 * @param {number} day
 */
export function ymdFromParts(year, month, day) {
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  const ymd = `${year}${monthText}${dayText}`;
  return isYmd(ymd) ? ymd : '';
}

/**
 * Upcoming weekend in Seoul calendar days.
 * Fri–Sun on weekdays; Sat: today–Sun; Sun: today only.
 * @param {Date} [now]
 * @returns {{ startYmd: string, endYmd: string }}
 */
export function upcomingWeekendRangeYmd(now = new Date()) {
  const todayYmd = seoulTodayYmd(now);
  if (!isYmd(todayYmd)) return { startYmd: '', endYmd: '' };
  const dow = weekdayIndexYmd(todayYmd);
  if (dow === 0) {
    return { startYmd: todayYmd, endYmd: todayYmd };
  }
  if (dow === 6) {
    return { startYmd: todayYmd, endYmd: addDaysYmd(todayYmd, 1) };
  }
  const startOffset = dow === 5 ? 0 : 5 - dow;
  const endOffset = startOffset + 2;
  return {
    startYmd: addDaysYmd(todayYmd, startOffset),
    endYmd: addDaysYmd(todayYmd, endOffset),
  };
}

/**
 * Monday (Asia/Seoul week) containing `ymd`.
 * @param {string} ymd
 */
export function mondayYmdOfSeoulWeekContaining(ymd) {
  if (!isYmd(ymd)) return '';
  const dow = weekdayIndexYmd(ymd);
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  return addDaysYmd(ymd, -daysFromMonday);
}

/**
 * Monday-first grid column of `ymd` (Mon = 0 … Sun = 6).
 * @param {string} ymd
 */
export function mondayFirstColumnYmd(ymd) {
  if (!isYmd(ymd)) return 0;
  const dow = weekdayIndexYmd(ymd);
  return dow === 0 ? 6 : dow - 1;
}

/**
 * Date-sheet week blocks — Mon–Sun weeks in Seoul.
 * `weeksAhead` 0 = today through this Sunday; 1+ = that many full Mon–Sun blocks ahead.
 * @param {number} weeksAhead
 * @param {string} todayYmd
 * @returns {{ startYmd: string, endYmd: string }}
 */
export function festivalDateSheetWeekRangeFromYmd(weeksAhead, todayYmd) {
  if (!isYmd(todayYmd)) return { startYmd: '', endYmd: '' };
  const ahead = Math.max(0, Math.trunc(Number(weeksAhead) || 0));
  if (ahead === 0) {
    const dow = weekdayIndexYmd(todayYmd);
    const endYmd = addDaysYmd(todayYmd, dow === 0 ? 0 : 7 - dow);
    return { startYmd: todayYmd, endYmd };
  }
  const monThisWeek = mondayYmdOfSeoulWeekContaining(todayYmd);
  const startYmd = addDaysYmd(monThisWeek, ahead * 7);
  const endYmd = addDaysYmd(startYmd, 6);
  return { startYmd, endYmd };
}

/**
 * Mon–Sun blocks between the week containing `todayYmd` and the week containing `startYmd`.
 * 0 when the start falls in this week or earlier.
 * @param {string} startYmd
 * @param {string} todayYmd
 */
export function festivalDateSheetWeekIndexFromYmd(startYmd, todayYmd) {
  if (!isYmd(startYmd) || !isYmd(todayYmd)) return 0;
  const thisMonday = mondayYmdOfSeoulWeekContaining(todayYmd);
  const startMonday = mondayYmdOfSeoulWeekContaining(startYmd);
  if (!thisMonday || !startMonday || startMonday <= thisMonday) return 0;
  const from = Date.UTC(
    Number(thisMonday.slice(0, 4)),
    Number(thisMonday.slice(4, 6)) - 1,
    Number(thisMonday.slice(6, 8)),
  );
  const to = Date.UTC(
    Number(startMonday.slice(0, 4)),
    Number(startMonday.slice(4, 6)) - 1,
    Number(startMonday.slice(6, 8)),
  );
  return Math.round((to - from) / (7 * 86400000));
}

/**
 * Step the highlighted week. Back stops at this week (today through Sunday).
 * @param {string} draftStart
 * @param {string} todayYmd
 * @param {number} direction 1 forward, -1 back
 * @returns {{ startYmd: string, endYmd: string }}
 */
export function festivalDateSheetAdjacentWeekRange(draftStart, todayYmd, direction) {
  const index = festivalDateSheetWeekIndexFromYmd(draftStart, todayYmd);
  const next = direction < 0 ? Math.max(0, index - 1) : index + 1;
  return festivalDateSheetWeekRangeFromYmd(next, todayYmd);
}

/**
 * @param {number} weeksAhead
 * @param {Date} [now]
 */
export function festivalDateSheetWeekRangeYmd(weeksAhead, now = new Date()) {
  return festivalDateSheetWeekRangeFromYmd(weeksAhead, seoulTodayYmd(now));
}

/**
 * @param {{ startYmd: string, endYmd: string }} range
 * @param {string} minYmd
 * @param {string} maxYmd
 */
export function clampYmdRangeToBounds(range, minYmd, maxYmd) {
  let start = range.startYmd;
  let end = range.endYmd;
  if (!isYmd(start) || !isYmd(end)) return { startYmd: '', endYmd: '' };
  if (minYmd && start < minYmd) start = minYmd;
  if (maxYmd && end > maxYmd) end = maxYmd;
  if (end < start) return { startYmd: '', endYmd: '' };
  return { startYmd: start, endYmd: end };
}
