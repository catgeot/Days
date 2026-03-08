// src/pages/Home/hooks/useSearchEngine.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] 지명 불일치 및 크래시를 유발하는 초성 검색 기능 완전 폐기.
// 2. [Fact Check] 실제 장소(masterValidNames)만 연관 검색어로 노출.
// 3. [Fix/New] Data Lake 전면 개방: travelSpots와 citiesData를 통합.
// 4. 🚨 [Fix/New] 4:1 꼬꼬무 정밀 분할: 연관된 장소 4개와 완전히 다른 테마의 '교두보(Bridge)' 장소 1개를 추출하여 배열 생성.
// 5. 🚨 [Fix/New] isBridge 플래그: 교두보 장소에 `isBridge: true` 마킹을 달아 UI에서 색상을 반전시킬 수 있도록 프론트엔드로 전달.
// 6. [Fix/New] Pessimistic First (비관적 방어): 특정 풀(Pool)의 개수가 부족할 경우 앱 크래시를 막기 위해 상대 풀에서 부족분을 채우는 강력한 방어 로직 추가.

import { useState, useCallback } from 'react';
import { TRAVEL_SPOTS } from '../data/travelSpots'; 
import { citiesData } from '../data/citiesData'; 
import { KEYWORD_SYNONYMS, KEYWORD_DB } from '../data/keywordData'; 

const removeSpaces = (str) => (str || '').replace(/\s+/g, '').toLowerCase();

// 🚨 [New] 꼬꼬무 장소 추천 로직 (4:1 유기적 셔플 & Safe Path 적용)
export const getRelatedPlaces = (currentPlace) => {
  const allPlaces = [...TRAVEL_SPOTS, ...(citiesData || [])];

  // 🛡️ [Safe Path 1] 데이터가 없으면 랜덤 5개 반환
  if (!currentPlace) {
    return allPlaces.sort(() => 0.5 - Math.random()).slice(0, 5).map(spot => ({
      name: spot.name,
      data: spot,
      isBridge: false // 기본값
    }));
  }

  const currentTags = currentPlace.tags || currentPlace.keywords || [];
  const otherPlaces = allPlaces.filter(p => p.name !== currentPlace.name && p.id !== currentPlace.id);

  let relatedPool = []; // 교집합이 1개라도 있는 장소
  let bridgePool = [];  // 교집합이 전혀 없는 장소 (완전히 새로운 테마)

  if (currentTags.length > 0) {
    otherPlaces.forEach(place => {
      const placeTags = place.tags || place.keywords || [];
      const hasIntersection = placeTags.some(tag => currentTags.includes(tag));
      if (hasIntersection) {
        relatedPool.push(place);
      } else {
        bridgePool.push(place);
      }
    });
  } else {
    // 🛡️ 비관적 방어: 태그가 아예 없는 장소라면 모두 관련 풀로 편입
    relatedPool = otherPlaces;
  }

  // 각 풀을 무작위로 섞음 (Organic Discovery)
  relatedPool = relatedPool.sort(() => 0.5 - Math.random());
  bridgePool = bridgePool.sort(() => 0.5 - Math.random());

  let finalPlaces = [];

  // 🚨 4(연관) : 1(교두보) 추출 및 방어 로직
  if (relatedPool.length >= 4 && bridgePool.length >= 1) {
    // 가장 이상적인 상황
    finalPlaces = [
      ...relatedPool.slice(0, 4).map(p => ({ name: p.name, data: p, isBridge: false })),
      ...bridgePool.slice(0, 1).map(p => ({ name: p.name, data: p, isBridge: true }))
    ];
  } else if (relatedPool.length < 4) {
    // 연관 장소가 부족하면 남은 자리를 교두보(새로운 테마)로 채움
    const neededBridge = 5 - relatedPool.length;
    finalPlaces = [
      ...relatedPool.map(p => ({ name: p.name, data: p, isBridge: false })),
      ...bridgePool.slice(0, neededBridge).map((p, i) => ({ name: p.name, data: p, isBridge: i === 0 })) // 1개만 하이라이트 유지
    ];
  } else {
    // 교두보 장소가 없으면 전부 연관 장소로 채움
    finalPlaces = relatedPool.slice(0, 5).map(p => ({ name: p.name, data: p, isBridge: false }));
  }

  // 최종 셔플: 교두보(보라색 버튼)가 항상 끝에만 있으면 어색하므로 배열 전체를 다시 섞음
  return finalPlaces.sort(() => 0.5 - Math.random());
};

export const useSearchEngine = () => {
  const [relatedTags, setRelatedTags] = useState([]);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const processSearchKeywords = useCallback(async (query) => {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      setRelatedTags([]);
      return;
    }

    setIsTagLoading(true);

    const cleanQuery = query.replace("📍", "").trim().toLowerCase();
    const baseKeyword = KEYWORD_SYNONYMS[cleanQuery] || cleanQuery;
    const normBase = removeSpaces(baseKeyword);

    const masterValidNames = new Set([
      ...TRAVEL_SPOTS.map(s => s.name),
      ...(citiesData || []).map(c => c.name)
    ]);

    const tempSet = new Set();

    Object.entries(KEYWORD_DB).forEach(([parent, children]) => {
      const normParent = removeSpaces(parent);
      const normChildren = children.map(removeSpaces);

      if (normParent.includes(normBase)) {
        tempSet.add(parent); 
        children.forEach(c => tempSet.add(c)); 
      }

      if (normChildren.some(c => c.includes(normBase))) {
        tempSet.add(parent);
        children.forEach(c => tempSet.add(c));
      }
    });

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

    masterValidNames.forEach(name => {
      if (removeSpaces(name).includes(normBase)) {
        tempSet.add(name);
      }
    });

    setTimeout(() => {
      const validTags = Array.from(tempSet).filter(tag => masterValidNames.has(tag));
      const finalTags = validTags.slice(0, 5);
      
      setRelatedTags(finalTags);
      setIsTagLoading(false);
    }, 50); 

  }, []);

  return { relatedTags, isTagLoading, processSearchKeywords };
};