// src/pages/Home/hooks/useSearchEngine.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] 지명 불일치 및 크래시를 유발하는 초성 검색 기능 완전 폐기 (가벼움 유지)
// 2. [Fact Check] 핀(Icon) 누락 버그 해결: 지구본에 물리적 좌표(Pin)가 존재하는 실제 장소(masterValidNames)만 연관 검색어로 노출되도록 강력한 거름망 적용.
// 3. [New / Pessimistic] THEME_DB를 활용한 꼬꼬무 장소 추출 순수 함수(getRelatedPlaces) 신설 (데이터 null 대응 완료)

import { useState, useCallback } from 'react';
import { TRAVEL_SPOTS } from '../data/travelSpots'; 
import { citiesData } from '../data/citiesData'; 
import { KEYWORD_SYNONYMS, KEYWORD_DB, THEME_DB } from '../data/keywordData'; // 🚨 [Fix] THEME_DB 임포트 추가

// ⚙️ [초경량 엔진] 1. 공백 제거기 (Zero-Space Rule)
const removeSpaces = (str) => (str || '').replace(/\s+/g, '').toLowerCase();

// 🚨 [New] 꼬꼬무 장소 추천 로직 (Safe Path 적용)
export const getRelatedPlaces = (currentPlace) => {
  // 🛡️ [Safe Path 1] 최악의 경우를 대비한 기본 방어 데이터 (travelSpots 최상단 5개)
  const defaultPlaces = TRAVEL_SPOTS.slice(0, 5).map(spot => ({
    name: spot.name,
    theme: '추천',
    data: spot
  }));

  // 🛡️ [Safe Path 2] 데이터가 아예 넘어오지 않으면 즉시 기본값 반환
  if (!currentPlace) return defaultPlaces;

  // 🚨 [Fix] 스키마 혼재 방어: citiesData(tags)와 travelSpots(keywords) 동시 대응
  const tags = currentPlace.tags || currentPlace.keywords || [];
  if (tags.length === 0) return defaultPlaces;

  const mainTheme = tags[0]; // 메인 테마 추출 (예: '휴양', '대도시')
  const relatedNames = THEME_DB[mainTheme] || [];

  const allPlaces = [...TRAVEL_SPOTS, ...(citiesData || [])];
  const results = [];

  // 뺄셈의 미학: 복잡한 filter/map 체이닝 대신 가장 원시적이고 빠른 for문 사용
  for (const name of relatedNames) {
    if (name === currentPlace.name) continue; // 자기 자신 제외

    const found = allPlaces.find(p => p.name === name);
    if (found) {
      results.push({
        name: found.name,
        theme: mainTheme,
        data: found
      });
    }

    // 최대 5개까지만 확보하면 즉시 루프 종료 (성능 최적화)
    if (results.length >= 5) break;
  }

  // 추출된 데이터가 없다면 기본값 반환
  return results.length > 0 ? results : defaultPlaces;
};

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
        tempSet.add(parent); 
        children.forEach(c => tempSet.add(c)); 
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
      // 🚨 [Fix] 거름망 가동: "실제 지구본에 존재하는(masterValidNames)" 장소만 필터링!
      const validTags = Array.from(tempSet).filter(tag => masterValidNames.has(tag));
      
      const finalTags = validTags.slice(0, 5);
      
      setRelatedTags(finalTags);
      setIsTagLoading(false);
    }, 50); 

  }, []);

  return { relatedTags, isTagLoading, processSearchKeywords };
};