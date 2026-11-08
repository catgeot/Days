import React from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';
import {
  EXPLORE_MONTHLY_PICK_GRID_CLASS,
  resolveExploreMonthlyPickGridSlot,
} from './exploreMonthlyGridLayout.js';

const ExploreMonthlyPicksLayoutB = ({ cards, onSelectSpot }) => (
  <div
    data-testid="explore-v2-monthly-layout-b"
    className={EXPLORE_MONTHLY_PICK_GRID_CLASS}
  >
    {cards.map(({ spot, entry, imageUrl }) => {
      const slug = String(spot?.slug || entry?.slug || '').toLowerCase();
      const { className: gridClass } = resolveExploreMonthlyPickGridSlot(slug);
      return (
        <ExploreMonthlyPickItem
          key={spot.id ?? entry.slug ?? slug}
          spot={spot}
          entry={entry}
          imageUrl={imageUrl}
          onSelect={onSelectSpot}
          className={gridClass}
        />
      );
    })}
  </div>
);

export default ExploreMonthlyPicksLayoutB;
