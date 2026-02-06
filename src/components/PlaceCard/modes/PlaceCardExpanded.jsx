import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';
// 🚨 [Fix/New] 데이터 소스 연결
import { TRAVEL_VIDEOS } from '../../../pages/Home/data/travelVideos'; 

const PlaceCardExpanded = ({ location, onClose, chatData, galleryData }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  
  // 🚨 [Fix/New] 비디오 선택 상태 관리 (초기값 null)
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  
  const containerRef = useRef(null);

  // 1. 데이터 조회 (비관적 기본값: 빈 배열)
  const spotVideos = TRAVEL_VIDEOS[location.id] || [];
  
  // 2. 현재 활성화된 비디오 ID 계산 (선택된 것 우선, 없으면 첫 번째)
  const activeVideoId = selectedVideoId || (spotVideos.length > 0 ? spotVideos[0].id : null);

  // 3. 현재 활성화된 비디오 객체 추출 (AI 도슨트용 데이터)
  const activeVideoData = spotVideos.find(v => v.id === activeVideoId) || null;

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
      
      <div className={`absolute top-8 left-8 z-[110] transition-opacity ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-blue-300 hover:text-white hover:border-blue-500/50 transition-all text-xs font-bold backdrop-blur-md">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Left Panel: Chat & Info (AI Docent) */}
      <PlaceChatPanel 
        location={location}
        chatData={chatData}
        selectedImg={galleryData.selectedImg}
        setSelectedImg={galleryData.setSelectedImg}
        isFullScreen={isFullScreen}
        mediaMode={mediaMode}
        setMediaMode={setMediaMode}
        // 🚨 [Fix/New] 현재 재생 중인 비디오 데이터 전달
        videoData={activeVideoData}
      />

      {/* Right Panel: Media */}
      <div className={`flex-1 min-w-0 h-full transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200]' : 'relative'}`}>
        <PlaceMediaPanel 
            galleryData={galleryData}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            showUI={showUI}
            mediaMode={mediaMode}
            // 🚨 [Fix/New] 비디오 ID 및 리스트 전달
            videoId={activeVideoId} 
            videos={spotVideos}
            // 🚨 [Fix/New] 비디오 선택 이벤트 핸들러 전달
            onVideoSelect={setSelectedVideoId}
        />
      </div>
    </div>
  );
};

export default PlaceCardExpanded;