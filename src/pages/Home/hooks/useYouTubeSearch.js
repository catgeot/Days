// src/pages/Home/hooks/useYouTubeSearch.js

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { buildPlaceDbIdCandidates, getPlaceStableKey, getPlaceStatsId } from '../../../utils/travelSpotResolve';
import { resolvePlaceVideoQueries } from '../lib/uiPlaceAssetQuery.js';
import {
  filterPlayableVideos,
  markYoutubeIdUnplayable,
} from '../../../utils/youtubeUnplayableStorage.js';

const GOOGLE_FORM_URL = 'https://forms.gle/QgofLDzzYD6NfWYN7';
const LOAD_MORE_SESSION_MAX = 3;
const INITIAL_MAX_RESULTS = 10;

function mergeVideosById(existing, incoming) {
  const seen = new Set(existing.map((v) => v.id));
  const merged = [...existing];
  for (const v of incoming || []) {
    if (v?.id && !seen.has(v.id)) {
      seen.add(v.id);
      merged.push(v);
    }
  }
  return merged;
}

export const useYouTubeSearch = (location, mediaMode) => {
  const [rawVideos, setRawVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isEmptyResult, setIsEmptyResult] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [loadMoreCount, setLoadMoreCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [unplayableBump, setUnplayableBump] = useState(0);

  const fetchContextRef = useRef(null);

  const videos = useMemo(
    () => filterPlayableVideos(rawVideos),
    [rawVideos, unplayableBump],
  );

  const invokeEdge = useCallback(async (body) => {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
      'fetch-place-videos',
      { body },
    );
    if (edgeError) {
      throw new Error('영상을 가져오는 데 실패했습니다.');
    }
    if (!edgeData?.success) {
      throw new Error(edgeData?.error || 'YouTube 검색에 실패했습니다.');
    }
    return edgeData;
  }, []);

  const runInitialFetch = useCallback(async () => {
    const cacheKey = getPlaceStableKey(location);
    const dbCandidates = buildPlaceDbIdCandidates(location);
    const statsId = getPlaceStatsId(location);
    const { query: searchQuery, fallbackQuery } = resolvePlaceVideoQueries(location);
    const placeId = statsId || cacheKey;

    fetchContextRef.current = { searchQuery, fallbackQuery, placeId };

    setFetchError(false);
    setIsEmptyResult(false);
    setNextPageToken(null);
    setHasMorePages(false);
    setLoadMoreCount(0);

    const { data: cachedData } = await supabase
      .from('place_videos')
      .select('videos')
      .in('place_id', dbCandidates.length ? dbCandidates : [cacheKey])
      .limit(1)
      .maybeSingle();

    if (cachedData && Array.isArray(cachedData.videos)) {
      console.log(`[L2] DB Cache found for: ${location.name} (Items: ${cachedData.videos.length})`);
      setRawVideos(cachedData.videos);
      setHasMorePages(cachedData.videos.length > 0);
      setIsEmptyResult(cachedData.videos.length === 0);
      return;
    }

    console.log(`[L3] Calling YouTube API for: ${location.name}`);
    const edgeData = await invokeEdge({
      query: searchQuery,
      fallbackQuery,
      placeId,
      maxResults: INITIAL_MAX_RESULTS,
    });

    const list = edgeData.videos || [];
    setRawVideos(list);
    setNextPageToken(edgeData.nextPageToken || null);
    setHasMorePages(Boolean(edgeData.nextPageToken) || list.length > 0);
    setIsEmptyResult(list.length === 0);
  }, [location, invokeEdge]);

  useEffect(() => {
    if (!location?.name) return;

    setRawVideos([]);
    setIsLoading(true);
    setFetchError(false);
    setIsEmptyResult(false);

    if (mediaMode !== 'VIDEO') {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await runInitialFetch();
      } catch (err) {
        console.error('[useYouTubeSearch] Error:', err);
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    location?.id,
    location?.name,
    location?.country,
    location?.name_en,
    location?.slug,
    location?.canonical_slug,
    mediaMode,
    runInitialFetch,
  ]);

  const retry = useCallback(async () => {
    if (mediaMode !== 'VIDEO' || !location?.name) return;
    setIsLoading(true);
    setFetchError(false);
    setIsEmptyResult(false);
    try {
      await runInitialFetch();
    } catch (err) {
      console.error('[useYouTubeSearch] retry Error:', err);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [mediaMode, location?.name, runInitialFetch]);

  const loadMore = useCallback(async () => {
    const ctx = fetchContextRef.current;
    if (!ctx || isLoadingMore || loadMoreCount >= LOAD_MORE_SESSION_MAX || !hasMorePages) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const edgeData = await invokeEdge({
        query: ctx.searchQuery,
        fallbackQuery: ctx.fallbackQuery,
        placeId: ctx.placeId,
        maxResults: INITIAL_MAX_RESULTS,
        skipUpsert: true,
        pageToken: nextPageToken || undefined,
      });

      const incoming = edgeData.videos || [];
      setRawVideos((prev) => mergeVideosById(prev, incoming));
      const token = edgeData.nextPageToken || null;
      setNextPageToken(token);
      setHasMorePages(Boolean(token));
      setLoadMoreCount((c) => c + 1);
    } catch (err) {
      console.error('[useYouTubeSearch] loadMore Error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMorePages, invokeEdge, isLoadingMore, loadMoreCount, nextPageToken]);

  const markUnplayable = useCallback((videoId) => {
    markYoutubeIdUnplayable(videoId);
    setUnplayableBump((n) => n + 1);
  }, []);

  const canLoadMore =
    !isLoading &&
    !fetchError &&
    videos.length > 0 &&
    loadMoreCount < LOAD_MORE_SESSION_MAX &&
    hasMorePages;

  return {
    videos,
    isLoading,
    error: fetchError,
    isEmpty: !isLoading && !fetchError && rawVideos.length === 0 && isEmptyResult,
    retry,
    loadMore,
    canLoadMore,
    isLoadingMore,
    markUnplayable,
    googleFormUrl: GOOGLE_FORM_URL,
  };
};
