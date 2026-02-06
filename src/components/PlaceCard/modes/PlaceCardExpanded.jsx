import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';
// 🚨 [Fix/New] 미디어 데이터 분리 원칙에 따라 유튜브 데이터 파일 추가 임포트
import { TRAVEL_VIDEOS } from '../../../pages/Home/data/travelVideos'; 

const PlaceCardExpanded = ({ location, onClose, chatData, galleryData }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  const containerRef = useRef(null);

  // 🚨 [Fix/New] location.id를 사용하여 해당 장소의 영상 리스트를 실시간 매핑
  // 만약 해당 ID의 영상이 없다면 빈 배열([])을 기본값으로 설정합니다.
  const spotId = Number(location.id);
  const spotVideos = TRAVEL_VIDEOS[location.id] || [];
  // 🔎 [디버깅] 이 코드를 추가하고 개발자 도구(F12) -> Console 탭을 확인해주세요.
  console.log("현재 장소:", location.title, "ID:", location.id, "찾은 비디오:", spotVideos);
  
  // 🚨 [Fix/New] 재생할 기본 영상 ID를 추출 (리스트의 첫 번째 영상)
  const defaultVideoId = spotVideos.length > 0 ? spotVideos[0].id : null;

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

      {/* Left Panel: Chat & Info */}
      <PlaceChatPanel 
        location={location}
        chatData={chatData}
        selectedImg={galleryData.selectedImg}
        setSelectedImg={galleryData.setSelectedImg}
        isFullScreen={isFullScreen}
        mediaMode={mediaMode}
        setMediaMode={setMediaMode}
      />

      {/* Right Panel: Media */}
      <div className={`flex-1 min-w-0 h-full transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[200]' : 'relative'}`}>
        <PlaceMediaPanel 
            galleryData={galleryData}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            showUI={showUI}
            mediaMode={mediaMode}
            // 🚨 [Fix/New] location 내부 데이터가 아닌, 외부에서 매핑한 분리된 데이터를 전달
            videoId={defaultVideoId} 
            videos={spotVideos}
        />
      </div>
    </div>
  );
};

export default PlaceCardExpanded;