// 🚨 [Fix/New] 
// 1. [Safe-Path] 정적 데이터 -> Supabase 캐시 -> API 순서의 다중 레이어 탐색 구현.
// 2. [Subtraction] 불필요한 duration 데이터 제거 및 로직 단순화.
// 3. [Feedback] 데이터 부재 시 구글 폼 URL 반환 로직 추가.

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase'; // 프로젝트 내 설정된 supabase 클라이언트 경로 확인 필요
import { youtubeClient } from '../../../shared/api/youtubeClient'; // 🚨 [Fix] 오타(.) 제거 완료 반영
import { TRAVEL_VIDEOS } from '../data/travelVideos';

const GOOGLE_FORM_URL = "https://forms.gle/QgofLDzzYD6NfWYN7";

export const useYouTubeSearch = (location) => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location?.id) return;

    const fetchAllSources = async () => {
      setIsLoading(true);
      setError(null);
      const placeId = String(location.id);

      try {
        // --- [L1] Static Fallback (정적 데이터 확인) ---
        if (TRAVEL_VIDEOS[placeId]) {
          console.log(`[L1] Static data found for: ${location.name}`);
          setVideos(TRAVEL_VIDEOS[placeId]);
          setIsLoading(false);
          return;
        }

        // --- [L2] Supabase Cache (공유 캐시 확인) ---
        // 🚨 [Fix] 비관적 쿼리 적용: 데이터가 없을 경우 406 에러 대신 null을 반환하도록 maybeSingle() 사용
        const { data: cachedData, error: dbError } = await supabase
          .from('place_videos')
          .select('videos')
          .eq('place_id', placeId)
          .maybeSingle(); 

        if (cachedData && cachedData.videos?.length > 0) {
          console.log(`[L2] DB Cache found for: ${location.name}`);
          setVideos(cachedData.videos);
          setIsLoading(false);
          return;
        }

        // --- [L3] YouTube API Call (신규 검색) ---
        console.log(`[L3] Calling YouTube API for: ${location.name}`);
        const freshVideos = await youtubeClient.searchVideos(location.name);

        if (freshVideos && freshVideos.length > 0) {
          setVideos(freshVideos);
          
          // API 성공 시 Supabase에 캐싱 (백그라운드 실행)
          await supabase.from('place_videos').upsert({
            place_id: placeId,
            videos: freshVideos,
            last_updated: new Date().toISOString()
          });
        } else {
          // 데이터가 검색되지 않는 경우
          setVideos([]);
        }

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