import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import PlaceChatPanel from '../panels/PlaceChatPanel';
import PlaceMediaPanel from '../panels/PlaceMediaPanel';

const PlaceCardExpanded = ({ location, onClose, chatData, galleryData }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  // 🚨 [New] 미디어 모드 상태 관리 (기본값: GALLERY)
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  const containerRef = useRef(null);

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
            // 🚨 [Fix] 데이터 파이프라인 연결! (videos 배열 전달)
            videoId={location.videoId} 
            videos={location.videos}
        />
      </div>
    </div>
  );
};

export default PlaceCardExpanded;