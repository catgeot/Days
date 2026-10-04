// src/pages/Home/hooks/useYouTubeSearch.js

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { buildPlaceDbIdCandidates, getPlaceStableKey, getPlaceStatsId } from '../../../utils/travelSpotResolve';
import { resolvePlaceVideoQueries } from '../lib/uiPlaceAssetQuery.js';
import {
  filterPlayableVideos,
  markYoutubeIdUnplayable,
} from '../../../utils/youtubeUnplayableStorage.js';
import { shouldRefreshPlaceVideoCache } from '../lib/placeVideoCache.js';
import { freeSearchYouTubeUrl, isFreeSearchLocation } from '../lib/freeSearchYouTubeLink.js';

const GOOGLE_FORM_URL = 'https://forms.gle/QgofLDzzYD6NfWYN7';
const LOAD_MORE_SESSION_MAX = 3;
const INITIAL_MAX_RESULTS = 10;
const LOAD_MORE_FIRST_MAX_RESULTS = 20;
const SESSION_CACHE_MAX = 30;

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

const PAGE_LIMIT_CODES = new Set([
  'page_ip_limited',
  'page_place_limited',
  'ip_quota',
  'global_quota',
]);

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

function placeKeyOnly(location) {
  return placeFetchKey(location, 'VIDEO');
}

// SPA 세션 메모리. load-more 결과만 기록한다(effect에서 쓰면 장소 전환 직후 빈 목록이 저장됨).
const sessionVideoCache = new Map();

function emptyLive() {
  return {
    rawVideos: [],
    nextPageToken: null,
    paginationSource: null,
    hasMorePages: false,
    loadMoreCount: 0,
    isLoadingMore: false,
    loadMoreNoNew: false,
  };
}

function peekSession(location) {
  if (!location?.name) return null;
  return sessionVideoCache.get(placeKeyOnly(location)) ?? null;
}

function rememberSession(placeKey, entry) {
  if (!placeKey || !entry) return;
  if (sessionVideoCache.has(placeKey)) sessionVideoCache.delete(placeKey);
  sessionVideoCache.set(placeKey, entry);
  while (sessionVideoCache.size > SESSION_CACHE_MAX) {
    const oldest = sessionVideoCache.keys().next().value;
    sessionVideoCache.delete(oldest);
  }
}

export function resetYouTubeSessionCacheForTests() {
  sessionVideoCache.clear();
}

function liveFromSession(mem) {
  return {
    rawVideos: mem.rawVideos,
    nextPageToken: mem.nextPageToken,
    paginationSource: mem.paginationSource,
    hasMorePages: mem.hasMorePages,
    loadMoreCount: mem.loadMoreCount,
    isLoadingMore: false,
    loadMoreNoNew: mem.loadMoreNoNew,
  };
}

