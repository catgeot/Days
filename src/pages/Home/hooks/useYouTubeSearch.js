// src/pages/Home/hooks/useYouTubeSearch.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Safe-Path] 정적 데이터 -> Supabase 캐시 -> API 순서의 다중 레이어 탐색 유지.
// 2. 🚨 [Fix/New] Lazy Fetching (지연 호출): mediaMode 파라미터를 추가하여, 사용자가 'VIDEO' 탭을 활성화했을 때만 데이터를 가져오도록 API 누수(과호출) 원천 차단.
// 3. 🚨 [Fix/New] Clean Slate (잔상 방지): 장소가 변경되었을 때 탭이 'GALLERY'라면, 이전 장소의 영상이 노출되지 않도록 상태를 즉시 초기화.

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { TRAVEL_VIDEOS } from '../data/travelVideos';

const GOOGLE_FORM_URL = "https://forms.gle/QgofLDzzYD6NfWYN7";

// 🚨 [Fix] 파라미터에 mediaMode 추가
export const useYouTubeSearch = (location, mediaMode) => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🚨 [Fix] 의존성 배열에 mediaMode 추가
  useEffect(() => {
    if (!location?.name) return;

    // 🚨 [Fix/New] Clean Slate: 장소가 바뀌면 일단 이전 장소의 데이터 비우기 (잔상 방지)
    setVideos([]);
    setIsLoading(true);
    setError(null);

    // 🚨 [Fix/New] Lazy Fetching 방어막: 영상 탭이 아닐 경우 여기서 즉시 실행 종료 (API/DB 통신 전면 차단)
    if (mediaMode !== 'VIDEO') {
        return;
    }

    const fetchAllSources = async () => {
      const cacheKey = String(location.name);
      const staticKey = String(location.id || location.name);

      try {
        // --- [L1] Static Fallback (정적 데이터 확인) ---
        if (TRAVEL_VIDEOS[staticKey]) {
          console.log(`[L1] Static data found for: ${location.name}`);
          setVideos(TRAVEL_VIDEOS[staticKey]);
          setIsLoading(false);
          return;
        } else if (TRAVEL_VIDEOS[cacheKey]) {
          console.log(`[L1] Static data found for: ${location.name}`);
          setVideos(TRAVEL_VIDEOS[cacheKey]);
          setIsLoading(false);
          return;
        }

        // --- [L2] Supabase Cache (공유 캐시 확인) ---
        const { data: cachedData, error: _dbError } = await supabase
          .from('place_videos')
          .select('videos')
          .eq('place_id', cacheKey)
          .maybeSingle();

        if (cachedData && Array.isArray(cachedData.videos)) {
          console.log(`[L2] DB Cache found for: ${location.name} (Items: ${cachedData.videos.length})`);
          setVideos(cachedData.videos);
          setIsLoading(false);
          return;
        }

        // --- [L3] YouTube API Call (신규 검색) ---
        console.log(`[L3] Calling YouTube API for: ${location.name}`);

        // 🚨 [Fix] 검색 정확도 향상을 위해 국가명이 있으면 추가하여 쿼리 전송
        const searchQuery = location.country && location.country !== "Explore" && location.country !== "Ocean" && location.country !== "바다" && location.country !== "대륙"
            ? `${location.name} ${location.country}`
            : location.name;

        // 🚨 [New] 1차 한글 검색 실패 시 활용할 영문 폴백 쿼리 (예: 핏케언 제도 -> Pitcairn Islands)
        const fallbackQuery = location.name_en ? `${location.name_en} travel vlog` : `${searchQuery} travel vlog`;

        // 🚨 [Security Fix] 클라이언트 단에서 YouTube API 직접 호출 & DB Upsert 하는 것을 방지하고 Edge Function으로 위임
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('fetch-place-videos', {
          body: { query: searchQuery, fallbackQuery: fallbackQuery, placeId: cacheKey }
        });

        if (edgeError) {
          console.error("Edge Function Error:", edgeError);
          throw new Error("영상을 가져오는 데 실패했습니다.");
        }

        if (edgeData && edgeData.success) {
          setVideos(edgeData.videos || []);
        } else {
          throw new Error(edgeData?.error || "YouTube 검색에 실패했습니다.");
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
  }, [location?.id, location?.name, mediaMode]);

  return {
    videos,
    isLoading,
    error,
    googleFormUrl: GOOGLE_FORM_URL
  };
};
