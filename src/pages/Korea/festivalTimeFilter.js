function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * @param {Date} d
 * @returns {string} yyyymmdd
 */
export function toYmd(d) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

/**
 * @param {number} year
 * @param {number} month0
 */
export function monthRangeYmd(year, month0) {
  const start = new Date(year, month0, 1);
  const end = new Date(year, month0 + 1, 0);
  return { eventStartDate: toYmd(start), eventEndDate: toYmd(end) };
}

/**
 * @param {Date} [now]
 * @returns {string} yyyymmdd
 */
export function todayYmd(now = new Date()) {
  return toYmd(now);
}

/**
 * 오늘 ~ +30일 — 「이번 달」 칩(달력 월말 수렴 방지).
 * @param {Date} [now]
 */
export function rolling30DayRangeYmd(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return { eventStartDate: toYmd(start), eventEndDate: toYmd(end) };
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

/** 기상학적 계절 — 봄(3–5) · 여름(6–8) · 가을(9–11) · 겨울(12–2) */
export const FESTIVAL_SEASONS = [
  { id: 'spring', label: '봄', startMonth0: 2 },
  { id: 'summer', label: '여름', startMonth0: 5 },
  { id: 'autumn', label: '가을', startMonth0: 8 },
  { id: 'winter', label: '겨울', startMonth0: 11 },
];

const SEASON_IDS = new Set(FESTIVAL_SEASONS.map((s) => s.id));

/**
 * @param {Date} [now]
 * @returns {number} FESTIVAL_SEASONS index
 */
export function currentSeasonIndex(now = new Date()) {
  const m = now.getMonth();
  if (m >= 2 && m <= 4) return 0;
  if (m >= 5 && m <= 7) return 1;
  if (m >= 8 && m <= 10) return 2;
  return 3;
}

/**
 * 오늘이 속한 계절의 시작일 (겨울은 전년 12/1일 수 있음).
 * @param {Date} [now]
 */
export function startOfSeasonContaining(now = new Date()) {
  const idx = currentSeasonIndex(now);
  const startMonth0 = FESTIVAL_SEASONS[idx].startMonth0;
  let year = now.getFullYear();
  if (idx === 3 && now.getMonth() <= 1) year -= 1;
  return new Date(year, startMonth0, 1);
}

/**
 * 현재 계절부터 ahead(0–3)번째 계절 구간.
 * @param {number} ahead
 * @param {Date} [now]
 */
export function seasonRangeByAhead(ahead, now = new Date()) {
  const start = startOfSeasonContaining(now);
  const n = ((Number(ahead) % 4) + 4) % 4;
  start.setMonth(start.getMonth() + n * 3);
  const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
  return { eventStartDate: toYmd(start), eventEndDate: toYmd(end) };
}

/**
 * @param {string} seasonId spring|summer|autumn|winter
 * @param {Date} [now]
 */
export function seasonRangeById(seasonId, now = new Date()) {
  const cur = currentSeasonIndex(now);
  const target = FESTIVAL_SEASONS.findIndex((s) => s.id === seasonId);
  if (target < 0) return seasonRangeByAhead(0, now);
  const ahead = (target - cur + 4) % 4;
  return seasonRangeByAhead(ahead, now);
}

/**
 * 시간 칩 — 고정 3 + 현재 계절부터 시간순 4.
 * @param {Date} [now]
 * @returns {{ id: string, label: string }[]}
 */
export function buildFestivalTimeTabs(now = new Date()) {
  const cur = currentSeasonIndex(now);
  /** @type {{ id: string, label: string }[]} */
  const seasons = [];
  for (let i = 0; i < 4; i += 1) {
    const s = FESTIVAL_SEASONS[(cur + i) % 4];
    seasons.push({ id: s.id, label: s.label });
  }
  return [
    { id: 'now', label: '지금' },
    { id: 'weekend', label: '이번 주말' },
    { id: 'thisMonth', label: '이번 달' },
    ...seasons,
  ];
}

/**
 * @deprecated 3개월 롤링 창 — 계절 칩으로 대체. 호출부 호환용.
 * @param {Date} [now]
 */
export function seasonRangeYmd(now = new Date()) {
  return seasonRangeByAhead(0, now);
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
 * @param {string} timeId now|weekend|thisMonth|spring|summer|autumn|winter
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
    const range = rolling30DayRangeYmd(now);
    return list.filter((item) =>
      rangesOverlap(
        item?.eventStartDate,
        item?.eventEndDate,
        range.eventStartDate,
        range.eventEndDate,
      ),
    );
  }

  if (SEASON_IDS.has(timeId)) {
    const range = seasonRangeById(timeId, now);
    return list.filter((item) =>
      rangesOverlap(
        item?.eventStartDate,
        item?.eventEndDate,
        range.eventStartDate,
        range.eventEndDate,
      ),
    );
  }

  // 구 'season' 칩 호환 → 현재 계절
  if (timeId === 'season') {
    const range = seasonRangeByAhead(0, now);
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

/** 장기 상설·야간개장 등 — 개막 임박·단기 축제보다 목록 하단 */
const LONG_TERM_FESTIVAL_DAYS = 60;

/**
 * @param {string} startYmd
 * @param {string} endYmd
 */
function festivalSpanDays(startYmd, endYmd) {
  const sy = Number(startYmd.slice(0, 4));
  const sm = Number(startYmd.slice(4, 6)) - 1;
  const sd = Number(startYmd.slice(6, 8));
  const ey = Number(endYmd.slice(0, 4));
  const em = Number(endYmd.slice(4, 6)) - 1;
  const ed = Number(endYmd.slice(6, 8));
  const start = new Date(sy, sm, sd);
  const end = new Date(ey, em, ed);
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / 86400000) + 1;
}

/**
 * 0=미개막 · 1=단기 진행중 · 2=장기 진행중 · 3=종료
 * @param {object} item
 * @param {string} today
 */
export function festivalOpenSortTier(item, today) {
  const start = String(item?.eventStartDate || '');
  const endRaw = String(item?.eventEndDate || '');
  const end = /^\d{8}$/.test(endRaw) ? endRaw : start;
  if (!/^\d{8}$/.test(start)) return 3;
  if (start > today) return 0;
  if (end < today) return 3;
  if (festivalSpanDays(start, end) > LONG_TERM_FESTIVAL_DAYS) return 2;
  return 1;
}

/**
 * 여행 계획용 — 미개막 → 단기 진행 → 장기 상설, 각각 eventStartDate 오름차순.
 * @param {object} a
 * @param {object} b
 * @param {Date} [now]
 */
export function compareFestivalsByOpenDate(a, b, now = new Date()) {
  const today = todayYmd(now);
  const tierA = festivalOpenSortTier(a, today);
  const tierB = festivalOpenSortTier(b, today);
  if (tierA !== tierB) return tierA - tierB;
  const as = String(a?.eventStartDate || '');
  const bs = String(b?.eventStartDate || '');
  const dateCmp = as.localeCompare(bs);
  if (dateCmp !== 0) return dateCmp;
  return String(a?.title || '').localeCompare(String(b?.title || ''), 'ko');
}

/**
 * 그룹 내·그룹 간 모두 오픈일 순 (개막 임박 그룹이 위).
 * @param {{ id: string, label: string, items: object[] }[]} groups
 * @param {Date} [now]
 */
export function sortFestivalGroupsByOpenDate(groups, now = new Date()) {
  const sorted = (groups || []).map((g) => ({
    ...g,
    items: [...(g.items || [])].sort((a, b) =>
      compareFestivalsByOpenDate(a, b, now),
    ),
  }));
  sorted.sort((a, b) => {
    const cmp = compareFestivalsByOpenDate(
      a.items[0] || {},
      b.items[0] || {},
      now,
    );
    return cmp !== 0 ? cmp : a.label.localeCompare(b.label, 'ko');
  });
  return sorted;
}
