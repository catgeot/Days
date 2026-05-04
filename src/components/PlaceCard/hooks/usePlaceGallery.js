// src/components/PlaceCard/hooks/usePlaceGallery.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Maintain] saveToSmartCache 내 QuotaExceededError 예외 처리 및 자동 청소(Auto-Purge) 로직 '유지' (앱 크래시 완벽 방어)
// 2. [Maintain] Unsplash API 최종 실패 시 기본 대체 이미지를 제공하는 3차 방어막(Fallback) '유지'
// 3. 🚨 [Subtraction] 영문 매핑 사전(FALLBACK_DICTIONARY) '제거' -> 기형적인 로직을 버리고 citiesData.js의 원본 데이터(name_en)를 직접 참조하도록 아키텍처 원복
// 4. 🚨 [New] Unsplash 프로덕션 승인 요건: 다운로드 트래킹(download_location) 호출 및 실제 파일 다운로드 로직(handleDownload) 추가
// 5. 🚨 [New] 갤러리 이미지 영구 삭제 기능(Ctrl + 더블클릭) 지원을 위한 handleRemoveImage 추가 및 쿼리/이름 Ref 추가

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { TRAVEL_SPOTS } from '../../../pages/Home/data/travelSpots';
import { citiesData } from '../../../pages/Home/data/citiesData';
import { supabase } from '../../../shared/api/supabase';

const CACHE_VERSION = 'v1.4';
const CACHE_TTL = 1000 * 60 * 60 * 24;

// 🚨 [Fix] 오지/자연경관 등 citiesData에 영문명이 없는 경우를 위한 Fallback Dictionary 복구
const FALLBACK_DICTIONARY = {
  "에베레스트": "Mount Everest",
  "에베레스트 베이스캠프": "Everest Base Camp",
  "트리스탄 다 쿠냐": "Tristan da Cunha",
  "칼라 타파르": "Kala Patthar",
  "남극점": "South Pole",
  "맥머도 기지": "McMurdo Station",
  "세종과학기지": "King Sejong Station",
  "장보고과학기지": "Jang Bogo Station",
  "아문센-스콧 남극점 기지": "Amundsen-Scott South Pole Station",
  "파타고니아": "Patagonia",
  "우수아이아": "Ushuaia",
  "사하라 사막": "Sahara Desert",
  "아마존 분지": "Amazon Basin",
  "갈라파고스": "Galapagos Islands",
  "이스터 섬": "Easter Island",
  "세렝게티": "Serengeti",
  "통가": "Tonga",
  "투발루": "Tuvalu",
  "키리바시": "Kiribati",
  "팔라우": "Palau",
  "바누아투": "Vanuatu",
  "피지": "Fiji",
  "나이아가라 폭포": "Niagara Falls",
  "나이아가라": "Niagara Falls",
  "나이야 가라": "Niagara Falls"
};

