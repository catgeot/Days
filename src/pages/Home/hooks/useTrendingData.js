// src/pages/Home/hooks/useTrendingData.js
// place_id(지명) / total_score(점수) — PC 티커

import { useState, useEffect } from 'react';
import { TRENDING_LIST as FALLBACK_LIST } from '../data/trendingData';
import { fetchTrendingRankingCached } from '../lib/fetchTrendingRanking';

/**
 * @param {{ enabled?: boolean }} [options]
 */
export const useTrendingData = ({ enabled = true } = {}) => {
  const [trending, setTrending] = useState(FALLBACK_LIST);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const liveList = await fetchTrendingRankingCached();
        if (cancelled) return;
        if (!liveList?.length) {
          console.log('📊 [Ticker] Not enough data in DB. Using Fallback.');
          setTrending(FALLBACK_LIST);
          return;
        }
        console.log(`📊 [Ticker] Live Data Loaded: ${liveList.length} items`);
        setTrending(liveList);
      } catch (err) {
        console.warn('🚨 [Ticker] DB Fetch Error (Using Fallback):', err);
        if (!cancelled) setTrending(FALLBACK_LIST);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return trending;
};
