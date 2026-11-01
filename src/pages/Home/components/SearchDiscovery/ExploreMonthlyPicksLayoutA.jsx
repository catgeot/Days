import React from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';

const ExploreMonthlyPicksLayoutA = ({ cards, onSelectSpot, onImageError }) => (
  <div
    data-testid="explore-v2-monthly-layout-a"
    className="-mx-1 flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-1 snap-x snap-mandatory no-scrollbar"
  >
    {cards.map(({ spot, entry, imageUrl }) => (
      <ExploreMonthlyPickItem
        key={spot.id ?? entry.slug}
        spot={spot}
        entry={entry}
        imageUrl={imageUrl}
        onSelect={onSelectSpot}
        onImageError={onImageError}
        variant="scroll"
        sourcesBelow
      />
    ))}
  </div>
);

export default ExploreMonthlyPicksLayoutA;
