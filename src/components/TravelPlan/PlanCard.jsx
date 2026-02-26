// 🚨 [Fix] 좌측 패널(TravelPlanPanel)의 상태를 우측 패널(PlaceMediaPanel)로 전달하는 중앙 State 추가

import React, { useState, useEffect, useRef } from 'react';
import TravelPlanPanel from './TravelPlanPanel';
import PlanMediaPanel from './PlanMedeaPanel';
import { TRAVEL_VIDEOS } from '../../pages/Home/data/travelVideos'; 

const PlanCard = ({ location, onClose, galleryData }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [mediaMode, setMediaMode] = useState('GALLERY'); 
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  
  // 🚨 [New] 데이터 배관: 스무고개 진행 상황과 유저 답변을 담는 그릇
  const [planContext, setPlanContext] = useState({ step: 1, answers: {} });
  
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  const spotVideos = (TRAVEL_VIDEOS && location && TRAVEL_VIDEOS[location.id]) || [];
  const activeVideoId = selectedVideoId || (spotVideos.length > 0 ? spotVideos[0].id : null);

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
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/95 flex flex-col md:flex-row p-0 md:p-6 gap-0 md:gap-6 animate-fade-in overflow-hidden font-sans">
      
      {/* 📡 Left Panel: 상태를 위로 올려보냄 (onPlanUpdate) */}
      <TravelPlanPanel 
        location={location}
        onClose={onClose}
        isFullScreen={isFullScreen}
        onPlanUpdate={setPlanContext} 
      />
      
      {/* 📥 Right Panel: 전달받은 상태(planContext)를 내려받아 화면을 변형시킴 */}
      <div className={`flex-1 w-full min-w-0 h-full transition-all duration-500 z-10 ${isFullScreen ? 'fixed inset-0 z-[200]' : 'relative'}`}>
        <PlanMediaPanel 
            galleryData={galleryData || { images: [], isImgLoading: false, selectedImg: null, setSelectedImg: () => {} }}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            showUI={showUI}
            mediaMode={mediaMode}
            videoId={activeVideoId} 
            videos={spotVideos}
            onVideoSelect={setSelectedVideoId}
            playerRef={playerRef}
            onAiModeChange={() => {}}
            planContext={planContext} // 🚨 [New] 배관 연결 완료
        />
      </div>
    </div>
  );
};

export default PlanCard;