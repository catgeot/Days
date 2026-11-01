import React from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';

const ExploreMonthlyPicksLayoutA = ({ cards, onSelectSpot }) => (
  <div
    data-testid="explore-v2-monthly-layout-a"
    className="-mx-1 flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-1 snap-x snap-mandatory no-scrollbar"
  >
    {cards.map(({ spot, entry }) => (
      <ExploreMonthlyPickItem
        key={spot.id ?? entry.slug}
        spot={spot}
        entry={entry}
        onSelect={onSelectSpot}
        variant="scroll"
        sourcesBelow
      />
    ))}
  </div>
);

export default ExploreMonthlyPicksLayoutA;
