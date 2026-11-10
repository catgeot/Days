import React from 'react';
import { useTranslation } from 'react-i18next';
import useClickWithDragPrevention from '../../../../hooks/useClickWithDragPrevention';
import {
  getLocalizedCountryName,
  getLocalizedPlaceName,
} from '../../../../components/PlaceCard/common/locationDisplay';
import { isPlaceholderCountry } from '../../../../utils/travelSpotResolve';
import {
  EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION,
  EXPLORE_MONTHLY_PICK_PHOTO_CREDIT,
} from '../../data/exploreMonthlyPickHeroUrls.js';
import ExploreMonthlyPickMedia from './ExploreMonthlyPickMedia';

const ExploreMonthlyPickItem = ({
  spot,
  entry,
  imageUrl,
  onSelect,
  onImageError,
  variant = 'tile',
  pickIndex = 0,
  desktop = false,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const displayName = getLocalizedPlaceName(spot, 'ko') || String(spot?.name || '').trim();
  const photoAlt = t('home.explore.monthlyPickPhotoAlt', {
    name: getLocalizedPlaceName(spot, i18n.language) || displayName,
  });
  const rawCountry = getLocalizedCountryName(spot, 'ko') || String(spot?.country || '').trim();
  const countryLabel = isPlaceholderCountry(rawCountry) ? '' : rawCountry;
  const slug = String(spot?.slug || entry?.slug || '').toLowerCase();
  const isEnUi = String(i18n.language || '')
    .toLowerCase()
    .startsWith('en');
  const summary = String(entry?.reason || '').trim();
  const credit = EXPLORE_MONTHLY_PICK_PHOTO_CREDIT[slug];
  const creditTitle = isEnUi ? credit?.en : credit?.ko;

  const { handleStart, handleMove, handleEnd, handleCancel } = useClickWithDragPrevention(onSelect, {
    threshold: 5,
    timeThreshold: 500,
    minTime: 0,
  });

  const objectPosition = EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION[slug] || '50% 50%';

  const isHero = !desktop && variant === 'hero';
  const isWide = variant === 'wide';
  const isTall = desktop && variant === 'tall';
  const isMid = desktop && variant === 'mid';
  const isTile = !isHero && !isWide && !isTall && !isMid;

  const titleClass = desktop
    ? 'text-base font-bold leading-snug sm:text-lg'
    : isHero
      ? 'text-lg font-bold leading-tight sm:text-xl'
      : isWide
        ? 'text-base font-bold leading-snug sm:text-lg'
        : 'text-sm font-bold leading-snug sm:text-base';

  const reasonClass = desktop
    ? 'mt-1 text-xs leading-snug text-gray-200 sm:text-[13px]'
    : isHero
      ? 'mt-1 text-xs leading-relaxed text-gray-200 sm:text-sm'
      : isWide
        ? 'mt-1 text-xs leading-relaxed text-gray-200 sm:text-[13px]'
        : 'mt-1 text-[11px] leading-snug text-gray-200 sm:text-xs';

  const clampClass = desktop ? 'line-clamp-2' : '';

  const photoFrameClass = desktop
    ? isMid
      ? 'h-[9.5rem] sm:h-[10.5rem]'
      : isTall
        ? 'min-h-[16rem] flex-1 sm:min-h-[18rem]'
        : 'min-h-[12rem] flex-1 sm:min-h-[13.5rem]'
    : isHero
      ? 'h-[208px] sm:h-[280px]'
      : isWide
        ? 'h-[164px] sm:h-[224px]'
        : 'h-[132px] sm:h-[192px]';

  const textPanelClass = desktop
    ? isWide
      ? 'px-3 py-2.5 sm:px-3.5 sm:py-3'
      : 'px-2.5 py-2 sm:px-3 sm:py-2.5'
    : isHero
      ? 'px-3.5 py-3 sm:px-4 sm:py-3.5'
      : isWide
        ? 'px-3 py-2.5 sm:px-3.5 sm:py-3'
        : 'px-2.5 py-2 sm:px-3 sm:py-2.5';

  const articleRowClass = desktop ? 'h-full min-h-0' : '';

  const photoWrapClass = desktop && !isMid ? 'flex min-h-0 flex-1 flex-col' : '';

  if (!imageUrl) return null;

  return (
    <div
      className={`flex min-w-0 flex-col ${desktop ? 'h-full' : ''} ${className}`}
      data-testid={`explore-v2-monthly-item-${slug}`}
      data-pick-index={pickIndex}
      data-variant={variant}
      data-desktop={desktop ? 'true' : undefined}
    >
      <article
        data-testid={`explore-v2-monthly-card-${slug}`}
        onPointerDown={handleStart}
        onPointerMove={handleMove}
        onPointerUp={(e) => handleEnd(e, spot)}
        onPointerLeave={handleCancel}
        onPointerCancel={handleCancel}
        className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-black/40 text-left transition hover:border-white/25 ${articleRowClass}`}
      >
        <div className={photoWrapClass || undefined}>
          <div
            data-testid={`explore-v2-monthly-photo-${slug}`}
            className={`relative w-full shrink-0 overflow-hidden bg-black/30 ${photoFrameClass}`}
          >
            <ExploreMonthlyPickMedia
              imageUrl={imageUrl}
              alt={photoAlt}
              title={creditTitle || undefined}
              objectPosition={objectPosition}
              onError={() => onImageError?.(slug)}
              className="transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {entry.estimate ? (
              <span
                data-testid="explore-v2-monthly-estimate"
                className="absolute right-2.5 top-2.5 z-10 shrink-0 rounded-md border border-amber-500/40 bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100 backdrop-blur-[2px]"
              >
                추정
              </span>
            ) : null}
          </div>
        </div>
        <div
          data-testid="explore-v2-monthly-text-panel"
          className={`flex min-w-0 shrink-0 flex-col border-t border-white/[0.08] bg-black/75 ${textPanelClass}`}
        >
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <h3 className={`break-keep text-white ${titleClass} ${clampClass}`}>{displayName}</h3>
            {countryLabel ? (
              <span
                className={`font-medium text-gray-300 ${
                  isTile && !desktop ? 'text-[10px] sm:text-[11px]' : 'text-xs'
                } ${clampClass}`}
              >
                {countryLabel}
              </span>
            ) : null}
          </div>
          {summary ? (
            <p
              data-testid="explore-v2-monthly-summary"
              className={`break-keep ${reasonClass} ${clampClass}`}
            >
              {summary}
            </p>
          ) : null}
        </div>
      </article>
    </div>
  );
};

export default ExploreMonthlyPickItem;
