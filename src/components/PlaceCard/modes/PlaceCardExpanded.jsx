import React, { useState, useEffect, useRef } from 'react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';
import { TRAVEL_VIDEOS } from '../../../pages/Home/data/travelVideos'; 

const PlaceCardExpanded = ({ location, onClose, chatData, galleryData }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  
  const containerRef = useRef(null);
  
  // 🕹️ [Control] 플레이어 제어용 Ref
  const playerRef = useRef(null);

  // 1. 데이터 조회 (비관적 기본값: 빈 배열)
  const spotVideos = TRAVEL_VIDEOS[location.id] || [];
  const activeVideoId = selectedVideoId || (spotVideos.length > 0 ? spotVideos[0].id : null);
  const activeVideoData = spotVideos.find(v => v.id === activeVideoId) || null;

  // 🕹️ [Logic] 타임라인 이동 핸들러 (Hybrid: Number/String 지원)
  const handleSeekTime = (timeValue) => {
    // 🚨 [Safe Path] 플레이어가 준비되지 않았으면 중단
    if (!playerRef.current) {
        console.warn("YouTube Player is not ready yet.");
        return;
    }
    
    // 1. 비디오 모드로 강제 전환 (갤러리 보고 있다가 클릭했을 경우 대비)
    setMediaMode('VIDEO');

    let seconds = 0;

    // 2. 타입별 처리 (비관적 설계 적용)
    if (typeof timeValue === 'number') {
        // 이미 초 단위 숫자라면 그대로 사용
        seconds = timeValue;
    } else if (typeof timeValue === 'string') {
        // 문자열("01:30")이라면 파싱
        const parts = timeValue.split(':').map(Number);
        if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
        console.error("Invalid time format:", timeValue);
        return;
    }
    
    // 3. 플레이어 이동 및 재생
    // seekTo(seconds, allowSeekAhead)
    playerRef.current.seekTo(seconds, true);
    if (playerRef.current.playVideo) {
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

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
      
      {/* Left Panel: Chat & Info (Navigation Center) */}
      <PlaceChatPanel 
        location={location}
        onClose={onClose}
        chatData={chatData}
        selectedImg={galleryData.selectedImg}
        setSelectedImg={galleryData.setSelectedImg}
        isFullScreen={isFullScreen}
        mediaMode={mediaMode}
        setMediaMode={setMediaMode}
        videoData={activeVideoData}
        onSeekTime={handleSeekTime} // 🚨 수정된 핸들러 전달
      />

      {/* Right Panel: Media (Player) */}
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
        />
      </div>
    </div>
  );
};

export default PlaceCardExpanded;