// src/pages/Home.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import PlaceCard from './components/PlaceCard'; 
import { getAddressFromCoordinates } from '../../lib/geocoding';
import { supabase } from '../../lib/supabase';
import LogoPanel from './components/LogoPanel';
import AmbientMode from './components/AmbientMode';
import { TRAVEL_SPOTS } from '../../../src/date/travelSpots';

function Home() {
  // ... (State 유지)
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);
  const [isAmbientMode, setIsAmbientMode] = useState(false);
  const [isPlaceCardOpen, setIsPlaceCardOpen] = useState(false); 
  const [user, setUser] = useState(null);

  const [initialQuery, setInitialQuery] = useState('');
  const [draftInput, setDraftInput] = useState('');
  const [hiddenSearchQuery, setHiddenSearchQuery] = useState('');
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  
  const [savedTrips, setSavedTrips] = useState([]);  
  const [scoutedPins, setScoutedPins] = useState([]); // Ghost Trail
  
  const [relatedTags, setRelatedTags] = useState([]); 
  const [isTagLoading, setIsTagLoading] = useState(false);
  
  const [category, setCategory] = useState('all');
  const [isTickerExpanded, setIsTickerExpanded] = useState(false);

  const globeRef = useRef();
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => { 
    fetchData(); 
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => { const { data: { user } } = await supabase.auth.getUser(); setUser(user); };
  const fetchData = async () => { 
    const { data: trips } = await supabase.from('saved_trips').select('*').order('created_at', { ascending: false }); if (trips) setSavedTrips(trips); 
  };
  const bucketList = savedTrips.filter(trip => trip.is_bookmarked);
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setIsLogoPanelOpen(false); alert("로그아웃 되었습니다."); };

  const filteredSpots = useMemo(() => {
    if (category === 'all') return TRAVEL_SPOTS;
    return TRAVEL_SPOTS.filter(spot => spot.category === category);
  }, [category]);

  // --- Handlers ---
  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    
    // 🚨 1. [Speed] 즉시 임시 핀 생성 및 이동 (주소 찾기 전!)
    const tempId = Date.now();
    const tempPin = { 
      id: tempId, 
      lat, lng, 
      name: "Locating...", 
      country: "Scanning...", 
      type: 'scout',
      category: 'scout'
    };

    // UI 선 반영
    setScoutedPins(prev => [tempPin, ...prev].slice(0, 5));
    setSelectedLocation(tempPin);
    setIsPlaceCardOpen(true);
    setDraftInput("Locating...");
    
    // 지구본 즉시 이동 (핀 먼저 꽂힘 -> 빨간 핀 애니메이션 시작)
    if (globeRef.current) globeRef.current.flyToAndPin(lat, lng, "Locating...", "scout");

    // 🚨 2. [Async] 데이터 Fetch (백그라운드)
    const addressData = await getAddressFromCoordinates(lat, lng);
    
    // 바다/오지 모두 포함 (Unknown Point)
    const locationName = addressData?.city || addressData?.country || `Unknown Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;
    const isMystery = !addressData?.city && !addressData?.country;

    // 🚨 3. [Update] 진짜 정보로 핀 업데이트 (ID 유지 -> 부드러운 전환)
    const realPin = { 
      ...tempPin, 
      name: locationName, 
      country: addressData?.country || "Unknown Territory", 
      category: isMystery ? 'mystery' : 'scout'
    };

    setScoutedPins(prev => prev.map(p => p.id === tempId ? realPin : p));
    setSelectedLocation(realPin);
    setDraftInput(`📍 ${locationName}`);
    setHiddenSearchQuery(`${locationName} travel guide`);
  };

  const handleLocationSelect = async (locationData, source = 'globe') => {
    if (!locationData.lat || !locationData.lng) return;
    
    if (globeRef.current) {
      globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name || "Selected", locationData.category);
    }
    
    const name = locationData.name || "Selected";
    setDraftInput(`📍 ${name}`);
    setHiddenSearchQuery(`${name} travel guide`);
    
    // 선택된 핀을 Active로 만듦 (Scout Trail 업데이트)
    const targetLocation = { 
        ...locationData, 
        type: 'scout', 
        id: locationData.id || Date.now(), // ID 없으면 생성
        country: locationData.country || '' 
    };
    
    setScoutedPins(prev => {
        const filtered = prev.filter(p => p.id !== targetLocation.id && p.name !== targetLocation.name);
        return [targetLocation, ...filtered].slice(0, 5);
    });

    setSelectedLocation(targetLocation);
    setIsPlaceCardOpen(true);
  };

  const handleStartChat = async (destination, initialPayload, existingId = null) => {
    if (existingId) { setActiveChatId(existingId); setInitialQuery(null); setIsChatOpen(true); return; }
    
    // 🚨 [Pin Upgrade] 채팅 시작 시 해당 핀을 '말풍선(💬)'으로 승격
    if (selectedLocation) {
        setScoutedPins(prev => prev.map(p => 
            (p.id === selectedLocation.id || p.name === selectedLocation.name) 
            ? { ...p, hasChat: true } // 이 속성이 있으면 HomeGlobe에서 말풍선으로 그림
            : p
        ));
    }

    const promptText = typeof initialPayload === 'object' && initialPayload !== null ? initialPayload.text : initialPayload;
    const newTrip = { destination: destination || "New Chat", lat: selectedLocation?.lat || 0, lng: selectedLocation?.lng || 0, date: new Date().toLocaleDateString(), code: (destination || "TRP").substring(0, 3).toUpperCase(), prompt_summary: promptText || "여행 계획 시작", messages: [], is_bookmarked: false };
    
    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    if (!error && data) { 
        const createdTrip = data[0]; 
        setSavedTrips(prev => [createdTrip, ...prev]); 
        setActiveChatId(createdTrip.id); 
        if (initialPayload) setInitialQuery(initialPayload); else setInitialQuery(null); 
        setIsChatOpen(true); 
    }
  };

  const fetchRelatedTags = async (query) => { /* ... 유지 ... */ setIsTagLoading(false); };
  const handleSearch = async (query) => { /* ... 유지 ... */ };
  
  const handleOpenChat = (params) => { if (typeof params === 'object' && params !== null && params.text) { const destName = selectedLocation?.name || "검색 질문"; handleStartChat(destName, params); return; } if (typeof params === 'string') { handleStartChat(null, null, params); return; } setActiveChatId(null); setInitialQuery(null); setIsChatOpen(true); };
  const handleTicketIssue = (payload) => { handleStartChat(selectedLocation?.name, payload.text); };
  const handleUpdateChatHistory = async (tripId, newMessages) => { setSavedTrips(prev => prev.map(trip => trip.id === tripId ? { ...trip, messages: newMessages } : trip)); await supabase.from('saved_trips').update({ messages: newMessages }).eq('id', tripId); };
  const handleToggleBookmark = async (tripId) => { const targetTrip = savedTrips.find(t => t.id === tripId); if (!targetTrip) return; const newStatus = !targetTrip.is_bookmarked; setSavedTrips(prev => prev.map(trip => trip.id === tripId ? { ...trip, is_bookmarked: newStatus } : trip)); await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', tripId); };
  const handleDeleteChat = async (id) => { if (window.confirm("이 대화 기록을 삭제하시겠습니까?")) { setSavedTrips(prev => prev.filter(trip => trip.id !== id)); await supabase.from('saved_trips').delete().eq('id', id); if (activeChatId === id) { setActiveChatId(null); setIsChatOpen(false); } } }
  const handleClearChats = async () => { if (window.confirm("모든 대화 기록을 초기화하시겠습니까?")) { setSavedTrips([]); await supabase.from('saved_trips').delete().neq('id', 0); setActiveChatId(null); setIsChatOpen(false); } }
  const handleClearScouts = () => { 
      if (window.confirm("지도에 표시된 탐색 핀들을 정리하시겠습니까?")) { 
          setScoutedPins([]); 
          if(globeRef.current) globeRef.current.resetPins();
          setIsPlaceCardOpen(false);
      } 
  };
  const handleCloseTicket = () => { setIsTicketOpen(false); if (globeRef.current) globeRef.current.resumeRotation(); };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      <HomeGlobe 
        ref={globeRef} 
        onGlobeClick={handleGlobeClick} 
        onMarkerClick={handleLocationSelect} 
        isChatOpen={isChatOpen} 
        savedTrips={savedTrips} 
        tempPinsData={scoutedPins} 
        travelSpots={filteredSpots}
        // 🚨 [Active ID] 현재 주인공 핀 ID 전달 (이 녀석만 빨간 핀!)
        activePinId={selectedLocation?.id}
      />
      
      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput}
        savedTrips={savedTrips} 
        onTripClick={handleLocationSelect} 
        onTripDelete={handleDeleteChat} 
        onOpenChat={handleOpenChat}
        onLogoClick={() => setIsLogoPanelOpen(true)}
        relatedTags={relatedTags}
        isTagLoading={isTagLoading}
        onTagClick={(tag) => handleSearch(tag)}
        selectedCategory={category}
        onCategorySelect={setCategory}
        isTickerExpanded={isTickerExpanded}
        setIsTickerExpanded={setIsTickerExpanded}
        onClearScouts={handleClearScouts}
      />
      
      <LogoPanel isOpen={isLogoPanelOpen} onClose={() => setIsLogoPanelOpen(false)} user={user} bucketList={bucketList} onLogout={handleLogout} onStartAmbient={() => { setIsLogoPanelOpen(false); setIsAmbientMode(true); }} />
      {isAmbientMode && <AmbientMode bucketList={bucketList} onClose={() => setIsAmbientMode(false)} />}
      
      {isPlaceCardOpen && (
        <PlaceCard 
          location={selectedLocation} 
          onClose={() => setIsPlaceCardOpen(false)}
          onChat={(name) => { handleOpenChat({ text: `${name}에 대해 알려줘`, mode: 'search_inquiry' }); }}
          onTicket={() => { setIsPlaceCardOpen(false); setIsTicketOpen(true); }}
          isCompactMode={isTickerExpanded}
        />
      )}

      <TicketModal 
				isOpen={isTicketOpen} 
				onClose={handleCloseTicket} 
				onIssue={handleTicketIssue} 
				preFilledDestination={selectedLocation} 
				scoutedPins={scoutedPins} 
				savedTrips={savedTrips}
				onScoutDelete={()=>{}} 
				onClearScouts={handleClearScouts} 
			/>
      <ChatModal 
				isOpen={isChatOpen} 
				onClose={() => { setIsChatOpen(false); if (globeRef.current) globeRef.current.resumeRotation(); }} 
				initialQuery={initialQuery} 
				chatHistory={savedTrips} 
				onUpdateChat={handleUpdateChatHistory} 
				onToggleBookmark={handleToggleBookmark} 
				activeChatId={activeChatId} 
				onSwitchChat={(id) => handleStartChat(null, null, id)} 
				onDeleteChat={handleDeleteChat} 
				onClearChats={handleClearChats}
			/>
    </div>
  );
}
export default Home;