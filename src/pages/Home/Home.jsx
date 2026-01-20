import React, { useState, useRef } from 'react';

import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import { getAddressFromCoordinates } from '../../lib/geocoding';

function Home() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState(''); // 채팅창 자동 전송용
  const [draftInput, setDraftInput] = useState('');     // 검색창 Draft용
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const globeRef = useRef();

  // 1. 지구본 빈 땅 클릭
  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    
    // 일단 좌표로 저장 (즉시 반응)
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    setDraftInput("위치 정보를 확인하고 있습니다... 🛰️");

    // 주소 변환
    const addressData = await getAddressFromCoordinates(lat, lng);

    if (addressData) {
      const country = addressData.country !== '알 수 없는 국가' ? addressData.country : '';
      const city = addressData.city !== '알 수 없는 도시' ? addressData.city : '';
      const locationName = `${country} ${city}`.trim();
      
      const displayText = locationName ? `${locationName} 여행에 대해 알려줘` : `위도 ${lat.toFixed(2)}, 경도 ${lng.toFixed(2)} 위치의 여행 정보 알려줘`;
      setDraftInput(displayText);

      // 🚨 [수정 핵심] 주소를 찾았으면 selectedLocation도 업데이트해준다!
      // 그래야 티켓 모달에서 좌표가 아니라 "일본 오사카"라고 뜸
      if (locationName) {
        setSelectedLocation({ name: locationName, country: '', lat, lng });
      }

    } else {
      setDraftInput(`위도 ${lat.toFixed(2)}, 경도 ${lng.toFixed(2)} 위치의 여행 정보 알려줘`);
    }
  };

  // 2. 마커 / 랭킹 / 핀 클릭 핸들러
  const handleLocationSelect = (locationData) => {
    // 🚨 [수정] 핀(User-Pin) 클릭 시 데이터 처리 보강
    // HomeGlobe에서 핀을 누르면 { lat, lng, type: 'user-pin', name: ... } 등이 넘어옴
    
    // Case A: TravelTicker (랭킹) 에서 옴
    if (locationData.country && locationData.rank) {
       if (globeRef.current) {
         globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name);
       }
       setDraftInput(`${locationData.country} ${locationData.name} 여행에 대해 알려줘`);
       setSelectedLocation(locationData);
       // 랭킹 클릭은 탐험의 시작이므로 모달 바로 안 염
    }
    // Case B: 지도 위의 '핀(User Pin)'이나 '마커'를 직접 클릭함 -> 발권 의도!
    else {
      // 핀 데이터에 이름이 없거나 좌표만 있는 경우, 현재 draftInput의 내용을 참고할 수도 있음
      // 여기서는 넘어온 데이터를 그대로 씁니다.
      setSelectedLocation(locationData);
      setIsTicketOpen(true); // 🚨 핀 클릭하면 모달 열림!
    }
  };

  // 3. 검색 (엔터)
  const handleSearch = (query) => {
    setInitialQuery(query); 
    setIsChatOpen(true);    
  };

  // 4. 티켓 발권 완료 (모달에서 넘어옴)
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
        onMarkerClick={handleLocationSelect} // 🚨 핀 클릭 연결됨
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