export const useYouTubeSearch = (location, mediaMode) => {
  const boot = peekSession(location);
  const [rawVideos, setRawVideos] = useState(() => boot?.rawVideos ?? []);
  const [isLoading, setIsLoading] = useState(() => !boot);
  const [fetchError, setFetchError] = useState(false);
  const [isEmptyResult, setIsEmptyResult] = useState(() => (boot ? boot.rawVideos.length === 0 : false));
  const [, setNextPageToken] = useState(() => boot?.nextPageToken ?? null);
  const [, setPaginationSource] = useState(() => boot?.paginationSource ?? null);
  const [hasMorePages, setHasMorePages] = useState(() => boot?.hasMorePages ?? false);
  const [loadMoreCount, setLoadMoreCount] = useState(() => boot?.loadMoreCount ?? 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [loadMoreLimitCode, setLoadMoreLimitCode] = useState(null);
  const [fetchLimitCode, setFetchLimitCode] = useState(null);
  const [loadMoreNoNew, setLoadMoreNoNew] = useState(() => boot?.loadMoreNoNew ?? false);
  const [unplayableBump, setUnplayableBump] = useState(0);

  const fetchContextRef = useRef(boot?.ctx ?? null);
  const completedInitialKeysRef = useRef(new Set());
  const fetchGenRef = useRef(0);
  const placeKey = location?.name ? placeKeyOnly(location) : '';
  const placeKeyRef = useRef(placeKey);
  const liveRef = useRef(boot ? liveFromSession(boot) : emptyLive());

  if (boot && placeKey && !completedInitialKeysRef.current.has(placeFetchKey(location, 'VIDEO'))) {
    completedInitialKeysRef.current.add(placeFetchKey(location, 'VIDEO'));
  }

  // 장소가 바뀐 렌더에서만 비운다. 탭 전환은 같은 훅 인스턴스라 목록을 유지해야 한다.
  if (placeKey && placeKeyRef.current !== placeKey) {
    placeKeyRef.current = placeKey;
    fetchGenRef.current += 1;
    completedInitialKeysRef.current.clear();
    const mem = sessionVideoCache.get(placeKey) ?? null;
    if (mem) {
      rememberSession(placeKey, mem);
      fetchContextRef.current = mem.ctx;
      liveRef.current = liveFromSession(mem);
      completedInitialKeysRef.current.add(placeFetchKey(location, 'VIDEO'));
      setRawVideos(mem.rawVideos);
      setIsLoading(false);
      setFetchError(false);
      setFetchLimitCode(null);
      setIsEmptyResult(mem.rawVideos.length === 0);
      setNextPageToken(mem.nextPageToken);
      setPaginationSource(mem.paginationSource);
      setHasMorePages(mem.hasMorePages);
      setLoadMoreCount(mem.loadMoreCount);
      setIsLoadingMore(false);
      setLoadMoreError(false);
      setLoadMoreLimitCode(null);
      setLoadMoreNoNew(mem.loadMoreNoNew);
    } else {
      fetchContextRef.current = null;
      liveRef.current = emptyLive();
      setRawVideos([]);
      setIsLoading(true);
      setFetchError(false);
      setFetchLimitCode(null);
      setIsEmptyResult(false);
      setNextPageToken(null);
      setPaginationSource(null);
      setHasMorePages(false);
      setLoadMoreCount(0);
      setIsLoadingMore(false);
      setLoadMoreError(false);
      setLoadMoreLimitCode(null);
      setLoadMoreNoNew(false);
    }
  }

  const videos = useMemo(
    () => filterPlayableVideos(rawVideos),
    [rawVideos, unplayableBump],
  );

  const placeYouTubeUrl = useMemo(
    () => freeSearchYouTubeUrl(location),
    [
      location?.name,
      location?.name_en,
      location?.city,
      location?.parentCity,
    ],
  );

  const externalYouTubeUrl = useMemo(() => (
    isFreeSearchLocation(location) ? placeYouTubeUrl : ''
  ), [
    placeYouTubeUrl,
    location?.id,
    location?.place_id,
    location?.placeId,
    location?.slug,
    location?.canonical_slug,
  ]);

  const invokeEdge = useCallback(async (body) => {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
      'fetch-place-videos',
      { body },
    );
    let code = edgeData?.error;
    if (!code && edgeError?.context && typeof edgeError.context.json === 'function') {
      try {
        const parsed = await edgeError.context.clone().json();
        code = parsed?.error;
      } catch {
        code = null;
      }
    }
    if (PAGE_LIMIT_CODES.has(code)) {
      const err = new Error(code);
      err.limitCode = code;
      throw err;
    }
    if (edgeError) {
      throw new Error('영상을 가져오는 데 실패했습니다.');
    }
    if (!edgeData?.success) {
      throw new Error(edgeData?.error || 'YouTube 검색에 실패했습니다.');
    }
    return edgeData;
  }, []);

  const runInitialFetch = useCallback(async (gen = fetchGenRef.current) => {
    if (fetchGenRef.current !== gen) return;
    const cacheKey = getPlaceStableKey(location);
    const dbCandidates = buildPlaceDbIdCandidates(location);
    const statsId = getPlaceStatsId(location);
    const { query: searchQuery, fallbackQuery } = resolvePlaceVideoQueries(location);
    const placeId = statsId || cacheKey;
    const currentPlaceKey = placeKeyOnly(location);

    fetchContextRef.current = {
      searchQuery,
      fallbackQuery,
      placeId,
      placeKey: currentPlaceKey,
      fromCache: false,
    };

    setFetchError(false);
    setFetchLimitCode(null);
    setIsEmptyResult(false);
    setNextPageToken(null);
    setPaginationSource(null);
    setHasMorePages(false);
    setLoadMoreCount(0);
    setLoadMoreError(false);
    setLoadMoreLimitCode(null);
    setLoadMoreNoNew(false);
    liveRef.current = emptyLive();

    const candidateIds = dbCandidates.length ? dbCandidates : [cacheKey];
    let cachedData = null;
    const cachedRes = await supabase
      .from('place_videos')
      .select('videos, next_retry_at')
      .in('place_id', candidateIds)
      .limit(1)
      .maybeSingle();
    if (cachedRes.error) {
      const legacy = await supabase
        .from('place_videos')
        .select('videos')
        .in('place_id', candidateIds)
        .limit(1)
        .maybeSingle();
      cachedData = legacy.data;
    } else {
      cachedData = cachedRes.data;
    }

    if (fetchGenRef.current !== gen) return;

    if (cachedData && Array.isArray(cachedData.videos) && !shouldRefreshPlaceVideoCache(cachedData)) {
      console.log(`[L2] DB Cache found for: ${location.name} (Items: ${cachedData.videos.length})`);
      fetchContextRef.current = {
        searchQuery,
        fallbackQuery,
        placeId,
        placeKey: currentPlaceKey,
        fromCache: true,
      };
      liveRef.current = {
        ...emptyLive(),
        rawVideos: cachedData.videos,
        hasMorePages: cachedData.videos.length > 0,
      };
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

    if (fetchGenRef.current !== gen) return;

    const list = edgeData.videos || [];
    const token = edgeData.nextPageToken || null;
    const source = edgeData.paginationSource || null;
    liveRef.current = {
      ...emptyLive(),
      rawVideos: list,
      nextPageToken: token,
      paginationSource: source,
      hasMorePages: Boolean(token) || list.length > 0,
    };
    setRawVideos(list);
    setNextPageToken(token);
    setPaginationSource(source);
    setHasMorePages(Boolean(token) || list.length > 0);
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
    if (externalYouTubeUrl) {
      setRawVideos([]);
      setIsLoading(false);
      setFetchError(false);
      setFetchLimitCode(null);
      setIsEmptyResult(false);
      setHasMorePages(false);
      return;
    }

    if (!location?.name) return;
    if (mediaMode !== 'VIDEO') return;

    const key = placeFetchKey(location, mediaMode);
    if (completedInitialKeysRef.current.has(key)) {
      queueMicrotask(() => setIsLoading(false));
      return;
    }

    const currentPlaceKey = placeKeyOnly(location);
    const mem = sessionVideoCache.get(currentPlaceKey);
    if (mem) {
      rememberSession(currentPlaceKey, mem);
      fetchContextRef.current = mem.ctx;
      liveRef.current = liveFromSession(mem);
      setRawVideos(mem.rawVideos);
      setNextPageToken(mem.nextPageToken);
      setPaginationSource(mem.paginationSource);
      setHasMorePages(mem.hasMorePages);
      setLoadMoreCount(mem.loadMoreCount);
      setLoadMoreNoNew(mem.loadMoreNoNew);
      setLoadMoreError(false);
      setFetchError(false);
      setIsEmptyResult(mem.rawVideos.length === 0);
      completedInitialKeysRef.current.add(key);
      queueMicrotask(() => setIsLoading(false));
      return;
    }

    const gen = fetchGenRef.current;
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        await runInitialFetch(gen);
        if (!cancelled && fetchGenRef.current === gen) {
          completedInitialKeysRef.current.add(key);
        }
      } catch (err) {
        console.error('[useYouTubeSearch] Error:', err);
        if (!cancelled && fetchGenRef.current === gen) {
          setFetchError(true);
          setFetchLimitCode(err?.limitCode || null);
        }
      } finally {
        if (!cancelled && fetchGenRef.current === gen) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [externalYouTubeUrl, location?.id, location?.slug, location?.canonical_slug, location?.name, location?.country, location?.name_en, mediaMode, runInitialFetch]);

  const retry = useCallback(async () => {
    if (externalYouTubeUrl || mediaMode !== 'VIDEO' || !location?.name) return;
    const currentPlaceKey = placeKeyOnly(location);
    sessionVideoCache.delete(currentPlaceKey);
    completedInitialKeysRef.current.delete(placeFetchKey(location, mediaMode));
    fetchGenRef.current += 1;
    const gen = fetchGenRef.current;
    setIsLoading(true);
    setFetchError(false);
    setFetchLimitCode(null);
    setIsEmptyResult(false);
    try {
      await runInitialFetch(gen);
      if (fetchGenRef.current === gen) {
        completedInitialKeysRef.current.add(placeFetchKey(location, mediaMode));
      }
    } catch (err) {
      console.error('[useYouTubeSearch] retry Error:', err);
      if (fetchGenRef.current === gen) {
        setFetchError(true);
        setFetchLimitCode(err?.limitCode || null);
      }
    } finally {
      if (fetchGenRef.current === gen) setIsLoading(false);
    }
  }, [externalYouTubeUrl, mediaMode, location?.name, location?.id, location?.slug, location?.canonical_slug, location?.country, location?.name_en, runInitialFetch]);

  const loadMore = useCallback(async () => {
    if (externalYouTubeUrl) return;
    const ctx = fetchContextRef.current;
    const live = liveRef.current;
    if (
      !ctx?.placeKey ||
      ctx.placeKey !== placeKeyRef.current ||
      live.isLoadingMore ||
      live.loadMoreCount >= LOAD_MORE_SESSION_MAX ||
      !live.hasMorePages
    ) {
      return;
    }

    const gen = fetchGenRef.current;
    const placeKeyAtStart = ctx.placeKey;
    const snapshotVideos = live.rawVideos;
    const pageToken = live.nextPageToken;
    const pageSource = live.paginationSource;
    live.isLoadingMore = true;
    setIsLoadingMore(true);
    setLoadMoreError(false);
    setLoadMoreLimitCode(null);
    setLoadMoreNoNew(false);

    try {
      const excludeVideoIds = snapshotVideos.map((v) => v.id).filter(Boolean);
      const isFirstFromCache = ctx.fromCache && !pageToken;
      const edgeData = await invokeEdge({
        query: ctx.searchQuery,
        fallbackQuery: ctx.fallbackQuery,
        placeId: ctx.placeId,
        maxResults: isFirstFromCache ? LOAD_MORE_FIRST_MAX_RESULTS : INITIAL_MAX_RESULTS,
        skipUpsert: true,
        pageToken: pageToken || undefined,
        paginationSource: pageToken && pageSource ? pageSource : undefined,
        excludeVideoIds,
      });

      if (fetchGenRef.current !== gen || placeKeyRef.current !== placeKeyAtStart) return;

      const seen = new Set(excludeVideoIds);
      const incoming = (edgeData.videos || []).filter((v) => v?.id && !seen.has(v.id));
      const token = edgeData.nextPageToken || null;

      if (incoming.length === 0) {
        liveRef.current = {
          ...liveRef.current,
          hasMorePages: false,
          loadMoreNoNew: true,
        };
        setLoadMoreNoNew(true);
        setHasMorePages(false);
      } else {
        const merged = mergeVideosById(liveRef.current.rawVideos, incoming);
        const nextCtx = ctx.fromCache && isFirstFromCache ? { ...ctx, fromCache: false } : ctx;
        const nextSource = edgeData.paginationSource || null;
        const nextHasMore = Boolean(token);
        fetchContextRef.current = nextCtx;
        liveRef.current = {
          ...liveRef.current,
          rawVideos: merged,
          nextPageToken: token,
          paginationSource: nextSource,
          hasMorePages: nextHasMore,
          loadMoreNoNew: false,
        };
        setRawVideos((prev) => mergeVideosById(prev, incoming));
        setNextPageToken(token);
        setPaginationSource(nextSource);
        setHasMorePages(nextHasMore);
      }
    } catch (err) {
      console.error('[useYouTubeSearch] loadMore Error:', err);
      if (fetchGenRef.current === gen) {
        if (err?.limitCode) {
          setLoadMoreLimitCode(err.limitCode);
          setLoadMoreError(false);
        } else {
          setLoadMoreError(true);
        }
      }
    } finally {
      if (fetchGenRef.current === gen && placeKeyRef.current === placeKeyAtStart) {
        const nextCount = liveRef.current.loadMoreCount + 1;
        liveRef.current.loadMoreCount = nextCount;
        liveRef.current.isLoadingMore = false;
        setLoadMoreCount((c) => c + 1);
        setIsLoadingMore(false);
        const nextCtx = fetchContextRef.current;
        if (nextCtx?.placeKey) {
          rememberSession(nextCtx.placeKey, {
            ctx: nextCtx,
            rawVideos: liveRef.current.rawVideos,
            nextPageToken: liveRef.current.nextPageToken,
            paginationSource: liveRef.current.paginationSource,
            hasMorePages: liveRef.current.hasMorePages,
            loadMoreCount: nextCount,
            loadMoreNoNew: liveRef.current.loadMoreNoNew,
          });
        }
      }
    }
  }, [invokeEdge, externalYouTubeUrl]);

  const markUnplayable = useCallback((videoId) => {
    markYoutubeIdUnplayable(videoId);
    setUnplayableBump((n) => n + 1);
  }, []);

  const canLoadMore =
    !externalYouTubeUrl &&
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
    loadMoreLimitCode,
    fetchLimitCode,
    externalYouTubeUrl,
    placeYouTubeUrl,
    loadMoreNoNew,
    markUnplayable,
    googleFormUrl: GOOGLE_FORM_URL,
  };
};
