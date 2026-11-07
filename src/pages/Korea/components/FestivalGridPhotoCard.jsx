import React, { useEffect, useState } from 'react';
import { Eye, Star } from 'lucide-react';
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
import {
  festivalHubCardGridSideCaption,
  festivalHubCardGridSpanClass,
  festivalHubCardGridThumbAspectStyle,
  festivalHubCardGridTier,
} from '../festivalHubGridLayout.js';

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
 *   viewed?: boolean,
 *   onToggleFavorite?: (item: Record<string, unknown>) => void,
 *   distanceKm?: number,
 *   areaCode?: string,
 *   cityName?: string,
 *   priorityThumb?: boolean,
 * }} props
 */
export default function FestivalGridPhotoCard({
  item,
  active = false,
  onSelect,
  favorited = false,
  viewed = false,
  onToggleFavorite,
  onPhotoSize,
  initialPhotoSize = null,
  distanceKm,
  areaCode = 'all',
  cityName = 'all',
  priorityThumb = false,
}) {
  const { t } = useTranslation();
  const { isEnglish, locale } = useLocale();
  const koText = koreanApiTextProps(isEnglish);
  const [urlIndex, setUrlIndex] = useState(0);
  const [loadedPhoto, setLoadedPhoto] = useState(null);
  const [viewportMdUp, setViewportMdUp] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const q = window.matchMedia('(min-width: 768px)');
    const sync = () => setViewportMdUp(q.matches);
    sync();
    q.addEventListener?.('change', sync);
    return () => q.removeEventListener?.('change', sync);
  }, []);

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

  const currentLoaded =
    loadedPhoto && loadedPhoto.url === activeUrl ? loadedPhoto : null;
  const thumbDecoded = Boolean(currentLoaded?.decoded || initialPhotoSize);
  const photoSize = currentLoaded?.size ?? initialPhotoSize;

  const cardTier = festivalHubCardGridTier(photoSize?.width, photoSize?.height);
  const gridSpanClass = festivalHubCardGridSpanClass(cardTier);
  const sideCaption = festivalHubCardGridSideCaption(cardTier);
  const thumbAspectStyle = festivalHubCardGridThumbAspectStyle(
    cardTier,
    photoSize?.width,
    photoSize?.height,
    { sideCaption },
  );
  const thumbFrameStyle =
    sideCaption && viewportMdUp ? undefined : thumbAspectStyle;
  const photoFitClass = 'object-contain';

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

  if (!titleLines?.primary) return null;

  return (
    <article
      className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-colors ${gridSpanClass} ${
        active
          ? 'border-amber-400 ring-1 ring-amber-200'
          : 'border-stone-200 [@media(hover:hover)]:hover:border-amber-300'
      } ${sideCaption ? 'md:min-h-[10rem]' : ''}`}
      data-festival-grid-card=""
      data-festival-grid-card-tier={cardTier}
      data-festival-grid-card-viewed={viewed ? 'true' : undefined}
    >
      <button
        type="button"
        data-festival-id={String(item?.contentId || '')}
        onClick={() => onSelect(item)}
        className={`flex min-h-0 min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90 focus-visible:ring-offset-1 ${
          sideCaption ? 'flex-col md:flex-row md:items-stretch' : 'flex-col'
        }`}
      >
        <div
          className={`relative w-full min-h-0 overflow-hidden bg-gradient-to-br from-amber-100 to-stone-200 ${
            sideCaption
              ? 'aspect-[16/9] md:aspect-auto md:h-auto md:min-h-[10rem] md:flex-[1.35] md:shrink-0'
              : ''
          }`}
          style={thumbFrameStyle}
          data-festival-grid-thumb-frame=""
        >
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
                className={`absolute inset-0 z-[1] h-full w-full ${photoFitClass} ${viewed ? 'opacity-75 saturate-[.55]' : ''}`}
                pendingShimmer={!thumbDecoded}
                fallback={
                  <span className="absolute inset-0" data-festival-grid-thumb-fallback="">
                    <FestivalListThumbFallback size="lg" />
                  </span>
                }
                onLoaded={(img) => {
                  const nextSize =
                    img?.naturalWidth > 0 && img?.naturalHeight > 0
                      ? { width: img.naturalWidth, height: img.naturalHeight }
                      : null;
                  setLoadedPhoto({
                    url: activeUrl,
                    decoded: true,
                    size: nextSize,
                  });
                  if (nextSize) {
                    onPhotoSize?.(item, nextSize);
                  }
                }}
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
          {viewed ? (
            <span
              data-festival-card-viewed-badge=""
              className="absolute bottom-2 left-2 z-[1] inline-flex items-center gap-1 rounded-full bg-stone-900/75 px-2 py-0.5 text-[10px] font-bold text-white"
            >
              <Eye size={11} aria-hidden="true" />
              {t('korea.festival.viewedBadge')}
            </span>
          ) : null}
        </div>
        <div
          className={`flex min-w-0 flex-col justify-center gap-0.5 ${
            sideCaption
              ? 'px-2 pb-2 pt-1.5 md:flex-1 md:px-3.5 md:py-3'
              : 'px-2 pb-2 pt-1.5'
          }`}
        >
          {titleLines?.secondary ? (
            <>
              <p
                className={`${
                  sideCaption ? 'text-[13px] md:text-[15px]' : 'text-[13px]'
                } font-bold leading-[1.32] line-clamp-2 break-keep ${
                  viewed ? 'text-stone-500' : 'text-stone-900'
                }`}
              >
                {titleLines.primary}
              </p>
              <p
                className={`${
                  sideCaption ? 'text-[11px] md:text-[11.5px]' : 'text-[11px]'
                } font-semibold leading-snug text-stone-600 line-clamp-1 break-keep`}
                {...koText}
              >
                {titleLines.secondary}
              </p>
            </>
          ) : (
            <p
              className={`${
                sideCaption ? 'text-[13px] md:text-[15px]' : 'text-[13px]'
              } font-bold leading-[1.32] line-clamp-2 break-keep ${
                viewed ? 'text-stone-500' : 'text-stone-900'
              }`}
              {...koText}
            >
              {titleLines?.primary}
            </p>
          )}
          {metaLine ? (
            <p
              className={`${
                sideCaption ? 'text-[11px] md:text-[11.5px]' : 'text-[11px]'
              } leading-snug text-stone-600 line-clamp-1 break-keep tabular-nums`}
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

export function FestivalGridSkeleton({ spanClass = 'col-span-6 md:col-span-4' } = {}) {
  return (
    <div
      className={`min-h-0 overflow-hidden rounded-xl border border-stone-200 bg-white ${spanClass}`}
      aria-hidden="true"
      data-festival-grid-card-skeleton=""
    >
      <div className="aspect-[5/4] animate-pulse bg-stone-200" />
      <div className="space-y-1 px-1.5 py-1.5">
        <div className="h-3 animate-pulse rounded bg-stone-200" />
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}
