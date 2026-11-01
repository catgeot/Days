import React from 'react';
import { useTranslation } from 'react-i18next';
import useClickWithDragPrevention from '../../../../hooks/useClickWithDragPrevention';
import {
  getLocalizedCountryName,
  getLocalizedPlaceName,
} from '../../../../components/PlaceCard/common/locationDisplay';
import { isPlaceholderCountry } from '../../../../utils/travelSpotResolve';
import ExploreMonthlyPickMedia from './ExploreMonthlyPickMedia';

const SourceLinks = ({ sources, compact = false }) => (
  <div className={`flex flex-wrap gap-x-2 gap-y-1 ${compact ? 'mt-1.5' : 'mt-2'}`}>
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
  variant = 'tile',
  sourcesBelow = true,
  className = '',
  mediaClassName = '',
}) => {
  const { t, i18n } = useTranslation();
  const displayName = getLocalizedPlaceName(spot, 'ko') || String(spot?.name || '').trim();
  const photoAlt = t('home.explore.monthlyPickPhotoAlt', {
    name: getLocalizedPlaceName(spot, i18n.language) || displayName,
  });
  const rawCountry = getLocalizedCountryName(spot, 'ko') || String(spot?.country || '').trim();
  const countryLabel = isPlaceholderCountry(rawCountry) ? '' : rawCountry;
  const slug = String(spot?.slug || entry?.slug || '').toLowerCase();

  const { handleStart, handleMove, handleEnd, handleCancel } = useClickWithDragPrevention(onSelect, {
    threshold: 5,
    timeThreshold: 500,
    minTime: 0,
  });

  const isHero = variant === 'hero';
  const isTile = !isHero;
  const titleClass = isHero
    ? 'text-xl font-bold leading-tight sm:text-2xl'
    : 'text-sm font-bold leading-snug sm:text-base';
  const reasonClass = isHero
    ? 'mt-2 text-sm leading-snug text-gray-100 line-clamp-2 sm:text-[15px]'
    : 'mt-1 text-[11px] leading-snug text-gray-100 line-clamp-3 sm:line-clamp-2 sm:text-xs';
  const gradientHeight = isTile ? 'h-[62%] min-h-[72px]' : 'h-[52%] min-h-[108px]';
  /** Text sits on its own panel so contrast holds without text-shadow on bright photos (4.5:1). */
  const textPanelClass = isHero
    ? 'rounded-xl bg-black/70 px-3 py-2.5'
    : 'rounded-lg bg-black/70 px-2 py-1.5';

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
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 text-left transition hover:border-white/25 ${
          isHero ? 'min-h-[220px] sm:min-h-[280px]' : 'min-h-[156px] sm:min-h-[160px]'
        } ${mediaClassName}`}
      >
        <ExploreMonthlyPickMedia
          imageUrl={imageUrl}
          alt={photoAlt}
          onError={() => onImageError?.(slug)}
        />
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 ${gradientHeight} bg-gradient-to-t from-black/95 via-black/70 to-transparent`}
        />
        {entry.estimate ? (
          <span
            data-testid="explore-v2-monthly-estimate"
            className="absolute right-3 top-3 z-20 shrink-0 rounded-md border border-amber-500/40 bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100 backdrop-blur-[2px]"
          >
            추정
          </span>
        ) : null}
        <div className={`relative z-10 flex h-full flex-col justify-end ${isHero ? 'p-3 sm:p-4' : 'p-2 sm:p-3'}`}>
          <div data-testid="explore-v2-monthly-text-panel" className={`min-w-0 self-start max-w-full ${textPanelClass}`}>
            <h3 className={`break-keep text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] ${titleClass}`}>
              {displayName}
            </h3>
            {countryLabel ? (
              <p
                className={`mt-0.5 text-gray-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${
                  isTile ? 'text-[10px] sm:text-[11px]' : 'text-xs'
                }`}
              >
                {countryLabel}
              </p>
            ) : null}
            <p className={`break-keep text-gray-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.92)] ${reasonClass}`}>
              {entry.reason}
            </p>
            {!sourcesBelow ? <SourceLinks sources={entry.sources} compact={isTile} /> : null}
          </div>
        </div>
      </article>
      {sourcesBelow ? <SourceLinks sources={entry.sources} compact={isTile} /> : null}
    </div>
  );
};

export default ExploreMonthlyPickItem;
