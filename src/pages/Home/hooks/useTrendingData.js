// src/pages/Home/hooks/useTrendingData.js
// 🚨 [Fix] 컬럼명 매핑 완료: place_id(지명) / total_score(점수)

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { TRENDING_LIST as FALLBACK_LIST } from '../data/trendingData';

export const useTrendingData = () => {
  // 초기값은 안전장치(Fallback) 데이터 사용
  const [trending, setTrending] = useState(FALLBACK_LIST);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        // 🚨 [Fix] DB 컬럼명에 맞춰 쿼리 수정
        // place_id: 여행지 이름 (예: "Osaka")
        // total_score: 랭킹 점수
        const { data, error } = await supabase
          .from('place_stats')
          .select('place_id, total_score') 
          .order('total_score', { ascending: false }) // 점수 높은 순 정렬
          .limit(30); // 🚨 [Fix] 유효하지 않은 데이터 필터링을 고려해 여유있게 가져옴

        if (error) throw error;

        // 데이터가 없으면 Fallback 유지
        if (!data || data.length === 0) {
            console.log("📊 [Ticker] Not enough data in DB. Using Fallback.");
            return;
        }

        // 🚨 [Fix] 유효한 데이터만 먼저 필터링한 후 순위(rank) 부여
        const validSpots = data
          .map(row => {
            const dbPlaceName = row.place_id; 
            const spot = TRAVEL_SPOTS.find(s => s.name === dbPlaceName);
            if (!spot) return null;
            return { ...spot, score: row.total_score };
          })
          .filter(Boolean);

        if (validSpots.length < 3) {
            console.log("📊 [Ticker] Not enough valid data in DB. Using Fallback.");
            return;
        }

        const liveList = validSpots.slice(0, 10).map((spot, index) => ({
          ...spot,
          rank: index + 1, // 1위부터 순차적으로 부여
          // 시각적 요소 (Mock Data)
          temp: 15 + Math.floor(Math.random() * 15), 
          weather: ['sun', 'cloud', 'wind'][index % 3], 
          change: index < 3 ? 'up' : 'same'
        }));

        // 유효한 데이터가 있을 때만 상태 업데이트
        if (liveList.length > 0) {
            setTrending(liveList);
            console.log(`📊 [Ticker] Live Data Loaded: ${liveList.length} items`);
        }
      } catch (err) {
        console.warn("🚨 [Ticker] DB Fetch Error (Using Fallback):", err);
      }
    };

    // 1. 초기 로드
    fetchRanking();

    // 2. 실시간 구독 (점수 변경 시 자동 갱신)
    const subscription = supabase
      .channel('public:place_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'place_stats' }, fetchRanking)
      .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
  }, []);

  return trending;
};