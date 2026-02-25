// src/components/PlaceCard/hooks/usePlaceGallery.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Maintain] saveToSmartCache 내 QuotaExceededError 예외 처리 및 자동 청소(Auto-Purge) 로직 '유지' (앱 크래시 완벽 방어)
// 2. [Maintain] Unsplash API 최종 실패 시 기본 대체 이미지를 제공하는 3차 방어막(Fallback) '유지'
// 3. 🚨 [Subtraction] 영문 매핑 사전(FALLBACK_DICTIONARY) '제거' -> 기형적인 로직을 버리고 citiesData.js의 원본 데이터(name_en)를 직접 참조하도록 아키텍처 원복
// 4. 🚨 [New] Unsplash 프로덕션 승인 요건: 다운로드 트래킹(download_location) 호출 및 실제 파일 다운로드 로직(handleDownload) 추가

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

  // 🚨 [New] 트래킹 API 호출 및 안전한 다운로드(Blob 방식) 핸들러 구현 (Fire & Forget 구조)
  const handleDownload = useCallback(async (imageObj) => {
    if (!imageObj || !ACCESS_KEY) return;
    
    // 1. Unsplash 가이드라인: download_location 엔드포인트 호출 (조회수/다운로드수 반영)
    if (imageObj.links?.download_location) {
      try {
        fetch(imageObj.links.download_location, {
          headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
        }).catch(e => console.error("⚠️ Tracking API silently failed:", e));
      } catch (e) {
        // 비관적 설계: 트래킹 실패가 사용자 다운로드를 막지 않도록 방치
      }
    }

    // 2. 실제 파일 다운로드 (CORS 문제 방지를 위한 Blob 변환 후 강제 다운로드)
    try {
      const imageUrl = imageObj.urls?.full || imageObj.urls?.regular;
      if (!imageUrl) return;
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      
      const authorName = imageObj.user?.name ? imageObj.user.name.replace(/\s+/g, '_') : 'Project_Days';
      a.download = `${authorName}_unsplash.jpg`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("🚨 Image download failed. Falling back to new tab.", error);
      // Fallback: Blob 다운로드 실패 시 새 창으로 열기
      if (imageObj.urls?.full) window.open(imageObj.urls.full, '_blank');
    }
  }, [ACCESS_KEY]);

  // 🚨 [Fix] handleDownload 반환 객체에 추가
  return { images, isImgLoading, selectedImg, setSelectedImg, handleDownload };
};