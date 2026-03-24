import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';
import { useWikiData } from '../hooks/useWikiData';
import { useYouTubeSearch } from '../../../pages/Home/hooks/useYouTubeSearch';

const PlaceCardExpanded = React.memo(({ location, isBookmarked, onClose, chatData, galleryData, onToggleBookmark }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mediaModeParam = searchParams.get('tab')?.toUpperCase();
  const initialMode = ['GALLERY', 'VIDEO', 'WIKI', 'LOGBOOK', 'TOOLKIT'].includes(mediaModeParam) ? mediaModeParam : 'GALLERY';

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);

  const mediaMode = initialMode;
  const setMediaMode = useCallback((newMode) => {
      setSearchParams({ tab: newMode.toLowerCase() }, { replace: true });
  }, [setSearchParams]);

  const [selectedVideoId, setSelectedVideoId] = useState(null);

  const [isAiMode, setIsAiMode] = useState(false);

  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const {
    videos: spotVideos,
    isLoading: isVideoLoading,
    error: videoError,
    googleFormUrl
  } = useYouTubeSearch(location, mediaMode);

  const activeVideoId = selectedVideoId || (spotVideos.length > 0 ? spotVideos[0].id : null);
  const activeVideoData = useMemo(() => spotVideos.find(v => v.id === activeVideoId) || (spotVideos.length > 0 ? spotVideos[0] : null), [spotVideos, activeVideoId]);

  const queryKey = location.name;
  const { wikiData: currentWikiData, isWikiLoading } = useWikiData(queryKey, mediaMode);

  const activeInfo = useMemo(() => {
    if (mediaMode === 'GALLERY' && galleryData.selectedImg) {
        return {
            mode: 'PHOTO',
            title: '갤러리 상세보기',
            summary: galleryData.selectedImg.alt_description || galleryData.selectedImg.description || "이 장소에 대한 정보가 업데이트 중입니다.",
            tags: galleryData.selectedImg.tags ? galleryData.selectedImg.tags.map(t => t.title) : ['Photo'],
            ai_context: null
        };
    }

    if (mediaMode === 'VIDEO') {
        const isVideoEmpty = !isVideoLoading && spotVideos.length === 0;

        return {
            mode: 'VIDEO',
            title: activeVideoData?.title || "영상 정보 없음",
            summary: activeVideoData?.ai_context?.summary || null,
            tags: activeVideoData?.ai_context?.tags || ['Travel', 'Video'],
            ai_context: activeVideoData?.ai_context || null,
            isLoading: isVideoLoading,
            isEmpty: isVideoEmpty,
            error: videoError,
            googleFormUrl: googleFormUrl
        };
    }

    return {
        mode: 'LOCATION',
        title: location.name,
        summary: location.desc || location.description || "장소에 대한 리뷰 정보가 없습니다.",
        tags: ['Travel', location.country || 'Unknown', ...(location.keywords || [])],
        ai_context: null
    };
  }, [mediaMode, galleryData.selectedImg, isVideoLoading, spotVideos.length, activeVideoData, videoError, googleFormUrl, location]);

  const handleSeekTime = useCallback((timeValue) => {
    if (!playerRef.current) return;
    setMediaMode('VIDEO');

    let seconds = 0;
    if (typeof timeValue === 'number') {
        seconds = timeValue;
    } else if (typeof timeValue === 'string') {
        const parts = timeValue.split(':').map(Number);
        if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    playerRef.current.seekTo(seconds, true);

    if (playerRef.current.playVideo && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
    }
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
      setShowUI(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullScreen(false);
    }
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  useEffect(() => {
    setIsAiMode(false);
  }, [galleryData.selectedImg]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/95 flex flex-col md:flex-row p-0 md:p-6 gap-0 md:gap-6 animate-fade-in overflow-hidden font-sans overscroll-none">
      <PlaceChatPanel
        location={location}
        isBookmarked={isBookmarked}
        onClose={onClose}
        chatData={chatData}
        activeInfo={activeInfo}
        isFullScreen={isFullScreen}
        mediaMode={mediaMode}
        setMediaMode={setMediaMode}
        onSeekTime={handleSeekTime}
        isAiMode={isAiMode}
        selectedImg={galleryData.selectedImg}
        onToggleBookmark={onToggleBookmark}
        wikiData={currentWikiData}
        isWikiLoading={isWikiLoading}
      />

      <div className={`flex-1 w-full min-w-0 h-full transition-all duration-500 z-10 ${isFullScreen ? 'fixed inset-0 z-[200]' : 'relative'}`}>
        <PlaceMediaPanel
            location={location}
            galleryData={galleryData}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            showUI={showUI}
            mediaMode={mediaMode}
            videoId={activeVideoId}
            videos={spotVideos}
            onVideoSelect={setSelectedVideoId}
            playerRef={playerRef}
            onAiModeChange={setIsAiMode}
            wikiData={currentWikiData}
            isWikiLoading={isWikiLoading}
            isVideoLoading={isVideoLoading}
            videoError={videoError}
            googleFormUrl={googleFormUrl}
        />
      </div>
    </div>
  );
});

export default PlaceCardExpanded;
