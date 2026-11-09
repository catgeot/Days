import React from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';
import {
  EXPLORE_MONTHLY_PICK_BOARD_CLASS,
  EXPLORE_MONTHLY_PICK_COLUMN_CLASS,
  groupExploreMonthlyPickColumns,
} from './exploreMonthlyGridLayout.js';

const ExploreMonthlyPicksLayoutB = ({ cards, onSelectSpot }) => {
  const columns = groupExploreMonthlyPickColumns(cards);
  return (
    <div data-testid="explore-v2-monthly-layout-b" className={EXPLORE_MONTHLY_PICK_BOARD_CLASS}>
      {columns.map((column, index) => (
        <div key={EXPLORE_MONTHLY_PICK_COLUMN_CLASS[index]} className={EXPLORE_MONTHLY_PICK_COLUMN_CLASS[index]}>
          {column.map(({ spot, entry, imageUrl }) => (
            <ExploreMonthlyPickItem
              key={spot.id ?? entry.slug ?? spot.slug}
              spot={spot}
              entry={entry}
              imageUrl={imageUrl}
              onSelect={onSelectSpot}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ExploreMonthlyPicksLayoutB;
