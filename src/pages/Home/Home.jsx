import React, { useState, useRef } from 'react';

import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import { getAddressFromCoordinates } from '../../lib/geocoding';

function Home() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [initialQuery, setInitialQuery] = useState(''); // 채팅창에 보낼 실제 질문
  const [draftInput, setDraftInput] = useState('');     // UI에 보여줄 텍스트

  // 🚨 [추가] 실제로 검색할 쿼리를 따로 저장할 상태 (화면엔 안보임)
  const [hiddenSearchQuery, setHiddenSearchQuery] = useState('');

  const [selectedLocation, setSelectedLocation] = useState(null);
  const globeRef = useRef();

  // 1. 지구본 클릭
  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    
    // 1단계: 로딩 중 표시
    setDraftInput("🛰️ 위치 데이터 수신 중...");

    const addressData = await getAddressFromCoordinates(lat, lng);

    if (addressData) {
      const country = addressData.country !== '알 수 없는 국가' ? addressData.country : '';
      const city = addressData.city !== '알 수 없는 도시' ? addressData.city : '';
      const locationName = `${country} ${city}`.trim();
      
      if (locationName) {
        // 🚨 [수정] 화면엔 '시스템 상태'처럼 보여줌
        setDraftInput(`📍 [${locationName}] 여행 정보 분석 준비 완료`);
        // 🚨 [수정] 실제 AI에게 보낼 질문은 따로 저장
        setHiddenSearchQuery(`${locationName} 여행에 대해 감성적으로 알려줘`);
        
        setSelectedLocation({ name: locationName, country: '', lat, lng });
      } else {
        setDraftInput(`📍 [${lat.toFixed(2)}, ${lng.toFixed(2)}] 좌표 식별됨`);
        setHiddenSearchQuery(`위도 ${lat}, 경도 ${lng} 위치의 여행 정보 알려줘`);
      }
    } else {
      setDraftInput(`📍 [${lat.toFixed(2)}, ${lng.toFixed(2)}] 좌표 식별됨`);
      setHiddenSearchQuery(`위도 ${lat}, 경도 ${lng} 위치의 여행 정보 알려줘`);
    }
  };

  // 2. 마커/랭킹 클릭
  const handleLocationSelect = (locationData) => {
    if (locationData.country && locationData.rank) {
       if (globeRef.current) globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name);
       
       setDraftInput(`📍 [${locationData.country} ${locationData.name}] 여행 정보 분석 준비 완료`);
       setHiddenSearchQuery(`${locationData.country} ${locationData.name} 여행에 대해 알려줘`);
       
       setSelectedLocation(locationData);
    } else {
      setSelectedLocation(locationData);
      setIsTicketOpen(true);
    }
  };

  // 3. 검색 (엔터 입력 시)
  // HomeUI에서 넘어온 query가 'draftInput'과 같다면 -> 'hiddenSearchQuery'를 사용
  // 사용자가 직접 타이핑해서 바꿨다면 -> 그 타이핑한 내용('query')을 사용
  const handleSearch = (query) => {
    if (query === draftInput && hiddenSearchQuery) {
      // 사용자가 텍스트를 안 바꾸고 그대로 엔터 친 경우
      setInitialQuery({ text: hiddenSearchQuery, display: query }); 
    } else {
      // 사용자가 직접 질문을 입력한 경우
      setInitialQuery(query);
    }
    setIsChatOpen(true);    
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

      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput} 
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