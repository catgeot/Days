import { monthRangeYmd, toYmd } from './FestivalCalendar';

/**
 * @param {Date} [now]
 * @returns {string} yyyymmdd
 */
export function todayYmd(now = new Date()) {
  return toYmd(now);
}

/**
 * 다가오는 금~일 (이미 일요일이면 오늘까지).
 * @param {Date} [now]
 * @returns {{ startYmd: string, endYmd: string }}
 */
export function upcomingWeekendRange(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay(); // 0 Sun … 6 Sat
  let startOffset;
  let endOffset;
  if (day === 0) {
    startOffset = -2;
    endOffset = 0;
  } else if (day === 5) {
    startOffset = 0;
    endOffset = 2;
  } else if (day === 6) {
    startOffset = -1;
    endOffset = 1;
  } else {
    startOffset = 5 - day;
    endOffset = startOffset + 2;
  }
  const start = new Date(d);
  start.setDate(d.getDate() + startOffset);
  const end = new Date(d);
  end.setDate(d.getDate() + endOffset);
  return { startYmd: toYmd(start), endYmd: toYmd(end) };
}

/**
 * 시즌 = 이번 달 1일 ~ +2개월 말 (3개월 창).
 * @param {Date} [now]
 */
export function seasonRangeYmd(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
  return { eventStartDate: toYmd(start), eventEndDate: toYmd(end) };
}

/**
 * 롤링 12개월: 이번 달 1일 ~ +11개월 말.
 * @param {Date} [now]
 */
export function rolling12MonthRangeYmd(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 12, 0);
  return { eventStartDate: toYmd(start), eventEndDate: toYmd(end) };
}

/**
 * @param {Date} [now]
 * @returns {{ year: number, month0: number }[]}
 */
export function rolling12MonthCursors(now = new Date()) {
  /** @type {{ year: number, month0: number }[]} */
  const out = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({ year: d.getFullYear(), month0: d.getMonth() });
  }
  return out;
}

/**
 * @param {string} startYmd
 * @param {string} endYmd
 * @param {string} winStart
 * @param {string} winEnd
 */
export function rangesOverlap(startYmd, endYmd, winStart, winEnd) {
  const start = /^\d{8}$/.test(String(startYmd || '')) ? String(startYmd) : '';
  if (!start) return false;
  const end = /^\d{8}$/.test(String(endYmd || '')) ? String(endYmd) : start;
  if (!/^\d{8}$/.test(winStart) || !/^\d{8}$/.test(winEnd)) return false;
  return start <= winEnd && end >= winStart;
}

/**
 * @param {'now' | 'weekend' | 'thisMonth' | 'season'} timeId
 * @param {object[]} items
 * @param {Date} [now]
 */
export function filterByTimeTab(timeId, items, now = new Date()) {
  const list = items || [];
  const today = todayYmd(now);

  if (timeId === 'now') {
    return list.filter((item) => {
      const start = String(item?.eventStartDate || '');
      const endRaw = String(item?.eventEndDate || '');
      const end = /^\d{8}$/.test(endRaw) ? endRaw : start;
      if (!/^\d{8}$/.test(start)) return false;
      return start <= today && end >= today;
    });
  }

  if (timeId === 'weekend') {
    const { startYmd, endYmd } = upcomingWeekendRange(now);
    return list.filter((item) =>
      rangesOverlap(item?.eventStartDate, item?.eventEndDate, startYmd, endYmd),
    );
  }

  if (timeId === 'thisMonth') {
    const range = monthRangeYmd(now.getFullYear(), now.getMonth());
    return list.filter((item) =>
      rangesOverlap(
        item?.eventStartDate,
        item?.eventEndDate,
        range.eventStartDate,
        range.eventEndDate,
      ),
    );
  }

  if (timeId === 'season') {
    const range = seasonRangeYmd(now);
    return list.filter((item) =>
      rangesOverlap(
        item?.eventStartDate,
        item?.eventEndDate,
        range.eventStartDate,
        range.eventEndDate,
      ),
    );
  }

  return list;
}

export { monthRangeYmd };
