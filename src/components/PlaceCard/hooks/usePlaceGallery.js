// src/components/PlaceCard/hooks/usePlaceGallery.js
// 🚨 [Fix/New] 수정 이유: 
// 1. Unsplash API Rate Limit 방어를 위한 3단계 캐싱 파이프라인
// 2. [아키텍처 확정] API 갱신 시 무거운 gallery_urls 배열과 초경량 썸네일용 image_url을 동시 업데이트 (성능 최적화)
// 3. 🚨 [Fix] DB에 없는 특수 지명(한국어)이 Unsplash에서 0건 검색되는 것을 방어하기 위한 영문 매핑 사전 추가

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { TRAVEL_SPOTS } from '../../../pages/Home/data/travelSpots'; 
import { supabase } from '../../../shared/api/supabase'; 

const CACHE_VERSION = 'v1.4'; // 🚨 v1.4 유지
const CACHE_TTL = 1000 * 60 * 60 * 24; 

// 🚨 [Fix] 영문 매핑 사전 (Fallback Dictionary)
const FALLBACK_DICTIONARY = {
  "팔라완": "Palawan",
  "라자 암팟": "Raja Ampat",
  "레위니옹": "Reunion",
  "메테오라": "Meteora",
  "모오레아": "Moorea",
  "아조레스 제도": "Azores",
  "세인트 헬레나": "Saint Helena"
};

export const usePlaceGallery = (locationSource) => {
  const [images, setImages] = useState([]);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  
  const lastQueryRef = useRef(null);
  const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  const sourceName = locationSource && typeof locationSource === 'object' ? locationSource.name : locationSource;
  const sourceId = locationSource && typeof locationSource === 'object' ? locationSource.id : null;

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
    if (!ACCESS_KEY || !locationSource) return;

    let targetSpot = locationSource;

    if (typeof locationSource === 'string') {
        const found = TRAVEL_SPOTS.find(s => s.name === locationSource);
        if (found) targetSpot = found;
    } else if (typeof locationSource === 'object') {
      if (!locationSource.name_en) {
        const foundInMaster = TRAVEL_SPOTS.find(s => 
          s.name === sourceName || (sourceId && s.id === sourceId)
        );
        if (foundInMaster) targetSpot = foundInMaster;
      }
    }

    let primaryQuery = '';
    let backupQuery = ''; 
    let koreanName = ''; 

    if (typeof targetSpot === 'object') {
        primaryQuery = targetSpot.name_en || targetSpot.name || '';
        koreanName = targetSpot.name || ''; 
        
        const country = targetSpot.country_en || targetSpot.country;
        if (country && primaryQuery) {
           backupQuery = `${primaryQuery} ${country}`;
        }
    } else {
        primaryQuery = String(targetSpot);
        koreanName = String(targetSpot);
    }

    primaryQuery = primaryQuery.trim();
    if (!primaryQuery) return;

    // 🚨 [Fix] 검색어 교정: 사전에 등록된 한글 지명이면 영문으로 강제 변환
    if (FALLBACK_DICTIONARY[primaryQuery]) {
        primaryQuery = FALLBACK_DICTIONARY[primaryQuery];
    }

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

    if (koreanName) {
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('place_stats')
          .select('gallery_urls')
          .eq('place_id', koreanName)
          .single();

        if (!dbError && dbData && dbData.gallery_urls && dbData.gallery_urls.length > 0) {
          setImages(dbData.gallery_urls);
          saveToSmartCache(CACHE_KEY, dbData.gallery_urls); 
          setIsImgLoading(false);
          return; 
        }
      } catch (err) {
        console.warn(`⚠️ Supabase Cache Miss or Error for ${koreanName}. Proceeding to Unsplash API.`);
      }
    }

    try {
      let results = await apiClient.fetchUnsplashImages(ACCESS_KEY, primaryQuery);

      if (results.length === 0 && backupQuery) {
        console.warn(`⚠️ No results for "${primaryQuery}". Retry with: "${backupQuery}"`);
        results = await apiClient.fetchUnsplashImages(ACCESS_KEY, backupQuery);
      }

      if (results.length > 0) {
        setImages(results);
        saveToSmartCache(CACHE_KEY, results);

        if (koreanName) {
          const thumbnailToSave = results[0]?.urls?.small || results[0]?.urls?.regular || '';
          
          supabase
            .from('place_stats')
            .upsert({ 
              place_id: koreanName, 
              gallery_urls: results,
              image_url: thumbnailToSave
            }, { onConflict: 'place_id' })
            .then(({ error }) => {
              if (error) console.error("⚠️ Supabase Update Error:", error);
            });
        }
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error("Gallery API Error:", error);
      setImages([]);
    } finally {
      setIsImgLoading(false);
    }

  }, [ACCESS_KEY, sourceName, sourceId, locationSource]);

  useEffect(() => {
    fetchImages();
    return () => setSelectedImg(null);
  }, [fetchImages]);

  return { images, isImgLoading, selectedImg, setSelectedImg };
};