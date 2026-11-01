import React from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';

const TILE_GRID_CLASS = [
  'col-span-12 row-span-2 min-h-[220px] sm:min-h-[260px]',
  'col-span-7 row-span-2 min-h-[132px]',
  'col-span-5 row-span-1 min-h-[88px]',
  'col-span-5 row-span-1 min-h-[88px]',
  'col-span-5 row-span-2 min-h-[132px]',
  'col-span-7 row-span-2 min-h-[132px]',
];

const ExploreMonthlyPicksLayoutB = ({ cards, onSelectSpot, onImageError }) => (
  <div
    data-testid="explore-v2-monthly-layout-b"
    className="grid grid-cols-12 auto-rows-min gap-2 sm:gap-3"
  >
    {cards.map(({ spot, entry, imageUrl }, index) => {
      const variant = index === 0 ? 'hero' : 'tile';
      const gridClass = TILE_GRID_CLASS[index] || 'col-span-6 min-h-[100px]';
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
