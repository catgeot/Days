import React, { useState, useRef } from 'react';

import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 

function Home() {
  // 상태 관리
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // 1. 채팅 모달로 넘길 최종 질문 (엔터 쳤을 때)
  const [initialQuery, setInitialQuery] = useState('');
  
  // 🚨 2. [신규] 메인 화면 입력바에 채워넣을 '초안(Draft)' 텍스트
  const [draftInput, setDraftInput] = useState('');

  const [selectedLocation, setSelectedLocation] = useState(null);
  const globeRef = useRef();

  // --- 이벤트 핸들러 ---

  // 1. 지구본 빈 땅 클릭
  const handleGlobeClick = ({ lat, lng }) => {
    // 1) 회전 멈춤
    if (globeRef.current) globeRef.current.pauseRotation();

    // 2) 좌표 저장
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    
    // 3) 초안 텍스트 생성
    const draftText = `위도 ${lat.toFixed(2)}, 경도 ${lng.toFixed(2)} 위치의 여행 정보 알려줘`;
    
    // 🚨 4) [수정] 모달을 열지 않고(setIsChatOpen X), 입력바에 텍스트만 배달!
    setDraftInput(draftText);

    console.log(`📍 Draft created: ${draftText}`);
  };

  // 2. 마커(도시) 또는 랭킹 클릭 -> 이건 명확한 선택이니 티켓 창 오픈
  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
    setIsTicketOpen(true);
    if (globeRef.current) globeRef.current.pauseRotation();
  };

  // 3. HomeUI에서 검색(엔터) 발생 시 -> 비로소 채팅 모달 오픈
  const handleSearch = (query) => {
    setInitialQuery(query); // 쿼리 저장
    setIsChatOpen(true);    // 모달 열기!
  };

  const handleTicketIssue = (prompt) => {
    setInitialQuery(prompt);
    setIsChatOpen(true);
  };

  const handleCloseTicket = () => {
    setIsTicketOpen(false);
    if (globeRef.current) globeRef.current.resumeRotation();
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      <HomeGlobe 
        ref={globeRef}
        onGlobeClick={handleGlobeClick}
        onMarkerClick={handleLocationSelect}
        isChatOpen={isChatOpen}
      />

      {/* 🚨 [핵심] HomeUI에게 draftInput(초안)을 전달합니다. */}
      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput} // <- 여기로 텍스트가 들어갑니다.
      />

      <TicketModal 
        isOpen={isTicketOpen} 
        onClose={handleCloseTicket}
        onIssue={handleTicketIssue}
        preFilledDestination={selectedLocation} 
      />
      
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          if (globeRef.current) globeRef.current.resumeRotation();
        }} 
        initialQuery={initialQuery} 
      />
    </div>
  );
}

export default Home;