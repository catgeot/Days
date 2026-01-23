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
  const [scoutedPins, setScoutedPins] = useState([]);
  
  const [relatedTags, setRelatedTags] = useState([]); 
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [category, setCategory] = useState('all');

  // 🚨 [New State] 순위표 확장 여부 (카드에게 비키라고 신호 주기 위함)
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
    const { data: pins } = await supabase.from('scout_pins').select('*').order('created_at', { ascending: false }); if (pins) setScoutedPins(pins); 
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
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    setDraftInput("Locating...");
    const addressData = await getAddressFromCoordinates(lat, lng);
    const locationName = addressData?.city || addressData?.country || "Unknown Point"; 
    
    setDraftInput(`📍 ${locationName}`);
    setHiddenSearchQuery(`${locationName} travel guide`);
    
    if (globeRef.current) globeRef.current.updateLastPinName(locationName);
    const newLocation = { name: locationName, country: addressData?.country, lat, lng, type: 'user-pin' };
    setSelectedLocation(newLocation);
    setIsPlaceCardOpen(true);
  };

  const handleLocationSelect = async (locationData, source = 'globe') => {
    if (!locationData.lat || !locationData.lng) return;
    if (globeRef.current) globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name || "Selected");
    const name = locationData.name || "Selected";
    
    setDraftInput(`📍 ${name}`);
    setHiddenSearchQuery(`${name} travel guide`);
    
    const targetLocation = { ...locationData, type: 'user-pin', country: locationData.country || '' };
    setSelectedLocation(targetLocation);
    setIsPlaceCardOpen(true);
  };

  const handleStartChat = async (destination, initialPayload, existingId = null) => {
    if (existingId) { setActiveChatId(existingId); setInitialQuery(null); setIsChatOpen(true); return; }
    const promptText = typeof initialPayload === 'object' && initialPayload !== null ? initialPayload.text : initialPayload;
    const newTrip = { destination: destination || "New Chat", lat: selectedLocation?.lat || 0, lng: selectedLocation?.lng || 0, date: new Date().toLocaleDateString(), code: (destination || "TRP").substring(0, 3).toUpperCase(), prompt_summary: promptText || "여행 계획 시작", messages: [], is_bookmarked: false };
    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    if (!error && data) { const createdTrip = data[0]; setSavedTrips(prev => [createdTrip, ...prev]); setActiveChatId(createdTrip.id); if (initialPayload) setInitialQuery(initialPayload); else setInitialQuery(null); setIsChatOpen(true); }
  };

  const fetchRelatedTags = async (query) => {
    setIsTagLoading(true);
    setRelatedTags([]); 
    try {
      const prompt = `
        사용자가 여행지 "${query}"를 검색했습니다.
        이 장소의 **지리적 위계(Hierarchy)**를 판단하여 다음 규칙에 맞는 여행지 4개를 추천해주세요.
        1. **국가(Country) 검색 시:** 해당 국가 **내부의 주요 인기 도시** 추천. (Drill-down)
        2. **도시(City) 검색 시:** 해당 도시의 **주변 도시** 추천. (Sibling)
        3. **금지:** 타워, 해변, 호텔 등 하위 관광지 금지. 다른 나라 금지.
        4. **형식:** 한국어 공식 명칭. 순수 JSON 배열.
      `;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
      );
      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonStartIndex = text.indexOf('[');
      const jsonEndIndex = text.lastIndexOf(']') + 1;
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) text = text.substring(jsonStartIndex, jsonEndIndex);
      const tags = JSON.parse(text);
      if (Array.isArray(tags)) setRelatedTags(tags);
    } catch (error) { console.error("Tag generation failed:", error); } finally { setIsTagLoading(false); }
  };

  const handleSearch = async (query) => {
    let targetQuery = query;
    if (query.startsWith("📍 ")) {
      targetQuery = query.replace("📍 ", "").trim();
      if (selectedLocation && selectedLocation.name === targetQuery) { setIsTicketOpen(true); return; }
    }
    if (!query.startsWith("📍 ")) { fetchRelatedTags(targetQuery); }

    const foundPin = scoutedPins.find(p => p.name.toLowerCase().includes(targetQuery.toLowerCase()));
    if (foundPin) { handleLocationSelect(foundPin, 'search'); return; }

    try {
      setDraftInput("Searching World...");
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(targetQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const place = data[0];
        const simpleName = place.display_name.split(',')[0];
        const newLocation = { name: simpleName, lat: parseFloat(place.lat), lng: parseFloat(place.lon), country: '' };
        handleLocationSelect(newLocation, 'search');
      } else { setDraftInput(targetQuery); alert(`'${targetQuery}' 위치를 찾을 수 없습니다.`); }
    } catch (error) { setDraftInput(targetQuery); alert("검색 중 오류가 발생했습니다."); }
  };

  // ... (기타 핸들러 유지)
  const handleOpenChat = (params) => { if (typeof params === 'object' && params !== null && params.text) { const destName = selectedLocation?.name || "검색 질문"; handleStartChat(destName, params); return; } if (typeof params === 'string') { handleStartChat(null, null, params); return; } setActiveChatId(null); setInitialQuery(null); setIsChatOpen(true); };
  const handleTicketIssue = (payload) => { handleStartChat(selectedLocation?.name, payload.text); };
  const handleUpdateChatHistory = async (tripId, newMessages) => { setSavedTrips(prev => prev.map(trip => trip.id === tripId ? { ...trip, messages: newMessages } : trip)); await supabase.from('saved_trips').update({ messages: newMessages }).eq('id', tripId); };
  const handleToggleBookmark = async (tripId) => { const targetTrip = savedTrips.find(t => t.id === tripId); if (!targetTrip) return; const newStatus = !targetTrip.is_bookmarked; setSavedTrips(prev => prev.map(trip => trip.id === tripId ? { ...trip, is_bookmarked: newStatus } : trip)); await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', tripId); };
  const handleDeleteChat = async (id) => { if (window.confirm("이 대화 기록을 삭제하시겠습니까?")) { setSavedTrips(prev => prev.filter(trip => trip.id !== id)); await supabase.from('saved_trips').delete().eq('id', id); if (activeChatId === id) { setActiveChatId(null); setIsChatOpen(false); } } }
  const handleClearChats = async () => { if (window.confirm("모든 대화 기록을 초기화하시겠습니까?")) { setSavedTrips([]); await supabase.from('saved_trips').delete().neq('id', 0); setActiveChatId(null); setIsChatOpen(false); } }
  const handleScoutDelete = async (id) => { setScoutedPins(prev => prev.filter(pin => pin.id !== id)); await supabase.from('scout_pins').delete().eq('id', id); };
  const handleClearScouts = async () => { if (window.confirm("모든 탐색 핀을 초기화하시겠습니까?")) { setScoutedPins([]); await supabase.from('scout_pins').delete().neq('id', 0); if (globeRef.current) globeRef.current.resetPins(); } };
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
        
        // 🚨 [Signal] 순위표 상태 전달
        isTickerExpanded={isTickerExpanded}
        setIsTickerExpanded={setIsTickerExpanded}
      />
      
      <LogoPanel isOpen={isLogoPanelOpen} onClose={() => setIsLogoPanelOpen(false)} user={user} bucketList={bucketList} onLogout={handleLogout} onStartAmbient={() => { setIsLogoPanelOpen(false); setIsAmbientMode(true); }} />
      {isAmbientMode && <AmbientMode bucketList={bucketList} onClose={() => setIsAmbientMode(false)} />}
      
      {isPlaceCardOpen && (
        <PlaceCard 
          location={selectedLocation} 
          onClose={() => setIsPlaceCardOpen(false)}
          onChat={(name) => { handleOpenChat({ text: `${name}에 대해 알려줘`, mode: 'search_inquiry' }); }}
          onTicket={() => { setIsPlaceCardOpen(false); setIsTicketOpen(true); }}
          
          // 🚨 [Yield] 순위표가 열려있는지(isTickerExpanded) 알려줌
          isCompactMode={isTickerExpanded}
        />
      )}

      <TicketModal isOpen={isTicketOpen} onClose={handleCloseTicket} onIssue={handleTicketIssue} preFilledDestination={selectedLocation} scoutedPins={scoutedPins} onScoutDelete={handleScoutDelete} onClearScouts={handleClearScouts} />
      <ChatModal isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); if (globeRef.current) globeRef.current.resumeRotation(); }} initialQuery={initialQuery} chatHistory={savedTrips} onUpdateChat={handleUpdateChatHistory} onToggleBookmark={handleToggleBookmark} activeChatId={activeChatId} onSwitchChat={(id) => handleStartChat(null, null, id)} onDeleteChat={handleDeleteChat} onClearChats={handleClearChats} />
    </div>
  );
}
export default Home;