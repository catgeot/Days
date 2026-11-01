import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildVisibleMonthlyPickCards,
  exploreV2MonthlyPickHeadline,
  readExploreV2LayoutParam,
  resolveExploreV2MonthlyPickKey,
} from '../../lib/exploreMonthlyPicks';
import { EXPLORE_V2_MONTHLY_PICK_KEY } from '../../data/spotTraits';
import ExploreMonthlyPicksLayoutA from './ExploreMonthlyPicksLayoutA';
import ExploreMonthlyPicksLayoutB from './ExploreMonthlyPicksLayoutB';

const ExploreMonthlyPicksSection = ({ onSelectSpot }) => {
  const location = useLocation();
  const layout = useMemo(
    () => readExploreV2LayoutParam(location.search),
    [location.search],
  );
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
      data-explore-v2-layout={layout}
      className="mb-10 w-full animate-fade-in"
      aria-label={headline}
    >
      <h2
        data-testid="explore-v2-monthly-heading"
        className="mb-4 text-base font-bold text-white md:text-lg"
      >
        {headline}
      </h2>
      {layout === 'b' ? (
        <ExploreMonthlyPicksLayoutB cards={cards} onSelectSpot={onSelectSpot} />
      ) : (
        <ExploreMonthlyPicksLayoutA cards={cards} onSelectSpot={onSelectSpot} />
      )}
    </section>
  );
};

export default ExploreMonthlyPicksSection;
