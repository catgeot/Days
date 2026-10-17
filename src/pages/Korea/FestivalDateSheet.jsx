import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useTrustBarOverlayLockEffect } from '../../shared/hooks/useTrustBarOverlayLockEffect.js';
import {
  clampYmdRangeToBounds,
  daysInMonth,
  eachMonthInYmdRange,
  festivalDateSheetAdjacentWeekRange,
  festivalDateSheetWeekIndexFromYmd,
  festivalDateSheetWeekRangeFromYmd,
  formatFestivalRangeLabel,
  mondayFirstColumnYmd,
  ymdFromParts,
} from './festivalDateFilter';

const WEEKDAY_FALLBACK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CHIP_IDLE =
  'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100';
const CHIP_ACTIVE = 'border-amber-600 bg-amber-700 text-white';

/**
 * @param {string} initialStart
 * @param {string} initialEnd
 * @param {string} todayYmd
 * @param {string} maxYmd
 */
function seedDraftRange(initialStart, initialEnd, todayYmd, maxYmd) {
  if (initialStart && initialEnd) {
    const kept = clampYmdRangeToBounds(
      { startYmd: initialStart, endYmd: initialEnd },
      todayYmd,
      maxYmd,
    );
    if (kept.startYmd && kept.endYmd) {
      return { start: kept.startYmd, end: kept.endYmd };
    }
  }
  const raw = festivalDateSheetWeekRangeFromYmd(0, todayYmd);
  const week = clampYmdRangeToBounds(raw, todayYmd, maxYmd);
  return { start: week.startYmd, end: week.endYmd };
}

/**
 * Single day or inclusive range, from Seoul today through the loaded data end.
 * With no applied range, the sheet opens on today through this Sunday.
 * @param {{
 *   open: boolean,
 *   todayYmd: string,
 *   maxYmd: string,
 *   initialStart?: string,
 *   initialEnd?: string,
 *   onApply: (range: { start: string, end: string }) => void,
 *   onClose: () => void,
 * }} props
 */
