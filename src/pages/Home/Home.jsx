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
        
        // 🚨 [핵심] 핀 이름 업데이트 명령!!
        if (globeRef.current) {
          globeRef.current.updateLastPinName(locationName);
        }
        
        // 티켓 모달용 데이터에도 이름 추가
        setSelectedLocation({ name: locationName, country: '', lat, lng, type: 'user-pin' });

      } else {
        setDraftInput(`📍 [${lat.toFixed(2)}, ${lng.toFixed(2)}] 좌표 식별됨`);
        setHiddenSearchQuery(`위도 ${lat}, 경도 ${lng} 위치의 여행 정보 알려줘`);
      }
    } else {
      setDraftInput(`📍 [${lat.toFixed(2)}, ${lng.toFixed(2)}] 좌표 식별됨`);
      setHiddenSearchQuery(`위도 ${lat}, 경도 ${lng} 위치의 여행 정보 알려줘`);
    }
  };

  const handleLocationSelect = (locationData) => {
    if (locationData.name) {
       if (locationData.country && locationData.rank) {
         if (globeRef.current) globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name);
         setDraftInput(`📍 [${locationData.country} ${locationData.name}] 여행 정보 분석 준비 완료`);
         setHiddenSearchQuery(`${locationData.country} ${locationData.name} 여행에 대해 알려줘`);
         setSelectedLocation(locationData);
       } 
       else if (locationData.lat && locationData.lng) {
         if (locationData.type === 'user-pin') {
           setSelectedLocation(locationData);
           setIsTicketOpen(true);
         } else {
            if (globeRef.current) globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name);
            const countryName = locationData.country || '';
            setDraftInput(`📍 [${countryName} ${locationData.name}] 여행 정보 분석 준비 완료`);
            setHiddenSearchQuery(`${countryName} ${locationData.name} 여행에 대해 알려줘`);
            setSelectedLocation(locationData);
         }
       }
    } else {
      setSelectedLocation(locationData);
      setIsTicketOpen(true);
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
      const newTrip = {
        id: Date.now(),
        destination: selectedLocation.name || `좌표 ${selectedLocation.lat?.toFixed(2)}`,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        date: new Date().toLocaleDateString(),
        code: (selectedLocation.name || "GPS").substring(0, 3).toUpperCase(),
        promptSummary: payload.display
      };
      setSavedTrips(prev => [newTrip, ...prev]); 
    }
  };

  const handleTripClick = (trip) => {
    if (trip.lat && trip.lng) {
      if (globeRef.current) globeRef.current.flyToAndPin(trip.lat, trip.lng, trip.destination);
      setDraftInput(`📍 [${trip.destination}] 기록된 여정 불러오기 완료`);
      setHiddenSearchQuery(`${trip.destination} 다시 여행하고 싶어`);
      setSelectedLocation({ name: trip.destination, lat: trip.lat, lng: trip.lng });
    }
  };

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