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
// 🚨 [Fix/New] 프롬프트 타입 임포트
import { PERSONA_TYPES } from '../../lib/prompts';

function Home() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);
  const [isAmbientMode, setIsAmbientMode] = useState(false);
  const [isPlaceCardOpen, setIsPlaceCardOpen] = useState(false); 
  const [user, setUser] = useState(null);

  const [initialQuery, setInitialQuery] = useState(null);
  const [draftInput, setDraftInput] = useState('');
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  
  const [savedTrips, setSavedTrips] = useState([]);  
  const [scoutedPins, setScoutedPins] = useState([]); 
  
  const [relatedTags, setRelatedTags] = useState([]); 
  const [isTagLoading, setIsTagLoading] = useState(false);
  
  const [category, setCategory] = useState('all');
  const [isTickerExpanded, setIsTickerExpanded] = useState(false);

  const globeRef = useRef();

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
    const { data: trips } = await supabase.from('saved_trips').select('*').order('created_at', { ascending: false }); 
    if (trips) setSavedTrips(trips); 
  };
  const bucketList = savedTrips.filter(trip => trip.is_bookmarked);
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setIsLogoPanelOpen(false); alert("로그아웃 되었습니다."); };

  const filteredSpots = useMemo(() => {
    if (category === 'all') return TRAVEL_SPOTS;
    return TRAVEL_SPOTS.filter(spot => spot.category === category);
  }, [category]);

  // 🚨 [Fix/New] 연관 키워드 추출 로직 (좌측 리스트 복구)
  const processSearchKeywords = async (query) => {
    if (!query) return;
    setIsTagLoading(true);
    try {
      let tags = [];
      const cleanQuery = query.replace("📍", "").trim();

      if (cleanQuery.includes("베트남")) {
        tags = ["다낭", "하롱베이", "나트랑", "푸꾸옥"];
      } else if (cleanQuery.includes("다낭")) {
        tags = ["나트랑", "하롱베이", "호이안", "미케비치", "바나힐"];
      } else if (cleanQuery.includes("일본")) {
        tags = ["도쿄", "오사카", "후쿠오카", "삿포로"];
      } else {
        tags = ["로컬 맛집", "인생샷 스팟", "추천 숙소", "야경 명소"];
      }
      setRelatedTags(tags);
    } catch (error) {
      console.error("Tag processing error:", error);
    } finally {
      setIsTagLoading(false);
    }
  };

  // --- Handlers ---

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    setDraftInput(query);
    processSearchKeywords(query);

    const searchPayload = {
      text: query,
      persona: PERSONA_TYPES.GENERAL, 
      timestamp: Date.now()
    };
    
    handleStartChat(null, searchPayload);
  };

  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    
    const tempId = Date.now();
    const tempPin = { 
      id: tempId, lat, lng, 
      name: "Scanning...", country: "Searching...", 
      type: 'temp-base', category: 'scout'
    };

    setScoutedPins(prev => [tempPin, ...prev].slice(0, 5));
    setSelectedLocation(tempPin);
    setIsPlaceCardOpen(true);
    
    if (globeRef.current) globeRef.current.flyToAndPin(lat, lng, "Scanning...", "scout");

    const addressData = await getAddressFromCoordinates(lat, lng);
    const locationName = addressData?.city || addressData?.country || `Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;

    processSearchKeywords(locationName);

    const realPin = { 
      ...tempPin, 
      name: locationName, 
      country: addressData?.country || "Unknown", 
      category: 'scout'
    };

    setScoutedPins(prev => prev.map(p => p.id === tempId ? realPin : p));
    setSelectedLocation(realPin);
    setDraftInput(`📍 ${locationName}`);
  };

  const handleLocationSelect = async (locationData) => {
    if (!locationData.lat || !locationData.lng) return;
    if (globeRef.current) globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name || "Selected", locationData.category);
    
    const name = locationData.name || "Selected";
    setDraftInput(`📍 ${name}`);
    processSearchKeywords(name);
    
    const targetLocation = { 
        ...locationData, type: 'temp-base', 
        id: locationData.id || Date.now(), country: locationData.country || '' 
    };
    
    setScoutedPins(prev => {
        const filtered = prev.filter(p => p.id !== targetLocation.id && p.name !== targetLocation.name);
        return [targetLocation, ...filtered].slice(0, 5);
    });

    setSelectedLocation(targetLocation);
    setIsPlaceCardOpen(true);
  };

  const handleStartChat = async (destination, initialPayload, existingId = null) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    
    if (existingId) { 
      setActiveChatId(existingId); 
      setInitialQuery(null); 
      setIsChatOpen(true); 
      return; 
    }

    let persona = PERSONA_TYPES.GENERAL;
    if (selectedLocation) {
      persona = PERSONA_TYPES.INSPIRER; 
    }

    // 🚨 [Fix] payload가 객체일 때와 문자열일 때 모두 대응
    const payloadWithPersona = typeof initialPayload === 'object' && initialPayload !== null
      ? { ...initialPayload, persona: initialPayload.persona || persona }
      : { text: initialPayload, persona: persona };

    const promptText = payloadWithPersona.text;
    const newTrip = { 
      destination: destination || (selectedLocation ? selectedLocation.name : "New Session"), 
      lat: selectedLocation?.lat || 0, 
      lng: selectedLocation?.lng || 0, 
      date: new Date().toLocaleDateString(), 
      code: (destination || "TRP").substring(0, 3).toUpperCase(), 
      prompt_summary: promptText || "대화 시작", 
      messages: [], 
      is_bookmarked: false,
      persona: persona // SQL로 추가한 컬럼
    };
    
    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    if (!error && data) { 
        const createdTrip = data[0]; 
        setSavedTrips(prev => [createdTrip, ...prev]); 
        setActiveChatId(createdTrip.id); 
        setInitialQuery(payloadWithPersona); 
        setIsChatOpen(true); 
    }
  };

  const handleOpenChat = (params) => {
    if (typeof params === 'object' && params !== null && params.text) {
      handleStartChat(selectedLocation?.name, params);
      return;
    }
    setActiveChatId(null); setInitialQuery(null); setIsChatOpen(true);
  };

  const handleUpdateChatHistory = async (tripId, newMessages) => {
    setSavedTrips(prev => prev.map(trip => trip.id === tripId ? { ...trip, messages: newMessages } : trip));
    await supabase.from('saved_trips').update({ messages: newMessages }).eq('id', tripId);
  };

  const handleToggleBookmark = async (tripId) => {
    const targetTrip = savedTrips.find(t => t.id === tripId);
    if (!targetTrip) return;
    const newStatus = !targetTrip.is_bookmarked;
    setSavedTrips(prev => prev.map(trip => trip.id === tripId ? { ...trip, is_bookmarked: newStatus } : trip));
    await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', tripId);
  };

  const handleDeleteChat = async (id) => {
    if (window.confirm("삭제하시겠습니까?")) {
      setSavedTrips(prev => prev.filter(trip => trip.id !== id));
      await supabase.from('saved_trips').delete().eq('id', id);
      if (activeChatId === id) { setActiveChatId(null); setIsChatOpen(false); }
    }
  }

  const handleClearScouts = () => { 
    if (window.confirm("정리하시겠습니까?")) { 
        setScoutedPins([]); if(globeRef.current) globeRef.current.resetPins(); setIsPlaceCardOpen(false);
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
        onSearch={handleSearch} onTickerClick={handleLocationSelect}
        onTicketClick={() => setIsTicketOpen(true)} externalInput={draftInput}
        savedTrips={savedTrips} onTripClick={handleLocationSelect} 
        onTripDelete={handleDeleteChat} onOpenChat={handleOpenChat}
        onLogoClick={() => setIsLogoPanelOpen(true)}
        relatedTags={relatedTags} isTagLoading={isTagLoading}
        onTagClick={(tag) => handleSearch(tag)}
        selectedCategory={category} onCategorySelect={setCategory}
        isTickerExpanded={isTickerExpanded} setIsTickerExpanded={setIsTickerExpanded}
        onClearScouts={handleClearScouts}
      />
      
      <LogoPanel isOpen={isLogoPanelOpen} onClose={() => setIsLogoPanelOpen(false)} user={user} bucketList={bucketList} onLogout={handleLogout} onStartAmbient={() => { setIsLogoPanelOpen(false); setIsAmbientMode(true); }} />
      {isAmbientMode && <AmbientMode bucketList={bucketList} onClose={() => setIsAmbientMode(false)} />}
      
      {isPlaceCardOpen && (
        <PlaceCard 
          location={selectedLocation} onClose={() => setIsPlaceCardOpen(false)}
          onChat={(payload) => { 
            // 🚨 [Fix] PlaceCard에서 객체로 넘겨주는 데이터를 그대로 handleOpenChat으로 전달
            handleOpenChat(payload); 
          }}
          onTicket={() => { setIsPlaceCardOpen(false); setIsTicketOpen(true); }}
          isCompactMode={isTickerExpanded}
        />
      )}

      <TicketModal 
        isOpen={isTicketOpen} onClose={() => { setIsTicketOpen(false); globeRef.current?.resumeRotation(); }} 
        onIssue={(payload) => {
          handleStartChat(selectedLocation?.name, { text: payload.text, persona: PERSONA_TYPES.PLANNER });
        }} 
        preFilledDestination={selectedLocation} scoutedPins={scoutedPins} 
        savedTrips={savedTrips} onScoutDelete={()=>{}} onClearScouts={handleClearScouts} 
      />

      <ChatModal 
        isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); globeRef.current?.resumeRotation(); }} 
        initialQuery={initialQuery} chatHistory={savedTrips} 
        onUpdateChat={handleUpdateChatHistory} onToggleBookmark={handleToggleBookmark} 
        activeChatId={activeChatId} onSwitchChat={(id) => handleStartChat(null, null, id)} 
        onDeleteChat={handleDeleteChat} onClearChats={async () => {}}
      />
    </div>
  );
}
export default Home;