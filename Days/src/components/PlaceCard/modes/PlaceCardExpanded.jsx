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

  // 🕹️ [Logic] 타임라인 이동 핸들러 (01:30 -> 90s 변환)
  const handleSeekTime = (timeString) => {
    if (!playerRef.current) return;
    
    // 시간 파싱 로직
    const parts = timeString.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    
    // 비디오 모드로 강제 전환 후 이동
    setMediaMode('VIDEO');
    playerRef.current.seekTo(seconds);
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
      
      {/* 🚨 [Fix/Layout] 기존의 절대 위치 Back 버튼 삭제 -> ChatPanel 내부로 통합 */}

      {/* Left Panel: Chat & Info (Navigation Center) */}
      <PlaceChatPanel 
        location={location}
        onClose={onClose} // 🚨 [New] 닫기 함수 전달
        chatData={chatData}
        selectedImg={galleryData.selectedImg}
        setSelectedImg={galleryData.setSelectedImg}
        isFullScreen={isFullScreen}
        mediaMode={mediaMode}
        setMediaMode={setMediaMode}
        videoData={activeVideoData}
        onSeekTime={handleSeekTime}
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
            playerRef={playerRef} // 🚨 Ref 전달
        />
      </div>
    </div>
  );
};

export default PlaceCardExpanded;