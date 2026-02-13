// src/pages/Home/index.jsx
// 🚨 [Fix] 휴지통 기능 통합(핀+말풍선 동시 삭제) 및 데이터 정제 로직(confirmPin) 적용 완료

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from './components/ChatModal'; 
import PlaceCard from '../../components/PlaceCard/index'; 
import LogoPanel from './components/LogoPanel';
import AmbientMode from './components/AmbientMode';

// Test Benches
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
  
  // 1. Auth 구독 (사용자 정보 실시간 동기화)
  useEffect(() => { 
    // fetchData(); // fetchData는 아래 useTravelData에서 가져온 뒤 호출하는 것이 안전함
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  // 2. Hooks 초기화
  // 🚨 [Fix] user.id 전달 -> 본인의 핀만 삭제 가능
  const { 
    scoutedPins, setScoutedPins, selectedLocation, setSelectedLocation, 
    moveToLocation, addScoutPin, clearScouts,
    confirmPin // 🚨 [New] 이모지 제거 및 점수 집계를 위한 핵심 함수
  } = useGlobeLogic(globeRef, user?.id);

  // 🚨 [Fix] clearTemporaryTrips 추가 (말풍선 삭제용)
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
  const [category, setCategory] = useState('all');
  const [isTickerExpanded, setIsTickerExpanded] = useState(false); 
  
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [activeTestBench, setActiveTestBench] = useState(null);

  // 데이터 로드
  useEffect(() => { fetchData(); }, [fetchData]);

  // 필터링 로직
  const bucketList = useMemo(() => savedTrips.filter(t => t.is_bookmarked), [savedTrips]);
  const filteredSpots = useMemo(() => category === 'all' ? TRAVEL_SPOTS : TRAVEL_SPOTS.filter(s => s.category === category), [category]);

  // 포커스 모드 (배경 흐림 처리 등)
  const isFocusMode = useMemo(() => {
    if (isAmbientMode) return true;
    if (isTicketOpen || isChatOpen || activeTestBench) return true;
    if (isPlaceCardOpen && isCardExpanded) return true;
    return false;
  }, [isAmbientMode, isTicketOpen, isChatOpen, activeTestBench, isPlaceCardOpen, isCardExpanded]);

  // --- Handlers ---

  // 4. 지구본 클릭 핸들러
  const handleGlobeClick = useCallback(async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    const tempId = Date.now();
    
    // 임시 핀 생성 (Scanning...)
    const tempPin = { id: tempId, lat, lng, name: "Scanning...", type: 'temp-base', category: 'scout' };

    addScoutPin(tempPin);
    setIsPlaceCardOpen(true);
    setIsCardExpanded(false); 
    
    moveToLocation(lat, lng, "Scanning...", "scout");

    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      const name = addressData?.city || addressData?.country || `Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;

      processSearchKeywords(name);
      
      const realPin = { 
        ...tempPin, 
        name, // 🚨 confirmPin 내부에서 이모지 자동 제거됨
        name_en: name, 
        country: addressData?.country || "Unknown",
        display_name: name 
      };
      
      // 🚨 [Fix] 핀 확정 및 점수 집계 (DB 저장)
      confirmPin(tempId, realPin);
      
      setDraftInput(`📍 ${name}`); // UI에는 이모지 보여줌
    } catch (error) {
      console.error("Geocoding Error:", error);
    }
  }, [addScoutPin, moveToLocation, processSearchKeywords, confirmPin, setDraftInput]);

  // 5. 위치 선택 핸들러 (마커 클릭 등)
  const handleLocationSelect = useCallback((loc) => {
    if (!loc) return;

    if (selectedLocation && selectedLocation.lat === loc.lat && selectedLocation.lng === loc.lng) {
      console.log("📍 Same location selected. Re-opening card.");
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

    // 내부 데이터 탐색
    const localSpot = TRAVEL_SPOTS.find(s => 
      s.name.toLowerCase() === query.toLowerCase() || 
      s.country.toLowerCase() === query.toLowerCase() ||
      (s.name_en && s.name_en.toLowerCase() === query.toLowerCase()) 
    );
    if (localSpot) {
      handleLocationSelect(localSpot);
      return;
    }

    // 컨셉 가드
    const isConcept = TRAVEL_SPOTS.some(spot => spot.category === query || spot.keywords?.some(k => k.includes(query)));
    if (isConcept) {
      console.log(`🛡️ Concept Guard: "${query}" - 키워드 매칭됨. 이동 보류.`);
      return;
    }

    // 외부 API 검색
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
      
      console.log(`🗺️ Search Mapped: Input[${query}] -> API[${coords.name}]`);
      handleLocationSelect(normalizedLoc);
    } else {
      console.log(`"${query}" 위치를 찾을 수 없습니다.`);
      alert(`'${query}' 위치를 찾을 수 없습니다. (일시적 통신 오류일 수 있으니 잠시 후 다시 시도해주세요)`); 
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
          savedTrips={savedTrips} 
          tempPinsData={scoutedPins} 
          travelSpots={filteredSpots} 
          activePinId={selectedLocation?.id}
          pauseRender={isFocusMode} 
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
        
        // 🚨 [Fix] 휴지통 통합: 핀(Scouts) + 임시 말풍선(Chats) 동시 삭제
        onClearScouts={() => { 
            if(window.confirm("임시 핀과 북마크되지 않은 대화 기록을 모두 정리하시겠습니까?")) {
                clearScouts();          // 핀 삭제 (화면+DB)
                clearTemporaryTrips();  // 말풍선 삭제 (화면+DB)
            } 
        }}
        
        onOpenTestBenchA={() => setActiveTestBench('A')}
        onOpenTestBenchB={() => setActiveTestBench('B')}
        onOpenTestBenchC={() => setActiveTestBench('C')}
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