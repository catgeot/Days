import React from 'react';
import useClickWithDragPrevention from '../../../../hooks/useClickWithDragPrevention';
import {
  getLocalizedCountryName,
  getLocalizedPlaceName,
} from '../../../../components/PlaceCard/common/locationDisplay';
import { isPlaceholderCountry } from '../../../../utils/travelSpotResolve';

const ExploreMonthlyPickCard = ({ spot, entry, onSelect }) => {
  const displayName = getLocalizedPlaceName(spot, 'ko') || String(spot?.name || '').trim();
  const rawCountry = getLocalizedCountryName(spot, 'ko') || String(spot?.country || '').trim();
  const countryLabel = isPlaceholderCountry(rawCountry) ? '' : rawCountry;

  const { handleStart, handleMove, handleEnd, handleCancel } = useClickWithDragPrevention(onSelect, {
    threshold: 5,
    timeThreshold: 500,
    minTime: 0,
  });

  const slug = String(spot?.slug || entry?.slug || '').toLowerCase();

  return (
    <article
      data-testid={`explore-v2-monthly-card-${slug}`}
      onPointerDown={handleStart}
      onPointerMove={handleMove}
      onPointerUp={(e) => handleEnd(e, spot)}
      onPointerLeave={handleCancel}
      onPointerCancel={handleCancel}
      className="group flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05] cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white break-keep">{displayName}</h3>
          {countryLabel ? (
            <p className="mt-1 text-xs text-gray-400">{countryLabel}</p>
          ) : null}
        </div>
        {entry.estimate ? (
          <span
            data-testid="explore-v2-monthly-estimate"
            className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200"
          >
            추정
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-200 break-keep">{entry.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {entry.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="explore-v2-monthly-source-link"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-[11px] font-medium text-blue-300 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-200"
          >
            {source.label}
          </a>
        ))}
      </div>
    </article>
  );
};

export default ExploreMonthlyPickCard;
