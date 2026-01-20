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
  const [hiddenSearchQuery, setHiddenSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // 🚨 저장된 여행지 목록 (Travel Dock에 표시됨)
  const [savedTrips, setSavedTrips] = useState([]);

  const globeRef = useRef();

  // 1. 지구본 클릭
  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    setDraftInput("🛰️ 위치 데이터 수신 중...");

    const addressData = await getAddressFromCoordinates(lat, lng);

    if (addressData) {
      const country = addressData.country !== '알 수 없는 국가' ? addressData.country : '';
      const city = addressData.city !== '알 수 없는 도시' ? addressData.city : '';
      const locationName = `${country} ${city}`.trim();
      
      if (locationName) {
        setDraftInput(`📍 [${locationName}] 여행 정보 분석 준비 완료`);
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

  // 3. 검색 (엔터)
  const handleSearch = (query) => {
    if (query === draftInput && hiddenSearchQuery) {
      setInitialQuery({ text: hiddenSearchQuery, display: query }); 
    } else {
      setInitialQuery(query);
    }
    setIsChatOpen(true);    
  };

  // 4. 티켓 발권 완료 (데이터 저장)
  const handleTicketIssue = (payload) => {
    setInitialQuery(payload);
    setIsChatOpen(true);

    if (selectedLocation) {
      const newTrip = {
        id: Date.now(),
        // 화면에 보여줄 이름 (이름이 없으면 좌표)
        destination: selectedLocation.name || `좌표 ${selectedLocation.lat?.toFixed(2)}`,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        date: new Date().toLocaleDateString(),
        // 공항 코드 (3글자 대문자)
        code: (selectedLocation.name || "GPS").substring(0, 3).toUpperCase(),
        promptSummary: payload.display
      };
      // 최신순으로 추가
      setSavedTrips(prev => [newTrip, ...prev]); 
    }
  };

  // 🚨 [추가] TripDock에서 여행지 클릭 시
  const handleTripClick = (trip) => {
    if (trip.lat && trip.lng) {
      if (globeRef.current) globeRef.current.flyToAndPin(trip.lat, trip.lng, trip.destination);
      setDraftInput(`📍 [${trip.destination}] 기록된 여정 불러오기 완료`);
      setHiddenSearchQuery(`${trip.destination} 다시 여행하고 싶어`);
      setSelectedLocation({ name: trip.destination, lat: trip.lat, lng: trip.lng });
    }
  };

  // 🚨 [추가] TripDock에서 여행지 삭제 시
  const handleTripDelete = (id) => {
    setSavedTrips(prev => prev.filter(trip => trip.id !== id));
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
        // 🚨 Dock 연결
        savedTrips={savedTrips}
        onTripClick={handleTripClick}
        onTripDelete={handleTripDelete}
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