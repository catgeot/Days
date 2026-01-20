import React, { useState, useRef } from 'react';

import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import { getAddressFromCoordinates } from '../../lib/geocoding';

function Home() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [draftInput, setDraftInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const globeRef = useRef();

  // 1. 지구본 빈 땅 클릭 (기존과 동일)
  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    setDraftInput("위치 정보를 확인하고 있습니다... 🛰️");

    const addressData = await getAddressFromCoordinates(lat, lng);

    if (addressData) {
      const country = addressData.country !== '알 수 없는 국가' ? addressData.country : '';
      const city = addressData.city !== '알 수 없는 도시' ? addressData.city : '';
      const locationName = `${country} ${city}`.trim();
      setDraftInput(locationName ? `${locationName} 여행에 대해 알려줘` : `위도 ${lat.toFixed(2)}, 경도 ${lng.toFixed(2)} 위치의 여행 정보 알려줘`);
    } else {
      setDraftInput(`위도 ${lat.toFixed(2)}, 경도 ${lng.toFixed(2)} 위치의 여행 정보 알려줘`);
    }
  };

  // 🚨 [수정] 마커(도시) 또는 랭킹(Ticker) 클릭 핸들러
  // 이제는 locationData가 단순 이름이 아니라 { lat, lng, name, country } 객체로 들어올 수 있음
  const handleLocationSelect = (locationData) => {
    
    // Case A: TravelTicker에서 넘어온 데이터 (좌표가 있음)
    if (typeof locationData === 'object' && locationData.lat && locationData.lng) {
      // 1. 지구본을 그 위치로 날려보냄 (Fly To) + 핀 꽂기
      if (globeRef.current) {
        globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name);
      }

      // 2. 검색창에 텍스트 자동 완성
      setDraftInput(`${locationData.country} ${locationData.name} 여행에 대해 알려줘`);

      // 3. 선택된 위치 저장 (모달 발권용)
      setSelectedLocation(locationData);
      
      // *중요*: 티켓 모달은 바로 열지 않음! (탐험 우선)
    } 
    // Case B: 지구본 위 기존 마커(작은 점) 클릭 (좌표 없이 이름만 오는 경우 등)
    else {
      // 기존 로직 유지 (바로 티켓 창 열기 or 좌표 찾기)
      // 만약 문자열로 오면 ("Japan, Osaka")
      if (typeof locationData === 'string') {
        setSelectedLocation(locationData); // 문자열 그대로 저장
        setIsTicketOpen(true); // 명확한 마커 클릭은 발권 의도가 있다고 보고 열어줌
      }
    }
  };

  const handleSearch = (query) => {
    setInitialQuery(query); 
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
        // 🚨 순위표 클릭과 마커 클릭을 같은 핸들러로 연결
        onMarkerClick={handleLocationSelect}
        isChatOpen={isChatOpen}
      />

      <HomeUI 
        onSearch={handleSearch}
        // 🚨 Ticker 클릭 시에도 같은 핸들러 사용
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