import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Route } from 'lucide-react';
import { localizedBeltLabel } from './festivalBelts.js';

/**
 * @param {{
 *   summaries: Array<{
 *     belt: import('./festivalBelts.js').FestivalBelt,
 *     groups: Array<{ id: string, label: string, items: object[], empty?: boolean }>,
 *     festivalCount: number,
 *     activeStopCount: number,
 *     stopCount: number,
 *   }>,
 *   expandedBeltId: string | null,
 *   onToggleExpand: (beltId: string | null) => void,
 *   locale: string,
 *   renderFestival: (item: object) => React.ReactNode,
 * }} props
 */
export default function FestivalBeltPanel({
  summaries,
  expandedBeltId,
  onToggleExpand,
  locale,
  renderFestival,
}) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col gap-2"
      role="region"
      aria-label={t('korea.festival.belt.panelAria')}
    >
      {summaries.map(
        ({ belt, groups, festivalCount, activeStopCount, stopCount }) => {
          const expanded = expandedBeltId === belt.id;
          const label = localizedBeltLabel(belt, locale);
          const blurb = String(belt.blurb || '').trim();
          const panelId = `festival-belt-panel-${belt.id}`;

          return (
            <section
              key={belt.id}
              className={`overflow-hidden rounded-2xl border transition-colors ${
                expanded
                  ? 'border-amber-400 bg-amber-50/40 shadow-sm ring-1 ring-amber-200/70'
                  : 'border-stone-200 bg-white'
              }`}
            >
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => onToggleExpand(expanded ? null : belt.id)}
                className="flex w-full flex-col gap-1 px-3 py-3 text-left hover:bg-amber-50/50"
              >
                <div className="flex items-start gap-2">
                  <Route
                    size={16}
                    className={`mt-0.5 shrink-0 ${
                      expanded ? 'text-amber-700' : 'text-stone-400'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-bold leading-snug break-keep ${
                          expanded ? 'text-amber-950' : 'text-stone-900'
                        }`}
                      >
                        {label}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          expanded
                            ? 'bg-amber-500 text-white'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {t('korea.festival.belt.festivals', {
                          count: festivalCount,
                        })}
                      </span>
                    </div>
                    {blurb ? (
                      <p className="mt-1 text-[11px] leading-snug text-stone-600 break-keep">
                        {blurb}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] font-medium text-stone-500">
                      {t('korea.festival.belt.stops', { count: stopCount })}
                      {activeStopCount < stopCount
                        ? ` · ${t('korea.festival.belt.activeStops', {
                            count: activeStopCount,
                          })}`
                        : ''}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`mt-0.5 shrink-0 text-stone-400 transition-transform ${
                      expanded ? 'rotate-180 text-amber-700' : ''
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>
              {expanded ? (
                <div
                  id={panelId}
                  className="space-y-3 border-t border-amber-200/80 bg-white/80 px-3 py-3"
                >
                  {festivalCount === 0 ? (
                    <p className="px-1 py-2 text-sm text-stone-500">
                      {t('korea.festival.belt.emptyRoad')}
                    </p>
                  ) : (
                    groups.map((group) => (
                      <div key={group.id} className="space-y-2">
                        <p className="px-1 py-0.5 text-[11px] font-bold tracking-wide text-stone-500">
                          {group.label}
                          <span className="ml-1 font-normal opacity-70">
                            {group.items.length}
                          </span>
                        </p>
                        {group.items.length === 0 ? (
                          <p className="px-1 text-[11px] text-stone-400">
                            {t('korea.festival.belt.emptyStop')}
                          </p>
                        ) : (
                          group.items.map((item) => (
                            <React.Fragment key={String(item?.contentId || item?.title)}>
                              {renderFestival(item)}
                            </React.Fragment>
                          ))
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </section>
          );
        },
      )}
    </div>
  );
}
