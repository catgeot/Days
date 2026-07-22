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
    tip: 'border-amber-300/70 bg-amber-400 text-black',
    tipArrow: 'border-t-amber-400',
    apply: 'border-amber-300/55 bg-amber-400 text-black hover:bg-amber-300',
  },
  sky: {
    selected: 'bg-sky-400 text-black font-bold shadow-sm',
    range: 'bg-sky-400/25 text-sky-50 font-semibold',
    today: 'text-sky-100 ring-1 ring-sky-300/50 font-semibold hover:bg-white/10',
    title: 'text-sky-50',
    hint: 'text-sky-100/65',
    border: 'border-sky-400/30',
    tip: 'border-sky-300/70 bg-sky-400 text-black',
    tipArrow: 'border-t-sky-400',
    apply: 'border-sky-300/55 bg-sky-400 text-black hover:bg-sky-300',
  },
};

/**
 * 한 달력에서 체크인→체크아웃 기간 선택.
 * 1탭=체크인 · 2탭=체크아웃 · 일정 변경 시에만 「변경하기」활성 · 최대 {@link STAY_MAX_NIGHTS}박.
 * PC에서도 max-width로 과도하게 커지지 않게 유지(19.5rem).
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
  const datesComplete = Boolean(draftIn && draftOut && draftOut > draftIn);
  const datesDirty =
    datesComplete && (draftIn !== checkIn || draftOut !== checkOut);
  const canApply = datesDirty;

  const shiftMonth = (delta) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const startCheckIn = (ymd) => {
    setDraftIn(ymd);
    setDraftOut(null);
    setPickingOut(true);
    const d = parseYmd(ymd);
    if (d) setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handleDayClick = (ymd) => {
    if (!ymd || ymd < todayYmd) return;
    if (!pickingOut || !draftIn) {
      startCheckIn(ymd);
      return;
    }
    if (ymd <= draftIn) {
      startCheckIn(ymd);
      return;
    }
    if (maxOutYmd && ymd > maxOutYmd) return;
    const next = normalizeMrtStayDates(draftIn, ymd);
    setDraftIn(next.checkIn);
    setDraftOut(next.checkOut);
    setPickingOut(false);
  };

  const handleToday = () => {
    startCheckIn(todayYmd);
  };

  const handleApply = () => {
    if (!canApply) return;
    const next = normalizeMrtStayDates(draftIn, draftOut);
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
      className={`mt-2 w-full max-w-[19.5rem] rounded-xl border ${theme.border} bg-black/90 p-2.5 shadow-xl backdrop-blur-md`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1.5">
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

      {pickingOut && draftIn ? (
        <div className="relative mb-1.5 flex justify-center px-1" role="status">
          <div
            className={`relative max-w-[17rem] rounded-lg border px-2.5 py-1.5 text-center text-[11px] font-bold leading-snug shadow-lg ${theme.tip}`}
          >
            체크아웃 날짜를 선택해 주세요
            <span
              className={`pointer-events-none absolute left-1/2 top-full -mt-px -translate-x-1/2 border-[5px] border-transparent ${theme.tipArrow}`}
              aria-hidden="true"
            />
          </div>
        </div>
      ) : (
        <p className={`mb-1.5 text-center text-[11px] ${theme.hint}`}>
          체크인 날짜를 선택하세요
        </p>
      )}

      <div className="mb-0.5 grid grid-cols-7 gap-0.5">
        {STAY_WEEKDAYS_KO.map((d) => (
          <div
            key={d}
            className={`py-0.5 text-center text-[10px] font-medium ${
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
              className={`flex h-8 items-center justify-center rounded-md text-[12px] tabular-nums transition-colors ${dayClass(
                ymd,
              )}`}
            >
              {ymd ? Number(ymd.slice(8, 10)) : ''}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 space-y-1.5 border-t border-white/10 pt-1.5">
        <p className="truncate text-center text-[10px] tabular-nums text-white/55">
          {formatStayDateLabel(draftIn || checkIn)}
          <span className="mx-1 text-white/25">→</span>
          {draftOut
            ? formatStayDateLabel(draftOut)
            : pickingOut
              ? '선택 중'
              : formatStayDateLabel(checkOut)}
        </p>
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-colors"
          >
            오늘
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-2 py-1 text-[10px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={!canApply}
              onClick={handleApply}
              className={`rounded-md border px-2 py-1 text-[10px] font-bold transition-all active:scale-95 ${
                canApply
                  ? theme.apply
                  : 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
              }`}
            >
              변경하기
            </button>
          </div>
        </div>
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
