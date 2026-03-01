// src/components/PlaceCard/hooks/useWikiData.js
// 🚨 [Fix] 수정 이유: 
// 1. [Subtraction] .single() 대신 .maybeSingle()을 사용하여 데이터가 없을 때 발생하는 406 네트워크 에러를 원천 차단 (로직 단순화)

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';

export const useWikiData = (placeId) => {
  const [wikiData, setWikiData] = useState(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);

  useEffect(() => {
    if (!placeId) return;

    const fetchWikiData = async () => {
      setIsWikiLoading(true);
      try {
        const { data, error } = await supabase
          .from('place_wiki')
          .select('*')
          .eq('place_id', String(placeId))
          .maybeSingle(); // 🚨 [Fix] 데이터가 없으면 에러 없이 null을 반환합니다.

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
  }, [placeId]);

  return { wikiData, isWikiLoading };
};