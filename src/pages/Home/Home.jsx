import React, { useState, useRef, useEffect } from 'react';
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import { getAddressFromCoordinates } from '../../lib/geocoding';
import { supabase } from '../../lib/supabase';

function Home() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [initialQuery, setInitialQuery] = useState('');
  const [draftInput, setDraftInput] = useState('');
  const [hiddenSearchQuery, setHiddenSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  const [savedTrips, setSavedTrips] = useState([]);  
  const [scoutedPins, setScoutedPins] = useState([]);

  const globeRef = useRef();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: trips } = await supabase.from('saved_trips').select('*').order('created_at', { ascending: false });
    if (trips) setSavedTrips(trips);
    const { data: pins } = await supabase.from('scout_pins').select('*').order('created_at', { ascending: false });
    if (pins) setScoutedPins(pins);
  };

  const handleGlobeClick = async ({ lat, lng }) => {
    if (globeRef.current) globeRef.current.pauseRotation();
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    setDraftInput("Locating...");
    const addressData = await getAddressFromCoordinates(lat, lng);
    const locationName = addressData?.city || addressData?.country || "Unknown Point"; 
    const fullLabel = addressData?.country ? `${locationName}, ${addressData.country}` : locationName;
    setDraftInput(`📍 [${locationName}] Ready`);
    setHiddenSearchQuery(`${locationName} travel guide`);
    if (globeRef.current) globeRef.current.updateLastPinName(locationName);
    setSelectedLocation({ name: locationName, country: addressData?.country, lat, lng, type: 'user-pin' });
    const newPin = { name: locationName, code: locationName.substring(0, 3).toUpperCase(), lat, lng };
    const { data, error } = await supabase.from('scout_pins').insert([newPin]).select();
    if (!error && data) setScoutedPins(prev => [data[0], ...prev]);
  };

  const handleLocationSelect = async (locationData, source = 'globe') => {
    if (!locationData.lat || !locationData.lng) return;

    // 1. 지구본 이동 (1.5초 동안 이동함)
    if (globeRef.current) {
      globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name || "Selected");
    }

    const name = locationData.name || "Selected";
    setDraftInput(`📍 [${name}] Ready`);
    setHiddenSearchQuery(`${name} travel guide`);
    
    // 2. 핀 저장 (DB)
    const isAlreadyScouted = scoutedPins.some(p => p.name === name);
    if (!isAlreadyScouted) {
      const newPin = { 
        name: name, 
        code: name.substring(0, 3).toUpperCase(), 
        lat: locationData.lat, 
        lng: locationData.lng 
      };
      const { data, error } = await supabase.from('scout_pins').insert([newPin]).select();
      if (!error && data) {
        setScoutedPins(prev => [data[0], ...prev]);
      }
    }

    // 3. 상태 업데이트
    const targetLocation = {
      ...locationData,
      type: 'user-pin', 
      country: locationData.country || ''
    };
    setSelectedLocation(targetLocation);

    // 🚨 [Fix] Cinematic Transition: 1.5초 딜레이 후 모달 오픈
    // source가 'globe'일 때만 창을 여는데, 이동이 끝나는 시점에 맞춤
    if (source === 'globe') {
      setTimeout(() => {
        setIsTicketOpen(true);
      }, 1500); // 1.5초 대기
    }
  };

  const handleStartChat = async (destination, initialText, existingId = null) => {
    if (existingId) {
      setActiveChatId(existingId);
      setInitialQuery(null); 
      setIsChatOpen(true);
      return;
    }
    const newTrip = {
      destination: destination || "New Chat",
      lat: selectedLocation?.lat || 0,
      lng: selectedLocation?.lng || 0,
      date: new Date().toLocaleDateString(),
      code: (destination || "TRP").substring(0, 3).toUpperCase(),
      prompt_summary: initialText || "여행 계획 시작",
      messages: [], 
      is_bookmarked: false
    };
    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    if (!error && data) {
      const createdTrip = data[0];
      setSavedTrips(prev => [createdTrip, ...prev]); 
      setActiveChatId(createdTrip.id);
      if (initialText) setInitialQuery({ text: initialText, display: initialText });
      else setInitialQuery(null);
      setIsChatOpen(true);
    }
  };

  const handleSearch = (query) => {
    const targetName = selectedLocation?.name || "검색된 여행지";
    let actualQuery = query;
    if (query === draftInput && hiddenSearchQuery) actualQuery = hiddenSearchQuery;
    handleStartChat(targetName, actualQuery);
  };
  const handleTicketIssue = (payload) => { handleStartChat(selectedLocation?.name, payload.text); };
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
    if (window.confirm("이 대화 기록을 삭제하시겠습니까?")) {
      setSavedTrips(prev => prev.filter(trip => trip.id !== id));
      await supabase.from('saved_trips').delete().eq('id', id);
      if (activeChatId === id) { setActiveChatId(null); setIsChatOpen(false); }
    }
  };
  const handleClearChats = async () => {
    if (window.confirm("모든 대화 기록을 초기화하시겠습니까?")) {
      setSavedTrips([]);
      await supabase.from('saved_trips').delete().neq('id', 0);
      setActiveChatId(null);
      setIsChatOpen(false);
    }
  };
  const handleScoutDelete = async (id) => {
    setScoutedPins(prev => prev.filter(pin => pin.id !== id));
    await supabase.from('scout_pins').delete().eq('id', id);
  };
  const handleClearScouts = async () => {
    if (window.confirm("모든 탐색 핀을 초기화하시겠습니까?")) {
      setScoutedPins([]); 
      await supabase.from('scout_pins').delete().neq('id', 0); 
      if (globeRef.current) globeRef.current.resetPins();
    }
  };
  const handleOpenChatHistory = () => {
    if (savedTrips.length > 0) handleStartChat(null, null, savedTrips[0].id);
    else alert("저장된 대화가 없습니다.");
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
      />
      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput}
        savedTrips={savedTrips} 
        onTripClick={handleLocationSelect} 
        onTripDelete={handleDeleteChat} 
        onOpenChat={handleOpenChatHistory}
      />
      <TicketModal 
        isOpen={isTicketOpen} 
        onClose={handleCloseTicket}
        onIssue={handleTicketIssue}
        preFilledDestination={selectedLocation} 
        scoutedPins={scoutedPins}
        onScoutDelete={handleScoutDelete}
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