export const usePlaceGallery = (locationSource) => {
  const [images, setImages] = useState([]);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  /** 같은 영문 쿼리를 쓰는 서로 다른 장소 구분 + in-flight 요청 무효화 */
  const lastFetchKeyRef = useRef(null);
  const galleryLoadSeqRef = useRef(0);
  // 🚨 [New] 큐레이션(좋아요/숨김) 원본 데이터를 보존하기 위한 Ref
  const allImagesRef = useRef([]);
  const pageRef = useRef(1);
  const currentKoreanNameRef = useRef('');
  const currentQueryRef = useRef('');
  const currentPlaceKeyRef = useRef('');

  const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;

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
    } catch {
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

  // 이미지 상태 업데이트 (단순화됨)
  const processAndSetImages = useCallback((rawImages) => {
    if (!rawImages || rawImages.length === 0) {
      setImages([]);
      return;
    }
    allImagesRef.current = rawImages;
    setImages(rawImages); // 단순하게 그대로 표시
  }, []);

  const fetchImages = useCallback(async (forceRefresh = false) => {
    if (!ACCESS_KEY || !locationSource) return;

    let targetSpot = locationSource;

    if (typeof locationSource === 'string') {
        let found = TRAVEL_SPOTS.find(s => s.name === locationSource);
        if (!found) found = citiesData.find(s => s.name === locationSource);
        if (found) targetSpot = found;
    } else if (typeof locationSource === 'object') {
      if (!locationSource.name_en) {
        let foundInMaster = TRAVEL_SPOTS.find(s =>
          s.name === sourceName || (sourceId && s.id === sourceId)
        );
        if (!foundInMaster) {
           foundInMaster = citiesData.find(s => s.name === sourceName);
        }
        if (foundInMaster) targetSpot = foundInMaster;
      }
    }

    let primaryQuery = '';
    let backupQuery = '';
    let koreanName = '';

    if (typeof targetSpot === 'object') {
        // 🚨 [Fix] 검색 정확도 향상을 위해 영어 지명에 쉼표가 있을 경우 첫 번째 구역(단어)만 추출
        const rawNameEn = targetSpot.name_en || '';
        const simpleNameEn = rawNameEn.split(',')[0].trim();

        primaryQuery = simpleNameEn || targetSpot.name || '';
        koreanName = targetSpot.name || '';

        const country = targetSpot.country_en || targetSpot.country;
        if (country && primaryQuery && country !== primaryQuery) {
           backupQuery = `${primaryQuery} ${country}`;
        }
    } else {
        primaryQuery = String(targetSpot);
        koreanName = String(targetSpot);
    }

    primaryQuery = primaryQuery.trim();
    if (!primaryQuery) return;

    // 🚨 [Fix] 한글 검색어로 API 호출 시 결과가 희박하므로 Dictionary로 영문 강제 치환
    if (FALLBACK_DICTIONARY[koreanName]) {
      primaryQuery = FALLBACK_DICTIONARY[koreanName];
    } else if (FALLBACK_DICTIONARY[primaryQuery]) {
      primaryQuery = FALLBACK_DICTIONARY[primaryQuery];
    }

    const placeKey =
      typeof targetSpot === 'object' && targetSpot
        ? String(targetSpot.slug || targetSpot.id || targetSpot.name || '').trim()
        : String(koreanName || primaryQuery).trim();
    const stablePlaceKey = placeKey || koreanName || primaryQuery;
    const fetchKey = `${stablePlaceKey}|${primaryQuery}`;

    // 상태 저장을 통한 삭제 시 활용
    currentKoreanNameRef.current = koreanName;
    currentQueryRef.current = primaryQuery;
    currentPlaceKeyRef.current = stablePlaceKey;

    // 같은 장소+쿼리로의 중복 요청만 스킵 (영문 쿼리만 보고 판단하면 다른 장소가 묶임)
    if (!forceRefresh && lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;

    const runId = ++galleryLoadSeqRef.current;

    setIsImgLoading(true);
    if (!forceRefresh) setImages([]);

    const CACHE_KEY = `days_gallery_${encodeURIComponent(stablePlaceKey)}_${primaryQuery}`;

    if (!forceRefresh) {
      pageRef.current = 1; // 🚨 [Fix] 일반 로드 시 페이지 초기화
      const validCache = loadFromSmartCache(CACHE_KEY);
      if (validCache && validCache.length > 0) {
        if (runId !== galleryLoadSeqRef.current) return;
        processAndSetImages(validCache);
        if (runId === galleryLoadSeqRef.current) setIsImgLoading(false);
        return;
      }

      if (koreanName) {
        try {
          const { data: dbData, error: dbError } = await supabase
            .from('place_stats')
            .select('gallery_urls')
            .eq('place_id', koreanName)
            .single();

          if (runId !== galleryLoadSeqRef.current) return;

          if (!dbError && dbData && dbData.gallery_urls && dbData.gallery_urls.length > 0) {
            processAndSetImages(dbData.gallery_urls);
            saveToSmartCache(CACHE_KEY, dbData.gallery_urls);
            if (runId === galleryLoadSeqRef.current) setIsImgLoading(false);
            return;
          }
        } catch {
          console.warn(`⚠️ Supabase Cache Miss or Error for ${koreanName}. Proceeding to API.`);
        }
      }
    } else {
      pageRef.current += 1;
      console.log(`🔄 강제 새로고침 실행: 기존 캐시 유지한 채 새로운 데이터 가져오기 (${primaryQuery}, 페이지: ${pageRef.current})`);
    }

    try {
      let results = await apiClient.fetchUnsplashImages(ACCESS_KEY, primaryQuery, pageRef.current);

      if (runId !== galleryLoadSeqRef.current) return;

      if (results.length === 0 && backupQuery) {
        console.warn(`⚠️ No results for "${primaryQuery}". Retry with: "${backupQuery}"`);
        results = await apiClient.fetchUnsplashImages(ACCESS_KEY, backupQuery, pageRef.current);
      }

      if (runId !== galleryLoadSeqRef.current) return;

      // 🚨 [Fix] Unsplash 이미지가 적을 때(15장 이하) 또는 강제 새로고침 시 Pexels 결합 (더 풍성한 갤러리 제공)
      if ((results.length <= 15 || forceRefresh) && PEXELS_KEY) {
        console.warn(`⚠️ Unsplash 이미지 부족 또는 강제 새로고침. Pexels 이미지 검색 병합을 시도합니다.`);
        try {
          const pexelsImages = await apiClient.fetchPexelsImages(PEXELS_KEY, primaryQuery, pageRef.current);

          if (pexelsImages && pexelsImages.length > 0) {
            results = [...results, ...pexelsImages];
            console.log(`✅ Pexels 이미지 ${pexelsImages.length}개 병합 완료. 총 ${results.length}개`);
          }
        } catch (pexelsError) {
          console.error("⚠️ Pexels API Error:", pexelsError);
        }
      }

      if (runId !== galleryLoadSeqRef.current) return;

      // 🚨 [New] 강제 새로고침에서 결과를 얻지 못했다면 기존 캐시/상태 보존
      if (forceRefresh && results.length === 0) {
        console.warn(`⚠️ 더 이상 가져올 이미지가 없습니다 (페이지 ${pageRef.current}). 이전 상태 유지.`);
        pageRef.current -= 1; // 페이지 원복
        if (runId === galleryLoadSeqRef.current) {
          setIsImgLoading(false);
          processAndSetImages(allImagesRef.current); // UI 원복
        }
        return;
      }

      if (results.length > 0) {
        // 새로고침(Refresh) 시 페이지네이션처럼 기존 데이터를 유지하며 병합 (Append)
        let finalResults = results;
        if (forceRefresh && allImagesRef.current && allImagesRef.current.length > 0) {
          // 강제 새로고침(더보기) 시: 이전 사진들을 보존하고 새 사진들을 이어 붙임
          const existingIds = new Set(allImagesRef.current.map(img => img.id));
          const freshImages = results.filter(img => !existingIds.has(img.id));
          finalResults = [...allImagesRef.current, ...freshImages];
        }

        if (runId !== galleryLoadSeqRef.current) return;

        processAndSetImages(finalResults);
        saveToSmartCache(CACHE_KEY, finalResults);

        if (koreanName) {
          const thumbnailToSave = finalResults[0]?.urls?.small || finalResults[0]?.urls?.regular || '';

          supabase
            .from('place_stats')
            .upsert({
              place_id: koreanName,
              gallery_urls: finalResults,
              image_url: thumbnailToSave
            }, { onConflict: 'place_id' })
            .then(({ error }) => {
              if (error) console.error("⚠️ Supabase Update Error:", error);
            });
        }
      } else {
        console.warn(`⚠️ 검색 최종 실패. 기본 Fallback 이미지를 렌더링합니다.`);
        const fallbackImgs = [
          { id: 'fallback-1', urls: { regular: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80' }, user: { name: 'Project Days Default' } },
          { id: 'fallback-2', urls: { regular: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80' }, user: { name: 'Project Days Default' } }
        ];
        if (runId === galleryLoadSeqRef.current) processAndSetImages(fallbackImgs);
      }
    } catch (error) {
      console.error("Gallery API Error:", error);
      if (runId === galleryLoadSeqRef.current) processAndSetImages([]);
    } finally {
      if (runId === galleryLoadSeqRef.current) setIsImgLoading(false);
    }

  }, [ACCESS_KEY, PEXELS_KEY, sourceName, sourceId, locationSource, processAndSetImages]);

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
      } catch {
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
      const sourceSuffix = imageObj.id?.toString().startsWith('pexels') ? 'pexels' : 'unsplash';
      a.download = `${authorName}_${sourceSuffix}.jpg`;

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

  // 🚨 [New] 특정 이미지 영구 삭제 처리 (DB, 캐시, 상태 업데이트)
  const handleRemoveImage = useCallback(async (imageToRemove) => {
    if (!imageToRemove) return;

    // 1. 상태 업데이트
    const newImages = allImagesRef.current.filter(img => img.id !== imageToRemove.id);
    allImagesRef.current = newImages;
    setImages(newImages);

    const koreanName = currentKoreanNameRef.current;
    const primaryQuery = currentQueryRef.current;
    const placeKeyPart = currentPlaceKeyRef.current || koreanName || primaryQuery;
    const CACHE_KEY = `days_gallery_${encodeURIComponent(placeKeyPart)}_${primaryQuery}`;

    // 2. 캐시 업데이트
    saveToSmartCache(CACHE_KEY, newImages);

    // 3. DB 업데이트
    if (koreanName) {
      const thumbnailToSave = newImages[0]?.urls?.small || newImages[0]?.urls?.regular || '';
      try {
        const { error } = await supabase
          .from('place_stats')
          .update({
            gallery_urls: newImages,
            image_url: thumbnailToSave
          })
          .eq('place_id', koreanName);

        if (error) {
          console.error("🚨 이미지 삭제 후 DB 업데이트 실패:", error);
        } else {
          console.log(`✅ 이미지 삭제 완료 (DB 영구반영): ${imageToRemove.id}`);
        }
      } catch (err) {
        console.error("🚨 이미지 삭제 중 예외 발생:", err);
      }
    }
  }, []);

  // 반환 객체
  return {
    images,
    isImgLoading,
    selectedImg,
    setSelectedImg,
    handleDownload,
    handleRefresh: () => fetchImages(true),
    handleRemoveImage
  };
};
