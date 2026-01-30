// src/pages/Home/index.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from './components/ChatModal'; 
import PlaceCard from './components/PlaceCard'; 
import LogoPanel from './components/LogoPanel';
import AmbientMode from './components/AmbientMode';

// Libs & Utils
// 🚨 [Fix/New] getCoordinatesFromAddress 추가 임포트
import { getAddressFromCoordinates, getCoordinatesFromAddress } from './lib/geocoding';
import { supabase } from '../../shared/api/supabase';
import { TRAVEL_SPOTS } from './data/travelSpots';
import { PERSONA_TYPES } from './lib/prompts';

// Hooks
import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';

function Home() {
  const globeRef = useRef();
  const [user, setUser] = useState(null);
  
  // 엔진 호출
  const { 
    scoutedPins, setScoutedPins, selectedLocation, setSelectedLocation, 
    moveToLocation, addScoutPin, clearScouts 
  } = useGlobeLogic(globeRef);

  const { 
    savedTrips, activeChatId, setActiveChatId, fetchData, 
    saveNewTrip, updateMessages, toggleBookmark, deleteTrip 
  } = useTravelData();

  const { relatedTags, isTagLoading, processSearchKeywords } = useSearchEngine();

  // UI States
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);
  const [isAmbientMode, setIsAmbientMode] = useState(false);
  const [isPlaceCardOpen, setIsPlaceCardOpen] = useState(false); 
  const [initialQuery, setInitialQuery] = useState(null);
  const [draftInput, setDraftInput] = useState('');
  const [category, setCategory] = useState('all');
  const [isTickerExpanded, setIsTickerExpanded] = useState(false);

  useEffect(() => { 
    fetchData(); 
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, [fetchData]);

  const bucketList = useMemo(() => savedTrips.filter(t => t.is_bookmarked), [savedTrips]);
  const filteredSpots = useMemo(() => category === 'all' ? TRAVEL_SPOTS : TRAVEL_SPOTS.filter(s => s.category === category), [category]);

  // --- Handlers ---

  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    const tempId = Date.now();
    const tempPin = { id: tempId, lat, lng, name: "Scanning...", type: 'temp-base', category: 'scout' };

    addScoutPin(tempPin);
    setIsPlaceCardOpen(true);
    moveToLocation(lat, lng, "Scanning...", "scout");

    const addressData = await getAddressFromCoordinates(lat, lng);
    const name = addressData?.city || addressData?.country || `Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;

    processSearchKeywords(name);
    const realPin = { ...tempPin, name, country: addressData?.country || "Unknown" };
    setScoutedPins(prev => prev.map(p => p.id === tempId ? realPin : p));
    setSelectedLocation(realPin);
    setDraftInput(`📍 ${name}`);
  };

  const handleLocationSelect = (loc) => {
    const name = loc.name || "Selected";
    moveToLocation(loc.lat, loc.lng, name, loc.category);
    addScoutPin({ ...loc, type: 'temp-base', id: loc.id || Date.now() });
    setDraftInput(`📍 ${name}`);
    processSearchKeywords(name);
    setIsPlaceCardOpen(true);
  };

  // 🚨 [New] 문자열 검색 및 티커 클릭을 처리하는 통합 핸들러
  const handleStringSearch = async (query) => {
    if (!query) return;
    setDraftInput(query);
    
    // 1. 내부 데이터(TRAVEL_SPOTS)에서 먼저 검색
    const localSpot = TRAVEL_SPOTS.find(s => s.name.toLowerCase() === query.toLowerCase());
    if (localSpot) {
      handleLocationSelect(localSpot);
      return;
    }

    // 2. 없으면 지오코딩 API 호출
    const coords = await getCoordinatesFromAddress(query);
    if (coords) {
      handleLocationSelect({ ...coords, category: 'search' });
    } else {
      alert(`"${query}" 위치를 찾을 수 없습니다.`);
    }
  };

  const handleStartChat = async (dest, initPayload, existingId = null) => {
    if (globeRef.current) globeRef.current.pauseRotation();

    if (initPayload?.mode === 'view_history') {
      const matchedTrip = savedTrips.find(t => 
        (initPayload.id && t.id === initPayload.id) || 
        (dest && t.destination === dest)
      );
      if (matchedTrip) {
        setActiveChatId(matchedTrip.id);
        setInitialQuery(null); 
        setIsChatOpen(true);
        return;
      }
      initPayload.persona = PERSONA_TYPES.INSPIRER;
    }

    if (existingId) { 
      setActiveChatId(existingId); 
      setInitialQuery(null); 
      setIsChatOpen(true); 
      return; 
    }

    const persona = initPayload?.persona || (selectedLocation ? PERSONA_TYPES.INSPIRER : PERSONA_TYPES.GENERAL);
    const payload = typeof initPayload === 'object' ? { ...initPayload, persona } : { text: initPayload, persona };

    const newTrip = { 
      destination: dest || selectedLocation?.name || "New Session", 
      lat: selectedLocation?.lat || 0, lng: selectedLocation?.lng || 0, 
      date: new Date().toLocaleDateString(), code: "CHAT",
      prompt_summary: payload.text || "대화 시작", messages: [], is_bookmarked: false, persona
    };
    
    const created = await saveNewTrip(newTrip);
    if (created) { 
      setActiveChatId(created.id); 
      setInitialQuery(payload); 
      setIsChatOpen(true); 
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      <HomeGlobe 
        ref={globeRef} onGlobeClick={handleGlobeClick} onMarkerClick={handleLocationSelect} 
        isChatOpen={isChatOpen} savedTrips={savedTrips} tempPinsData={scoutedPins} 
        travelSpots={filteredSpots} activePinId={selectedLocation?.id}
      />
      
      <HomeUI 
        // 🚨 [Fix] onSearch와 onTickerClick을 handleStringSearch로 연결
        onSearch={handleStringSearch}
        onTickerClick={(data) => handleStringSearch(data.name || data)} 
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput} savedTrips={savedTrips} 
        onTripClick={handleLocationSelect} onTripDelete={deleteTrip}
        onOpenChat={(p) => p?.text || p?.mode ? handleStartChat(selectedLocation?.name, p) : setIsChatOpen(true)}
        onLogoClick={() => setIsLogoPanelOpen(true)}
        relatedTags={relatedTags} isTagLoading={isTagLoading} 
        onTagClick={(t) => handleStringSearch(t)}
        selectedCategory={category} onCategorySelect={setCategory}
        isTickerExpanded={isTickerExpanded} setIsTickerExpanded={setIsTickerExpanded}
        onClearScouts={() => { if(window.confirm("지도의 모든 핀을 정리하시겠습니까?")) clearScouts(); }}
      />
      
      <LogoPanel isOpen={isLogoPanelOpen} onClose={() => setIsLogoPanelOpen(false)} user={user} bucketList={bucketList} onLogout={() => supabase.auth.signOut()} onStartAmbient={() => { setIsLogoPanelOpen(false); setIsAmbientMode(true); }} />
      {isAmbientMode && <AmbientMode bucketList={bucketList} onClose={() => setIsAmbientMode(false)} />}
      
      {isPlaceCardOpen && (
        <PlaceCard 
          location={selectedLocation} onClose={() => setIsPlaceCardOpen(false)}
          onChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onTicket={() => { setIsPlaceCardOpen(false); setIsTicketOpen(true); }}
          isCompactMode={isTickerExpanded}
        />
      )}

      <TicketModal isOpen={isTicketOpen} onClose={() => { setIsTicketOpen(false); globeRef.current?.resumeRotation(); }} onIssue={(p) => handleStartChat(selectedLocation?.name, { text: p.text, persona: PERSONA_TYPES.PLANNER })} preFilledDestination={selectedLocation} scoutedPins={scoutedPins} savedTrips={savedTrips} />

      <ChatModal 
        isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); globeRef.current?.resumeRotation(); }} 
        initialQuery={initialQuery} chatHistory={savedTrips} 
        onUpdateChat={updateMessages} onToggleBookmark={toggleBookmark} 
        activeChatId={activeChatId} onSwitchChat={(id) => handleStartChat(null, null, id)} 
        onDeleteChat={deleteTrip} onClearChats={() => {}}
      />
    </div>
  );
}
export default Home;