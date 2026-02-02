// src/pages/Home/index.jsx
// 🚨 [Fix/New] Smart Search 엔진 완전 통합 (검색어 입력 시 즉시 태그 분석 + 장소 이동)
import React, { useState, useRef, useEffect, useMemo } from 'react';

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

  // 🚨 [Fix] 고도화된 하이브리드 검색 엔진 장착
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

  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    const tempId = Date.now();
    // 클릭 시 'scout' 카테고리로 임시 핀 생성
    const tempPin = { id: tempId, lat, lng, name: "Scanning...", type: 'temp-base', category: 'scout' };

    addScoutPin(tempPin);
    setIsPlaceCardOpen(true);
    moveToLocation(lat, lng, "Scanning...", "scout");

    const addressData = await getAddressFromCoordinates(lat, lng);
    const name = addressData?.city || addressData?.country || `Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;

    // 🚨 [Logic] 지오코딩 결과 이름으로 엔진 가동 -> 이웃 도시 추천
    processSearchKeywords(name);
    
    const realPin = { ...tempPin, name, country: addressData?.country || "Unknown" };
    setScoutedPins(prev => prev.map(p => p.id === tempId ? realPin : p));
    setSelectedLocation(realPin);
    setDraftInput(`📍 ${name}`);
  };

  const handleLocationSelect = (loc) => {
    const name = loc.name || "Selected";
    // 이미 TRAVEL_SPOTS에 있는 데이터라면 videoId 등이 포함되어 있음
    moveToLocation(loc.lat, loc.lng, name, loc.category);
    addScoutPin({ ...loc, type: 'temp-base', id: loc.id || Date.now() });
    
    setDraftInput(`📍 ${name}`);
    
    // 🚨 [Logic] 장소 선택 시에도 엔진 가동 (태그 갱신)
    processSearchKeywords(name); 
    setIsPlaceCardOpen(true);
  };

  // 🚨 [Fix/New] 개념 가드(Concept Guard) 장착
  // "휴양", "비치" 같은 키워드 입력 시 엉뚱한 도로명 주소로 날아가는 것 방지
  const handleSmartSearch = async (input) => {
    if (!input) return;

    // Case 1: 객체가 들어온 경우 (티커/검색결과 클릭) -> 즉시 이동
    if (typeof input === 'object' && input.lat && input.lng) {
      handleLocationSelect(input);
      return;
    }

    // Case 2: 문자열 검색 (검색창 입력)
    const query = input.trim(); 
    setDraftInput(query);

    // [Engine Trigger] 태그 추천 시스템 가동
    processSearchKeywords(query);

    // Step A: 로컬 데이터(TRAVEL_SPOTS)에서 '장소 이름' 매칭 확인
    const localSpot = TRAVEL_SPOTS.find(s => 
      s.name.toLowerCase() === query.toLowerCase() || 
      s.country.toLowerCase() === query.toLowerCase()
    );

    if (localSpot) {
      handleLocationSelect(localSpot);
      return;
    }

    // 🚨 [Step B: Concept Guard] 키워드/카테고리인지 확인
    // 입력한 단어가 우리 여행지의 '키워드'나 '카테고리'에 포함되어 있다면?
    // -> 굳이 외부 API로 이상한 주소를 찾지 말고, 여기서 멈춘다. (태그만 보여줌)
    const isConcept = TRAVEL_SPOTS.some(spot => 
      spot.category === query || 
      spot.keywords?.some(k => k.includes(query)) // "비치"가 포함된 키워드가 있는가?
    );

    if (isConcept) {
      console.log(`🛡️ Concept Guard: "${query}"는 장소명이 아닌 키워드로 판단하여 이동을 보류합니다.`);
      // 여기서 return하면 지도는 움직이지 않고, processSearchKeywords가 찾아준 태그만 뜹니다.
      // 사용자는 그 태그(예: #보라카이)를 클릭해서 이동하면 됩니다.
      return;
    }

    // Step C: 로컬에도 없고 키워드도 아니면 -> 외부 API(Nominatim) 검색
    const coords = await getCoordinatesFromAddress(query);
    if (coords) {
      handleLocationSelect({ ...coords, category: 'search' });
    } else {
      console.log(`"${query}" 위치를 찾을 수 없습니다.`);
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
        // 🚨 [Fix] 검색 로직 연결 완료
        onSearch={handleSmartSearch}
        onTickerClick={handleSmartSearch}
        onTagClick={handleSmartSearch} 
        
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput} savedTrips={savedTrips} 
        onTripClick={handleLocationSelect} onTripDelete={deleteTrip}
        onOpenChat={(p) => handleStartChat(selectedLocation?.name, p)}
        onLogoClick={() => setIsLogoPanelOpen(true)}
        
        // 🚨 [Search Engine State]
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