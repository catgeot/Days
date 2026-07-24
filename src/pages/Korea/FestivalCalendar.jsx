import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function toYmd(d) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

export function parseYmd(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return null;
  return new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)));
}

export function monthRangeYmd(year, month0) {
  const start = new Date(year, month0, 1);
  const end = new Date(year, month0 + 1, 0);
  return { eventStartDate: toYmd(start), eventEndDate: toYmd(end) };
}

/**
 * @param {string} startYmd
 * @param {string} endYmd
 * @param {string} dayYmd
 */
export function festivalCoversDay(startYmd, endYmd, dayYmd) {
  const start = /^\d{8}$/.test(String(startYmd || '')) ? String(startYmd) : '';
  const end = /^\d{8}$/.test(String(endYmd || '')) ? String(endYmd) : start;
  if (!start || !/^\d{8}$/.test(dayYmd)) return false;
  return dayYmd >= start && dayYmd <= (end || start);
}

/**
 * @param {object[]} items
 * @param {number} year
 * @param {number} month0
 * @returns {Map<string, object[]>}
 */
export function buildDayFestivalMap(items, year, month0) {
  /** @type {Map<string, object[]>} */
  const map = new Map();
  const dim = new Date(year, month0 + 1, 0).getDate();
  for (let day = 1; day <= dim; day += 1) {
    const ymd = `${year}${pad2(month0 + 1)}${pad2(day)}`;
    const list = [];
    for (const item of items || []) {
      if (festivalCoversDay(item?.eventStartDate, item?.eventEndDate, ymd)) {
        list.push(item);
      }
    }
    if (list.length) map.set(ymd, list);
  }
  return map;
}

/**
 * 달력 day 리스트 구분: 시작 / 진행 중 / 종료 (선택일이 오늘이면 「오늘」표기).
 * @param {object[]} items
 * @param {string} dayYmd
 * @returns {{ id: string, label: string, items: object[] }[]}
 */
export function groupFestivalsByDayRole(items, dayYmd) {
  const ymd = String(dayYmd || '');
  if (!/^\d{8}$/.test(ymd)) return [];

  const isToday = ymd === toYmd(new Date());
  const startLabel = isToday ? '오늘 시작' : '이날 시작';
  const endLabel = isToday ? '오늘 종료' : '이날 종료';

  /** @type {object[]} */
  const starting = [];
  /** @type {object[]} */
  const ongoing = [];
  /** @type {object[]} */
  const ending = [];

  for (const item of items || []) {
    const start = String(item?.eventStartDate || '');
    const endRaw = String(item?.eventEndDate || '');
    const end = /^\d{8}$/.test(endRaw) ? endRaw : start;
    if (!/^\d{8}$/.test(start)) continue;

    if (start === ymd) {
      starting.push(item);
    } else if (end === ymd) {
      ending.push(item);
    } else {
      ongoing.push(item);
    }
  }

  return [
    { id: 'start', label: startLabel, items: starting },
    { id: 'ongoing', label: '진행 중', items: ongoing },
    { id: 'end', label: endLabel, items: ending },
  ].filter((g) => g.items.length > 0);
}

/**
 * @param {{
 *   year: number,
 *   month0: number,
 *   dayMap: Map<string, object[]>,
 *   selectedYmd: string | null,
 *   onSelectDay: (ymd: string) => void,
 *   onPrevMonth: () => void,
 *   onNextMonth: () => void,
 * }} props
 */
export default function FestivalCalendar({
  year,
  month0,
  dayMap,
  selectedYmd,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}) {
  const today = toYmd(new Date());
  const cells = useMemo(() => {
    const first = new Date(year, month0, 1);
    const startPad = first.getDay();
    const dim = new Date(year, month0 + 1, 0).getDate();
    /** @type {Array<{ ymd: string | null, day: number | null }>} */
    const out = [];
    for (let i = 0; i < startPad; i += 1) out.push({ ymd: null, day: null });
    for (let day = 1; day <= dim; day += 1) {
      out.push({
        ymd: `${year}${pad2(month0 + 1)}${pad2(day)}`,
        day,
      });
    }
    while (out.length % 7 !== 0) out.push({ ymd: null, day: null });
    return out;
  }, [year, month0]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center hover:bg-white/10"
          aria-label="이전 달"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-sm md:text-base font-extrabold tracking-tight">
          {year}.{month0 + 1}
        </h3>
        <button
          type="button"
          onClick={onNextMonth}
          className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center hover:bg-white/10"
          aria-label="다음 달"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] font-bold text-gray-500 py-1">
            {w}
          </div>
        ))}
        {cells.map((cell, idx) => {
          if (!cell.ymd) {
            return <div key={`pad-${idx}`} className="aspect-square" />;
          }
          const count = dayMap.get(cell.ymd)?.length || 0;
          const selected = selectedYmd === cell.ymd;
          const isToday = cell.ymd === today;
          return (
            <button
              key={cell.ymd}
              type="button"
              onClick={() => onSelectDay(cell.ymd)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs transition-all border ${
                selected
                  ? 'bg-amber-500/25 border-amber-400/50 text-white font-bold'
                  : count > 0
                    ? 'bg-white/[0.06] border-white/15 text-white hover:bg-white/10'
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-white/[0.04]'
              } ${isToday && !selected ? 'ring-1 ring-amber-400/40' : ''}`}
            >
              <span>{cell.day}</span>
              {count > 0 ? (
                <span className="text-[9px] font-bold text-amber-200/90 leading-none">
                  {count > 9 ? '9+' : count}
                </span>
              ) : (
                <span className="h-2.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
