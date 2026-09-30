// src/pages/Home/hooks/useTrendingData.js
// place_id(지명) / total_score(점수) — 날씨는 Open-Meteo (PC 티커)

import { useState, useEffect } from 'react';
import { TRENDING_LIST as FALLBACK_LIST } from '../data/trendingData';
import { enrichTickerSpotsWithWeather } from '../lib/tickerWeather';
import { fetchTrendingRankingFromDb } from '../lib/fetchTrendingRanking';

function assignRankChange(spots) {
  return spots.map((spot, index) => ({
    ...spot,
    change: index < 3 ? 'up' : 'same',
  }));
}

/**
 * @param {{ enabled?: boolean, withWeather?: boolean }} [options]
 */
export const useTrendingData = ({ enabled = true, withWeather = true } = {}) => {
  const [trending, setTrending] = useState(FALLBACK_LIST);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const publish = async (spots) => {
      if (withWeather) {
        const withWeatherSpots = await enrichTickerSpotsWithWeather(spots);
        if (!cancelled) setTrending(withWeatherSpots);
      } else if (!cancelled) {
        setTrending(spots);
      }
    };

    const fetchRanking = async () => {
      try {
        const liveList = await fetchTrendingRankingFromDb();
        if (!liveList?.length) {
          console.log('📊 [Ticker] Not enough data in DB. Using Fallback.');
          await publish(FALLBACK_LIST);
          return;
        }

        const withChange = assignRankChange(liveList);
        console.log(`📊 [Ticker] Live Data Loaded: ${withChange.length} items`);
        await publish(withChange);
      } catch (err) {
        console.warn('🚨 [Ticker] DB Fetch Error (Using Fallback):', err);
        await publish(FALLBACK_LIST);
      }
    };

    fetchRanking();

    return () => {
      cancelled = true;
    };
  }, [enabled, withWeather]);

  return trending;
};
