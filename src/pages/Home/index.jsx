// src/pages/Home/index.jsx
// 🚨 [Fix] 무한 루프 방지 및 데이터 흐름 안정화

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
  const [isTickerExpanded, setIsTickerExpanded] = useState(false);
  
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

  // --- Handlers ---

  const handleGlobeClick = useCallback(async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    const tempId = Date.now();
    
    // 클릭 시 'scout' 카테고리로 임시 핀 생성
    const tempPin = { id: tempId, lat, lng, name: "Scanning...", type: 'temp-base', category: 'scout' };

    addScoutPin(tempPin);
    setIsPlaceCardOpen(true);
    moveToLocation(lat, lng, "Scanning...", "scout");

    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      const name = addressData?.city || addressData?.country || `Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;

      // 엔진 가동 -> 이웃 도시 추천
      processSearchKeywords(name);
      
      const realPin = { ...tempPin, name, country: addressData?.country || "Unknown" };
      
      setScoutedPins(prev => prev.map(p => p.id === tempId ? realPin : p));
      setSelectedLocation(realPin); // 상태 업데이트 1회
      setDraftInput(`📍 ${name}`);
    } catch (error) {
      console.error("Geocoding Error:", error);
    }
  }, [addScoutPin, moveToLocation, processSearchKeywords, setScoutedPins, setSelectedLocation]);

  // 🚨 [Fix] useCallback으로 감싸서 불필요한 함수 재생성 방지
  const handleLocationSelect = useCallback((loc) => {
    if (!loc) return;
    
    const name = loc.name || "Selected";
    
    // 1. 지도 이동
    moveToLocation(loc.lat, loc.lng, name, loc.category);
    
    // 2. 핀 추가 (이미 존재하는 ID라면 useGlobeLogic 내부에서 처리됨)
    addScoutPin({ ...loc, type: 'temp-base', id: loc.id || Date.now() });
    
    // 3. 입력창 동기화
    setDraftInput(`📍 ${name}`);
    
    // 4. 검색 엔진 태그 갱신
    processSearchKeywords(name); 
    
    // 5. 카드 열기 (selectedLocation은 useGlobeLogic 내부에서 moveToLocation 시 업데이트 될 수도 있지만, 명시적으로 함)
    setSelectedLocation(loc); 
    setIsPlaceCardOpen(true);

  }, [moveToLocation, addScoutPin, processSearchKeywords, setSelectedLocation]);

  // 개념 가드(Concept Guard) 장착
  const handleSmartSearch = async (input) => {
    if (!input) return;

    // Case 1: 객체가 들어온 경우 (티커/검색결과 클릭) -> 즉시 이동
    if (typeof input === 'object' && input.lat && input.lng) {
      handleLocationSelect(input);
      return;
    }

    // Case 2: 문자열 검색
    const query = input.trim(); 
    setDraftInput(query);

    processSearchKeywords(query);

    // Step A: 로컬 데이터 매칭 (대소문자 무시)
    const localSpot = TRAVEL_SPOTS.find(s => 
      s.name.toLowerCase() === query.toLowerCase() || 
      s.country.toLowerCase() === query.toLowerCase() ||
      (s.name_en && s.name_en.toLowerCase() === query.toLowerCase()) // 🚨 [Fix] 영문명 검색 지원 추가
    );

    if (localSpot) {
      handleLocationSelect(localSpot);
      return;
    }

    // Step B: Concept Guard
    const isConcept = TRAVEL_SPOTS.some(spot => 
      spot.category === query || 
      spot.keywords?.some(k => k.includes(query))
    );

    if (isConcept) {
      console.log(`🛡️ Concept Guard: "${query}" - 키워드 매칭됨. 이동 보류.`);
      return;
    }

    // Step C: 외부 API 검색
    const coords = await getCoordinatesFromAddress(query);
    if (coords) {
      handleLocationSelect({ ...coords, category: 'search' });
    } else {
      console.log(`"${query}" 위치를 찾을 수 없습니다.`);
      alert(`'${query}' 위치를 찾을 수 없습니다. 정확한 도시 이름을 입력해주세요.`); // 사용자 피드백 추가
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
      <HomeGlobe 
        ref={globeRef} onGlobeClick={handleGlobeClick} onMarkerClick={handleLocationSelect} 
        isChatOpen={isChatOpen} savedTrips={savedTrips} tempPinsData={scoutedPins} 
        travelSpots={filteredSpots} activePinId={selectedLocation?.id}
      />
      
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
          location={selectedLocation} onClose={() => setIsPlaceCardOpen(false)}
          onChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onTicket={() => { setIsPlaceCardOpen(false); setIsTicketOpen(true); }}
          isCompactMode={isTickerExpanded}
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