import React, { useState, useEffect, useRef } from 'react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';
import { TRAVEL_VIDEOS } from '../../../pages/Home/data/travelVideos'; 
import { useWikiData } from '../hooks/useWikiData'; 

const PlaceCardExpanded = ({ location, isBookmarked, onClose, chatData, galleryData, onToggleBookmark }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  
  const [isAiMode, setIsAiMode] = useState(false);
  
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const spotVideos = TRAVEL_VIDEOS[location.id] || [];
  const activeVideoId = selectedVideoId || (spotVideos.length > 0 ? spotVideos[0].id : null);
  const activeVideoData = spotVideos.find(v => v.id === activeVideoId) || null;

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
    
    if (mediaMode === 'VIDEO' && activeVideoData) {
        const aiSummary = activeVideoData.ai_context?.summary;
        const aiTags = activeVideoData.ai_context?.tags;

        return {
            mode: 'VIDEO',
            title: activeVideoData.title,
            summary: aiSummary || "영상 설명 데이터를 불러오는 중입니다...", 
            tags: aiTags || ['Video', 'Trip'],
            ai_context: activeVideoData.ai_context 
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
            location={location} // 🚨 [Fix] 이곳에 location 데이터를 넘겨주는 파이프라인 연결 완료
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
        />
      </div>
    </div>
  );
};

export default PlaceCardExpanded;