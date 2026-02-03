// src/hooks/usePlaceGallery.js
// 🚨 [Fix] Crash 방지 및 검색 로직 고도화
// 1. typeof null === 'object' 버그 수정
// 2. 외부 데이터(External) 유입 시 검색어 조합 전략 개선

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/apiClient';
import { TRAVEL_SPOTS } from '../data/travelSpots'; 

// ⚙️ 캐시 설정
const CACHE_VERSION = 'v1.3'; // 🚨 [Version Up] 로직 변경으로 캐시 버전 갱신
const CACHE_TTL = 1000 * 60 * 60 * 24; 

export const usePlaceGallery = (locationSource) => {
  const [images, setImages] = useState([]);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  
  const lastQueryRef = useRef(null);
  const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  // 🚨 [Fix] null safe check
  const sourceName = locationSource && typeof locationSource === 'object' ? locationSource.name : locationSource;
  const sourceId = locationSource && typeof locationSource === 'object' ? locationSource.id : null;

  // 스마트 캐시 로더
  const loadFromSmartCache = (key) => {
    const cachedItem = sessionStorage.getItem(key);
    if (!cachedItem) return null;
    try {
      const parsed = JSON.parse(cachedItem);
      if (parsed.version !== CACHE_VERSION) {
        sessionStorage.removeItem(key);
        return null;
      }
      if (Date.now() - parsed.timestamp > CACHE_TTL) {
        sessionStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch (e) {
      sessionStorage.removeItem(key);
      return null;
    }
  };

  const saveToSmartCache = (key, data) => {
    const payload = { version: CACHE_VERSION, timestamp: Date.now(), data: data };
    sessionStorage.setItem(key, JSON.stringify(payload));
  };

  const fetchImages = useCallback(async () => {
    // 🚨 [Fix] locationSource가 null/undefined일 때 즉시 리턴하여 Crash 방지
    if (!ACCESS_KEY || !locationSource) return;

    // 🕵️ [Step 0] 데이터 보정 (Normalization)
    let targetSpot = locationSource;

    if (typeof locationSource === 'string') {
        // 문자열로 들어온 경우 (레거시 지원)
        const found = TRAVEL_SPOTS.find(s => s.name === locationSource);
        if (found) targetSpot = found;
    } else if (typeof locationSource === 'object') {
      // 🚨 [Fix] locationSource가 null이 아님을 보장한 상태에서 체크
      // 내부 데이터베이스(TRAVEL_SPOTS)에 존재하는지 ID나 이름으로 2차 확인
      if (!locationSource.name_en) {
        const foundInMaster = TRAVEL_SPOTS.find(s => 
          s.name === sourceName || (sourceId && s.id === sourceId)
        );
        if (foundInMaster) targetSpot = foundInMaster;
      }
    }

    // 🎯 [Step 1] 쿼리 전략 수립 (Query Strategy)
    let primaryQuery = '';
    let backupQuery = ''; 

    if (typeof targetSpot === 'object') {
        // Case A: 객체 데이터 (내부 or 외부 정규화 데이터)
        // 1순위: 영문명 (내부 데이터 or Geocoding 결과)
        // 2순위: 한글명 (외부 데이터)
        primaryQuery = targetSpot.name_en || targetSpot.name || '';
        
        // 🚨 [Fix] 백업 쿼리 강화: 결과가 0건일 때 국가명을 붙여서 재시도
        // 예: "Aitutaki" (0건) -> "Aitutaki Cook Islands" (성공 가능성 Up)
        const country = targetSpot.country_en || targetSpot.country;
        if (country && primaryQuery) {
           backupQuery = `${primaryQuery} ${country}`;
        }
    } else {
        // Case B: 단순 문자열
        primaryQuery = String(targetSpot);
    }

    primaryQuery = primaryQuery.trim();
    if (!primaryQuery) return;

    // 중복 호출 방지
    if (lastQueryRef.current === primaryQuery) return;
    lastQueryRef.current = primaryQuery;

    setIsImgLoading(true);
    setImages([]); 

    const CACHE_KEY = `days_gallery_${primaryQuery}`; 

    // 캐시 확인
    const validCache = loadFromSmartCache(CACHE_KEY);
    if (validCache && validCache.length > 0) {
      setImages(validCache);
      setIsImgLoading(false);
      return;
    }

    try {
      // 1차 시도: Primary Query
      let results = await apiClient.fetchUnsplashImages(ACCESS_KEY, primaryQuery);

      // 2차 시도: 검색 결과가 없고 백업 쿼리가 있을 때 (Fallback)
      if (results.length === 0 && backupQuery) {
        console.warn(`⚠️ No results for "${primaryQuery}". Retry with: "${backupQuery}"`);
        results = await apiClient.fetchUnsplashImages(ACCESS_KEY, backupQuery);
      }

      if (results.length > 0) {
        setImages(results);
        saveToSmartCache(CACHE_KEY, results);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error("Gallery API Error:", error);
      setImages([]);
    } finally {
      setIsImgLoading(false);
    }

  }, [ACCESS_KEY, sourceName, sourceId, locationSource]); // 🚨 [Fix] locationSource 의존성 명확화

  useEffect(() => {
    fetchImages();
    return () => setSelectedImg(null);
  }, [fetchImages]);

  return { images, isImgLoading, selectedImg, setSelectedImg };
};