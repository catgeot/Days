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
import { resolveExploreMonthlyPickGridSlot } from './exploreMonthlyGridLayout.js';
import ExploreMonthlyPickMedia from './ExploreMonthlyPickMedia';

const ExploreMonthlyPickItem = ({
  spot,
  entry,
  imageUrl,
  onSelect,
  onImageError,
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
  const { variant, photoClass } = resolveExploreMonthlyPickGridSlot(slug);
  const summary = String(entry?.reason || '').trim();
  const credit = EXPLORE_MONTHLY_PICK_PHOTO_CREDIT[slug];
  const creditTitle = isEnUi ? credit?.en : credit?.ko;

  const { handleStart, handleMove, handleEnd, handleCancel } = useClickWithDragPrevention(onSelect, {
    threshold: 5,
    timeThreshold: 500,
    minTime: 0,
  });

  const objectPosition = EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION[slug] || '50% 50%';

  if (!imageUrl) return null;

  return (
    <div
      className={`flex w-full min-w-0 self-start ${className}`}
      data-testid={`explore-v2-monthly-item-${slug}`}
      data-variant={variant}
    >
      <article
        data-testid={`explore-v2-monthly-card-${slug}`}
        onPointerDown={handleStart}
        onPointerMove={handleMove}
        onPointerUp={(e) => handleEnd(e, spot)}
        onPointerLeave={handleCancel}
        onPointerCancel={handleCancel}
        className="flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/15 bg-black text-left transition hover:border-white/35"
      >
        <div
          data-testid={`explore-v2-monthly-photo-${slug}`}
          className={`relative w-full shrink-0 overflow-hidden bg-black ${photoClass}`}
        >
          <ExploreMonthlyPickMedia
            imageUrl={imageUrl}
            alt={photoAlt}
            title={creditTitle || undefined}
            objectPosition={objectPosition}
            onError={() => onImageError?.(slug)}
          />
          {entry.estimate ? (
            <span
              data-testid="explore-v2-monthly-estimate"
              className="absolute right-2 top-2 z-10 rounded-md border border-amber-500/40 bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100"
            >
              추정
            </span>
          ) : null}
        </div>
        <div
          data-testid="explore-v2-monthly-text-panel"
          className="flex min-w-0 flex-col border-t border-white/10 bg-black px-2.5 py-2"
        >
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <h3 className="break-keep text-sm font-bold leading-tight text-white sm:text-[15px]">
              {displayName}
            </h3>
            {countryLabel ? (
              <span className="text-[11px] font-medium text-gray-300">{countryLabel}</span>
            ) : null}
          </div>
          {summary ? (
            <p
              data-testid="explore-v2-monthly-summary"
              className="mt-1 break-keep text-[12px] leading-snug text-gray-100 sm:text-[13px]"
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
