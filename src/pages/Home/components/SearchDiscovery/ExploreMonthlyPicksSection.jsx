import React, { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildVisibleMonthlyPickCards,
  exploreV2MonthlyPickHeadline,
  monthlyPickDisplayName,
  partitionExploreMonthlyPickCardsByHero,
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
  const { withHero, excluded: excludedNoHero } = useMemo(
    () => partitionExploreMonthlyPickCardsByHero(cards),
    [cards],
  );
  const [brokenSlugs, setBrokenSlugs] = useState(() => new Set());

  const handleImageError = useCallback((slug) => {
    const key = String(slug || '').toLowerCase();
    if (!key) return;
    setBrokenSlugs((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const visibleCards = useMemo(
    () =>
      withHero.filter(
        (card) => !brokenSlugs.has(String(card.entry.slug || '').toLowerCase()),
      ),
    [withHero, brokenSlugs],
  );

  const excludedLabels = useMemo(() => {
    const names = excludedNoHero.map((row) => row.name);
    for (const card of withHero) {
      const slug = String(card.entry.slug || '').toLowerCase();
      if (brokenSlugs.has(slug)) {
        names.push(monthlyPickDisplayName(card.spot, slug));
      }
    }
    return names;
  }, [brokenSlugs, excludedNoHero, withHero]);

  const headline = useMemo(() => {
    if (!monthKey) return '';
    return exploreV2MonthlyPickHeadline(monthKey, visibleCards.length);
  }, [monthKey, visibleCards.length]);

  if (!monthKey || cards.length === 0 || visibleCards.length === 0) return null;

  return (
    <section
      data-testid="explore-v2-monthly-section"
      data-explore-v2-layout={layout}
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
      {layout === 'b' ? (
        <ExploreMonthlyPicksLayoutB
          cards={visibleCards}
          onSelectSpot={onSelectSpot}
          onImageError={handleImageError}
        />
      ) : (
        <ExploreMonthlyPicksLayoutA
          cards={visibleCards}
          onSelectSpot={onSelectSpot}
          onImageError={handleImageError}
        />
      )}
    </section>
  );
};

export default ExploreMonthlyPicksSection;
