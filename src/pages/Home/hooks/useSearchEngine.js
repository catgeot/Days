// src/hooks/useSearchEngine.js
import { useState, useCallback } from 'react';
import { KEYWORD_DB, KEYWORD_SYNONYMS } from '../data/keywordData';

export const useSearchEngine = () => {
  const [relatedTags, setRelatedTags] = useState([]);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const processSearchKeywords = useCallback(async (query) => {
    if (!query) return;

    // 1. 전처리: 공백 제거 및 소문자화
    const cleanQuery = query.replace("📍", "").trim().toLowerCase();
    
    // 2. 타겟 키워드 탐색
    let matchedTags = null;

    // A. 국가명 직접 검색 확인 (예: "베트남")
    // 동의어(vietnam) 체크 후 DB 키와 매칭
    const countryKey = KEYWORD_SYNONYMS[cleanQuery] || Object.keys(KEYWORD_DB).find(k => cleanQuery.includes(k));
    
    if (countryKey) {
      matchedTags = KEYWORD_DB[countryKey];
    } else {
      // B. 도시명 역방향 검색 (예: "다낭" -> "베트남" 리스트 찾기)
      // 🚨 [Logic] 모든 국가를 순회하며, 입력된 검색어가 해당 국가의 도시 리스트에 포함되는지 확인
      const foundCountry = Object.keys(KEYWORD_DB).find(country => {
        const cities = KEYWORD_DB[country];
        // 입력값(cleanQuery)이 도시명(city)을 포함하거나, 도시명이 입력값을 포함하는 경우
        return cities.some(city => cleanQuery.includes(city) || city.includes(cleanQuery));
      });

      if (foundCountry) {
        matchedTags = KEYWORD_DB[foundCountry];
      }
    }

    // 3. 상태 업데이트
    // 🚨 [Rule] 결과가 있을 때만 업데이트 (오타 시 이전 추천 유지)
    if (matchedTags && matchedTags.length > 0) {
      setIsTagLoading(true);
      setRelatedTags(matchedTags);
      setIsTagLoading(false);
    } 
  }, []);

  return { relatedTags, isTagLoading, processSearchKeywords };
};