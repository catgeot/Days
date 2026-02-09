// src/pages/Home/hooks/useSearchEngine.js
// 🚨 [Fix/New] 이중 언어(한글/영어) 동시 검색 지원 로직 적용

import { useState, useCallback } from 'react';
import { TRAVEL_SPOTS } from '../data/travelSpots'; 
import { KEYWORD_SYNONYMS, KEYWORD_DB } from '../data/keywordData';

export const useSearchEngine = () => {
  const [relatedTags, setRelatedTags] = useState([]);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const processSearchKeywords = useCallback(async (query) => {
    // 1. 방어 로직
    if (!query || typeof query !== 'string' || query.trim() === '') {
      setRelatedTags([]);
      return;
    }

    setIsTagLoading(true);

    // 2. 전처리 (공백 제거, 소문자)
    let cleanQuery = query.replace("📍", "").trim().toLowerCase();
    
    // 3. [Logic A] 동의어 사전 체크 ('vietnam' -> '베트남')
    if (KEYWORD_SYNONYMS[cleanQuery]) {
      cleanQuery = KEYWORD_SYNONYMS[cleanQuery];
    }

    const resultTags = new Set();
    const searchScope = new Set([cleanQuery]);

    // 4. [Logic B] Reverse Lookup (도시 -> 국가 추론)
    Object.entries(KEYWORD_DB).forEach(([country, cities]) => {
      // 도시명 매칭 (예: '다낭' 입력 시 -> '베트남' 추가)
      if (cities.some(city => city === cleanQuery)) {
        searchScope.add(country); 
        resultTags.add(country); 
      }
      // 국가명 매칭 (예: '베트남' 입력 시 -> '다낭', '나트랑' 추가)
      if (country === cleanQuery) {
        cities.forEach(city => resultTags.add(city));
      }
    });

    // 5. [Logic C] TRAVEL_SPOTS 다중 필드 필터링 (한글/영어 동시 검사)
    const matchedSpots = TRAVEL_SPOTS.filter(spot => {
      return Array.from(searchScope).some(keyword => {
        // A. 키워드 매칭
        const hasKeyword = spot.keywords?.some(k => k.includes(keyword));
        
        // B. 이름 매칭 (한글 OR 영어)
        const hasNameKO = spot.name.includes(keyword); // "다낭"
        const hasNameEN = spot.name_en.toLowerCase().includes(keyword); // "danang"
        
        // C. 국가 매칭 (한글 OR 영어)
        const hasCountryKO = spot.country.includes(keyword); // "베트남"
        const hasCountryEN = spot.country_en.toLowerCase().includes(keyword); // "vietnam"
        
        return hasKeyword || hasNameKO || hasNameEN || hasCountryKO || hasCountryEN;
      });
    });

    // 6. 결과 병합 (UI에는 한글 이름인 spot.name을 노출)
    matchedSpots.forEach(spot => resultTags.add(spot.name));

    // 7. UI 업데이트
    setTimeout(() => {
      setRelatedTags(Array.from(resultTags));
      setIsTagLoading(false);
    }, 100); 

  }, []);

  return { relatedTags, isTagLoading, processSearchKeywords };
};