export default function FestivalDateSheet({
  open,
  todayYmd,
  maxYmd,
  initialStart = '',
  initialEnd = '',
  onApply,
  onClose,
}) {
  const { t } = useTranslation();
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const onCloseRef = useRef(onClose);
  const scrollRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  onCloseRef.current = onClose;

  useTrustBarOverlayLockEffect(open);

  useEffect(() => {
    if (!open) return undefined;
    const seeded = seedDraftRange(initialStart, initialEnd, todayYmd, maxYmd);
    setDraftStart(seeded.start);
    setDraftEnd(seeded.end);
    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, initialStart, initialEnd, todayYmd, maxYmd]);

  const months = useMemo(
    () => eachMonthInYmdRange(todayYmd, maxYmd),
    [todayYmd, maxYmd],
  );

  const weekdays = useMemo(() => {
    const raw = t('korea.festival.dateSheetWeekdays', { returnObjects: true });
    return Array.isArray(raw) && raw.length === 7 ? raw : WEEKDAY_FALLBACK;
  }, [t]);

  const weekShortcuts = useMemo(
    () => [
      { id: 1, label: t('korea.festival.dateSheetWeekNext') },
      { id: 2, label: t('korea.festival.dateSheetWeekNext2') },
    ],
    [t],
  );

  const weekIndex = festivalDateSheetWeekIndexFromYmd(draftStart, todayYmd);

  const canStepForward = useMemo(() => {
    const raw = festivalDateSheetWeekRangeFromYmd(weekIndex + 1, todayYmd);
    const next = clampYmdRangeToBounds(raw, todayYmd, maxYmd);
    return Boolean(next.startYmd && next.endYmd);
  }, [weekIndex, todayYmd, maxYmd]);

  useLayoutEffect(() => {
    if (!open || !draftStart) return;
    const root = scrollRef.current;
    if (!root) return;
    const startEl = root.querySelector(`[data-ymd="${draftStart}"]`);
    const endEl =
      root.querySelector(`[data-ymd="${draftEnd || draftStart}"]`) || startEl;
    if (!startEl || !endEl) return;
    const monthEl = startEl.closest('[data-calendar-month]');
    const rootRect = root.getBoundingClientRect();
    const relTop = (el) => el.getBoundingClientRect().top - rootRect.top + root.scrollTop;
    const relBottom = (el) =>
      el.getBoundingClientRect().bottom - rootRect.top + root.scrollTop;
    const startTop = relTop(startEl);
    const endBottom = relBottom(endEl);
    const monthTop = monthEl ? relTop(monthEl) : startTop;
    const monthBottom = monthEl ? relBottom(monthEl) : endBottom;
    const view = root.clientHeight;
    let nextTop = monthTop;
    if (monthBottom - monthTop <= view) {
      nextTop = monthTop;
      if (endBottom > nextTop + view) nextTop = endBottom - view;
      if (startTop < nextTop) nextTop = Math.max(0, startTop - 4);
    } else if (endBottom - startTop <= view) {
      nextTop = Math.max(0, startTop - 4);
    } else {
      nextTop = Math.max(0, startTop - 4);
    }
    if (Math.abs(root.scrollTop - nextTop) > 1) root.scrollTop = nextTop;
  }, [open, draftStart, draftEnd]);

  if (!open) return null;

  const label = draftStart
    ? formatFestivalRangeLabel(draftStart, draftEnd || draftStart, todayYmd)
    : '';

  const rangeMatchesWeek = (weeksAhead) => {
    const raw = festivalDateSheetWeekRangeFromYmd(weeksAhead, todayYmd);
    const { startYmd, endYmd } = clampYmdRangeToBounds(raw, todayYmd, maxYmd);
    return Boolean(startYmd && startYmd === draftStart && endYmd === draftEnd);
  };

  const pickDay = (ymd) => {
    if (!draftStart || (draftEnd && draftEnd !== draftStart)) {
      setDraftStart(ymd);
      setDraftEnd(ymd);
      return;
    }
    if (ymd < draftStart) {
      setDraftStart(ymd);
      setDraftEnd(ymd);
      return;
    }
    setDraftEnd(ymd);
  };

  const applyWeekAhead = (weeksAhead) => {
    const raw = festivalDateSheetWeekRangeFromYmd(weeksAhead, todayYmd);
    const { startYmd, endYmd } = clampYmdRangeToBounds(raw, todayYmd, maxYmd);
    if (!startYmd || !endYmd) return;
    setDraftStart(startYmd);
    setDraftEnd(endYmd);
  };

  const stepWeek = (direction) => {
    if (direction < 0 && weekIndex <= 0) return;
    if (direction > 0 && !canStepForward) return;
    const raw = festivalDateSheetAdjacentWeekRange(
      draftStart || todayYmd,
      todayYmd,
      direction,
    );
    const { startYmd, endYmd } = clampYmdRangeToBounds(raw, todayYmd, maxYmd);
    if (!startYmd || !endYmd) return;
    setDraftStart(startYmd);
    setDraftEnd(endYmd);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-0"
      role="presentation"
      onClick={onClose}
      data-festival-date-sheet=""
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="festival-date-sheet-title"
        className="flex max-h-[min(36rem,100dvh)] w-full max-w-lg flex-col rounded-t-3xl border border-stone-200 bg-white text-stone-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id="festival-date-sheet-title" className="text-sm font-extrabold">
              {t('korea.festival.dateSheetTitle')}
            </h2>
            <p
              className="mt-0.5 text-[11px] text-stone-500"
              data-festival-date-range=""
            >
              {label || t('korea.festival.dateSheetHint')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('korea.common.close')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="shrink-0 px-3 pt-3">
          <div
            className="mb-3 flex flex-wrap gap-2"
            data-festival-date-week-shortcuts=""
          >
            {weekShortcuts.map((item) => {
              const active = rangeMatchesWeek(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  data-week-shortcut={item.id}
                  aria-pressed={active}
                  onClick={() => applyWeekAhead(item.id)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                    active ? CHIP_ACTIVE : CHIP_IDLE
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              data-week-step="back"
              disabled={weekIndex <= 0}
              aria-label={t('korea.festival.dateSheetWeekBack')}
              onClick={() => stepWeek(-1)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 ${CHIP_IDLE}`}
            >
              {t('korea.festival.dateSheetWeekBack')}
            </button>
            <button
              type="button"
              data-week-step="forward"
              disabled={!canStepForward}
              aria-label={t('korea.festival.dateSheetWeekForward')}
              onClick={() => stepWeek(1)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold disabled:opacity-40 ${CHIP_IDLE}`}
            >
              {t('korea.festival.dateSheetWeekForward')}
            </button>
          </div>
          <div
            className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold text-stone-400"
            data-festival-date-weekdays=""
          >
            {weekdays.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-4">
            {months.map(({ year, month }) => (
              <MonthGrid
                key={`${year}-${month}`}
                year={year}
                month={month}
                todayYmd={todayYmd}
                maxYmd={maxYmd}
                draftStart={draftStart}
                draftEnd={draftEnd || draftStart}
                monthLabel={t('korea.festival.dateSheetMonth', { year, month })}
                onPick={pickDay}
              />
            ))}
          </div>
        </div>
        <div
          className="relative z-10 shrink-0 border-t border-stone-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
        >
          <button
            type="button"
            disabled={!draftStart}
            onClick={() =>
              onApply({ start: draftStart, end: draftEnd || draftStart })
            }
            className="w-full rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            {t('korea.festival.dateSheetApply')}
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  year,
  month,
  todayYmd,
  maxYmd,
  draftStart,
  draftEnd,
  monthLabel,
  onPick,
}) {
  const cells = useMemo(() => {
    const pad = mondayFirstColumnYmd(ymdFromParts(year, month, 1));
    const dim = daysInMonth(year, month);
    /** @type {(string | null)[]} */
    const out = [];
    for (let i = 0; i < pad; i += 1) out.push(null);
    for (let day = 1; day <= dim; day += 1) {
      out.push(ymdFromParts(year, month, day));
    }
    return out;
  }, [year, month]);

  const monthKey = `${year}${String(month).padStart(2, '0')}`;

  return (
    <section data-calendar-month={monthKey}>
      <p className="mb-1 px-1 text-xs font-bold text-stone-700">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((ymd, index) => {
          if (!ymd) return <span key={`pad-${monthKey}-${index}`} />;
          const enabled = ymd >= todayYmd && ymd <= maxYmd;
          const inRange = Boolean(
            draftStart && draftEnd && ymd >= draftStart && ymd <= draftEnd,
          );
          const edge = ymd === draftStart || ymd === draftEnd;
          return (
            <button
              key={ymd}
              type="button"
              disabled={!enabled}
              data-ymd={ymd}
              aria-pressed={edge}
              onClick={() => onPick(ymd)}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs ${
                !enabled
                  ? 'text-stone-300'
                  : edge
                    ? 'bg-amber-700 font-bold text-white'
                    : inRange
                      ? 'bg-amber-100 font-semibold text-amber-950'
                      : 'text-stone-800'
              }`}
            >
              {Number(ymd.slice(6, 8))}
            </button>
          );
        })}
      </div>
    </section>
  );
}
