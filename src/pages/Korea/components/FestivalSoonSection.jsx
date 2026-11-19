import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../../i18n/LocaleProvider';
import FestivalGridPhotoCard from './FestivalGridPhotoCard.jsx';
import { FESTIVAL_HUB_GRID_CLASS } from '../festivalHubGridLayout.js';
import {
  festivalDaysUntilStart,
  formatFestivalSoonSectionSubline,
} from '../lib/festivalSoonWiden.js';
import { formatFestivalMonthDay, isYmd, seoulTodayYmd } from '../festivalDateFilter.js';

/**
 * @param {{
 *   items: object[],
 *   rangeStartYmd: string,
 *   rangeEndYmd: string,
 *   today?: Date,
 *   selected?: object | null,
 *   favoriteIds?: Set<string>,
 *   viewedIds?: Set<string>,
 *   onToggleFavorite?: (item: object) => void,
 *   onSelect: (item: object) => void,
 *   areaCode?: string,
 *   cityName?: string,
 *   showTopDivider?: boolean,
 * }} props
 */
export default function FestivalSoonSection({
  items,
  rangeStartYmd,
  rangeEndYmd,
  today = new Date(),
  selected,
  favoriteIds,
  viewedIds,
  onToggleFavorite,
  onSelect,
  areaCode = 'all',
  cityName = 'all',
  showTopDivider = true,
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const todayYmd = seoulTodayYmd(today);
  const countLabel = t('korea.festival.soonCount', { count: items.length });
  const sortLabel = t('korea.festival.soonSortByStart');
  const subline = formatFestivalSoonSectionSubline({
    rangeStartYmd,
    rangeEndYmd,
    count: items.length,
    todayYmd,
    locale,
    countLabel,
    sortLabel,
  });

  return (
    <section className={showTopDivider ? 'mt-4 space-y-3' : 'space-y-3'} data-festival-soon-section="">
      {showTopDivider ? (
        <div
          className="border-t border-dashed border-stone-300 pt-4"
          data-festival-soon-divider=""
        />
      ) : null}
      <div className="px-0.5">
        <h3 className="text-[15px] font-bold text-stone-900 md:text-sm">
          {t('korea.festival.soonTitle')}
        </h3>
        <p className="mt-0.5 text-[12px] text-stone-500 md:text-xs">{subline}</p>
      </div>
      <div className={FESTIVAL_HUB_GRID_CLASS}>
        {items.map((item, index) => {
          const days = festivalDaysUntilStart(item, todayYmd);
          return (
            <FestivalGridPhotoCard
              key={String(item?.contentId || index)}
              item={item}
              areaCode={areaCode}
              cityName={cityName}
              active={
                selected?.contentId != null
                && String(selected.contentId) === String(item?.contentId)
              }
              favorited={favoriteIds?.has(String(item?.contentId))}
              viewed={Boolean(viewedIds?.has(String(item?.contentId)))}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelect}
              priorityThumb={index < 4}
              soonStartsInDays={days}
            />
          );
        })}
      </div>
    </section>
  );
}

/**
 * @param {{
 *   item: object,
 *   today?: Date,
 *   onSelect: (item: object) => void,
 *   selected?: object | null,
 *   favoriteIds?: Set<string>,
 *   viewedIds?: Set<string>,
 *   onToggleFavorite?: (item: object) => void,
 *   areaCode?: string,
 *   cityName?: string,
 * }} props
 */
export function FestivalNearestUpcomingBlock({
  item,
  today = new Date(),
  onSelect,
  selected,
  favoriteIds,
  viewedIds,
  onToggleFavorite,
  areaCode = 'all',
  cityName = 'all',
}) {
  const { t } = useTranslation();
  const { isEnglish } = useLocale();
  const todayYmd = seoulTodayYmd(today);
  const start = String(item?.eventStartDate || '');
  const datePart = formatFestivalMonthDay(start, todayYmd);
  let line;
  if (isEnglish) {
    line = t('korea.festival.nearestUpcomingLineEn', { date: datePart });
  } else if (isYmd(start)) {
    const month = Number(start.slice(4, 6));
    const day = Number(start.slice(6, 8));
    line = t('korea.festival.nearestUpcomingLine', {
      date: `${month}월 ${day}일`,
    });
  } else {
    line = t('korea.festival.nearestUpcomingLine', { date: datePart });
  }

  return (
    <div className="space-y-3 px-1 py-2" data-festival-nearest-upcoming="">
      <p className="text-sm text-stone-600">{line}</p>
      <div className="max-w-sm">
        <FestivalGridPhotoCard
          item={item}
          areaCode={areaCode}
          cityName={cityName}
          active={
            selected?.contentId != null
            && String(selected.contentId) === String(item?.contentId)
          }
          favorited={favoriteIds?.has(String(item?.contentId))}
          viewed={Boolean(viewedIds?.has(String(item?.contentId)))}
          onToggleFavorite={onToggleFavorite}
          onSelect={onSelect}
          priorityThumb
        />
      </div>
    </div>
  );
}