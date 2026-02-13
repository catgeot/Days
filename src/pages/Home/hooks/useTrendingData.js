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
          .limit(10);

        if (error) throw error;

        // 데이터가 없으면 Fallback 유지
        if (!data || data.length < 3) {
            console.log("📊 [Ticker] Not enough data in DB. Using Fallback.");
            return;
        }

        // 데이터 병합 로직
        const liveList = data.map((row, index) => {
          // 🚨 [Fix] DB의 'place_id' 컬럼에 있는 지명(Text)을 가져옴
          const dbPlaceName = row.place_id; 
          
          // 로컬 데이터(TRAVEL_SPOTS)에서 해당 이름으로 상세 정보 찾기
          const spot = TRAVEL_SPOTS.find(s => s.name === dbPlaceName);
          
          // 매칭되지 않는 데이터(유령)는 제외
          if (!spot) return null;

          return {
            ...spot,
            rank: index + 1, // 1~10위 순위 부여
            score: row.total_score, // 🚨 [Fix] total_score 사용
            // 시각적 요소 (Mock Data)
            temp: 15 + Math.floor(Math.random() * 15), 
            weather: ['sun', 'cloud', 'wind'][index % 3], 
            change: index < 3 ? 'up' : 'same'
          };
        }).filter(Boolean); // null 제거

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