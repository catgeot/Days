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

const DESKTOP_MONTHS = 3;

/** 멀티월 뷰에서 기준 달이 가운데 오도록 첫 달(viewMonth) 계산 */
function firstMonthForFocus(focusDate, monthsVisible) {
  const focus = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  if (monthsVisible <= 1) return focus;
  const centerOffset = Math.floor(monthsVisible / 2);
  return new Date(focus.getFullYear(), focus.getMonth() - centerOffset, 1);
}

/**
 * 체크인→체크아웃 기간 선택.
 * 1탭=체크인 · 2탭=체크아웃 · 일정 변경 시에만 「변경하기」활성 · 최대 {@link STAY_MAX_NIGHTS}박.
 * `monthsVisible={1}`: 모바일 기존(한 달·19.5rem) · `3`: PC 세 달·한 단계 확대.
 * PC 기본 뷰: 체크인 달(보름 뒤)이 가운데(예: 8월 → 7·8·9월).
 */
export function StayRangeCalendar({
  checkIn,
  checkOut,
  todayYmd,
  onPick,
  onCancel,
  accent = 'amber',
  monthsVisible = 1,
}) {
  const theme = ACCENT[accent] || ACCENT.amber;
  const isMulti = monthsVisible > 1;
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseYmd(checkIn) || new Date();
    return firstMonthForFocus(d, monthsVisible);
  });
  const [draftIn, setDraftIn] = useState(checkIn);
  const [draftOut, setDraftOut] = useState(checkOut);
  const [pickingOut, setPickingOut] = useState(false);

  const maxOutYmd = draftIn ? addDaysYmd(draftIn, STAY_MAX_NIGHTS) : null;
  const visibleMonths = Array.from({ length: monthsVisible }, (_, i) =>
    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + i, 1),
  );
  const datesComplete = Boolean(draftIn && draftOut && draftOut > draftIn);
  const datesDirty =
    datesComplete && (draftIn !== checkIn || draftOut !== checkOut);
  const canApply = datesDirty;

  const shiftMonth = (delta) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const ensureMonthVisible = (ymd) => {
    const d = parseYmd(ymd);
    if (!d) return;
    const target = new Date(d.getFullYear(), d.getMonth(), 1);
    setViewMonth((prev) => {
      const last = new Date(prev.getFullYear(), prev.getMonth() + monthsVisible - 1, 1);
      if (target >= prev && target <= last) return prev;
      return firstMonthForFocus(target, monthsVisible);
    });
  };

  const startCheckIn = (ymd) => {
    setDraftIn(ymd);
    setDraftOut(null);
    setPickingOut(true);
    ensureMonthVisible(ymd);
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

  const headerLabel = isMulti
    ? `${monthTitle(visibleMonths[0])} – ${monthTitle(visibleMonths[monthsVisible - 1])}`
    : monthTitle(viewMonth);

  const renderMonthGrid = (month, { showTitle }) => {
    const cells = buildMonthCells(month);
    const dayBtn = isMulti
      ? 'flex h-9 items-center justify-center rounded-md text-[13px] tabular-nums transition-colors'
      : 'flex h-8 items-center justify-center rounded-md text-[12px] tabular-nums transition-colors';
    const weekdayCls = isMulti ? 'text-[11px]' : 'text-[10px]';
    return (
      <div key={toYmd(month)} className="min-w-0">
        {showTitle ? (
          <p
            className={`mb-1.5 text-center text-[13px] font-bold tabular-nums ${theme.title}`}
          >
            {monthTitle(month)}
          </p>
        ) : null}
        <div className="mb-0.5 grid grid-cols-7 gap-0.5">
          {STAY_WEEKDAYS_KO.map((d) => (
            <div
              key={`${toYmd(month)}-${d}`}
              className={`py-0.5 text-center font-medium ${weekdayCls} ${
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
                key={ymd || `${toYmd(month)}-e-${idx}`}
                type="button"
                disabled={Boolean(disabled)}
                onClick={() => handleDayClick(ymd)}
                className={`${dayBtn} ${dayClass(ymd)}`}
              >
                {ymd ? Number(ymd.slice(8, 10)) : ''}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-label="숙소 일정 선택"
      className={`mt-2 w-full rounded-xl border ${theme.border} bg-black/90 shadow-xl backdrop-blur-md ${
        isMulti ? 'max-w-5xl p-3' : 'max-w-[19.5rem] p-2.5'
      }`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={`flex items-center justify-between ${
          isMulti ? 'mb-2 gap-2' : 'mb-1.5 gap-1.5'
        }`}
      >
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => shiftMonth(-1)}
          className={`flex items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10 active:scale-95 transition-all ${
            isMulti ? 'h-9 w-9' : 'h-8 w-8'
          }`}
        >
          <ChevronLeft size={isMulti ? 18 : 16} aria-hidden="true" />
        </button>
        <p
          className={`min-w-0 truncate text-center font-bold tabular-nums ${theme.title} ${
            isMulti ? 'text-sm' : 'text-[13px]'
          }`}
        >
          {headerLabel}
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => shiftMonth(1)}
          className={`flex items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10 active:scale-95 transition-all ${
            isMulti ? 'h-9 w-9' : 'h-8 w-8'
          }`}
        >
          <ChevronRight size={isMulti ? 18 : 16} aria-hidden="true" />
        </button>
      </div>

      {pickingOut && draftIn ? (
        <div
          className={`relative flex justify-center px-1 ${isMulti ? 'mb-2' : 'mb-1.5'}`}
          role="status"
        >
          <div
            className={`relative rounded-lg border text-center font-bold leading-snug shadow-lg ${theme.tip} ${
              isMulti
                ? 'max-w-sm px-3 py-1.5 text-[12px]'
                : 'max-w-[17rem] px-2.5 py-1.5 text-[11px]'
            }`}
          >
            체크아웃 날짜를 선택해 주세요
            <span
              className={`pointer-events-none absolute left-1/2 top-full -mt-px -translate-x-1/2 border-[5px] border-transparent ${theme.tipArrow}`}
              aria-hidden="true"
            />
          </div>
        </div>
      ) : (
        <p
          className={`text-center ${theme.hint} ${
            isMulti ? 'mb-2 text-[12px]' : 'mb-1.5 text-[11px]'
          }`}
        >
          체크인 날짜를 선택하세요
        </p>
      )}

      {isMulti ? (
        <div className="grid grid-cols-3 gap-4">
          {visibleMonths.map((month) => renderMonthGrid(month, { showTitle: true }))}
        </div>
      ) : (
        renderMonthGrid(viewMonth, { showTitle: false })
      )}

      <div
        className={`border-t border-white/10 ${
          isMulti ? 'mt-2 space-y-1.5 pt-2' : 'mt-1.5 space-y-1.5 pt-1.5'
        }`}
      >
        <p
          className={`truncate text-center tabular-nums text-white/55 ${
            isMulti ? 'text-[11px]' : 'text-[10px]'
          }`}
        >
          {formatStayDateLabel(draftIn || checkIn)}
          <span className="mx-1 text-white/25">→</span>
          {draftOut
            ? formatStayDateLabel(draftOut)
            : pickingOut
              ? '선택 중'
              : formatStayDateLabel(checkOut)}
        </p>
        <div className={`flex items-center justify-between ${isMulti ? 'gap-1.5' : 'gap-1'}`}>
          <button
            type="button"
            onClick={handleToday}
            className={
              isMulti
                ? 'rounded-md border border-white/40 bg-white/15 px-3 py-2 text-[12px] font-bold text-white hover:bg-white/25 hover:border-white/50 transition-colors'
                : 'rounded-md border border-white/20 px-2 py-1 text-[10px] font-semibold text-white/85 hover:bg-white/10 hover:text-white transition-colors'
            }
          >
            오늘
          </button>
          <div className={`flex items-center ${isMulti ? 'gap-1.5' : 'gap-1'}`}>
            <button
              type="button"
              onClick={onCancel}
              className={
                isMulti
                  ? 'rounded-md border border-white/30 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white hover:bg-white/20 hover:border-white/50 transition-colors'
                  : 'rounded-md px-2 py-1 text-[10px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors'
              }
            >
              닫기
            </button>
            <button
              type="button"
              disabled={!canApply}
              onClick={handleApply}
              className={`rounded-md border font-bold transition-all active:scale-95 ${
                isMulti ? 'px-3 py-2 text-[12px]' : 'px-2 py-1 text-[10px]'
              } ${
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

export { DESKTOP_MONTHS };

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
