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

const SourceLinks = ({ sources }) => (
  <div className="flex min-w-0 flex-col items-start gap-1">
    {sources.map((source) => (
      <a
        key={source.url}
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="explore-v2-monthly-source-link"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="max-w-full break-words text-[12px] font-medium leading-snug text-blue-300 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-200"
      >
        {source.label}
      </a>
    ))}
  </div>
);

const PhotoCreditLine = ({ slug, isEn }) => {
  const c = EXPLORE_MONTHLY_PICK_PHOTO_CREDIT[String(slug || '').toLowerCase()];
  if (!c?.filePageUrl) return null;
  const text = isEn ? c.en : c.ko;
  const linkLabel = isEn ? 'File / policy' : '파일·정책 페이지';
  return (
    <p className="mt-1.5 max-w-full break-words text-[11px] leading-snug text-gray-400">
      {text}
      <a
        href={c.filePageUrl}
        target="_blank"
        rel="noopener noreferrer license"
        className="mt-0.5 block max-w-full break-words font-medium text-blue-400/90 underline decoration-blue-500/30 underline-offset-2 hover:text-blue-300"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {linkLabel}
      </a>
    </p>
  );
};

const ExploreMonthlyPickItem = ({
  spot,
  entry,
  imageUrl,
  onSelect,
  onImageError,
  variant = 'tile',
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

  const { handleStart, handleMove, handleEnd, handleCancel } = useClickWithDragPrevention(onSelect, {
    threshold: 5,
    timeThreshold: 500,
    minTime: 0,
  });

  const objectPosition = EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION[slug] || '50% 50%';

  if (!imageUrl) return null;

  return (
    <div
      className={`flex h-full min-w-0 ${className}`}
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
        className="flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/15 bg-black text-left transition hover:border-white/35"
      >
        <div
          data-testid={`explore-v2-monthly-photo-${slug}`}
          className="relative aspect-[3/2] w-full shrink-0 overflow-hidden bg-black"
        >
          <ExploreMonthlyPickMedia
            imageUrl={imageUrl}
            alt={photoAlt}
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
          className="flex min-w-0 flex-1 flex-col border-t border-white/10 bg-black px-3 py-2.5"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <h3 className="break-keep text-[15px] font-bold leading-tight text-white sm:text-base">
                {displayName}
              </h3>
              {countryLabel ? (
                <span className="text-xs font-medium text-gray-300">{countryLabel}</span>
              ) : null}
            </div>
            <p className="mt-1 break-keep text-[13px] leading-relaxed text-gray-200">{entry.reason}</p>
          </div>
          <div className="mt-auto min-w-0 border-t border-white/10 pt-2">
            <SourceLinks sources={entry.sources} />
            <PhotoCreditLine slug={slug} isEn={isEnUi} />
          </div>
        </div>
      </article>
    </div>
  );
};

export default ExploreMonthlyPickItem;
