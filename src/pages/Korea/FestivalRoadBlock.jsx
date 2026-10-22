import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FestivalRoadPanel } from './FestivalRoadPanel.jsx';
import FestivalAccessCard from './FestivalAccessCard.jsx';
import { seoulTodayYmd } from './festivalDateFilter.js';
import {
  beltForFestival,
  beltStopNearbySights,
  festivalRoadAllEmpty,
  festivalRoadFill,
  festivalRoadPeriodRange,
  groupFestivalsForBelt,
} from './lib/festivalRoad.js';
import { useSeoulCalendarNow } from './useSeoulCalendarNow.js';

/**
 * Flag-on road entry. Loaded only when VITE_GATEO_FESTIVAL_ROAD is '1'.
 * @param {{
 *   item?: object | null,
 *   festivalPool?: object[],
 *   onSelectNearby?: (spot: object) => void,
 *   onAskMooni?: ((event: React.MouseEvent) => void) | null,
 * }} props
 */
export default function FestivalRoadBlock({
  item,
  festivalPool,
  onSelectNearby,
  onAskMooni = null,
}) {
  const { t } = useTranslation();
  const now = useSeoulCalendarNow();
  const roadToday = seoulTodayYmd(now);
  const roadBelt = useMemo(() => beltForFestival(item), [item]);
  const [roadOpen, setRoadOpen] = useState(false);
  const [roadWeeksAhead, setRoadWeeksAhead] = useState(0);
  const [roadStopIndex, setRoadStopIndex] = useState(null);
  const roadLegs = useMemo(() => {
    if (!roadBelt) return [];
    const pool = Array.isArray(festivalPool) ? festivalPool : [];
    const id = String(item?.contentId || '');
    const withOrigin = id && !pool.some((row) => String(row?.contentId || '') === id)
      ? [item, ...pool]
      : pool;
    return groupFestivalsForBelt(
      roadBelt,
      withOrigin,
      festivalRoadPeriodRange(roadWeeksAhead, now),
    );
  }, [roadBelt, festivalPool, item, roadWeeksAhead, roadToday, now]);
  const roadOriginHubId = useMemo(() => {
    if (!roadBelt || !item) return '';
    const legs = groupFestivalsForBelt(roadBelt, [item], { startYmd: '', endYmd: '' });
    return legs.find((leg) => leg.items.length)?.hubId || '';
  }, [roadBelt, item]);
  const roadSelectedLeg = roadLegs.find((leg) => leg.stopIndex === roadStopIndex) || null;
  const roadNearbySights = roadSelectedLeg ? beltStopNearbySights(roadSelectedLeg.hubId) : [];
  const roadFill = festivalRoadFill(
    roadSelectedLeg,
    roadNearbySights.map((sight) => sight.name),
    item?.contentId,
    roadOriginHubId,
  );
  const roadAllEmpty = festivalRoadAllEmpty(roadLegs);

  if (!roadBelt) return null;

  return (
    <>
      <button
        type="button"
        data-festival-road-entry=""
        aria-pressed={roadOpen}
        onClick={() => {
          if (roadOpen) {
            setRoadOpen(false);
            return;
          }
          setRoadWeeksAhead(0);
          setRoadStopIndex(null);
          setRoadOpen(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-bold text-stone-800 transition-colors hover:border-stone-300 hover:bg-stone-100"
      >
        {t('korea.festival.road.viewFromThis')}
      </button>
      {roadOpen ? (
        <FestivalRoadPanel
          beltName={String(roadBelt.name || '')}
          legs={roadLegs}
          allEmpty={roadAllEmpty}
          weeksAhead={roadWeeksAhead}
          onWeeksAhead={setRoadWeeksAhead}
          selectedStopIndex={roadStopIndex}
          onSelectStop={(stopIndex) => {
            setRoadStopIndex((prev) => (prev === stopIndex ? null : stopIndex));
          }}
          originHubId={roadOriginHubId}
          showNearby={roadFill.showNearby}
          nearbySights={roadFill.showNearby ? roadNearbySights : []}
          onSelectNearby={(sight) => {
            if (!sight || !onSelectNearby) return;
            onSelectNearby({
              id: sight.contentId || sight.name,
              name: sight.name,
              attractionName: sight.name,
              contentId: sight.contentId || null,
              contentTypeId: '12',
              lat: sight.lat,
              lng: sight.lng,
              hubId: sight.hubId,
              localScenicListId: sight.listId,
            });
          }}
          showAccess={roadFill.showAccess}
          accessSlot={
            roadFill.showAccess && roadFill.accessItem ? (
              <FestivalAccessCard
                contentId={roadFill.accessItem.contentId}
                eventStartDate={roadFill.accessItem.eventStartDate}
                eventEndDate={roadFill.accessItem.eventEndDate}
                detailSettled
                onAskMooni={onAskMooni}
              />
            ) : null
          }
        />
      ) : null}
    </>
  );
}
