import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useClickWithDragPrevention from '../../../../hooks/useClickWithDragPrevention';
import {
  getLocalizedCountryName,
  getLocalizedPlaceName,
} from '../../../../components/PlaceCard/common/locationDisplay';
import { isPlaceholderCountry } from '../../../../utils/travelSpotResolve';
import { festivalHubPhotoLayout } from '../../../Korea/festivalHubGridLayout.js';
import {
  EXPLORE_MONTHLY_PICK_HERO_INTRINSIC_SIZE,
  EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION,
} from '../../data/exploreMonthlyPickHeroUrls.js';
import ExploreMonthlyPickMedia from './ExploreMonthlyPickMedia';

const SourceLinks = ({ sources, compact = false }) => (
  <div className={`flex flex-wrap gap-x-2 gap-y-1 px-0.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
    {sources.map((source) => (
      <a
        key={source.url}
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="explore-v2-monthly-source-link"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={`font-medium text-blue-300 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-200 ${
          compact ? 'text-[10px] leading-snug' : 'text-[11px]'
        }`}
      >
        {source.label}
      </a>
    ))}
  </div>
);

const ExploreMonthlyPickItem = ({
  spot,
  entry,
  imageUrl,
  onSelect,
  onImageError,
  onPhotoNaturalSize,
  variant = 'tile',
  sourcesBelow = true,
  className = '',
  mediaClassName = '',
  layoutColumnSlotIndex = 0,
}) => {
  const { t, i18n } = useTranslation();
  const displayName = getLocalizedPlaceName(spot, 'ko') || String(spot?.name || '').trim();
  const photoAlt = t('home.explore.monthlyPickPhotoAlt', {
    name: getLocalizedPlaceName(spot, i18n.language) || displayName,
  });
  const rawCountry = getLocalizedCountryName(spot, 'ko') || String(spot?.country || '').trim();
  const countryLabel = isPlaceholderCountry(rawCountry) ? '' : rawCountry;
  const slug = String(spot?.slug || entry?.slug || '').toLowerCase();
  const [naturalSize, setNaturalSize] = useState(null);
  const fallbackSize = EXPLORE_MONTHLY_PICK_HERO_INTRINSIC_SIZE[slug] || {
    width: 3,
    height: 4,
  };
  const sizeForLayout = naturalSize || fallbackSize;

  const handlePhotoNaturalSize = useCallback(
    (w, h) => {
      setNaturalSize((prev) => {
        if (prev && prev.width === w && prev.height === h) return prev;
        return { width: w, height: h };
      });
      onPhotoNaturalSize?.(slug, w, h);
    },
    [onPhotoNaturalSize, slug],
  );

  const { handleStart, handleMove, handleEnd, handleCancel } = useClickWithDragPrevention(onSelect, {
    threshold: 5,
    timeThreshold: 500,
    minTime: 0,
  });

  const isHero = variant === 'hero';
  const isWide = variant === 'wide';
  const isTile = !isHero && !isWide;
  const titleClass = isHero
    ? 'text-lg font-bold leading-tight sm:text-xl'
    : isWide
      ? 'text-base font-bold leading-snug sm:text-lg'
      : 'text-sm font-bold leading-snug sm:text-base';
  const reasonClass = isHero
    ? 'mt-1 text-xs leading-relaxed text-gray-200 sm:text-sm'
    : isWide
      ? 'mt-1 text-xs leading-relaxed text-gray-200 sm:text-[13px]'
      : 'mt-1 text-[11px] leading-snug text-gray-200 sm:text-xs';
  const photoLayout = festivalHubPhotoLayout(sizeForLayout.width, sizeForLayout.height, {
    inColumn: Boolean(isTile),
    slotIndex: layoutColumnSlotIndex,
  });
  const photoAspect = photoLayout.aspectRatio || '3 / 4';
  const objectPosition = EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION[slug] || '50% 50%';
  const frameMaxHeight = isHero
    ? 'min(32rem, 55vh)'
    : isWide
      ? 'min(26rem, 45vh)'
      : 'min(22rem, 40vh)';
  const textPanelClass = isHero
    ? 'bg-black/75 px-3.5 py-3 sm:px-4 sm:py-3.5'
    : isWide
      ? 'bg-black/75 px-3 py-2.5 sm:px-3.5 sm:py-3'
      : 'bg-black/75 px-2.5 py-2 sm:px-3 sm:py-2.5';

  if (!imageUrl) return null;

  return (
    <div
      className={`flex min-w-0 flex-col ${className}`}
      data-testid={`explore-v2-monthly-item-${slug}`}
    >
      <article
        data-testid={`explore-v2-monthly-card-${slug}`}
        onPointerDown={handleStart}
        onPointerMove={handleMove}
        onPointerUp={(e) => handleEnd(e, spot)}
        onPointerLeave={handleCancel}
        onPointerCancel={handleCancel}
        className={`group flex flex-1 cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-black/40 text-left transition hover:border-white/25 ${mediaClassName}`}
      >
        <div
          data-testid={`explore-v2-monthly-photo-${slug}`}
          className="relative w-full shrink-0 overflow-hidden bg-black/30"
          style={{
            aspectRatio: photoAspect,
            maxHeight: frameMaxHeight,
          }}
        >
          <ExploreMonthlyPickMedia
            imageUrl={imageUrl}
            alt={photoAlt}
            objectPosition={objectPosition}
            onError={() => onImageError?.(slug)}
            onNaturalSize={handlePhotoNaturalSize}
            className=""
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
        <div
          data-testid="explore-v2-monthly-text-panel"
          className={`flex min-w-0 flex-1 flex-col justify-between border-t border-white/[0.08] ${textPanelClass}`}
        >
          <div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <h3 className={`break-keep text-white ${titleClass}`}>
                {displayName}
              </h3>
              {countryLabel ? (
                <span
                  className={`font-medium text-gray-300 ${
                    isTile ? 'text-[10px] sm:text-[11px]' : 'text-xs'
                  }`}
                >
                  {countryLabel}
                </span>
              ) : null}
            </div>
            <p className={`break-keep ${reasonClass}`}>
              {entry.reason}
            </p>
          </div>
          {!sourcesBelow ? <SourceLinks sources={entry.sources} compact={isTile} /> : null}
        </div>
      </article>
      {sourcesBelow ? <SourceLinks sources={entry.sources} compact={isTile} /> : null}
    </div>
  );
};

export default ExploreMonthlyPickItem;
