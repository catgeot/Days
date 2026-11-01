import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../../i18n/LocaleProvider';
import { koreanApiTextProps } from '../../../i18n/koreanApiText.js';
import { formatFestivalDetailDateRange } from '../festivalDateFilter.js';
import {
  festivalItemThumbCandidateUrls,
} from '../festivalListThumb.js';
import { FestivalListThumbFallback } from '../festivalListThumbBox.jsx';
import { FestivalPhotoFrame } from '../festivalPhotoFrame.js';
import { formatFestivalDistKm } from '../lib/formatFestivalDistKm.js';
import { festivalListDisplayTitleLines } from '../festivalDisplayTitle.js';
import { festivalGridPlaceLabel } from '../festivalGridPlaceLabel.js';
import { hasFestivalThumbnail } from '../socialPromoFestivalsLogic.js';

function FestivalGridThumbLoadingShimmer() {
  return (
    <span
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-festival-grid-thumb-loading=""
      aria-hidden="true"
    >
      <span
        className="absolute inset-[-12%] bg-gradient-to-br from-amber-50 via-stone-200/80 to-orange-100 blur-md"
      />
      <span
        className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/0 via-white/80 to-white/0"
      />
    </span>
  );
}

/**
 * @param {{
 *   item: Record<string, unknown>,
 *   active?: boolean,
 *   onSelect: (item: Record<string, unknown>) => void,
 *   favorited?: boolean,
 *   onToggleFavorite?: (item: Record<string, unknown>) => void,
 *   distanceKm?: number,
 *   areaCode?: string,
 *   cityName?: string,
 *   priorityThumb?: boolean,
 *   thumbAspectClass?: string,
 *   wide?: boolean,
 * }} props
 */
export default function FestivalGridPhotoCard({
  item,
  active = false,
  onSelect,
  favorited = false,
  onToggleFavorite,
  distanceKm,
  areaCode = 'all',
  cityName = 'all',
  priorityThumb = false,
  thumbAspectClass = 'aspect-[4/3]',
  wide = false,
}) {
  const { t } = useTranslation();
  const { isEnglish, locale } = useLocale();
  const koText = koreanApiTextProps(isEnglish);
  const [urlIndex, setUrlIndex] = useState(0);
  const [thumbDecoded, setThumbDecoded] = useState(false);

  const thumbCandidates = React.useMemo(
    () => festivalItemThumbCandidateUrls(item),
    [item],
  );
  const canTryImage =
    hasFestivalThumbnail(item) && thumbCandidates.length > 0;
  const activeUrl =
    canTryImage && urlIndex < thumbCandidates.length
      ? thumbCandidates[urlIndex]
      : '';
  const showStaticFallback = !canTryImage || !activeUrl;

  useEffect(() => {
    setThumbDecoded(false);
  }, [activeUrl]);

  const range = formatFestivalDetailDateRange(
    item.eventStartDate,
    item.eventEndDate,
    undefined,
    isEnglish ? 'en' : 'ko',
  );
  const place = festivalGridPlaceLabel(item, { areaCode, cityName, locale });
  const titleLines = festivalListDisplayTitleLines(item, locale);
  const distanceLabel = formatFestivalDistKm(distanceKm);
  const metaLine = [range, place].filter(Boolean).join(' · ');

  return (
    <article
      className={`relative mb-1.5 flex min-w-0 break-inside-avoid flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-colors md:mb-2 lg:mb-2.5 ${wide ? '[column-span:all]' : ''} ${
        active
          ? 'border-amber-400 ring-1 ring-amber-200'
          : 'border-stone-200 [@media(hover:hover)]:hover:border-amber-300'
      }`}
      data-festival-grid-card=""
    >
      <button
        type="button"
        data-festival-id={String(item?.contentId || '')}
        onClick={() => onSelect(item)}
        className="flex min-w-0 flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90 focus-visible:ring-offset-1"
      >
        <div className={`relative ${thumbAspectClass} w-full overflow-hidden bg-gradient-to-br from-amber-100 to-stone-200`}>
          {showStaticFallback ? (
            <span className="absolute inset-0" data-festival-grid-thumb-fallback="">
              <FestivalListThumbFallback size="lg" />
            </span>
          ) : (
            <>
              {!thumbDecoded ? <FestivalGridThumbLoadingShimmer /> : null}
              <FestivalPhotoFrame
                src={activeUrl}
                alt=""
                loading={priorityThumb ? 'eager' : 'lazy'}
                fetchPriority={priorityThumb ? 'high' : undefined}
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 z-[1] h-full w-full object-cover"
                pendingShimmer={!thumbDecoded}
                fallback={
                  <span className="absolute inset-0" data-festival-grid-thumb-fallback="">
                    <FestivalListThumbFallback size="lg" />
                  </span>
                }
                onLoaded={() => setThumbDecoded(true)}
                onFailed={() => {
                  if (urlIndex + 1 < thumbCandidates.length) {
                    setUrlIndex((i) => i + 1);
                  }
                }}
              />
            </>
          )}
          {distanceLabel ? (
            <span
              className="absolute left-2 top-2 z-[1] rounded-full bg-stone-900/75 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white"
            >
              {distanceLabel}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 px-1.5 pb-1.5 pt-1">
          {titleLines?.secondary ? (
            <>
              <p
                className="text-[11px] font-bold leading-[1.25] text-stone-900 line-clamp-2 break-keep"
              >
                {titleLines.primary}
              </p>
              <p
                className="text-[10px] font-semibold leading-snug text-stone-600 line-clamp-1 break-keep"
                {...koText}
              >
                {titleLines.secondary}
              </p>
            </>
          ) : (
            <p
              className="text-[11px] font-bold leading-[1.25] text-stone-900 line-clamp-2 break-keep"
              {...koText}
            >
              {titleLines?.primary}
            </p>
          )}
          {metaLine ? (
            <p
              className="text-[10px] leading-snug text-stone-600 line-clamp-1 break-keep tabular-nums"
            >
              {metaLine}
            </p>
          ) : null}
        </div>
      </button>
      {onToggleFavorite ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item);
          }}
          aria-label={
            favorited
              ? t('korea.common.favoriteRemove')
              : t('korea.common.favoriteAdd')
          }
          aria-pressed={favorited}
          className="absolute right-1.5 top-1.5 z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-stone-500 shadow-sm hover:border-amber-300 hover:bg-amber-50"
        >
          <Star
            size={14}
            className={
              favorited ? 'fill-amber-400 text-amber-500' : 'text-stone-400'
            }
            aria-hidden="true"
          />
        </button>
      ) : null}
    </article>
  );
}

export function FestivalGridSkeleton({ thumbAspectClass = 'aspect-[4/3]', wide = false }) {
  return (
    <div
      className={`mb-1.5 break-inside-avoid overflow-hidden rounded-xl border border-stone-200 bg-white md:mb-2 lg:mb-2.5 ${wide ? '[column-span:all]' : ''}`}
      aria-hidden="true"
    >
      <div className={`${thumbAspectClass} animate-pulse bg-stone-200`} />
      <div className="space-y-1 px-1.5 py-1.5">
        <div className="h-3 animate-pulse rounded bg-stone-200" />
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}
