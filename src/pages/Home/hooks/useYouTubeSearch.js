// 🚨 [Fix/New] 
// 1. [Safe-Path] 정적 데이터 -> Supabase 캐시 -> API 순서의 다중 레이어 탐색 구현.
// 2. [Subtraction] 불필요한 duration 데이터 제거 및 로직 단순화.
// 3. [Feedback] 데이터 부재 시 구글 폼 URL 반환 로직 추가.

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase'; // 프로젝트 내 설정된 supabase 클라이언트 경로 확인 필요
import { youtubeClient } from '../../../shared/api/youtubeClient'; 
import { TRAVEL_VIDEOS } from '../data/travelVideos';

const GOOGLE_FORM_URL = "https://forms.gle/QgofLDzzYD6NfWYN7";

export const useYouTubeSearch = (location) => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 🚨 [Fix] location.name 기반으로 작동하도록 의존성 우선순위 변경
    if (!location?.name) return; 

    const fetchAllSources = async () => {
      setIsLoading(true);
      setError(null);
      
      // 🚨 [Fix/New] 파편화된 ID(512, loc-...) 대신 일관된 한글 지명(location.name)을 기준 키로 통합
      const cacheKey = String(location.name); 
      // 🚨 정적 데이터(TRAVEL_VIDEOS) 하위 호환성을 위해 기존 ID도 체크 키로 남겨둠
      const staticKey = String(location.id || location.name); 

      try {
        // --- [L1] Static Fallback (정적 데이터 확인) ---
        if (TRAVEL_VIDEOS[staticKey]) {
          console.log(`[L1] Static data found for: ${location.name}`);
          setVideos(TRAVEL_VIDEOS[staticKey]);
          setIsLoading(false);
          return;
        } else if (TRAVEL_VIDEOS[cacheKey]) { // 한글명으로 저장되어 있을 경우를 대비한 2차 확인
          console.log(`[L1] Static data found for: ${location.name}`);
          setVideos(TRAVEL_VIDEOS[cacheKey]);
          setIsLoading(false);
          return;
        }

        // --- [L2] Supabase Cache (공유 캐시 확인) ---
        // 🚨 [Fix] 비관적 쿼리 적용: 데이터가 없을 경우 406 에러 대신 null을 반환하도록 maybeSingle() 사용
        const { data: cachedData, error: dbError } = await supabase
          .from('place_videos')
          .select('videos')
          .eq('place_id', cacheKey) // 🚨 [Fix] 일관된 한글 지명(cacheKey)으로 캐시 조회
          .maybeSingle(); 

        // 🚨 [Fix] DB에 기록이 존재한다면, 그 값이 빈 배열(결과 없음)이더라도 즉시 반환하여 API 호출 차단
        if (cachedData && Array.isArray(cachedData.videos)) {
          console.log(`[L2] DB Cache found for: ${location.name} (Items: ${cachedData.videos.length})`);
          setVideos(cachedData.videos);
          setIsLoading(false);
          return;
        }

        // --- [L3] YouTube API Call (신규 검색) ---
        console.log(`[L3] Calling YouTube API for: ${location.name}`);
        const freshVideos = await youtubeClient.searchVideos(location.name);

        // 🚨 [Fix/New] Pessimistic First (비관적 우선)
        // 검색 결과가 아예 없더라도 빈 배열을 DB에 저장합니다. 
        // 동일한 곳을 다시 조회할 때 API 호출(일일 100건 할당량)을 아끼고 L2에서 바로 끊어내기 위함입니다.
        const videosToCache = freshVideos || [];
        setVideos(videosToCache);
        
        // API 결과(성공 또는 빈 배열)를 Supabase에 캐싱 (백그라운드 실행)
        await supabase.from('place_videos').upsert({
          place_id: cacheKey, // 🚨 [Fix] 일관된 한글 지명(cacheKey)으로 DB 저장
          videos: videosToCache,
          last_updated: new Date().toISOString()
        });

      } catch (err) {
        console.error('[useYouTubeSearch] Error:', err);
        setError({
          message: "영상을 불러오지 못했습니다.",
          formUrl: GOOGLE_FORM_URL
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllSources();
  }, [location?.id, location?.name]);

  return { 
    videos, 
    isLoading, 
    error, 
    googleFormUrl: GOOGLE_FORM_URL 
  };
};