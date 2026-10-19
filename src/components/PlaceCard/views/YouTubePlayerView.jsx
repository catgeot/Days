import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Minimize2, Play, Sparkles, List, X, ChevronLeft, ChevronRight, AlertCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { mobilePlaceHeaderSpacerClass, mobileLandscapeChromeHidden } from '../common/mobilePlaceHeaderInset';
import { decodeHtmlEntities } from '../../../utils/decodeHtmlEntities';
import {
  YOUTUBE_POST_MESSAGE_TARGET,
  YOUTUBE_ALLOWED_MESSAGE_ORIGINS,
  YOUTUBE_UNPLAYABLE_ERROR_CODES,
} from '../../../utils/youtubePlayerMessaging';
import { isYoutubeForceEmbedErrorEnabled } from '../../../utils/youtubeEmbedQaHook';

const MAX_CONSECUTIVE_EMBED_FAILURES = 3;

const YouTubePlayerView = forwardRef(({
  videoId,
  videos,
  isFullScreen,
  toggleFullScreen,
  showUI,
  onVideoSelect,
  isLoading = false,
  googleFormUrl = "https://forms.gle/QgofLDzzYD6NfWYN7",
  mobileSecondaryNav = null,
  fetchError = false,
  onRetry,
  onRetryUnplayable,
  isEmptyResult = false,
  onLoadMore,
  canLoadMore = false,
  isLoadingMore = false,
  onVideoUnplayable,
  loadMoreError = false,
  loadMoreLimitCode = null,
  fetchLimitCode = null,
  externalYouTubeUrl = '',
  placeYouTubeUrl = '',
  loadMoreNoNew = false,
}, ref) => {
  const { t } = useTranslation();
  const limitMessage = (code) => {
    if (code === 'page_ip_limited') return t('place.video.loadMoreIpLimit');
    if (code === 'page_place_limited') return t('place.video.loadMorePlaceLimit');
    if (code === 'ip_quota') return t('place.video.ipQuota');
    if (code === 'global_quota') return t('place.video.globalQuota');
    return t('place.video.loadMoreFailed');
  };
  const emptyQuotaMessage = (code) => (
    code === 'global_quota' ? t('place.video.globalQuotaEmpty') : t('place.video.ipQuotaEmpty')
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  const iframeRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const currentVideoIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const preservePlaybackRef = useRef(false);
  const prevVideoIdRef = useRef(videoId);
  const retrySessionNoAdvanceRef = useRef(false);
  const lastPlayViaPlaylistRef = useRef(false);
  const consecutiveEmbedFailuresRef = useRef(0);
  const lastEmbedErrorRef = useRef({ id: null, at: 0 });
  const [failedPickVideo, setFailedPickVideo] = useState(null);
  const failedPickVideoRef = useRef(null);
  const [unplayableRetryExhausted, setUnplayableRetryExhausted] = useState(false);
  const [retrySessionYoutubeCta, setRetrySessionYoutubeCta] = useState(false);

  const retryExhaustedStorageKey =
    typeof window !== 'undefined' ? `gateo.yt.retryExhausted:${window.location.pathname}` : '';
  const retrySessionStorageKey =
    typeof window !== 'undefined' ? `gateo.yt.retrySession:${window.location.pathname}` : '';

  const videoList = videos || [];
  const currentVideo = videoList[currentVideoIndex];
  const uiVideo = failedPickVideo || currentVideo;

  useEffect(() => {
    failedPickVideoRef.current = failedPickVideo;
  }, [failedPickVideo]);

  useEffect(() => {
    currentVideoIndexRef.current = currentVideoIndex;
  }, [currentVideoIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const displayTitle = (title) => {
    const decoded = decodeHtmlEntities(title || '').trim();
    return decoded || t('place.fallback.youtubeVideo');
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const postToPlayer = useCallback((payload) => {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage(JSON.stringify(payload), YOUTUBE_POST_MESSAGE_TARGET);
    }
  }, []);

  const markRetryExhausted = useCallback(() => {
    setUnplayableRetryExhausted(true);
    if (retryExhaustedStorageKey) {
      try {
        sessionStorage.setItem(retryExhaustedStorageKey, '1');
      } catch {
        /* ignore */
      }
    }
  }, [retryExhaustedStorageKey]);

  const clearRetryExhausted = useCallback(() => {
    setUnplayableRetryExhausted(false);
    setRetrySessionYoutubeCta(false);
    setFailedPickVideo(null);
    lastPlayViaPlaylistRef.current = false;
    retrySessionNoAdvanceRef.current = false;
    consecutiveEmbedFailuresRef.current = 0;
    if (retryExhaustedStorageKey) {
      try {
        sessionStorage.removeItem(retryExhaustedStorageKey);
      } catch {
        /* ignore */
      }
    }
    if (retrySessionStorageKey) {
      try {
        sessionStorage.removeItem(retrySessionStorageKey);
      } catch {
        /* ignore */
      }
    }
  }, [retryExhaustedStorageKey, retrySessionStorageKey]);

  const isRetrySessionNoAdvance = useCallback(() => {
    if (retrySessionNoAdvanceRef.current) return true;
    if (!retrySessionStorageKey) return false;
    try {
      return sessionStorage.getItem(retrySessionStorageKey) === '1';
    } catch {
      return false;
    }
  }, [retrySessionStorageKey]);

  const handleEmbedErrorInRetrySession = useCallback((failedId) => {
    if (onVideoUnplayable) onVideoUnplayable(failedId);
    markRetryExhausted();
    preservePlaybackRef.current = false;
    setIsPlaying(false);
    setIsPaused(true);
    setRetrySessionYoutubeCta(true);
  }, [onVideoUnplayable, markRetryExhausted]);

  const handleUserPickEmbedError = useCallback((failedVideo) => {
    lastPlayViaPlaylistRef.current = false;
    if (!failedVideo?.id) return;
    const snapshot = { id: failedVideo.id, title: failedVideo.title };
    failedPickVideoRef.current = snapshot;
    setFailedPickVideo(snapshot);
    if (onVideoUnplayable) onVideoUnplayable(failedVideo.id);
    preservePlaybackRef.current = false;
    setIsPlaying(false);
    setIsPaused(true);
    setRetrySessionYoutubeCta(true);
  }, [onVideoUnplayable]);

  const stopAfterEmbedFailures = useCallback(() => {
    preservePlaybackRef.current = false;
    setIsPlaying(false);
    setIsPaused(true);
    setRetrySessionYoutubeCta(true);
  }, []);

  const advanceToNextVideo = useCallback((wasPlaying) => {
    lastPlayViaPlaylistRef.current = false;
    const list = videos || [];
    const idx = currentVideoIndexRef.current;
    const failedId = list[idx]?.id;
    if (!failedId) return;

    if (isRetrySessionNoAdvance()) {
      handleEmbedErrorInRetrySession(failedId);
      return;
    }

    if (onVideoUnplayable) onVideoUnplayable(failedId);
    consecutiveEmbedFailuresRef.current += 1;

    if (consecutiveEmbedFailuresRef.current >= MAX_CONSECUTIVE_EMBED_FAILURES) {
      stopAfterEmbedFailures();
      return;
    }

    const afterFilter = list.filter((v) => v.id !== failedId);
    if (afterFilter.length === 0 || idx >= afterFilter.length) {
      setIsPlaying(false);
      setIsPaused(true);
      return;
    }

    const nextVideo = afterFilter[idx];

    preservePlaybackRef.current = wasPlaying;
    setCurrentVideoIndex(idx);
    if (onVideoSelect) onVideoSelect(nextVideo.id);
    if (wasPlaying) {
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [videos, onVideoSelect, onVideoUnplayable, isRetrySessionNoAdvance, handleEmbedErrorInRetrySession, stopAfterEmbedFailures]);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      if (!isPlaying) {
          setIsPlaying(true);
          setIsPaused(false);
          setTimeout(() => {
            postToPlayer({ event: 'command', func: 'seekTo', args: [seconds, true] });
            postToPlayer({ event: 'command', func: 'playVideo', args: [] });
          }, 500);
          return;
      }
      postToPlayer({ event: 'command', func: 'seekTo', args: [seconds, true] });
      postToPlayer({ event: 'command', func: 'playVideo', args: [] });
    },
    playVideo: () => {
        if (!isPlaying) {
            setIsPlaying(true);
            setIsPaused(false);
        }
        postToPlayer({ event: 'command', func: 'playVideo', args: [] });
    }
  }));

  useEffect(() => {
      const handleMessage = (event) => {
          if (!YOUTUBE_ALLOWED_MESSAGE_ORIGINS.has(event.origin)) return;
          if (event.source !== iframeRef.current?.contentWindow) return;
          if (!event.data) return;

          let data = event.data;
          if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch { return; }
          }

          if (data?.event === 'infoDelivery' && data.info && data.info.playerState !== undefined) {
              const state = data.info.playerState;
              const isActive = state === 1 || state === 3;
              setIsPaused(!isActive);
          }

          if (data?.event === 'onError' && typeof data.info === 'number') {
            if (YOUTUBE_UNPLAYABLE_ERROR_CODES.has(data.info)) {
              if (failedPickVideoRef.current?.id) return;
              const list = videos || [];
              const failedId = list[currentVideoIndexRef.current]?.id;
              if (!failedId) return;
              const now = Date.now();
              if (
                lastEmbedErrorRef.current.id === failedId
                && now - lastEmbedErrorRef.current.at < 900
              ) {
                return;
              }
              lastEmbedErrorRef.current = { id: failedId, at: now };
              if (lastPlayViaPlaylistRef.current) {
                const picked = list[currentVideoIndexRef.current];
                if (picked) handleUserPickEmbedError(picked);
              } else if (isRetrySessionNoAdvance()) {
                handleEmbedErrorInRetrySession(failedId);
              } else {
                advanceToNextVideo(isPlayingRef.current);
              }
            }
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, [advanceToNextVideo, isPlaying, videos, isRetrySessionNoAdvance, handleEmbedErrorInRetrySession, handleUserPickEmbedError]);

  useEffect(() => {
    if (!isPlaying || !currentVideo?.id) return;
    const timer = setTimeout(() => {
      postToPlayer({ event: 'listening' });
    }, 300);
    return () => clearTimeout(timer);
  }, [isPlaying, currentVideo?.id, postToPlayer]);

  useEffect(() => {
    if (!isPlaying || !currentVideo?.id || !isYoutubeForceEmbedErrorEnabled()) return;
    const timer = setTimeout(() => {
      if (lastPlayViaPlaylistRef.current && currentVideo) {
        handleUserPickEmbedError(currentVideo);
      } else if (isRetrySessionNoAdvance()) {
        handleEmbedErrorInRetrySession(currentVideo.id);
      } else {
        advanceToNextVideo(isPlayingRef.current);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [isPlaying, currentVideo, advanceToNextVideo, isRetrySessionNoAdvance, handleEmbedErrorInRetrySession, handleUserPickEmbedError]);

  useEffect(() => {
    queueMicrotask(() => {
      const list = videos || [];
      if (failedPickVideo?.id) {
        if (videoId && videoId !== failedPickVideo.id && list.some((v) => v.id === videoId)) {
          setFailedPickVideo(null);
        } else {
          prevVideoIdRef.current = videoId;
          return;
        }
      }
      let targetIndex = 0;
      if (videoId && list.length > 0) {
        const found = list.findIndex((v) => v.id === videoId);
        targetIndex = found >= 0 ? found : 0;
      }
      setCurrentVideoIndex(targetIndex);

      if (preservePlaybackRef.current) {
        preservePlaybackRef.current = false;
        prevVideoIdRef.current = videoId;
        return;
      }

      if (prevVideoIdRef.current !== videoId) {
        prevVideoIdRef.current = videoId;
        setIsPlaying(false);
        setIsPaused(true);
      }
    });
  }, [videoId, videos, failedPickVideo]);

  useEffect(() => {
    if (uiVideo?.id) {
      queueMicrotask(() => {
        setThumbnailUrl(`https://img.youtube.com/vi/${uiVideo.id}/hqdefault.jpg`);
      });
    }
  }, [uiVideo]);

  const handleImageError = () => {
    if (uiVideo && thumbnailUrl && !thumbnailUrl.includes('mqdefault')) {
      setThumbnailUrl(`https://img.youtube.com/vi/${uiVideo.id}/mqdefault.jpg`);
    }
  };

  const handlePlay = useCallback(() => {
    lastPlayViaPlaylistRef.current = false;
    if (!currentVideo) return;
    setFailedPickVideo(null);
    setRetrySessionYoutubeCta(false);
    consecutiveEmbedFailuresRef.current = 0;
    lastEmbedErrorRef.current = { id: null, at: 0 };
    setIsPlaying(true);
    setIsPaused(false);
  }, [currentVideo]);

  const selectVideoAndPlay = useCallback((video, idx) => {
    setFailedPickVideo(null);
    lastPlayViaPlaylistRef.current = true;
    setRetrySessionYoutubeCta(false);
    consecutiveEmbedFailuresRef.current = 0;
    lastEmbedErrorRef.current = { id: null, at: 0 };
    preservePlaybackRef.current = true;
    setCurrentVideoIndex(idx);
    if (onVideoSelect) onVideoSelect(video.id);
    setIsPlaying(true);
    setIsPaused(false);
  }, [onVideoSelect]);

  const watchOnYouTubeUrl = failedPickVideo
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(failedPickVideo.id)}`
    : (externalYouTubeUrl || placeYouTubeUrl);
  const showFetchError = !isLoading && fetchError;
  const quotaWithoutVideos = showFetchError
    && (fetchLimitCode === 'ip_quota' || fetchLimitCode === 'global_quota')
    && videoList.length === 0;
  const showEmpty = !isLoading && !fetchError && isEmptyResult && videoList.length === 0;
  const showNoPlayable = !isLoading && !fetchError && !isEmptyResult && videoList.length === 0;

  useEffect(() => {
    if (!showNoPlayable || !retryExhaustedStorageKey) return;
    try {
      if (sessionStorage.getItem(retryExhaustedStorageKey) === '1') {
        setUnplayableRetryExhausted(true);
      }
    } catch {
      /* ignore */
    }
  }, [showNoPlayable, retryExhaustedStorageKey]);

  useEffect(() => {
    if (showNoPlayable || showEmpty) {
      setIsPlaying(false);
      setIsPaused(true);
      preservePlaybackRef.current = false;
    }
  }, [showNoPlayable, showEmpty]);

  const handleRetryUnplayable = useCallback(() => {
    clearRetryExhausted();
    retrySessionNoAdvanceRef.current = true;
    if (retrySessionStorageKey) {
      try {
        sessionStorage.setItem(retrySessionStorageKey, '1');
      } catch {
        /* ignore */
      }
    }
    preservePlaybackRef.current = false;
    setIsPlaying(false);
    setIsPaused(true);
    onRetryUnplayable?.();
  }, [clearRetryExhausted, onRetryUnplayable, retrySessionStorageKey]);

  useEffect(() => {
    if (!retrySessionStorageKey) return;
    try {
      if (sessionStorage.getItem(retrySessionStorageKey) === '1') {
        retrySessionNoAdvanceRef.current = true;
      }
    } catch {
      /* ignore */
    }
  }, [retrySessionStorageKey]);

  const primaryCtaClass =
    'group flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.3)]';
  const secondaryCtaClass =
    'group flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-bold transition-all active:scale-95 border border-white/10';

  const watchOnYouTubeButton = watchOnYouTubeUrl ? (
    <a
      href={watchOnYouTubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={primaryCtaClass}
    >
      {t('place.video.openOnYouTube')}
      <ExternalLink size={14} className="opacity-50" />
    </a>
  ) : null;

  const retryButton = onRetry ? (
    <button
      type="button"
      onClick={() => onRetry?.()}
      disabled={isLoading}
      className={`${secondaryCtaClass} disabled:opacity-40`}
    >
      <RotateCcw size={18} />
      {t('place.video.retry')}
    </button>
  ) : null;

  const recommendFormButton = (
    <a
      href={googleFormUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={secondaryCtaClass}
    >
      <Sparkles size={18} />
      {t('place.video.recommend')}
      <ExternalLink size={14} className="opacity-50" />
    </a>
  );

  const retryUnplayableButton = onRetryUnplayable && !unplayableRetryExhausted ? (
    <button
      type="button"
      onClick={handleRetryUnplayable}
      disabled={isLoading}
      className={`${secondaryCtaClass} disabled:opacity-40`}
    >
      <RotateCcw size={18} />
      {t('place.video.retry')}
    </button>
  ) : null;

  const emptyOrUnplayableActions = (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      {watchOnYouTubeButton}
      {showNoPlayable && unplayableRetryExhausted ? null : showNoPlayable ? retryUnplayableButton : retryButton}
      {showNoPlayable && unplayableRetryExhausted ? null : recommendFormButton}
    </div>
  );

  return (
    <div
      className={`flex flex-col flex-1 w-full h-full bg-[#05070a] md:rounded-[2rem] md:border md:border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 caret-transparent select-none outline-none ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}
    >
      <div className={mobilePlaceHeaderSpacerClass} aria-hidden="true" />
      {mobileSecondaryNav && (
        <div className={`md:hidden shrink-0 z-[215] relative border-b border-white/10 ${mobileLandscapeChromeHidden}`}>
          {mobileSecondaryNav}
        </div>
      )}

      <div className="flex-1 min-h-0 relative overflow-hidden">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
           <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
           <p className="text-white/40 text-sm animate-pulse">{t('place.video.loading')}</p>
        </div>
      ) : showFetchError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <AlertCircle size={40} className="text-white/20" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">{t('place.video.errorTitle')}</h3>
          {fetchLimitCode ? (
            <p className="text-white/60 text-sm mb-4 max-w-sm">
              {quotaWithoutVideos ? emptyQuotaMessage(fetchLimitCode) : limitMessage(fetchLimitCode)}
            </p>
          ) : (
            <p className="text-white/50 text-sm mb-6 max-w-xs">{t('place.video.errorBody')}</p>
          )}
          {quotaWithoutVideos ? (
            watchOnYouTubeButton
          ) : (
            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
              {watchOnYouTubeButton}
              {retryButton}
            </div>
          )}
        </div>
      ) : (showEmpty || showNoPlayable) ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <AlertCircle size={40} className="text-white/20" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">
            {showNoPlayable ? t('place.video.noPlayableTitle') : t('place.video.emptyTitle')}
          </h3>
          <p className="text-white/50 text-sm max-w-xs mb-8">
            {showNoPlayable ? t('place.video.noPlayableBody') : t('place.video.emptyBody')}
          </p>
          {emptyOrUnplayableActions}
        </div>
      ) : isPlaying ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <div className={`transition-all duration-500 mx-auto ${isFullScreen ? 'w-full h-full p-0 max-w-none' : 'w-full md:w-[98%] h-[100%] md:h-[95%] max-w-[1440px] md:rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] md:border md:border-white/5'}`}>
            <iframe
              key={currentVideo?.id}
              ref={iframeRef}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentVideo?.id}?autoplay=1&mute=0&modestbranding=1&rel=0&enablejsapi=1&origin=${window.location.origin}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      ) : (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center group ${retrySessionYoutubeCta ? '' : 'cursor-pointer'}`}
          onClick={retrySessionYoutubeCta ? undefined : handlePlay}
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110 transition-transform duration-700 group-hover:scale-125"
            style={{ backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none' }}
          />
          <div className="relative z-20 w-[90%] md:w-[80%] max-w-[1200px] aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20 group-hover:border-white/50 transition-all duration-300 transform group-hover:scale-105 bg-black/50">
             <img
               key={thumbnailUrl}
               src={thumbnailUrl}
               alt="Video Thumbnail"
               className="w-full h-full object-cover"
               onError={handleImageError}
             />
             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
                    <Play size={24} className="md:w-8 md:h-8 text-white fill-white ml-1 md:ml-2" />
                </div>
             </div>
          </div>
          <div className="absolute bottom-12 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
             <p className="text-sm md:text-lg font-bold drop-shadow-lg px-4">{displayTitle(uiVideo?.title)}</p>
          </div>
          {retrySessionYoutubeCta && watchOnYouTubeButton ? (
            <div
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {watchOnYouTubeButton}
            </div>
          ) : null}
        </div>
      )}

      {!showFetchError && !showEmpty && !showNoPlayable && videoList.length > 0 && showUI && (
        <div className={`hidden md:block absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[1000px] z-[210] transition-opacity duration-500
            ${(!isPlaying || isPaused) ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
          <div className="relative group/playlist">
            <button
              onClick={(e) => { e.stopPropagation(); scroll('left'); }}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white opacity-0 group-hover/playlist:opacity-100 transition-opacity hover:bg-red-600"
            >
              <ChevronLeft size={20} />
            </button>

            <div
              ref={scrollContainerRef}
              className="flex gap-4 p-4 overflow-x-auto scrollbar-hide snap-x no-scrollbar"
              style={{ scrollBehavior: 'smooth' }}
            >
              {videoList.map((video, idx) => (
                  <button
                      key={video.id + idx}
                      onClick={(e) => {
                          e.stopPropagation();
                          selectVideoAndPlay(video, idx);
                      }}
                      className={`relative flex-shrink-0 w-36 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 snap-center group/item ${currentVideoIndex === idx ? 'border-red-500 scale-105 shadow-[0_0_20px_rgba(220,38,38,0.5)] z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/50'}`}
                  >
                      <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} className="w-full h-full object-cover" alt="mini" />
                      {currentVideoIndex === idx && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <div className="flex gap-1 items-end h-3">
                                 <div className="w-1 bg-red-500 animate-[bounce_1s_infinite] h-full" />
                                 <div className="w-1 bg-red-500 animate-[bounce_1.2s_infinite] h-2/3" />
                                 <div className="w-1 bg-red-500 animate-[bounce_0.8s_infinite] h-full" />
                              </div>
                          </div>
                      )}
                      <div className="absolute bottom-0 left-0 w-full bg-black/80 text-[9px] text-white p-1.5 truncate opacity-0 group-hover/item:opacity-100 transition-opacity font-medium">
                          {displayTitle(video.title)}
                      </div>
                  </button>
              ))}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); scroll('right'); }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white opacity-0 group-hover/playlist:opacity-100 transition-opacity hover:bg-red-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {!isLoading && videoList.length > 0 && (canLoadMore || loadMoreError || loadMoreLimitCode || loadMoreNoNew) && (
        <div
          className={`hidden md:block absolute left-1/2 -translate-x-1/2 z-[220] w-[90%] max-w-md px-2 ${
            isPlaying
              ? 'bottom-3 md:bottom-4'
              : 'bottom-28 md:bottom-[13.5rem]'
          }`}
        >
          {canLoadMore && (
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={(e) => {
                e.stopPropagation();
                onLoadMore?.();
              }}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold disabled:opacity-50 transition-all"
            >
              {isLoadingMore ? t('place.video.loading') : t('place.video.loadMore')}
            </button>
          )}
          {(loadMoreLimitCode || loadMoreError) && (
            <p className={`text-center text-xs text-red-400/90 max-w-xs ${canLoadMore ? 'mt-2' : ''}`}>
              {limitMessage(loadMoreLimitCode)}
            </p>
          )}
          {loadMoreNoNew && !loadMoreError && (
            <p className={`text-center text-xs text-white/50 max-w-xs ${canLoadMore ? 'mt-2' : ''}`}>
              {t('place.video.loadMoreNoNew')}
            </p>
          )}
        </div>
      )}

      {!isFullScreen && (
        <div className={`md:hidden absolute bottom-32 right-4 z-[210] flex flex-col gap-3 transition-all duration-300
            ${(showUI || !isPlaying || isPaused) ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>

            {!showEmpty && !showFetchError && !showNoPlayable && videoList.length > 0 && (
              <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsMobileListOpen(true); }}
                  className="px-4 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-full shadow-2xl backdrop-blur-md border border-white/20 active:scale-95 transition-all"
              >
                  {t('place.video.openPlaylist')}
              </button>
            )}

        </div>
      )}

      {isMobileListOpen && videoList.length > 0 && (
        <div
            className="md:hidden fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
            onClick={() => setIsMobileListOpen(false)}
        >
            <div
                className="bg-[#05070a]/95 border border-white/10 rounded-3xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0 bg-black/50">
                    <div className="flex items-center gap-2">
                        <List size={18} className="text-red-500" />
                        <h3 className="text-white font-bold">{t('place.video.playlist', { count: videoList.length })}</h3>
                    </div>
                    <button onClick={() => setIsMobileListOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {videoList.map((video, idx) => (
                        <button
                            key={video.id + idx}
                            onClick={() => {
                                selectVideoAndPlay(video, idx);
                                setIsMobileListOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all mb-2 ${currentVideoIndex === idx ? 'bg-red-500/20 border border-red-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 border border-white/10">
                                <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} className="w-full h-full object-cover" alt="thumb" />
                                {currentVideoIndex === idx && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Play size={14} className="text-red-500 fill-red-500" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className={`text-sm line-clamp-2 leading-snug ${currentVideoIndex === idx ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{displayTitle(video.title)}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {!isLoading && (canLoadMore || loadMoreError || loadMoreLimitCode || loadMoreNoNew) && (
                  <div className="shrink-0 p-4 pt-3 border-t border-white/10 bg-black/50 space-y-2">
                    {canLoadMore && (
                      <button
                        type="button"
                        disabled={isLoadingMore}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadMore?.();
                        }}
                        className="w-full px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold disabled:opacity-50 transition-all"
                      >
                        {isLoadingMore ? t('place.video.loading') : t('place.video.loadMore')}
                      </button>
                    )}
                    {(loadMoreLimitCode || loadMoreError) && (
                      <p className="text-center text-xs text-red-400/90">
                        {limitMessage(loadMoreLimitCode)}
                      </p>
                    )}
                    {loadMoreNoNew && !loadMoreError && (
                      <p className="text-center text-xs text-white/50">
                        {t('place.video.loadMoreNoNew')}
                      </p>
                    )}
                  </div>
                )}
            </div>
        </div>
      )}

      <div className={`hidden md:flex absolute top-6 right-6 items-center gap-3 z-[220] transition-opacity ${(!showUI && isFullScreen) ? 'opacity-0' : 'opacity-100'}`}>
        {!showEmpty && !showFetchError && !showNoPlayable && videoList.length > 0 && (
          <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 shadow-lg">
              <Sparkles size={14} className="text-red-500 animate-pulse" />
              <span className="text-[10px] text-white font-bold tracking-widest uppercase">Cinema Mode</span>
          </div>
        )}
        <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl group">
          {isFullScreen ? <Minimize2 size={20} className="group-hover:scale-90 transition-transform"/> : <Maximize2 size={20} className="group-hover:scale-110 transition-transform"/>}
        </button>
      </div>
      </div>
    </div>
  );
});

export default YouTubePlayerView;
