import React, { useState, useEffect, useRef } from 'react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';
import { TRAVEL_VIDEOS } from '../../../pages/Home/data/travelVideos'; 

const PlaceCardExpanded = ({ location, onClose, chatData, galleryData }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  
  // 🚨 [Fix] AI 분석 모드 상태 추가 (갤러리 5초 응시 감지용)
  const [isAiMode, setIsAiMode] = useState(false);
  
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  // 1. 데이터 조회
  const spotVideos = TRAVEL_VIDEOS[location.id] || [];
  const activeVideoId = selectedVideoId || (spotVideos.length > 0 ? spotVideos[0].id : null);
  const activeVideoData = spotVideos.find(v => v.id === activeVideoId) || null;

  // 통합 정보 객체 생성
  const getActiveInfo = () => {
    // Case A: 갤러리 모드 (사진)
    if (mediaMode === 'GALLERY' && galleryData.selectedImg) {
        return {
            mode: 'PHOTO',
            title: '갤러리 상세 정보',
            // 🚨 [Fix] AI 모드일 때 요약 정보를 AI 분석 텍스트로 대체 가능하도록 데이터 보강
            summary: galleryData.selectedImg.alt_description || galleryData.selectedImg.description || "사진에 대한 설명이 없습니다.",
            tags: galleryData.selectedImg.tags ? galleryData.selectedImg.tags.map(t => t.title) : ['Photo'],
            ai_context: null 
        };
    }
    
    // Case B: 비디오 모드 (영상)
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

    // Case C: 기본 장소 정보
    return {
        mode: 'LOCATION',
        title: location.name,
        summary: location.description || "이 장소에 대한 여행자들의 리뷰와 정보가 곧 업데이트될 예정입니다.",
        tags: ['Travel', location.country, ...(location.keywords || [])],
        ai_context: null
    };
  };

  const activeInfo = getActiveInfo();

  // 타임라인 이동 핸들러
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

  // 🚨 [Logic] 갤러리 이미지가 변경되면 AI 모드 자동 해제
  useEffect(() => {
    setIsAiMode(false);
  }, [galleryData.selectedImg]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
      {/* Left Panel: Chat & Info */}
      <PlaceChatPanel 
        location={location}
        onClose={onClose}
        chatData={chatData}
        activeInfo={activeInfo}
        isFullScreen={isFullScreen}
        mediaMode={mediaMode}
        setMediaMode={setMediaMode}
        onSeekTime={handleSeekTime}
        // 🚨 [Fix] GalleryInfoView에 필요한 핵심 데이터 주입
        isAiMode={isAiMode}
        selectedImg={galleryData.selectedImg}
      />
      
      {/* Right Panel: Media Gallery */}
      <div className={`flex-1 min-w-0 h-full transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200]' : 'relative'}`}>
        <PlaceMediaPanel 
            galleryData={galleryData}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            showUI={showUI}
            mediaMode={mediaMode}
            videoId={activeVideoId} 
            videos={spotVideos}
            onVideoSelect={setSelectedVideoId}
            playerRef={playerRef}
            // 🚨 [Fix] 갤러리(View) -> 미디어패널(Panel) -> 이곳(Expanded)으로 신호 연결
            onAiModeChange={setIsAiMode}
        />
      </div>
    </div>
  );
};

export default PlaceCardExpanded;