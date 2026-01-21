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
  
  // 1. 발권된 티켓 (하단 도크용 - 영구 저장)
  const [savedTrips, setSavedTrips] = useState(() => {
    const saved = localStorage.getItem('gate0_trips');
    return saved ? JSON.parse(saved) : [];
  });

  // 2. 🚨 [신규] 탐색한 핀 기록 (모달 좌측용 - 세션 저장)
  // 지구본을 클릭해서 '간'만 본 장소들입니다.
  const [scoutedPins, setScoutedPins] = useState([]);

  useEffect(() => {
    localStorage.setItem('gate0_trips', JSON.stringify(savedTrips));
  }, [savedTrips]);

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

    // 🚨 [핵심] 핀을 찍으면 '탐색 기록(Scouted Pins)'에 추가
    const newPinRecord = {
      id: Date.now(),
      name: locationName,
      code: locationName.substring(0, 3).toUpperCase(),
      lat, lng,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    // 중복 방지 없이 최신순 추가 (같은 곳을 여러 번 고민할 수 있으므로)
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

      // 발권 시 '티켓 목록(Saved Trips)'에 저장
      const newTrip = {
        id: Date.now(),
        destination: selectedLocation.name || "Unknown",
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        date: new Date().toLocaleDateString(),
        code: (selectedLocation.name || "GPS").substring(0, 3).toUpperCase(),
        promptSummary: payload.display,
        type: 'saved-trip'
      };
      setSavedTrips(prev => [newTrip, ...prev]); 
    }
  };

  const handleTripDelete = (id) => {
    setSavedTrips(prev => prev.filter(trip => trip.id !== id));
  };
  
  // 🚨 [신규] 탐색 기록 삭제 핸들러
  const handleScoutDelete = (id) => {
    setScoutedPins(prev => prev.filter(pin => pin.id !== id));
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
      />

      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput}
        savedTrips={savedTrips} // 하단 도크는 '발권된 티켓' 표시
        onTripClick={handleLocationSelect} 
        onTripDelete={handleTripDelete}
      />

      <TicketModal 
        isOpen={isTicketOpen} 
        onClose={handleCloseTicket}
        onIssue={handleTicketIssue}
        preFilledDestination={selectedLocation} 
        // 🚨 모달에는 '탐색 기록(Scouted Pins)' 전달
        scoutedPins={scoutedPins}
        onScoutDelete={handleScoutDelete}
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