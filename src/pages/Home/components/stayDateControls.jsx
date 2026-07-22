import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { normalizeMrtStayDates } from '../../../utils/fetchMrtStays';

export const STAY_MAX_NIGHTS = 30;
export const STAY_WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd, days) {
  const d = parseYmd(ymd);
  if (!d) return ymd;
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

/** YYYY-MM-DD → 2026.7.20 */
export function formatStayDateLabel(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
  if (!m) return ymd || '날짜 선택';
  return `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`;
}

function monthTitle(viewMonth) {
  return `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;
}

function buildMonthCells(viewMonth) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toYmd(new Date(year, month, day, 12, 0, 0, 0)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const ACCENT = {
  amber: {
    selected: 'bg-amber-400 text-black font-bold shadow-sm',
    range: 'bg-amber-400/25 text-amber-50 font-semibold',
    today: 'text-amber-100 ring-1 ring-amber-300/50 font-semibold hover:bg-white/10',
    title: 'text-amber-50',
    hint: 'text-amber-100/65',
    border: 'border-amber-400/30',
  },
  sky: {
    selected: 'bg-sky-400 text-black font-bold shadow-sm',
    range: 'bg-sky-400/25 text-sky-50 font-semibold',
    today: 'text-sky-100 ring-1 ring-sky-300/50 font-semibold hover:bg-white/10',
    title: 'text-sky-50',
    hint: 'text-sky-100/65',
    border: 'border-sky-400/30',
  },
};

/**
 * 한 달력에서 체크인→체크아웃 기간 선택.
 * 1탭=체크인 · 2탭=체크아웃 · 최대 {@link STAY_MAX_NIGHTS}박.
 */
export function StayRangeCalendar({
  checkIn,
  checkOut,
  todayYmd,
  onPick,
  onCancel,
  accent = 'amber',
}) {
  const theme = ACCENT[accent] || ACCENT.amber;
  const [viewMonth, setViewMonth] = useState(() => parseYmd(checkIn) || new Date());
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);
  const [pickingOut, setPickingOut] = useState(false);

  const maxOutYmd = draftIn ? addDaysYmd(draftIn, STAY_MAX_NIGHTS) : null;
  const cells = buildMonthCells(viewMonth);
  const hint = pickingOut
    ? '체크아웃 날짜를 선택하세요'
    : '체크인 날짜를 선택하세요';

  const shiftMonth = (delta) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleDayClick = (ymd) => {
    if (!ymd || ymd < todayYmd) return;
    if (!pickingOut || !draftIn) {
      setDraftIn(ymd);
      setDraftOut(null);
      setPickingOut(true);
      return;
    }
    if (ymd <= draftIn) {
      setDraftIn(ymd);
      setDraftOut(null);
      setPickingOut(true);
      return;
    }
    if (maxOutYmd && ymd > maxOutYmd) return;
    const next = normalizeMrtStayDates(draftIn, ymd);
    onPick?.(next.checkIn, next.checkOut);
  };

  const dayClass = (ymd) => {
    if (!ymd) return 'invisible pointer-events-none';
    const disabled =
      ymd < todayYmd ||
      (pickingOut && draftIn && maxOutYmd && ymd > maxOutYmd && ymd !== draftIn);
    const isIn = ymd === draftIn;
    const isOut = Boolean(draftOut) && ymd === draftOut;
    const inRange = Boolean(draftIn && draftOut) && ymd > draftIn && ymd < draftOut;
    if (disabled && !isIn) return 'text-white/20 cursor-not-allowed';
    if (isIn || isOut) return theme.selected;
    if (inRange) return theme.range;
    if (ymd === todayYmd) return theme.today;
    return 'text-white/85 hover:bg-white/10';
  };

  return (
    <div
      role="dialog"
      aria-label="숙소 일정 선택"
      className={`mt-2 rounded-xl border ${theme.border} bg-black/90 p-2.5 shadow-xl backdrop-blur-md`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => shiftMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <p className={`text-[13px] font-bold tabular-nums ${theme.title}`}>
          {monthTitle(viewMonth)}
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => shiftMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <p className={`mb-2 text-center text-[11px] ${theme.hint}`}>{hint}</p>
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {STAY_WEEKDAYS_KO.map((d) => (
          <div
            key={d}
            className={`py-1 text-center text-[10px] font-medium ${
              d === '일' ? 'text-rose-300/70' : 'text-white/40'
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((ymd, idx) => {
          const disabled =
            !ymd ||
            ymd < todayYmd ||
            (pickingOut && draftIn && maxOutYmd && ymd > maxOutYmd);
          return (
            <button
              key={ymd || `e-${idx}`}
              type="button"
              disabled={Boolean(disabled)}
              onClick={() => handleDayClick(ymd)}
              className={`flex h-9 items-center justify-center rounded-lg text-[12px] tabular-nums transition-colors ${dayClass(
                ymd,
              )}`}
            >
              {ymd ? Number(ymd.slice(8, 10)) : ''}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <p className="min-w-0 truncate text-[11px] tabular-nums text-white/55">
          {formatStayDateLabel(draftIn || checkIn)}
          <span className="mx-1 text-white/25">→</span>
          {draftOut
            ? formatStayDateLabel(draftOut)
            : pickingOut
              ? '선택 중'
              : formatStayDateLabel(checkOut)}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export function GuestStepper({
  label,
  value,
  min,
  max,
  onChange,
  accent = 'amber',
}) {
  const labelCls =
    accent === 'sky' ? 'text-sky-100/75' : 'text-amber-100/75';
  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className={`shrink-0 text-[10px] font-semibold ${labelCls}`}>{label}</span>
      <div className="flex items-center rounded-md border border-white/12 bg-black/40">
        <button
          type="button"
          aria-label={`${label} 줄이기`}
          disabled={value <= min}
          onClick={(e) => {
            e.stopPropagation();
            if (value > min) onChange?.(value - 1);
          }}
          className="flex h-7 w-7 items-center justify-center text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
        >
          <Minus size={12} aria-hidden="true" />
        </button>
        <span className="min-w-[1.1rem] text-center text-[12px] font-bold tabular-nums text-white">
          {value}
        </span>
        <button
          type="button"
          aria-label={`${label} 늘리기`}
          disabled={value >= max}
          onClick={(e) => {
            e.stopPropagation();
            if (value < max) onChange?.(value + 1);
          }}
          className="flex h-7 w-7 items-center justify-center text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
        >
          <Plus size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
