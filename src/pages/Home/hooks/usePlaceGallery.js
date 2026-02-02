// src/hooks/usePlaceGallery.js
// 🚨 [Upgrade] "순정 검색어" 우선 전략
// name_en이 있으면 그것만 딱 보냅니다. (예: "Aitutaki")

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/apiClient';
import { TRAVEL_SPOTS } from '../data/travelSpots'; 

// ⚙️ 캐시 설정 (로직 변경으로 버전 업)
const CACHE_VERSION = 'v1.2'; 
const CACHE_TTL = 1000 * 60 * 60 * 24; 

export const usePlaceGallery = (locationSource) => {
  const [images, setImages] = useState([]);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  
  const lastQueryRef = useRef(null);
  const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  const sourceName = typeof locationSource === 'object' ? locationSource?.name : locationSource;
  const sourceId = typeof locationSource === 'object' ? locationSource?.id : null;

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
    if (!ACCESS_KEY || (!sourceName && !sourceId)) return;

    // 🕵️ [Step 0] 데이터 보정
    let targetSpot = locationSource;
    if (typeof locationSource === 'string') {
        const found = TRAVEL_SPOTS.find(s => s.name === locationSource);
        if (found) targetSpot = found;
    } else if (typeof locationSource === 'object' && !locationSource.name_en) {
      const foundInMaster = TRAVEL_SPOTS.find(s => 
        s.name === sourceName || (sourceId && s.id === sourceId)
      );
      if (foundInMaster) targetSpot = foundInMaster;
    }

    // 🎯 [Step 1] 순정 검색어(Pure Query) 생성
    let primaryQuery = '';
    let backupQuery = ''; // 이번 전략에선 백업을 적극 활용

    if (typeof targetSpot === 'object') {
        // 🚨 [Change] "Aitutaki"만 보냄. (국가명 제거)
        // 사용자가 Unsplash에서 검색하는 그대로를 모방
        primaryQuery = targetSpot.name_en || targetSpot.name || '';
        
        // 만약 결과가 0건이면 그때 국가명을 붙여서 재시도 (Fallback)
        if (targetSpot.country_en) {
           backupQuery = `${primaryQuery} ${targetSpot.country_en}`;
        }
    } else {
        primaryQuery = String(targetSpot);
    }

    primaryQuery = primaryQuery.trim();
    if (!primaryQuery) return;

    if (lastQueryRef.current === primaryQuery) return;
    lastQueryRef.current = primaryQuery;

    setIsImgLoading(true);
    setImages([]); 

    const CACHE_KEY = `days_gallery_${primaryQuery}`; 

    const validCache = loadFromSmartCache(CACHE_KEY);
    if (validCache && validCache.length > 0) {
      setImages(validCache);
      setIsImgLoading(false);
      return;
    }

    try {
      // console.log(`📸 Pure Searching: "${primaryQuery}"`);
      let results = await apiClient.fetchUnsplashImages(ACCESS_KEY, primaryQuery);

      // 검색 결과가 너무 적으면(예: 동명이인 도시라 이상한게 섞이거나 0건이면) 백업 쿼리 가동
      // 여기서는 0건일 때만 가동하도록 설정
      if (results.length === 0 && backupQuery) {
        console.warn(`⚠️ No results for "${primaryQuery}". Trying backup: "${backupQuery}"`);
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

  }, [ACCESS_KEY, sourceName, sourceId]); 

  useEffect(() => {
    fetchImages();
    return () => setSelectedImg(null);
  }, [fetchImages]);

  return { images, isImgLoading, selectedImg, setSelectedImg };
};