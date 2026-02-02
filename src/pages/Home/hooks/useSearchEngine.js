// src/pages/Home/hooks/useSearchEngine.js
// 🚨 [Fix/New] keywordData.js의 동의어/DB와 travelSpots.js를 하이브리드로 연결
// 🚨 [Fix/New] '다낭' 입력 시 -> '베트남'을 역추적하여 관련 여행지까지 찾는 Reverse Lookup 구현

import { useState, useCallback } from 'react';
import { TRAVEL_SPOTS } from '../data/travelSpots'; 
import { KEYWORD_SYNONYMS, KEYWORD_DB } from '../data/keywordData';

export const useSearchEngine = () => {
  const [relatedTags, setRelatedTags] = useState([]);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const processSearchKeywords = useCallback(async (query) => {
    // 1. 입력값 방어 로직
    if (!query || typeof query !== 'string' || query.trim() === '') {
      setRelatedTags([]);
      return;
    }

    setIsTagLoading(true);

    // 2. 기본 전처리 (공백제거, 소문자)
    let cleanQuery = query.replace("📍", "").trim().toLowerCase();
    
    // 3. [Logic A] 동의어 사전 체크 (Synonym Check)
    // 예: 'vietnam' -> '베트남'
    if (KEYWORD_SYNONYMS[cleanQuery]) {
      cleanQuery = KEYWORD_SYNONYMS[cleanQuery];
    }

    // 결과를 담을 Set (중복 제거)
    const resultTags = new Set();
    // 검색에 사용할 확장된 키워드 목록 (원본 검색어 + 역추적된 국가명 등)
    const searchScope = new Set([cleanQuery]);

    // 4. [Logic B] Reverse Lookup (도시명 -> 국가명 추론)
    // '다낭'을 쳤는데 travelSpots에는 'Danang'만 있고 키워드에 '다낭'이 없을 때를 대비
    Object.entries(KEYWORD_DB).forEach(([country, cities]) => {
      // 검색어가 도시 목록에 포함되어 있다면? (예: 다낭)
      if (cities.some(city => city === cleanQuery)) {
        searchScope.add(country); // '베트남'도 검색 범위에 추가
        resultTags.add(country);  // 추천 태그에도 추가 (상위 개념 제안)
      }
      // 검색어가 국가명이라면? (예: 베트남)
      if (country === cleanQuery) {
        // 해당 국가의 모든 도시를 추천 태그에 추가 ('베트남' 검색 -> '다낭', '나트랑' 추천)
        cities.forEach(city => resultTags.add(city));
      }
    });

    // 5. [Logic C] TRAVEL_SPOTS 필터링 (Matching)
    const matchedSpots = TRAVEL_SPOTS.filter(spot => {
      // 우리가 확보한 검색 범위(원어, 변환어, 국가명 등) 중 하나라도 맞으면 통과
      return Array.from(searchScope).some(keyword => {
        // A. 한국어 키워드 매칭 (travelSpots의 keywords 배열 확인)
        const hasKeyword = spot.keywords?.some(k => k.includes(keyword));
        
        // B. 영문 이름/국가 매칭 (입력값이 영어일 경우 대비)
        // cleanQuery가 'danang'이면 spot.name 'Danang'과 매칭
        const hasEngName = spot.name.toLowerCase().includes(keyword);
        const hasEngCountry = spot.country.toLowerCase().includes(keyword);
        
        return hasKeyword || hasEngName || hasEngCountry;
      });
    });

    // 6. 결과 병합
    // 찾은 Spot들의 이름도 태그로 추가 (예: 'Danang')
    matchedSpots.forEach(spot => resultTags.add(spot.name));

    // 7. UI 업데이트 (비동기 시뮬레이션)
    setTimeout(() => {
      setRelatedTags(Array.from(resultTags));
      setIsTagLoading(false);
    }, 100); 

  }, []);

  return { relatedTags, isTagLoading, processSearchKeywords };
};