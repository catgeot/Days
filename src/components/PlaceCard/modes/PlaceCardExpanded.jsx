// 🚨 [Fix/New] 훅 파라미터 전달 오류 수정: useYouTubeSearch(location) 단일 객체 전달로 변경
// 🚨 [Fix/New] 상태 구조 분해 할당 확장: isLoading, error, googleFormUrl 추가 확보
// 🚨 [Fix/New] activeInfo 객체에 비관적 UI(Empty State) 대응용 데이터 추가 탑재 (Props 우회 전달)

import React, { useState, useEffect, useRef } from 'react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';
import { useWikiData } from '../hooks/useWikiData'; 
import { useYouTubeSearch } from '../../../pages/Home/hooks/useYouTubeSearch'; 

const PlaceCardExpanded = ({ location, isBookmarked, onClose, chatData, galleryData, onToggleBookmark }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  
  const [isAiMode, setIsAiMode] = useState(false);
  
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  // 🚨 [Fix] 파라미터 버그 수정 (location 단일 객체 전달) 및 Props 확장
  const { 
    videos: spotVideos, 
    isLoading: isVideoLoading, 
    error: videoError, 
    googleFormUrl 
  } = useYouTubeSearch(location);

  const activeVideoId = selectedVideoId || (spotVideos.length > 0 ? spotVideos[0].id : null);
  const activeVideoData = spotVideos.find(v => v.id === activeVideoId) || (spotVideos.length > 0 ? spotVideos[0] : null);

  const queryKey = location.name; 
  const { wikiData: currentWikiData, isWikiLoading } = useWikiData(queryKey);

  const getActiveInfo = () => {
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
        // 🚨 [Safe-Path] 데이터가 완벽하지 않을 때(Null)를 대비한 비관적 맵핑
        const isVideoEmpty = !isVideoLoading && spotVideos.length === 0;
        
        return {
            mode: 'VIDEO',
            title: activeVideoData?.title || "영상 정보 없음",
            summary: activeVideoData?.ai_context?.summary || null, 
            tags: activeVideoData?.ai_context?.tags || ['Travel', 'Video'],
            ai_context: activeVideoData?.ai_context || null,
            // 🚨 [New] VideoInfoView에서 사용할 비관적 UI 상태값 추가 전달
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
  };

  const activeInfo = getActiveInfo();

  const handleSeekTime = (timeValue) => {
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
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
      setShowUI(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

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
        activeInfo={activeInfo} // 🚨 [Drilling] 비관적 상태값이 포함된 정보 전달
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
            // 🚨 [Drilling] YouTubePlayerView까지 전달될 수 있도록 Props 주입
            isVideoLoading={isVideoLoading}
            videoError={videoError}
            googleFormUrl={googleFormUrl}
        />
      </div>
    </div>
  );
};
export default PlaceCardExpanded;