import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';

// 🚨 [New] 이미지 로직 분리 및 캐싱 전략 캡슐화
export const usePlaceGallery = (locationName) => {
  const [images, setImages] = useState([]);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

  const fetchImages = useCallback(async () => {
    if (!locationName || !ACCESS_KEY) return;

    // 1. 캐시 확인
    const CACHE_KEY = `${locationName}_images_cache_v1`;
    const cachedData = sessionStorage.getItem(CACHE_KEY);

    if (cachedData) {
      setImages(JSON.parse(cachedData));
      setIsImgLoading(false);
      return;
    }

    // 2. 캐시 없으면 API 호출
    setIsImgLoading(true);
    const results = await apiClient.fetchUnsplashImages(ACCESS_KEY, locationName);
    
    if (results.length > 0) {
      setImages(results);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(results));
    }
    
    setIsImgLoading(false);
  }, [locationName, ACCESS_KEY]);

  // locationName이 변경되면 자동으로 이미지 로드
  useEffect(() => {
    fetchImages();
    return () => {
      setSelectedImg(null); // 장소 바뀌면 선택된 이미지 초기화
    };
  }, [fetchImages]);

  return {
    images,
    isImgLoading,
    selectedImg,
    setSelectedImg
  };
};