import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedPlaceName } from '../../../components/PlaceCard/common/locationDisplay';
import { fetchTrendingRankingCached } from '../lib/fetchTrendingRanking';

export default function TrendingExploreChipsRow({ active, onSpotSelect }) {
  const { t, i18n } = useTranslation();
  const [spots, setSpots] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;

    (async () => {
      const list = await fetchTrendingRankingCached();
      if (cancelled) return;
      setSpots(list);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!active || !ready || !spots?.length) return null;

  const displayName = (spot) =>
    getLocalizedPlaceName(spot, i18n.language) || spot?.name || '';

  return (
    <div
      className="mt-3 md:hidden"
      data-testid="explore-trending-chips-row"
    >
      <div className="flex items-end justify-between gap-2 px-1 mb-2">
        <h3 className="text-[13px] font-bold text-white leading-tight">
          {t('home.explore.trendingTitle')}
        </h3>
        <span className="shrink-0 text-[10px] font-medium text-gray-400">
          {t('home.explore.trendingMetric')}
        </span>
      </div>
      <div
        className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1"
        style={{ minHeight: 36 }}
      >
        {spots.map((spot) => {
          const rank = spot.rank ?? 0;
          const topThree = rank >= 1 && rank <= 3;
          return (
            <button
              key={spot.id ?? `${spot.name}-${rank}`}
              type="button"
              onClick={() => onSpotSelect(spot)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-2.5 py-1.5 text-left transition-colors hover:border-white/35 hover:bg-white/[0.1] active:scale-[0.98] touch-manipulation"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  topThree
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-200'
                }`}
              >
                {rank}
              </span>
              <span className="max-w-[8.5rem] truncate text-[13px] font-semibold text-white">
                {displayName(spot)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
