import React, { useState } from 'react';
import { Eye, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../i18n/LocaleProvider';
import { koreanApiTextProps } from '../../i18n/koreanApiText.js';
import { FestivalListThumbFallback } from '../Korea/festivalListThumbBox.jsx';
import { FestivalPhotoFrame } from '../Korea/festivalPhotoFrame.js';
import { festivalHubPhotoLayout } from '../Korea/festivalHubGridLayout.js';
import { formatScenicSpotPlaceLabel } from '../Home/lib/scenicSpotPlaceLabel';
import { formatDistanceKm } from './nearbyScenicRank';
import { scenicSpotThumbCandidates } from './scenicSpotListThumbs.js';

function ScenicGridThumbLoadingShimmer() {
  return (
    <span
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-scenic-grid-thumb-loading=""
      aria-hidden="true"
    >
      <span className="absolute inset-[-12%] bg-gradient-to-br from-amber-50 via-stone-200/80 to-orange-100 blur-md" />
      <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/0 via-white/80 to-white/0" />
    </span>
  );
}

/**
 * 축제 홈 사진 카드와 같은 틀. 날짜 대신 지역·한 줄 소개.
 * @param {{
 *   spot: Record<string, unknown>,
 *   active?: boolean,
 *   onOpen?: (id: string) => void,
 *   favorited?: boolean,
 *   viewed?: boolean,
 *   onToggleFavorite?: (spot: Record<string, unknown>) => void,
 *   distanceKm?: number,
 *   locale?: string,
 *   priorityThumb?: boolean,
 *   inColumn?: boolean,
 *   slotIndex?: number,
 *   initialPhotoSize?: { width: number, height: number } | null,
 *   onPhotoSize?: (spot: Record<string, unknown>, size: { width: number, height: number }) => void,
 * }} props
 */
export default function ScenicGridPhotoCard({
  spot,
  active = false,
  onOpen,
  favorited = false,
  viewed = false,
  onToggleFavorite,
  distanceKm,
  locale = 'ko',
  priorityThumb = false,
  inColumn = false,
  slotIndex = 0,
  initialPhotoSize = null,
  onPhotoSize,
}) {
  const { t } = useTranslation();
  const { isEnglish } = useLocale();
  const koText = koreanApiTextProps(isEnglish);
  const [urlIndex, setUrlIndex] = useState(0);
  const [loadedPhoto, setLoadedPhoto] = useState(null);

  const name = String(spot?.name || '').trim();
  const thumbCandidates = React.useMemo(
    () => scenicSpotThumbCandidates(spot),
    [spot],
  );
  const activeUrl =
    urlIndex < thumbCandidates.length ? thumbCandidates[urlIndex] : '';
  const showStaticFallback = !activeUrl;

  const currentLoaded =
    loadedPhoto && loadedPhoto.url === activeUrl ? loadedPhoto : null;
  const thumbDecoded = Boolean(currentLoaded?.decoded || initialPhotoSize);
  const photoSize = currentLoaded?.size ?? initialPhotoSize;
  const photoLayout = festivalHubPhotoLayout(photoSize?.width, photoSize?.height, {
    inColumn,
    slotIndex,
  });
  const isWideCard = photoLayout.wide && !inColumn;
  const photoFitClass = photoLayout.enlargedLandscape
    ? 'object-cover'
    : 'object-contain';

  const place = formatScenicSpotPlaceLabel(spot, locale);
  const blurb = String(spot?.blurb || '').trim();
  const blurbLine = blurb && blurb !== name ? blurb : '';
  const distanceLabel = formatDistanceKm(distanceKm);

  if (!name) return null;

  return (
    <article
      className={`relative mb-1.5 flex w-full min-w-0 break-inside-avoid flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-colors md:mb-2 lg:mb-2.5 ${
        active
          ? 'border-amber-400 ring-1 ring-amber-200'
          : 'border-stone-200 [@media(hover:hover)]:hover:border-amber-300'
      }`}
      data-scenic-grid-card=""
      data-scenic-grid-card-wide={isWideCard ? 'true' : undefined}
      data-scenic-grid-card-viewed={viewed ? 'true' : undefined}
    >
      <button
        type="button"
        data-scenic-id={String(spot?.id || '')}
        onClick={() => onOpen?.(spot.id)}
        className="flex min-w-0 flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/90 focus-visible:ring-offset-1"
      >
        <div
          className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-amber-100 to-stone-200"
          style={photoLayout.aspectRatio ? { aspectRatio: photoLayout.aspectRatio } : undefined}
          data-scenic-grid-thumb-frame=""
        >
          {showStaticFallback ? (
            <span className="absolute inset-0" data-scenic-grid-thumb-fallback="">
              <FestivalListThumbFallback size="lg" />
            </span>
          ) : (
            <>
              {!thumbDecoded ? <ScenicGridThumbLoadingShimmer /> : null}
              <FestivalPhotoFrame
                src={activeUrl}
                alt=""
                loading={priorityThumb ? 'eager' : 'lazy'}
                fetchPriority={priorityThumb ? 'high' : undefined}
                decoding="async"
                referrerPolicy="no-referrer"
                className={`absolute inset-0 z-[1] h-full w-full ${photoFitClass}`}
                pendingShimmer={!thumbDecoded}
                fallback={
                  <span className="absolute inset-0" data-scenic-grid-thumb-fallback="">
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
                  if (nextSize) onPhotoSize?.(spot, nextSize);
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
            <span className="absolute left-2 top-2 z-[1] rounded-full bg-stone-900/75 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">
              {distanceLabel}
            </span>
          ) : null}
          {viewed ? (
            <span
              data-scenic-card-viewed-badge=""
              className="absolute bottom-2 left-2 z-[1] inline-flex items-center gap-1 rounded-full bg-stone-900/75 px-2 py-0.5 text-[10px] font-bold text-white"
            >
              <Eye size={11} aria-hidden="true" />
              {t('korea.common.viewed')}
            </span>
          ) : null}
        </div>
        <div
          className={`flex min-w-0 flex-col gap-0.5 ${
            isWideCard ? 'px-3 pb-2.5 pt-2' : 'px-2 pb-2 pt-1.5'
          }`}
        >
          <p
            className={`${
              isWideCard ? 'text-[14px]' : 'text-[13px]'
            } font-bold leading-[1.32] line-clamp-2 break-keep text-stone-900`}
            {...koText}
          >
            {name}
          </p>
          {place ? (
            <p
              className={`${
                isWideCard ? 'text-[11.5px]' : 'text-[11px]'
              } font-semibold leading-snug text-stone-600 line-clamp-1 break-keep`}
            >
              {place}
            </p>
          ) : null}
          {blurbLine ? (
            <p
              className={`${
                isWideCard ? 'text-[11.5px]' : 'text-[11px]'
              } leading-snug text-stone-600 line-clamp-1 break-keep`}
              {...koText}
            >
              {blurbLine}
            </p>
          ) : null}
        </div>
      </button>
      {onToggleFavorite ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(spot);
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
