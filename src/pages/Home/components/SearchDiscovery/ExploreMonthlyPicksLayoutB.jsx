import React, { useEffect, useState } from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';
import {
  EXPLORE_MONTHLY_PICK_GRID_CLASS,
  distributeExploreMonthlyPickColumns,
} from './exploreMonthlyGridLayout.js';

function useExploreMonthlyColumnCount() {
  const [count, setCount] = useState(2);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const apply = () => setCount(media.matches ? 3 : 2);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);
  return count;
}

const ExploreMonthlyPicksLayoutB = ({ cards, onSelectSpot }) => {
  const columnCount = useExploreMonthlyColumnCount();
  const columns = distributeExploreMonthlyPickColumns(cards, columnCount);

  return (
    <div
      data-testid="explore-v2-monthly-layout-b"
      data-columns={columns.length}
      className={EXPLORE_MONTHLY_PICK_GRID_CLASS}
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
    >
      {columns.map((col, colIdx) => {
        const lead = col[0];
        const leadSlug = String(lead?.spot?.slug || lead?.entry?.slug || colIdx);
        return (
          <div
            key={leadSlug}
            data-testid="explore-v2-monthly-column"
            className={`flex min-w-0 flex-col gap-3 sm:gap-4 ${colIdx % 2 === 1 ? 'pt-6' : ''}`}
          >
            {col.map(({ spot, entry, imageUrl }) => {
              const slug = String(spot?.slug || entry?.slug || '').toLowerCase();
              return (
                <ExploreMonthlyPickItem
                  key={spot.id ?? entry.slug ?? slug}
                  spot={spot}
                  entry={entry}
                  imageUrl={imageUrl}
                  onSelect={onSelectSpot}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default ExploreMonthlyPicksLayoutB;
