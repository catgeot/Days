import React from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';

/** 6장: hero → 2×2 타일 → 제주 전폭 → 2열 (390·1280 공통, 그리드 구멍 없음) */
function resolveLayoutBGridClass(index, slug) {
  if (index === 0) return 'col-span-12';
  if (index === 1 || index === 2 || index === 4 || index === 5) {
    return 'col-span-6';
  }
  if (index === 3 || slug === 'jeju') {
    return 'col-span-12';
  }
  return 'col-span-6';
}

const ExploreMonthlyPicksLayoutB = ({ cards, onSelectSpot, onImageError }) => (
  <div
    data-testid="explore-v2-monthly-layout-b"
    className="grid grid-cols-12 auto-rows-min gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5"
  >
    {cards.map(({ spot, entry, imageUrl }, index) => {
      const slug = String(spot?.slug || entry?.slug || '').toLowerCase();
      const variant = index === 0 ? 'hero' : index === 3 || slug === 'jeju' ? 'wide' : 'tile';
      const gridClass = resolveLayoutBGridClass(index, slug);
      return (
        <ExploreMonthlyPickItem
          key={spot.id ?? entry.slug}
          spot={spot}
          entry={entry}
          imageUrl={imageUrl}
          onSelect={onSelectSpot}
          onImageError={onImageError}
          variant={variant}
          sourcesBelow
          className={gridClass}
        />
      );
    })}
  </div>
);

export default ExploreMonthlyPicksLayoutB;
