import React from 'react';
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
  onSelect,
  variant = 'scroll',
  sourcesBelow = true,
  className = '',
  mediaClassName = '',
  overlayClassName = 'from-black/85 via-black/45 to-black/20',
}) => {
  const displayName = getLocalizedPlaceName(spot, 'ko') || String(spot?.name || '').trim();
  const rawCountry = getLocalizedCountryName(spot, 'ko') || String(spot?.country || '').trim();
  const countryLabel = isPlaceholderCountry(rawCountry) ? '' : rawCountry;
  const slug = String(spot?.slug || entry?.slug || '').toLowerCase();

  const { handleStart, handleMove, handleEnd, handleCancel } = useClickWithDragPrevention(onSelect, {
    threshold: 5,
    timeThreshold: 500,
    minTime: 0,
  });

  const isHero = variant === 'hero';
  const isTile = variant === 'tile';
  const isScroll = variant === 'scroll';
  const wrapperWidth = isScroll ? 'w-[min(78vw,300px)] shrink-0 snap-center sm:w-[300px]' : '';
  const titleClass = isHero
    ? 'text-xl font-bold leading-tight sm:text-2xl'
    : isTile
      ? 'text-sm font-bold leading-snug sm:text-base'
      : 'text-lg font-bold leading-tight';
  const reasonClass = isHero
    ? 'mt-2 text-sm leading-snug text-gray-100 line-clamp-2 sm:text-[15px]'
    : isTile
      ? 'mt-1 text-[11px] leading-snug text-gray-200 line-clamp-2 sm:text-xs'
      : 'mt-2 text-sm leading-snug text-gray-100 line-clamp-2';

  return (
    <div
      className={`flex min-w-0 flex-col ${wrapperWidth} ${className}`}
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
          isHero ? 'min-h-[220px] sm:min-h-[280px]' : isTile ? 'min-h-[108px] sm:min-h-[120px]' : 'h-[min(72vw,320px)] w-full sm:h-[340px]'
        } ${mediaClassName}`}
      >
        <ExploreMonthlyPickMedia spot={spot} />
        <div className={`absolute inset-0 bg-gradient-to-t ${overlayClassName}`} />
        <div className="relative z-10 flex h-full flex-col p-3 sm:p-4">
          <div className="mb-auto flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={`break-keep text-white ${titleClass}`}>{displayName}</h3>
              {countryLabel ? (
                <p className={`mt-0.5 text-gray-300 ${isTile ? 'text-[10px] sm:text-[11px]' : 'text-xs'}`}>
                  {countryLabel}
                </p>
              ) : null}
            </div>
            {entry.estimate ? (
              <span
                data-testid="explore-v2-monthly-estimate"
                className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100"
              >
                추정
              </span>
            ) : null}
          </div>
          <p className={`break-keep ${reasonClass}`}>{entry.reason}</p>
          {!sourcesBelow ? <SourceLinks sources={entry.sources} compact={isTile} /> : null}
        </div>
      </article>
      {sourcesBelow ? <SourceLinks sources={entry.sources} compact={isTile} /> : null}
    </div>
  );
};

export default ExploreMonthlyPickItem;
