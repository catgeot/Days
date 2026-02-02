// src/pages/Home/index.jsx
// 🚨 [Fix] isCardExpanded 상태 추가 및 Focus Mode 공식 최종 수정

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from './components/ChatModal'; 
import PlaceCard from './components/PlaceCard'; 
import LogoPanel from './components/LogoPanel';
import AmbientMode from './components/AmbientMode';

// 3개의 물리적 벤치 파일
import TestBenchA from './components/TestBenchA';
import TestBenchB from './components/TestBenchB';
import TestBenchC from './components/TestBenchC';

// Libs & Utils
import { getAddressFromCoordinates, getCoordinatesFromAddress } from './lib/geocoding';
import { supabase } from '../../shared/api/supabase';
import { TRAVEL_SPOTS } from './data/travelSpots';
import { PERSONA_TYPES, getSystemPrompt } from './lib/prompts';

// Hooks
import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';

function Home() {
  const globeRef = useRef();
  const [user, setUser] = useState(null);
  
  const { 
    scoutedPins, setScoutedPins, selectedLocation, setSelectedLocation, 
    moveToLocation, addScoutPin, clearScouts 
  } = useGlobeLogic(globeRef);

  const { 
    savedTrips, activeChatId, setActiveChatId, fetchData, 
    saveNewTrip, updateMessages, toggleBookmark, deleteTrip 
  } = useTravelData();

  // 고도화된 하이브리드 검색 엔진 장착
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
  const [isTickerExpanded, setIsTickerExpanded] = useState(false); // 축소형(미니) 카드 모드 여부
  
  // 🚨 [New] 자식(PlaceCard)이 실제로 '확장(Expanded)' 상태인지 추적하는 state
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  // 벤치 선택자
  const [activeTestBench, setActiveTestBench] = useState(null);

  useEffect(() => { 
    fetchData(); 
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, [fetchData]);

  const bucketList = useMemo(() => savedTrips.filter(t => t.is_bookmarked), [savedTrips]);
  const filteredSpots = useMemo(() => category === 'all' ? TRAVEL_SPOTS : TRAVEL_SPOTS.filter(s => s.category === category), [category]);

  // 🚨 [Fix] Focus Mode Logic (Final Version)
  const isFocusMode = useMemo(() => {
    // 1. 화면 전체를 덮는 앰비언트 모드
    if (isAmbientMode) return true;

    // 2. 화면 전체를 덮는 로그북/티켓/테스트벤치
    if (isTicketOpen || isChatOpen || activeTestBench) return true;

    // 3. 장소 카드 최적화:
    //    카드가 열려 있고(Open) && 자식이 '확장 상태(isCardExpanded)'라고 보고했을 때만 렌더링 중지
    //    (축소 모드나 기본 모드일 때는 지구본이 보여야 하므로 false)
    if (isPlaceCardOpen && isCardExpanded) return true;

    return false;
  }, [isAmbientMode, isTicketOpen, isChatOpen, activeTestBench, isPlaceCardOpen, isCardExpanded]);

  // --- Handlers ---

  const handleGlobeClick = useCallback(async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    const tempId = Date.now();
    
    // 클릭 시 'scout' 카테고리로 임시 핀 생성
    const tempPin = { id: tempId, lat, lng, name: "Scanning...", type: 'temp-base', category: 'scout' };

    addScoutPin(tempPin);
    setIsPlaceCardOpen(true);
    // 🚨 [Fix] 새 카드를 열 때는 항상 '축소 안 됨(Expanded False)' 상태로 시작
    setIsCardExpanded(false); 
    
    moveToLocation(lat, lng, "Scanning...", "scout");

    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      const name = addressData?.city || addressData?.country || `Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;

      processSearchKeywords(name);
      
      const realPin = { ...tempPin, name, country: addressData?.country || "Unknown" };
      
      setScoutedPins(prev => prev.map(p => p.id === tempId ? realPin : p));
      setSelectedLocation(realPin); 
      setDraftInput(`📍 ${name}`);
    } catch (error) {
      console.error("Geocoding Error:", error);
    }
  }, [addScoutPin, moveToLocation, processSearchKeywords, setScoutedPins, setSelectedLocation]);

  const handleLocationSelect = useCallback((loc) => {
    if (!loc) return;
    const name = loc.name || "Selected";
    moveToLocation(loc.lat, loc.lng, name, loc.category);
    addScoutPin({ ...loc, type: 'temp-base', id: loc.id || Date.now() });
    setDraftInput(`📍 ${name}`);
    processSearchKeywords(name); 
    
    setSelectedLocation(loc); 
    setIsPlaceCardOpen(true);
    // 🚨 [Fix] 새 카드를 열 때 확장 상태 초기화
    setIsCardExpanded(false);

  }, [moveToLocation, addScoutPin, processSearchKeywords, setSelectedLocation]);

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
    if (isConcept) {
      console.log(`🛡️ Concept Guard: "${query}" - 키워드 매칭됨. 이동 보류.`);
      return;
    }

    const coords = await getCoordinatesFromAddress(query);
    if (coords) {
      handleLocationSelect({ ...coords, category: 'search' });
    } else {
      console.log(`"${query}" 위치를 찾을 수 없습니다.`);
      alert(`'${query}' 위치를 찾을 수 없습니다. 정확한 도시 이름을 입력해주세요.`); 
    }
  };

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

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* 🚨 [Fix] Focus Mode Wrapper */}
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
          savedTrips={savedTrips} 
          tempPinsData={scoutedPins} 
          travelSpots={filteredSpots} 
          activePinId={selectedLocation?.id}
          pauseRender={isFocusMode} 
        />
      </div>
      
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
        onClearScouts={() => { if(window.confirm("지도의 모든 핀을 정리하시겠습니까?")) clearScouts(); }}
        
        onOpenTestBenchA={() => setActiveTestBench('A')}
        onOpenTestBenchB={() => setActiveTestBench('B')}
        onOpenTestBenchC={() => setActiveTestBench('C')}
      />
      
      <LogoPanel isOpen={isLogoPanelOpen} onClose={() => setIsLogoPanelOpen(false)} user={user} bucketList={bucketList} onLogout={() => supabase.auth.signOut()} onStartAmbient={() => { setIsLogoPanelOpen(false); setIsAmbientMode(true); }} />
      {isAmbientMode && <AmbientMode bucketList={bucketList} onClose={() => setIsAmbientMode(false)} />}
      
      {isPlaceCardOpen && (
        <PlaceCard 
          location={selectedLocation} 
          onClose={() => setIsPlaceCardOpen(false)}
          onChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onTicket={() => { setIsPlaceCardOpen(false); setIsTicketOpen(true); }}
          
          isCompactMode={isTickerExpanded}
          // 🚨 [Fix] 자식 상태 변경 리스너 연결
          onExpandChange={setIsCardExpanded}
        />
      )}

      {/* 테스트 벤치 영역 */}
      {activeTestBench === 'A' && <TestBenchA onClose={() => setActiveTestBench(null)} />}
      {activeTestBench === 'B' && <TestBenchB onClose={() => setActiveTestBench(null)} />}
      {activeTestBench === 'C' && <TestBenchC onClose={() => setActiveTestBench(null)} />}

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