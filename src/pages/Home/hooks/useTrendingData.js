// src/pages/Home/hooks/useTrendingData.js
// place_id(지명) / total_score(점수) — 날씨는 Open-Meteo 실시간

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { TRENDING_LIST as FALLBACK_LIST } from '../data/trendingData';
import { buildSpotLookup, resolveTravelSpotFromPlaceId } from '../../../utils/travelSpotResolve';
import { enrichTickerSpotsWithWeather } from '../lib/tickerWeather';

const spotLookup = buildSpotLookup(TRAVEL_SPOTS);

function assignRankChange(spots) {
  return spots.map((spot, index) => ({
    ...spot,
    change: index < 3 ? 'up' : 'same',
  }));
}

export const useTrendingData = () => {
  const [trending, setTrending] = useState(FALLBACK_LIST);

  useEffect(() => {
    let cancelled = false;

    const publish = async (spots) => {
      const withWeather = await enrichTickerSpotsWithWeather(spots);
      if (!cancelled) setTrending(withWeather);
    };

    const fetchRanking = async () => {
      try {
        const { data, error } = await supabase
          .from('place_stats')
          .select('place_id, total_score')
          .order('total_score', { ascending: false })
          .limit(30);

        if (error) throw error;

        if (!data || data.length === 0) {
          console.log('📊 [Ticker] Not enough data in DB. Using Fallback.');
          await publish(FALLBACK_LIST);
          return;
        }

        const validSpots = data
          .map((row) => {
            const resolved = resolveTravelSpotFromPlaceId(spotLookup, TRAVEL_SPOTS, row.place_id);
            if (!resolved?.spot) return null;
            return { ...resolved.spot, score: row.total_score };
          })
          .filter(Boolean);

        if (validSpots.length < 3) {
          console.log('📊 [Ticker] Not enough valid data in DB. Using Fallback.');
          await publish(FALLBACK_LIST);
          return;
        }

        const liveList = assignRankChange(
          validSpots.slice(0, 10).map((spot, index) => ({
            ...spot,
            rank: index + 1,
          })),
        );

        console.log(`📊 [Ticker] Live Data Loaded: ${liveList.length} items`);
        await publish(liveList);
      } catch (err) {
        console.warn('🚨 [Ticker] DB Fetch Error (Using Fallback):', err);
        await publish(FALLBACK_LIST);
      }
    };

    fetchRanking();

    const subscription = supabase
      .channel('public:place_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'place_stats' }, fetchRanking)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, []);

  return trending;
};
