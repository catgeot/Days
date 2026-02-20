// src/pages/Home/hooks/useSearchEngine.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] 지명 불일치 및 크래시를 유발하는 초성 검색 기능 완전 폐기 (가벼움 유지)
// 2. [Fact Check] 핀(Icon) 누락 버그 해결: 지구본에 물리적 좌표(Pin)가 존재하는 실제 장소(masterValidNames)만 연관 검색어로 노출되도록 강력한 거름망 적용.

import { useState, useCallback } from 'react';
import { TRAVEL_SPOTS } from '../data/travelSpots'; 
import { citiesData } from '../data/citiesData'; 
import { KEYWORD_SYNONYMS, KEYWORD_DB } from '../data/keywordData';

// ⚙️ [초경량 엔진] 1. 공백 제거기 (Zero-Space Rule)
const removeSpaces = (str) => (str || '').replace(/\s+/g, '').toLowerCase();

export const useSearchEngine = () => {
  const [relatedTags, setRelatedTags] = useState([]);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const processSearchKeywords = useCallback(async (query) => {
    // 🛡️ [Safe Path] 비관적 방어 로직
    if (!query || typeof query !== 'string' || query.trim() === '') {
      setRelatedTags([]);
      return;
    }

    setIsTagLoading(true);

    const cleanQuery = query.replace("📍", "").trim().toLowerCase();
    const baseKeyword = KEYWORD_SYNONYMS[cleanQuery] || cleanQuery;
    const normBase = removeSpaces(baseKeyword);

    // 🚨 [Fix] 지구본에 핀을 꽂을 수 있는 "물리적 장소"의 정확한 이름들만 모은 마스터 풀
    const masterValidNames = new Set([
      ...TRAVEL_SPOTS.map(s => s.name),
      ...(citiesData || []).map(c => c.name)
    ]);

    const tempSet = new Set();

    // 🧠 [Logic 1] 계층 족보 검색 (부모, 형제 찾기)
    Object.entries(KEYWORD_DB).forEach(([parent, children]) => {
      const normParent = removeSpaces(parent);
      const normChildren = children.map(removeSpaces);

      if (normParent.includes(normBase)) {
        tempSet.add(parent); // 나중에 거름망에서 걸러짐
        children.forEach(c => tempSet.add(c)); // 실제 도시들은 통과됨
      }

      if (normChildren.some(c => c.includes(normBase))) {
        tempSet.add(parent);
        children.forEach(c => tempSet.add(c));
      }
    });

    // 🧠 [Logic 2] 테마(키워드) 및 카테고리 교차 검색
    const targetSpot = TRAVEL_SPOTS.find(s => 
      removeSpaces(s.name) === normBase || removeSpaces(s.name_en) === normBase
    );

    TRAVEL_SPOTS.forEach(spot => {
      if (Array.isArray(spot.keywords)) {
        const isKeywordMatch = spot.keywords.some(k => removeSpaces(k).includes(normBase));
        if (isKeywordMatch) tempSet.add(spot.name);

        if (targetSpot && targetSpot.id !== spot.id) {
          const hasCommonTheme = spot.keywords.some(k => targetSpot.keywords?.includes(k));
          if (hasCommonTheme) tempSet.add(spot.name);
        }
      }
    });

    // 🧠 [Logic 3] 이름 직접 매칭 (공백 무시)
    masterValidNames.forEach(name => {
      if (removeSpaces(name).includes(normBase)) {
        tempSet.add(name);
      }
    });

    setTimeout(() => {
      // 🚨 [Fix] 거름망 가동: tempSet에 모인 키워드 중, "실제 지구본에 존재하는(masterValidNames)" 장소만 필터링!
      // 이제 "베트남", "휴양지" 같은 핀 없는 텍스트는 UI에 노출되지 않아 핀 누락 버그가 원천 차단됩니다.
      const validTags = Array.from(tempSet).filter(tag => masterValidNames.has(tag));
      
      // 개수 제한 (10개로 세팅 - 필요시 수정)
      const finalTags = validTags.slice(0, 7);
      
      setRelatedTags(finalTags);
      setIsTagLoading(false);
    }, 50); 

  }, []);

  return { relatedTags, isTagLoading, processSearchKeywords };
};