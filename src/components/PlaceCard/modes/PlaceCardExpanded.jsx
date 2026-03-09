// src/components/PlaceCard/modes/PlaceCardExpanded.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. 🚨 [Fix] 훅 파라미터 전달: API 누수를 막기 위해 useYouTubeSearch와 useWikiData에 현재 탭 상태인 `mediaMode`를 주입하여 지연 호출(Lazy Fetching)을 유도.
// 2. [Performance] React.memo를 적용하고 핸들러들을 최적화하여 리렌더링 억제.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';
import { useWikiData } from '../hooks/useWikiData'; 
import { useYouTubeSearch } from '../../../pages/Home/hooks/useYouTubeSearch'; 

const PlaceCardExpanded = React.memo(({ location, isBookmarked, onClose, chatData, galleryData, onToggleBookmark }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  
  const [isAiMode, setIsAiMode] = useState(false);
  
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  // 🚨 [Fix/New] Lazy Fetching 연결: mediaMode를 넘겨주어 탭이 열릴 때만 호출되도록 제어
  const { 
    videos: spotVideos, 
    isLoading: isVideoLoading, 
    error: videoError, 
    googleFormUrl 
  } = useYouTubeSearch(location, mediaMode);

  const activeVideoId = selectedVideoId || (spotVideos.length > 0 ? spotVideos[0].id : null);
  const activeVideoData = useMemo(() => spotVideos.find(v => v.id === activeVideoId) || (spotVideos.length > 0 ? spotVideos[0] : null), [spotVideos, activeVideoId]);

  const queryKey = location.name; 
  // 🚨 [Fix/New] 위키 데이터도 동일하게 지연 호출 적용
  const { wikiData: currentWikiData, isWikiLoading } = useWikiData(queryKey, mediaMode);

  const activeInfo = useMemo(() => {
    if (mediaMode === 'GALLERY' && galleryData.selectedImg) {
        return {
            mode: 'PHOTO',
            title: '갤러리 상세 정보',
            summary: galleryData.selectedImg.alt_description || galleryData.selectedImg.description || "사진에 대한 설명이 없습니다.",
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
        summary: location.desc || location.description || "이 장소에 대한 여행자들의 리뷰와 정보가 곧 업데이트될 예정입니다.",
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
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/95 flex flex-col md:flex-row p-0 md:p-6 gap-0 md:gap-6 animate-fade-in overflow-hidden font-sans">
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
