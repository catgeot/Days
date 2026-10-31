import React, { useMemo } from 'react';
import ExploreMonthlyPickCard from './ExploreMonthlyPickCard';
import {
  buildVisibleMonthlyPickCards,
  exploreV2MonthlyPickHeadline,
  resolveExploreV2MonthlyPickKey,
} from '../../lib/exploreMonthlyPicks';
import { EXPLORE_V2_MONTHLY_PICK_KEY } from '../../data/spotTraits';

const ExploreMonthlyPicksSection = ({ onSelectSpot }) => {
  const monthKey = resolveExploreV2MonthlyPickKey(EXPLORE_V2_MONTHLY_PICK_KEY);
  const cards = useMemo(
    () => (monthKey ? buildVisibleMonthlyPickCards(monthKey) : []),
    [monthKey],
  );
  const headline = useMemo(
    () => (monthKey ? exploreV2MonthlyPickHeadline(monthKey) : ''),
    [monthKey],
  );

  if (!monthKey || cards.length === 0) return null;

  return (
    <section
      data-testid="explore-v2-monthly-section"
      className="mb-10 w-full animate-fade-in"
      aria-label={headline}
    >
      <h2
        data-testid="explore-v2-monthly-heading"
        className="mb-4 text-base font-bold text-white md:text-lg"
      >
        {headline}
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:gap-5">
        {cards.map(({ spot, entry }) => (
          <ExploreMonthlyPickCard
            key={spot.id ?? entry.slug}
            spot={spot}
            entry={entry}
            onSelect={onSelectSpot}
          />
        ))}
      </div>
    </section>
  );
};

export default ExploreMonthlyPicksSection;
