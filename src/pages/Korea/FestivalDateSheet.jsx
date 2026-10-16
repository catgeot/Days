import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useTrustBarOverlayLockEffect } from '../../shared/hooks/useTrustBarOverlayLockEffect.js';
import {
  daysInMonth,
  eachMonthInYmdRange,
  formatFestivalRangeLabel,
  weekdayIndexYmd,
  ymdFromParts,
} from './festivalDateFilter';

const WEEKDAY_FALLBACK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Single day or inclusive range, from Seoul today through the loaded data end.
 * @param {{
 *   open: boolean,
 *   todayYmd: string,
 *   maxYmd: string,
 *   onApply: (range: { start: string, end: string }) => void,
 *   onClose: () => void,
 * }} props
 */
export default function FestivalDateSheet({
  open,
  todayYmd,
  maxYmd,
  onApply,
  onClose,
}) {
  const { t } = useTranslation();
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useTrustBarOverlayLockEffect(open);

  useEffect(() => {
    if (!open) return undefined;
    setDraftStart('');
    setDraftEnd('');
    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const months = useMemo(
    () => eachMonthInYmdRange(todayYmd, maxYmd),
    [todayYmd, maxYmd],
  );

  const weekdays = useMemo(() => {
    const raw = t('korea.festival.dateSheetWeekdays', { returnObjects: true });
    return Array.isArray(raw) && raw.length === 7 ? raw : WEEKDAY_FALLBACK;
  }, [t]);

  if (!open) return null;

  const label = draftStart
    ? formatFestivalRangeLabel(draftStart, draftEnd || draftStart, todayYmd)
    : '';

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
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id="festival-date-sheet-title" className="text-sm font-extrabold">
              {t('korea.festival.dateSheetTitle')}
            </h2>
            <p className="mt-0.5 text-[11px] text-stone-500">
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
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold text-stone-400">
            {weekdays.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
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
          className="shrink-0 border-t border-stone-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
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
    const pad = weekdayIndexYmd(ymdFromParts(year, month, 1));
    const dim = daysInMonth(year, month);
    /** @type {(string | null)[]} */
    const out = [];
    for (let i = 0; i < pad; i += 1) out.push(null);
    for (let day = 1; day <= dim; day += 1) {
      out.push(ymdFromParts(year, month, day));
    }
    return out;
  }, [year, month]);

  return (
    <section>
      <p className="mb-1 px-1 text-xs font-bold text-stone-700">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((ymd, index) => {
          if (!ymd) return <span key={`pad-${index}`} />;
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
