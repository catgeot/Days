// src/components/PlaceCard/hooks/useWikiData.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Subtraction] .single() 대신 .maybeSingle()을 사용하여 데이터 부재 시 406 에러 차단 유지.
// 2. 🚨 [Fix/New] Lazy Fetching (지연 호출): mediaMode를 감시하여 'WIKI' 탭이 활성화될 때만 Supabase 쿼리를 실행하도록 트래픽 누수 차단.
// 3. 🚨 [Fix/New] Clean Slate (잔상 제거): 장소가 변경되었을 때 이전 장소의 위키 데이터가 남지 않도록 즉시 상태 초기화.

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';

// 🚨 [Fix] mediaMode 파라미터 수용
export const useWikiData = (placeId, mediaMode) => {
  const [wikiData, setWikiData] = useState(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);

  // 🚨 [Fix] 의존성 배열에 mediaMode 추가
  useEffect(() => {
    if (!placeId) return;

    // 🚨 [Fix/New] Clean Slate: 새로운 장소로 이동 시 이전 데이터 즉시 삭제
    setWikiData(null);
    setIsWikiLoading(false);

    // 🚨 [Fix/New] Lazy Fetching 방어막: 백과 탭이 아닐 경우 DB 조회를 하지 않고 리턴
    if (mediaMode !== 'WIKI') {
        return;
    }

    const fetchWikiData = async () => {
      setIsWikiLoading(true);
      try {
        const { data, error } = await supabase
          .from('place_wiki')
          .select('*')
          .eq('place_id', String(placeId))
          .maybeSingle(); 

        if (error) {
            console.error('Wiki Fetch Error:', error);
        }
        
        setWikiData(data || null); 
      } catch (err) {
        console.error('Wiki Unexpected Error:', err);
        setWikiData(null);
      } finally {
        setIsWikiLoading(false);
      }
    };

    fetchWikiData();
  }, [placeId, mediaMode]);

  return { wikiData, isWikiLoading };
};