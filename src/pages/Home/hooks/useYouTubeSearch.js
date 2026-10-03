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
const LOAD_MORE_FIRST_MAX_RESULTS = 20;

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

function placeFetchKey(location, mediaMode) {
  return [
    mediaMode,
    location?.id,
    location?.slug,
    location?.canonical_slug,
    location?.name,
    location?.country,
    location?.name_en,
  ].join('|');
}

export const useYouTubeSearch = (location, mediaMode) => {
  const [rawVideos, setRawVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isEmptyResult, setIsEmptyResult] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [paginationSource, setPaginationSource] = useState(null);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [loadMoreCount, setLoadMoreCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [loadMoreNoNew, setLoadMoreNoNew] = useState(false);
  const [unplayableBump, setUnplayableBump] = useState(0);

  const fetchContextRef = useRef(null);
  const completedInitialKeysRef = useRef(new Set());

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

    fetchContextRef.current = { searchQuery, fallbackQuery, placeId, fromCache: false };

    setFetchError(false);
    setIsEmptyResult(false);
    setNextPageToken(null);
    setPaginationSource(null);
    setHasMorePages(false);
    setLoadMoreCount(0);
    setLoadMoreError(false);
    setLoadMoreNoNew(false);

    const { data: cachedData } = await supabase
      .from('place_videos')
      .select('videos')
      .in('place_id', dbCandidates.length ? dbCandidates : [cacheKey])
      .limit(1)
      .maybeSingle();

    if (cachedData && Array.isArray(cachedData.videos)) {
      console.log(`[L2] DB Cache found for: ${location.name} (Items: ${cachedData.videos.length})`);
      fetchContextRef.current = { searchQuery, fallbackQuery, placeId, fromCache: true };
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
    setPaginationSource(edgeData.paginationSource || null);
    setHasMorePages(Boolean(edgeData.nextPageToken) || list.length > 0);
    setIsEmptyResult(list.length === 0);
  }, [
    location?.id,
    location?.slug,
    location?.canonical_slug,
    location?.name,
    location?.country,
    location?.name_en,
    invokeEdge,
  ]);

  useEffect(() => {
    if (!location?.name) return;

    setRawVideos([]);
    setIsLoading(true);
    setFetchError(false);
    setIsEmptyResult(false);

    if (mediaMode !== 'VIDEO') {
      return;
    }

    const key = placeFetchKey(location, mediaMode);
    if (completedInitialKeysRef.current.has(key)) {
      queueMicrotask(() => setIsLoading(false));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await runInitialFetch();
        if (!cancelled) completedInitialKeysRef.current.add(key);
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
  }, [location?.id, location?.slug, location?.canonical_slug, location?.name, location?.country, location?.name_en, mediaMode, runInitialFetch]);

  const retry = useCallback(async () => {
    if (mediaMode !== 'VIDEO' || !location?.name) return;
    completedInitialKeysRef.current.delete(placeFetchKey(location, mediaMode));
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
    setLoadMoreError(false);
    setLoadMoreNoNew(false);
    try {
      const excludeVideoIds = rawVideos.map((v) => v.id).filter(Boolean);
      const isFirstFromCache = ctx.fromCache && !nextPageToken;
      const edgeData = await invokeEdge({
        query: ctx.searchQuery,
        fallbackQuery: ctx.fallbackQuery,
        placeId: ctx.placeId,
        maxResults: isFirstFromCache ? LOAD_MORE_FIRST_MAX_RESULTS : INITIAL_MAX_RESULTS,
        skipUpsert: true,
        pageToken: nextPageToken || undefined,
        paginationSource: nextPageToken && paginationSource ? paginationSource : undefined,
        excludeVideoIds,
      });

      const seen = new Set(excludeVideoIds);
      const incoming = (edgeData.videos || []).filter((v) => v?.id && !seen.has(v.id));
      const token = edgeData.nextPageToken || null;

      if (incoming.length === 0) {
        setLoadMoreNoNew(true);
        setHasMorePages(false);
      } else {
        setRawVideos((prev) => mergeVideosById(prev, incoming));
        setNextPageToken(token);
        setPaginationSource(edgeData.paginationSource || null);
        setHasMorePages(Boolean(token));
        if (ctx.fromCache && isFirstFromCache) {
          fetchContextRef.current = { ...ctx, fromCache: false };
        }
      }
    } catch (err) {
      console.error('[useYouTubeSearch] loadMore Error:', err);
      setLoadMoreError(true);
    } finally {
      setLoadMoreCount((c) => c + 1);
      setIsLoadingMore(false);
    }
  }, [
    hasMorePages,
    invokeEdge,
    isLoadingMore,
    loadMoreCount,
    nextPageToken,
    paginationSource,
    rawVideos,
  ]);

  const markUnplayable = useCallback((videoId) => {
    markYoutubeIdUnplayable(videoId);
    setUnplayableBump((n) => n + 1);
  }, []);

  const canLoadMore =
    !isLoading &&
    !fetchError &&
    videos.length > 0 &&
    loadMoreCount < LOAD_MORE_SESSION_MAX &&
    hasMorePages &&
    !loadMoreNoNew;

  return {
    videos,
    isLoading,
    error: fetchError,
    isEmpty: !isLoading && !fetchError && rawVideos.length === 0 && isEmptyResult,
    retry,
    loadMore,
    canLoadMore,
    isLoadingMore,
    loadMoreError,
    loadMoreNoNew,
    markUnplayable,
    googleFormUrl: GOOGLE_FORM_URL,
  };
};
