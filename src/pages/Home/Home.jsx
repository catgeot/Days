import React, { useState, useRef, useEffect } from 'react';

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
  
  // 1. 발권된 티켓 (채팅 기록 포함 - 영구 저장)
  const [savedTrips, setSavedTrips] = useState(() => {
    const saved = localStorage.getItem('gate0_trips');
    return saved ? JSON.parse(saved) : [];
  });

  // 2. 🚨 [수정] 탐색 핀 기록도 영구 저장 (새로고침 방어)
  const [scoutedPins, setScoutedPins] = useState(() => {
    const saved = localStorage.getItem('gate0_scouts');
    return saved ? JSON.parse(saved) : [];
  });

  // 저장소 동기화
  useEffect(() => { localStorage.setItem('gate0_trips', JSON.stringify(savedTrips)); }, [savedTrips]);
  useEffect(() => { localStorage.setItem('gate0_scouts', JSON.stringify(scoutedPins)); }, [scoutedPins]);

  const globeRef = useRef();

  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    setDraftInput("Locating...");

    const addressData = await getAddressFromCoordinates(lat, lng);
    const locationName = addressData?.city || addressData?.country || "Unknown Point"; 
    const fullLabel = addressData?.country ? `${locationName}, ${addressData.country}` : locationName;

    setDraftInput(`📍 [${locationName}] Ready`);
    setHiddenSearchQuery(`${fullLabel} travel guide`);
    
    if (globeRef.current) globeRef.current.updateLastPinName(locationName);
    
    const newLocationData = { name: locationName, country: addressData?.country, lat, lng, type: 'user-pin' };
    setSelectedLocation(newLocationData);

    // 탐색 기록 추가
    const newPinRecord = {
      id: Date.now(),
      name: locationName,
      code: locationName.substring(0, 3).toUpperCase(),
      lat, lng,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setScoutedPins(prev => [newPinRecord, ...prev]);
  };

  const handleLocationSelect = (locationData) => {
    if (locationData.lat && locationData.lng) {
      if (globeRef.current) globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name || "Selected");
      
      const name = locationData.name || "Selected";
      setDraftInput(`📍 [${name}] Ready`);
      setHiddenSearchQuery(`${name} travel guide`);
      setSelectedLocation(locationData);
      
      if (locationData.type === 'user-pin' || locationData.type === 'saved-trip') {
         setIsTicketOpen(true);
      }
    }
  };

  const handleSearch = (query) => {
    if (query === draftInput && hiddenSearchQuery) {
      setInitialQuery({ text: hiddenSearchQuery, display: query }); 
    } else {
      setInitialQuery(query);
    }
    setIsChatOpen(true);    
  };

  const handleTicketIssue = (payload) => {
    setInitialQuery(payload);
    setIsChatOpen(true);

    if (selectedLocation) {
      const isExist = savedTrips.some(t => t.lat === selectedLocation.lat && t.lng === selectedLocation.lng);
      if (isExist) return;

      const newTrip = {
        id: Date.now(),
        destination: selectedLocation.name || "Unknown",
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        date: new Date().toLocaleDateString(),
        code: (selectedLocation.name || "GPS").substring(0, 3).toUpperCase(),
        promptSummary: payload.display,
        type: 'saved-trip',
        messages: [], // 🚨 대화 내용 저장용 배열 초기화
        isBookmarked: false // 🚨 버킷리스트용 플래그
      };
      setSavedTrips(prev => [newTrip, ...prev]); 
    }
  };

  // 🚨 [신규] 채팅 내용 업데이트 핸들러 (ChatModal에서 호출)
  const handleUpdateChatHistory = (tripId, newMessages) => {
    setSavedTrips(prev => prev.map(trip => 
      trip.id === tripId ? { ...trip, messages: newMessages } : trip
    ));
  };

  // 🚨 [신규] 버킷리스트 토글 핸들러
  const handleToggleBookmark = (tripId) => {
    setSavedTrips(prev => prev.map(trip => 
      trip.id === tripId ? { ...trip, isBookmarked: !trip.isBookmarked } : trip
    ));
  };

  const handleTripDelete = (id) => {
    setSavedTrips(prev => prev.filter(trip => trip.id !== id));
  };
  
  const handleScoutDelete = (id) => {
    setScoutedPins(prev => prev.filter(pin => pin.id !== id));
  };

  // 🚨 [신규] 탐색 핀 전체 리셋 (지구본 핀도 같이 사라짐)
  const handleClearScouts = () => {
    if (window.confirm("모든 탐색 핀을 초기화하시겠습니까?")) {
      setScoutedPins([]);
    }
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
        savedTrips={savedTrips} 
        // 🚨 탐색 핀도 지구본에 전달해야 새로고침 후에도 보임
        tempPinsData={scoutedPins} 
      />

      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput}
        savedTrips={savedTrips} 
        onTripClick={handleLocationSelect} 
        onTripDelete={handleTripDelete}
      />

      <TicketModal 
        isOpen={isTicketOpen} 
        onClose={handleCloseTicket}
        onIssue={handleTicketIssue}
        preFilledDestination={selectedLocation} 
        scoutedPins={scoutedPins}
        onScoutDelete={handleScoutDelete}
        // 🚨 리셋 기능 전달
        onClearScouts={handleClearScouts}
      />
      
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          if (globeRef.current) globeRef.current.resumeRotation();
        }} 
        initialQuery={initialQuery} 
        chatHistory={savedTrips}
        // 🚨 업데이트 함수 전달
        onUpdateChat={handleUpdateChatHistory}
        onToggleBookmark={handleToggleBookmark}
      />
    </div>
  );
}

export default Home;