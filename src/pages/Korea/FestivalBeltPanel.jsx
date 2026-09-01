import React from 'react';
import { useTranslation } from 'react-i18next';
import { Route } from 'lucide-react';
import { localizedBeltLabel } from './festivalBelts.js';

/**
 * @param {{
 *   summaries: Array<{
 *     belt: import('./festivalBelts.js').FestivalBelt,
 *     festivalCount: number,
 *     activeStopCount: number,
 *     stopCount: number,
 *   }>,
 *   selectedBeltId: string | null,
 *   onSelect: (beltId: string | null) => void,
 *   locale: string,
 * }} props
 */
export default function FestivalBeltPanel({
  summaries,
  selectedBeltId,
  onSelect,
  locale,
}) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col gap-2"
      role="listbox"
      aria-label={t('korea.festival.belt.panelAria')}
    >
      {selectedBeltId ? (
        <button
          type="button"
          role="option"
          aria-selected={false}
          onClick={() => onSelect(null)}
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 py-2.5 text-left text-[11px] font-semibold text-stone-600 hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-900"
        >
          <Route size={14} className="shrink-0 opacity-70" aria-hidden="true" />
          {t('korea.festival.belt.clear')}
        </button>
      ) : null}
      {summaries.map(({ belt, festivalCount, activeStopCount, stopCount }) => {
        const selected = selectedBeltId === belt.id;
        const label = localizedBeltLabel(belt, locale);
        const blurb = String(belt.blurb || '').trim();
        return (
          <button
            key={belt.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(selected ? null : belt.id)}
            className={`flex w-full flex-col gap-1 rounded-2xl border px-3 py-3 text-left transition-all ${
              selected
                ? 'border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-200/80'
                : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-sm font-bold leading-snug break-keep ${
                  selected ? 'text-amber-950' : 'text-stone-900'
                }`}
              >
                {label}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selected
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {t('korea.festival.belt.festivals', { count: festivalCount })}
              </span>
            </div>
            {blurb ? (
              <p className="text-[11px] leading-snug text-stone-600 break-keep">
                {blurb}
              </p>
            ) : null}
            <p className="text-[10px] font-medium text-stone-500">
              {t('korea.festival.belt.stops', { count: stopCount })}
              {activeStopCount < stopCount
                ? ` · ${t('korea.festival.belt.activeStops', {
                    count: activeStopCount,
                  })}`
                : ''}
            </p>
          </button>
        );
      })}
    </div>
  );
}
