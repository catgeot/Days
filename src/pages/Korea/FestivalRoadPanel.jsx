import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FESTIVAL_ROAD_MAP_MIN_POINTS,
  FESTIVAL_ROAD_MAP_SLOT_PX,
  festivalRoadMapPoints,
} from './lib/festivalRoad.js';

const FestivalRoadMap = lazy(() => import('./FestivalRoadMap.jsx'));

const CHIP_IDLE =
  'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100';
const CHIP_ACTIVE = 'border-amber-600 bg-amber-700 text-white';

const WEEK_CHIPS = [
  { id: 0, labelKey: 'korea.festival.dateSheetWeekThis' },
  { id: 1, labelKey: 'korea.festival.dateSheetWeekNext' },
];

/**
 * Draft route. The map chunk loads only when the line has two or more points.
 * @param {{
 *   beltName: string,
 *   legs: object[],
 *   allEmpty: boolean,
 *   weeksAhead: number,
 *   onWeeksAhead: (weeksAhead: number) => void,
 *   selectedStopIndex: number | null,
 *   onSelectStop: (stopIndex: number) => void,
 *   originHubId?: string,
 *   showNearby: boolean,
 *   nearbyLabels: string[],
 *   showAccess: boolean,
 *   accessSlot?: React.ReactNode,
 *   mooniSlot?: React.ReactNode,
 * }} props
 */
export function FestivalRoadPanel({
  beltName,
  legs,
  allEmpty,
  weeksAhead,
  onWeeksAhead,
  selectedStopIndex,
  onSelectStop,
  originHubId = '',
  showNearby,
  nearbyLabels,
  showAccess,
  accessSlot = null,
  mooniSlot = null,
}) {
  const { t } = useTranslation();
  const mapPoints = festivalRoadMapPoints(legs);
  const showMap = mapPoints.length >= FESTIVAL_ROAD_MAP_MIN_POINTS;

  return (
    <div className="space-y-3" data-festival-road="">
      <p className="text-sm font-extrabold text-stone-900 break-keep">{beltName}</p>
      {showMap ? (
        <div
          data-festival-road-map=""
          data-festival-road-map-points={String(mapPoints.length)}
          role="img"
          aria-label={t('korea.festival.road.mapSlot')}
          className="shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100"
          style={{ height: FESTIVAL_ROAD_MAP_SLOT_PX }}
        >
          <Suspense fallback={null}>
            <FestivalRoadMap points={mapPoints} />
          </Suspense>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2" data-festival-date-week-shortcuts="">
        {WEEK_CHIPS.map((chip) => {
          const active = weeksAhead === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              data-week-shortcut={chip.id}
              aria-pressed={active}
              onClick={() => onWeeksAhead(chip.id)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                active ? CHIP_ACTIVE : CHIP_IDLE
              }`}
            >
              {t(chip.labelKey)}
            </button>
          );
        })}
      </div>
      {allEmpty ? (
        <p className="text-sm font-medium text-stone-700 break-keep" data-festival-road-all-empty="">
          {t('korea.festival.road.allEmpty')}
        </p>
      ) : null}
      <ol className="space-y-2" data-festival-road-stops="">
        {(legs || []).map((leg) => {
          const selected = selectedStopIndex === leg.stopIndex;
          const origin = originHubId && originHubId === leg.hubId;
          return (
            <li
              key={leg.hubId}
              data-festival-road-stop={leg.hubId}
              data-festival-road-empty={leg.empty ? '1' : '0'}
              {...(origin ? { 'data-festival-road-origin': '' } : {})}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectStop(leg.stopIndex)}
                className="flex w-full items-start gap-2 rounded-xl border border-transparent px-1 py-1 text-left hover:bg-stone-50"
              >
                <span className="w-5 shrink-0 pt-0.5 text-sm font-extrabold tabular-nums text-stone-800">
                  {leg.stopIndex}
                </span>
                <span
                  data-festival-road-dot={leg.empty ? 'gray' : 'color'}
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    leg.empty ? 'bg-stone-300' : 'bg-amber-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-stone-900 break-keep">{leg.label}</span>
                  {leg.empty ? (
                    <span className="mt-0.5 block text-xs font-medium text-stone-500 break-keep">
                      {t('korea.festival.road.emptyStop')}
                    </span>
                  ) : null}
                  {leg.items?.length ? (
                    <span className="mt-1 block space-y-0.5">
                      {leg.items.map((row) => (
                        <span
                          key={String(row.item?.contentId || row.item?.title)}
                          data-festival-road-in-period={row.inPeriod ? '1' : '0'}
                          className={`block text-xs break-keep ${
                            row.inPeriod ? 'font-semibold text-stone-800' : 'text-stone-400'
                          }`}
                        >
                          {String(row.item?.title || '')}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </button>
              {selected && (showNearby || showAccess) ? (
                <div className="space-y-2 pb-1 pl-7" data-festival-road-fill="">
                  {showNearby ? (
                    <div data-festival-road-nearby="">
                      <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                        {t('korea.festival.detail.nearbySights')}
                      </p>
                      <ul className="mt-1 space-y-1">
                        {nearbyLabels.map((name) => (
                          <li key={name} className="text-sm font-medium text-stone-800 break-keep">
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {showAccess ? accessSlot : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      {mooniSlot}
    </div>
  );
}
