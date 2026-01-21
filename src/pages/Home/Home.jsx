import React, { useState, useRef, useEffect } from 'react';
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import { getAddressFromCoordinates } from '../../lib/geocoding';
import { supabase } from '../../lib/supabase';

// 🚨 [New] 신규 컴포넌트 Import
import LogoPanel from './components/LogoPanel';
import AmbientMode from './components/AmbientMode';

function Home() {
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // 🚨 [New] 패널 & 앰비언트 모드 상태
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);
  const [isAmbientMode, setIsAmbientMode] = useState(false);
  
  // 🚨 [New] 로그인 유저 상태
  const [user, setUser] = useState(null);

  const [initialQuery, setInitialQuery] = useState('');
  const [draftInput, setDraftInput] = useState('');
  const [hiddenSearchQuery, setHiddenSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  const [savedTrips, setSavedTrips] = useState([]);  
  const [scoutedPins, setScoutedPins] = useState([]);

  const globeRef = useRef();

  // 1. 데이터 및 로그인 상태 로드
  useEffect(() => { 
    fetchData(); 
    checkUser();

    // 🚨 실시간 로그인 상태 감지 (Logbook 등 다른 탭에서 로그인해도 반영됨)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchData = async () => {
    const { data: trips } = await supabase.from('saved_trips').select('*').order('created_at', { ascending: false });
    if (trips) setSavedTrips(trips);
    const { data: pins } = await supabase.from('scout_pins').select('*').order('created_at', { ascending: false });
    if (pins) setScoutedPins(pins);
  };

  // 🚨 [New] 버킷 리스트 필터링 (별표 친 것만)
  const bucketList = savedTrips.filter(trip => trip.is_bookmarked);

  // 🚨 [New] 로그아웃 핸들러
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLogoPanelOpen(false); // 로그아웃 시 패널 닫기
    alert("로그아웃 되었습니다.");
  };

  // ... (이하 기존 핸들러들 동일) ...
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
    if (globeRef.current) {
      globeRef.current.flyToAndPin(locationData.lat, locationData.lng, locationData.name || "Selected");
    }
    const name = locationData.name || "Selected";
    setDraftInput(`📍 [${name}] Ready`);
    setHiddenSearchQuery(`${name} travel guide`);
    
    const isAlreadyScouted = scoutedPins.some(p => p.name === name);
    if (!isAlreadyScouted) {
      const newPin = { name: name, code: name.substring(0, 3).toUpperCase(), lat: locationData.lat, lng: locationData.lng };
      const { data, error } = await supabase.from('scout_pins').insert([newPin]).select();
      if (!error && data) setScoutedPins(prev => [data[0], ...prev]);
    }
    const targetLocation = { ...locationData, type: 'user-pin', country: locationData.country || '' };
    setSelectedLocation(targetLocation);

    if (source === 'globe') {
      setTimeout(() => { setIsTicketOpen(true); }, 1500); 
    }
  };

  const handleStartChat = async (destination, initialText, existingId = null) => {
    if (existingId) { setActiveChatId(existingId); setInitialQuery(null); setIsChatOpen(true); return; }
    const newTrip = {
      destination: destination || "New Chat",
      lat: selectedLocation?.lat || 0,
      lng: selectedLocation?.lng || 0,
      date: new Date().toLocaleDateString(),
      code: (destination || "TRP").substring(0, 3).toUpperCase(),
      prompt_summary: initialText || "여행 계획 시작",
      messages: [], is_bookmarked: false
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
        // 🚨 로고 클릭 시 패널 오픈
        onLogoClick={() => setIsLogoPanelOpen(true)}
      />
      
      {/* 🚨 [New] 로고 패널 (슬라이드) */}
      <LogoPanel 
        isOpen={isLogoPanelOpen}
        onClose={() => setIsLogoPanelOpen(false)}
        user={user}
        bucketList={bucketList}
        onLogout={handleLogout}
        onStartAmbient={() => {
          setIsLogoPanelOpen(false);
          setIsAmbientMode(true);
        }}
      />

      {/* 🚨 [New] 앰비언트 모드 (전체화면 슬라이드) */}
      {isAmbientMode && (
        <AmbientMode 
          bucketList={bucketList} 
          onClose={() => setIsAmbientMode(false)} 
        />
      )}

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