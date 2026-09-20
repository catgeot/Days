export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseYmd(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12);
}

export function todayYmd() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return formatYmd(d);
}

export function addDaysYmd(ymd, days) {
  const dt = parseYmd(ymd);
  if (!dt) {
    const fallback = new Date();
    fallback.setHours(12, 0, 0, 0);
    fallback.setDate(fallback.getDate() + days);
    return formatYmd(fallback);
  }
  dt.setDate(dt.getDate() + days);
  return formatYmd(dt);
}

export function shiftMonth(viewDate, delta) {
  return new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1, 12);
}

/**
 * 왕복: 첫 탭=가는 날, 둘째 탭=오는 날. 편도: 한 번이면 완료.
 * @param {{ tripType: 'RT' | 'OW', ddate: string, rdate: string, picking: 'start' | 'end', ymd: string, today: string }}
 */
export function applyFlightDatePick(state) {
  const { tripType, ddate, rdate, picking, ymd, today } = state;
  if (!ymd || ymd < today) {
    return { ...state, changed: false, done: false };
  }
  if (tripType !== 'RT') {
    return {
      tripType,
      ddate: ymd,
      rdate: '',
      picking: 'start',
      today,
      changed: true,
      done: true,
    };
  }
  if (picking !== 'end' || !ddate || ymd <= ddate) {
    return {
      tripType,
      ddate: ymd,
      rdate: '',
      picking: 'end',
      today,
      changed: true,
      done: false,
    };
  }
  return {
    tripType,
    ddate,
    rdate: ymd,
    picking: 'start',
    today,
    changed: true,
    done: true,
  };
}

export function buildMonthCells(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = new Date(year, month, 1, 12).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(formatYmd(new Date(year, month, day, 12)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function dateRangeRole(ymd, ddate, rdate) {
  if (!ymd) return null;
  if (ymd === ddate && ymd === rdate) return 'both';
  if (ymd === ddate) return 'start';
  if (ymd === rdate) return 'end';
  if (ddate && rdate && ymd > ddate && ymd < rdate) return 'mid';
  return null;
}

export function weekdayLabels(locale) {
  const fmt = new Intl.DateTimeFormat(locale || 'ko', { weekday: 'narrow' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 8, 20 + i)));
}

export function formatMonthTitle(viewDate, locale) {
  return new Intl.DateTimeFormat(locale || 'ko', { year: 'numeric', month: 'long' }).format(viewDate);
}

export function formatDayLabel(ymd, locale) {
  const dt = parseYmd(ymd);
  if (!dt) return '';
  return new Intl.DateTimeFormat(locale || 'ko', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(dt);
}

/** 사용자가 달력에서 고른 일정인지 — 기본 +14/+21 채움과 구분 */
export function hasCompleteFlightDates({ tripType, ddate, rdate } = {}) {
  if (!parseYmd(ddate)) return false;
  if (String(tripType || 'RT').toUpperCase() === 'OW') return true;
  return Boolean(parseYmd(rdate) && rdate > ddate);
}
