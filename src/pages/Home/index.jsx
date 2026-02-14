// src/pages/Home/index.jsx
// 🚨 [Fix] TestBench 제거 & globeTheme(순환형 테마) 상태 추가

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from './components/ChatModal'; 
import PlaceCard from '../../components/PlaceCard/index'; 
import LogoPanel from './components/LogoPanel';
import AmbientMode from './components/AmbientMode';

// Test Benches (UI에서는 뺐지만 나중을 위해 임포트는 유지)
import TestBenchA from './components/TestBenchA';
import TestBenchB from './components/TestBenchB';
import TestBenchC from './components/TestBenchC';

// Libs & Utils
import { getAddressFromCoordinates, getCoordinatesFromAddress } from './lib/geocoding';
import { supabase, recordInteraction } from '../../shared/api/supabase';
import { TRAVEL_SPOTS } from './data/travelSpots';
import { PERSONA_TYPES, getSystemPrompt } from './lib/prompts';

// Hooks
import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';

function Home() {
  const globeRef = useRef();
  const [user, setUser] = useState(null);
  
  // 1. Auth 구독
  useEffect(() => { 
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  // 2. Hooks 초기화
  const { 
    scoutedPins, setScoutedPins, selectedLocation, setSelectedLocation, 
    moveToLocation, addScoutPin, clearScouts
  } = useGlobeLogic(globeRef, user?.id);

  const { 
    savedTrips, activeChatId, setActiveChatId, fetchData, 
    saveNewTrip, updateMessages, toggleBookmark, deleteTrip,
    clearTemporaryTrips 
  } = useTravelData();

  const { relatedTags, isTagLoading, processSearchKeywords } = useSearchEngine();

  // 3. UI States
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);
  const [isAmbientMode, setIsAmbientMode] = useState(false);
  const [isPlaceCardOpen, setIsPlaceCardOpen] = useState(false); 
  const [initialQuery, setInitialQuery] = useState(null);
  const [draftInput, setDraftInput] = useState('');
  
  const [category, setCategory] = useState('paradise');
  const [isPinVisible, setIsPinVisible] = useState(true);

  // 🚨 [New] 지구본 테마 상태 (초기값: neon)
  const [globeTheme, setGlobeTheme] = useState('neon');

  const [isTickerExpanded, setIsTickerExpanded] = useState(false); 
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  
  // 🚨 [Fix] TestBench 상태는 덜어냄 (뺄셈의 미학)
  // const [activeTestBench, setActiveTestBench] = useState(null); 

  // 데이터 로드
  useEffect(() => { fetchData(); }, [fetchData]);

  // 필터링 로직
  const bucketList = useMemo(() => savedTrips.filter(t => t.is_bookmarked), [savedTrips]);
  const filteredSpots = useMemo(() => category === 'all' ? TRAVEL_SPOTS : TRAVEL_SPOTS.filter(s => s.category === category), [category]);

  // 포커스 모드
  const isFocusMode = useMemo(() => {
    if (isAmbientMode) return true;
    if (isTicketOpen || isChatOpen) return true;
    if (isPlaceCardOpen && isCardExpanded) return true;
    return false;
  }, [isAmbientMode, isTicketOpen, isChatOpen, isPlaceCardOpen, isCardExpanded]);

  // --- Handlers ---

  // 4. 지구본 클릭 핸들러
  const handleGlobeClick = useCallback(async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    const tempId = Date.now();
    
    const tempPin = { id: tempId, lat, lng, name: "Scanning...", type: 'temp-base', category: 'scout' };

    addScoutPin(tempPin);
    setIsPlaceCardOpen(true);
    setIsCardExpanded(false); 
    
    if (!isPinVisible) setIsPinVisible(true);

    moveToLocation(lat, lng, "Scanning...", "scout");

    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      const name = addressData?.city || addressData?.country || `Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;

      processSearchKeywords(name);
      
      const realPin = { 
        ...tempPin, 
        name, 
        name_en: name, 
        country: addressData?.country || "Unknown",
        display_name: name 
      };
      
      addScoutPin(realPin);
      recordInteraction(name, 'view'); 
      setDraftInput(`📍 ${name}`);
    } catch (error) {
      console.error("Geocoding Error:", error);
    }
  }, [addScoutPin, moveToLocation, processSearchKeywords, setDraftInput, isPinVisible]);

  // 5. 위치 선택 핸들러
  const handleLocationSelect = useCallback((loc) => {
    if (!loc) return;

    if (selectedLocation && selectedLocation.lat === loc.lat && selectedLocation.lng === loc.lng) {
      setIsPlaceCardOpen(true); 
      return;
    }

    const name = loc.name || "Selected";
    moveToLocation(loc.lat, loc.lng, name, loc.category);
    
    const finalLoc = { 
      ...loc, 
      type: loc.type || 'temp-base', 
      id: loc.id || `loc-${loc.lat}-${loc.lng}`,
      name: name
    };

    addScoutPin(finalLoc);
    setDraftInput(`📍 ${name}`);
    processSearchKeywords(name); 
    
    setSelectedLocation(finalLoc); 
    setIsPlaceCardOpen(true);
    setIsCardExpanded(false);

  }, [moveToLocation, addScoutPin, processSearchKeywords, setSelectedLocation, selectedLocation]);

  // 6. 스마트 검색 핸들러
  const handleSmartSearch = async (input) => {
    if (!input) return;
    
    if (typeof input === 'object' && input.lat && input.lng) {
      handleLocationSelect(input);
      return;
    }

    const query = input.trim(); 
    setDraftInput(query);
    processSearchKeywords(query);

    const localSpot = TRAVEL_SPOTS.find(s => 
      s.name.toLowerCase() === query.toLowerCase() || 
      s.country.toLowerCase() === query.toLowerCase() ||
      (s.name_en && s.name_en.toLowerCase() === query.toLowerCase()) 
    );
    if (localSpot) {
      handleLocationSelect(localSpot);
      return;
    }

    const isConcept = TRAVEL_SPOTS.some(spot => spot.category === query || spot.keywords?.some(k => k.includes(query)));
    if (isConcept) return;

    const coords = await getCoordinatesFromAddress(query);
    
    if (coords) {
      const normalizedLoc = {
        id: `search-${coords.lat}-${coords.lng}`,
        name: query, 
        name_en: coords.name, 
        country: coords.country || "Explore",
        lat: coords.lat,
        lng: coords.lng,
        category: 'search',
        description: `${query} (${coords.country}) 지역을 탐색합니다.`,
        type: 'temp-base'
      };
      handleLocationSelect(normalizedLoc);
    } else {
      alert(`'${query}' 위치를 찾을 수 없습니다.`); 
    }
  };

  // 7. 채팅 시작 핸들러
  const handleStartChat = async (dest, initPayload, existingId = null) => {
    if (globeRef.current) globeRef.current.pauseRotation();

    if (initPayload?.mode === 'view_history' || existingId) {
      const targetId = existingId || savedTrips.find(t => (initPayload?.id && t.id === initPayload.id) || (dest && t.destination === dest))?.id;
      if (targetId) {
        setActiveChatId(targetId);
        setInitialQuery(null); 
        setIsChatOpen(true);
        return;
      }
    }

    const persona = initPayload?.persona || (selectedLocation ? PERSONA_TYPES.INSPIRER : PERSONA_TYPES.GENERAL);
    const locationName = dest || selectedLocation?.name || "New Session";
    const systemPrompt = getSystemPrompt(persona, locationName);

    const newTrip = { 
      destination: locationName, 
      lat: selectedLocation?.lat || 0, lng: selectedLocation?.lng || 0, 
      date: new Date().toLocaleDateString(), code: "CHAT",
      prompt_summary: systemPrompt,
      messages: [], is_bookmarked: false, persona
    };
    
    const created = await saveNewTrip(newTrip);
    if (created) { 
      setActiveChatId(created.id); 
      setInitialQuery({ text: initPayload?.text || `${locationName}에 대해 알려줘!`, persona }); 
      setIsChatOpen(true); 
    }
  };

  // 🚨 [New] 테마 순환 로직
  const handleThemeToggle = () => {
    const themes = ['neon', 'bright', 'deep'];
    const nextIndex = (themes.indexOf(globeTheme) + 1) % themes.length;
    setGlobeTheme(themes[nextIndex]);
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* 1. 지구본 레이어 */}
      <div 
        style={{ 
          contentVisibility: isFocusMode ? 'hidden' : 'visible',
          contain: isFocusMode ? 'strict' : 'none',
          containIntrinsicSize: '100vw 100vh',
          pointerEvents: isFocusMode ? 'none' : 'auto',
          width: '100%',
          height: '100%'
        }}
      >
        <HomeGlobe 
          ref={globeRef} 
          onGlobeClick={handleGlobeClick} 
          onMarkerClick={handleLocationSelect} 
          isChatOpen={isChatOpen} 
          savedTrips={isPinVisible ? savedTrips : []} 
          tempPinsData={isPinVisible ? scoutedPins : []} 
          travelSpots={isPinVisible ? filteredSpots : []} 
          activePinId={selectedLocation?.id}
          pauseRender={isFocusMode} 
          globeTheme={globeTheme} // 🚨 [New] 테마 속성 전달
        />
      </div>
      
      {/* 2. UI 레이어 */}
      <HomeUI 
        onSearch={handleSmartSearch}
        onTickerClick={handleSmartSearch}
        onTagClick={handleSmartSearch} 
        
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput} savedTrips={savedTrips} 
        onTripClick={handleLocationSelect} onTripDelete={deleteTrip}
        onOpenChat={(p) => handleStartChat(selectedLocation?.name, p)}
        onLogoClick={() => setIsLogoPanelOpen(true)}
        
        relatedTags={relatedTags} isTagLoading={isTagLoading} 
        
        selectedCategory={category} onCategorySelect={setCategory}
        isTickerExpanded={isTickerExpanded} setIsTickerExpanded={setIsTickerExpanded}
        
        isPinVisible={isPinVisible}
        onTogglePinVisibility={() => setIsPinVisible(prev => !prev)}
        
        globeTheme={globeTheme} // 🚨 [New]
        onThemeToggle={handleThemeToggle} // 🚨 [New]
        
        onClearScouts={() => { 
            if(window.confirm("임시 핀과 저장되지 않은 대화 기록을 모두 정리하시겠습니까?")) {
                clearScouts();          
                clearTemporaryTrips();  
                setDraftInput('');      
                setSelectedLocation(null); 
            } 
        }}
      />
      
      {/* 3. 패널 및 모달 */}
      <LogoPanel isOpen={isLogoPanelOpen} onClose={() => setIsLogoPanelOpen(false)} user={user} bucketList={bucketList} onLogout={() => supabase.auth.signOut()} onStartAmbient={() => { setIsLogoPanelOpen(false); setIsAmbientMode(true); }} />
      {isAmbientMode && <AmbientMode bucketList={bucketList} onClose={() => setIsAmbientMode(false)} />}
      
      {isPlaceCardOpen && selectedLocation && (
        <PlaceCard 
          location={selectedLocation} 
          onClose={() => setIsPlaceCardOpen(false)}
          onChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onTicket={() => { setIsPlaceCardOpen(false); setIsTicketOpen(true); }}
          isCompactMode={isTickerExpanded}
          onExpandChange={setIsCardExpanded}
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