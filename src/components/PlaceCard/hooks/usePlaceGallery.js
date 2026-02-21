// src/components/PlaceCard/hooks/usePlaceGallery.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Maintain] saveToSmartCache 내 QuotaExceededError 예외 처리 및 자동 청소(Auto-Purge) 로직 '유지' (앱 크래시 완벽 방어)
// 2. [Maintain] Unsplash API 최종 실패 시 기본 대체 이미지를 제공하는 3차 방어막(Fallback) '유지'
// 3. 🚨 [Subtraction] 영문 매핑 사전(FALLBACK_DICTIONARY) '제거' -> 기형적인 로직을 버리고 citiesData.js의 원본 데이터(name_en)를 직접 참조하도록 아키텍처 원복

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { TRAVEL_SPOTS } from '../../../pages/Home/data/travelSpots'; 
import { supabase } from '../../../shared/api/supabase'; 

const CACHE_VERSION = 'v1.4';
const CACHE_TTL = 1000 * 60 * 60 * 24; 

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

  // 🚨 [Maintain] 안전망: 저장 실패 시 앱 크래시 방지 및 원시적 캐시 청소
  const saveToSmartCache = (key, data) => {
    const payload = { version: CACHE_VERSION, timestamp: Date.now(), data: data };
    try {
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        console.warn('⚠️ SessionStorage full. Auto-Purging gallery caches...');
        
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('days_gallery_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
        
        try {
          sessionStorage.setItem(key, JSON.stringify(payload));
        } catch (retryError) {
          console.error('🚨 Cache save failed post-purge. Skipping cache.', retryError);
        }
      } else {
        console.error('🚨 Unexpected Cache Error:', e);
      }
    }
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
        // 🚨 핵심: 여기서 citiesData.js에 작성될 완벽한 name_en("Meteora, Greece")을 1순위로 가져옴
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
        // 🚨 [Maintain] 3차 방어막: 검색 결과가 아예 없을 때 기본 Fallback 이미지 제공
        console.warn(`⚠️ Unsplash 검색 최종 실패. 기본 Fallback 이미지를 렌더링합니다.`);
        setImages([
          { id: 'fallback-1', urls: { regular: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80' }, user: { name: 'Project Days Default' } },
          { id: 'fallback-2', urls: { regular: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80' }, user: { name: 'Project Days Default' } }
        ]);
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