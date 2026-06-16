// src/pages/Home/hooks/useSearchEngine.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] 지명 불일치 및 크래시를 유발하는 초성 검색 기능 완전 폐기.
// 2. [Fact Check] 실제 장소(masterValidNames)만 연관 검색어로 노출.
// 3. [Fix/New] Data Lake 전면 개방: travelSpots와 citiesData를 통합.
// 4. 🚨 [Fix/New] 4:1 꼬꼬무 정밀 분할: 연관된 장소 4개와 완전히 다른 테마의 '교두보(Bridge)' 장소 1개를 추출하여 배열 생성.
// 5. 🚨 [Fix/New] isBridge 플래그: 교두보 장소에 `isBridge: true` 마킹을 달아 UI에서 색상을 반전시킬 수 있도록 프론트엔드로 전달.
// 6. [Fix/New] Pessimistic First (비관적 방어): 특정 풀(Pool)의 개수가 부족할 경우 앱 크래시를 막기 위해 상대 풀에서 부족분을 채우는 강력한 방어 로직 추가.
// 7. [Performance] 정적 데이터 사전 계산 및 메모이제이션 강화.
// 8. [Home] 좌측 연관 검색어 — KEYWORD_DB 대신 getRelatedPlaces(꼬꼬무) SSOT.

import { useState, useCallback } from 'react';
import { TRAVEL_SPOTS } from '../data/travelSpots'; 
import { citiesData } from '../data/citiesData'; 

const removeSpaces = (str) => (str || '').replace(/\s+/g, '').toLowerCase();

/** 장소별 결정적 셔플 시드 — 탭 전환·리렌더 시 꼬꼬무 목록 고정 */
const getPlaceSeed = (place) => {
  const key = String(place?.id ?? place?.name ?? '');
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
};

const seededShuffle = (array, seed) => {
  const out = [...array];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    const j = (s >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

// 사전 계산된 정적 데이터 (성능 최적화)
const ALL_PLACES = [...TRAVEL_SPOTS, ...(citiesData || [])];

/** 문자열·장소 객체 → SSOT 장소 (홈 꼬꼬무 입력 정규화) */
const resolvePlaceFromInput = (input) => {
  if (input == null) return null;

  if (typeof input === 'object') {
    if (input.slug) {
      const bySlug = ALL_PLACES.find((p) => p.slug === input.slug);
      if (bySlug) return { ...bySlug, ...input };
    }
    if (input.name) {
      const norm = removeSpaces(input.name);
      const byName = ALL_PLACES.find(
        (p) => removeSpaces(p.name) === norm || removeSpaces(p.name_en) === norm
      );
      if (byName) return { ...byName, ...input };
    }
    if (Number.isFinite(Number(input.lat)) && Number.isFinite(Number(input.lng))) {
      return input;
    }
    return input.name ? input : null;
  }

  if (typeof input === 'string') {
    const clean = input.replace('📍', '').trim();
    if (!clean) return null;
    const norm = removeSpaces(clean);
    return ALL_PLACES.find(
      (p) =>
        removeSpaces(p.name) === norm ||
        removeSpaces(p.name_en) === norm ||
        removeSpaces(p.country) === norm ||
        removeSpaces(p.country_en) === norm
    ) || null;
  }

  return null;
};

// 🚨 [New] 꼬꼬무 장소 추천 로직 (4:1 유기적 셔플 & Safe Path 적용)
export const getRelatedPlaces = (currentPlace) => {
  const seed = getPlaceSeed(currentPlace);

  // 🛡️ [Safe Path 1] 데이터가 없으면 결정적 5개 반환
  if (!currentPlace) {
    return seededShuffle(ALL_PLACES, seed).slice(0, 5).map(spot => ({
      name: spot.name,
      data: spot,
      isBridge: false 
    }));
  }

  const currentTags = currentPlace.tags || currentPlace.keywords || [];
  const otherPlaces = ALL_PLACES.filter(p => p.name !== currentPlace.name && p.id !== currentPlace.id);

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
    relatedPool = otherPlaces;
  }

  relatedPool = seededShuffle(relatedPool, seed);
  bridgePool = seededShuffle(bridgePool, seed + 1);

  let finalPlaces = [];

  if (relatedPool.length >= 4 && bridgePool.length >= 1) {
    finalPlaces = [
      ...relatedPool.slice(0, 4).map(p => ({ name: p.name, data: p, isBridge: false })),
      ...bridgePool.slice(0, 1).map(p => ({ name: p.name, data: p, isBridge: true }))
    ];
  } else if (relatedPool.length < 4) {
    const neededBridge = 5 - relatedPool.length;
    finalPlaces = [
      ...relatedPool.map(p => ({ name: p.name, data: p, isBridge: false })),
      ...bridgePool.slice(0, neededBridge).map((p, i) => ({ name: p.name, data: p, isBridge: i === 0 }))
    ];
  } else {
    finalPlaces = relatedPool.slice(0, 5).map(p => ({ name: p.name, data: p, isBridge: false }));
  }

  return seededShuffle(finalPlaces, seed + 2);
};

export const useSearchEngine = () => {
  const [relatedPlaces, setRelatedPlaces] = useState([]);
  const [isTagLoading, setIsTagLoading] = useState(false);

  const processSearchKeywords = useCallback((input) => {
    setIsTagLoading(true);

    // 🚨 UI 블로킹 방지를 위한 짧은 딜레이 유지
    setTimeout(() => {
      const place = resolvePlaceFromInput(input);
      if (!place) {
        setRelatedPlaces([]);
        setIsTagLoading(false);
        return;
      }

      setRelatedPlaces(getRelatedPlaces(place));
      setIsTagLoading(false);
    }, 50);
  }, []);

  return { relatedPlaces, isTagLoading, processSearchKeywords };
};
