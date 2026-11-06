import React, { useMemo } from 'react';
import {
  buildVisibleMonthlyPickCards,
  exploreV2MonthlyPickHeadline,
  partitionExploreMonthlyPickCardsByHero,
  resolveExploreV2MonthlyPickKey,
} from '../../lib/exploreMonthlyPicks';
import { EXPLORE_V2_MONTHLY_PICK_KEY } from '../../data/spotTraits';
import ExploreMonthlyPicksLayoutB from './ExploreMonthlyPicksLayoutB';

const ExploreMonthlyPicksSection = ({ onSelectSpot }) => {
  const monthKey = resolveExploreV2MonthlyPickKey(EXPLORE_V2_MONTHLY_PICK_KEY);
  const cards = useMemo(
    () => (monthKey ? buildVisibleMonthlyPickCards(monthKey) : []),
    [monthKey],
  );
  const { withHero, excluded: excludedNoHero } = useMemo(
    () => partitionExploreMonthlyPickCardsByHero(cards),
    [cards],
  );

  const excludedLabels = useMemo(
    () => excludedNoHero.map((row) => row.name),
    [excludedNoHero],
  );

  const headline = useMemo(() => {
    if (!monthKey) return '';
    return exploreV2MonthlyPickHeadline(monthKey);
  }, [monthKey]);

  if (!monthKey || cards.length === 0 || withHero.length === 0) return null;

  return (
    <section
      data-testid="explore-v2-monthly-section"
      data-explore-v2-excluded={excludedLabels.join(',') || undefined}
      className="mb-10 w-full animate-fade-in"
      aria-label={headline}
    >
      <h2
        data-testid="explore-v2-monthly-heading"
        className="mb-4 text-base font-bold text-white md:text-lg"
      >
        {headline}
      </h2>
      <ExploreMonthlyPicksLayoutB cards={withHero} onSelectSpot={onSelectSpot} />
    </section>
  );
};

export default ExploreMonthlyPicksSection;
