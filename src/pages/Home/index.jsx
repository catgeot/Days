// src/pages/Home/index.jsx
// 🚨 [Fix] toggleBookmark 주입 및 handleToggleBookmark Props 하달

import React, { useState, useRef, useEffect, useMemo } from 'react';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import ChatModal from './components/ChatModal'; 
import PlaceCard from '../../components/PlaceCard/index'; 
import LogoPanel from './components/LogoPanel';
import AmbientMode from './components/AmbientMode';

// Libs & Utils
import { supabase } from '../../shared/api/supabase';
import { TRAVEL_SPOTS } from './data/travelSpots';

// Hooks
import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';
import { useHomeHandlers } from './hooks/useHomeHandlers';

function Home() {
  const globeRef = useRef();
  const [user, setUser] = useState(null);
  
  useEffect(() => { 
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const { scoutedPins, setScoutedPins, selectedLocation, setSelectedLocation, moveToLocation, addScoutPin, clearScouts } = useGlobeLogic(globeRef, user?.id);
  const { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip, clearTemporaryTrips } = useTravelData();
  const { relatedTags, isTagLoading, processSearchKeywords } = useSearchEngine();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);
  const [isAmbientMode, setIsAmbientMode] = useState(false);
  const [isPlaceCardOpen, setIsPlaceCardOpen] = useState(false); 
  const [initialQuery, setInitialQuery] = useState(null);
  const [draftInput, setDraftInput] = useState('');
  const [category, setCategory] = useState('paradise');
  const [isPinVisible, setIsPinVisible] = useState(true);
  const [globeTheme, setGlobeTheme] = useState('neon');
  const [isTickerExpanded, setIsTickerExpanded] = useState(false); 
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  const {
    handleGlobeClick,
    handleLocationSelect,
    handleStartChat,
    handleToggleBookmark, // 🚨 핸들러 추출
    handleSmartSearch,
    handleClearChats
  } = useHomeHandlers({
    globeRef, user, category, isPinVisible, selectedLocation, savedTrips,
    setSelectedLocation, addScoutPin, moveToLocation, processSearchKeywords,
    setIsPlaceCardOpen, setIsCardExpanded, setIsPinVisible, setDraftInput,
    setIsChatOpen, setInitialQuery, setActiveChatId, saveNewTrip, setSavedTrips, fetchData,
    toggleBookmark // 🚨 [Fix] toggleBookmark 주입
  });

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSavedTrips = useMemo(() => savedTrips.filter(t => t.category === category), [savedTrips, category]);
  const filteredScoutedPins = useMemo(() => scoutedPins.filter(p => p.category === category), [scoutedPins, category]);
  const filteredSpots = useMemo(() => TRAVEL_SPOTS.filter(s => s.category === category), [category]);
  const bucketList = useMemo(() => savedTrips.filter(t => t.is_bookmarked), [savedTrips]);
  const globeRenderedTrips = useMemo(() => filteredSavedTrips.filter(t => t.lat !== 0 || t.lng !== 0), [filteredSavedTrips]);

  const isFocusMode = useMemo(() => {
    if (isAmbientMode) return true;
    if (isChatOpen) return true;
    if (isPlaceCardOpen && isCardExpanded) return true;
    return false;
  }, [isAmbientMode, isChatOpen, isPlaceCardOpen, isCardExpanded]);

  const handleThemeToggle = () => {
    const themes = ['neon', 'bright', 'deep'];
    const nextIndex = (themes.indexOf(globeTheme) + 1) % themes.length;
    setGlobeTheme(themes[nextIndex]);
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      <div 
        style={{ 
          contentVisibility: isFocusMode ? 'hidden' : 'visible',
          contain: isFocusMode ? 'strict' : 'none',
          containIntrinsicSize: '100vw 100vh',
          pointerEvents: isFocusMode ? 'none' : 'auto',
          width: '100%', height: '100%'
        }}
      >
        <HomeGlobe 
          ref={globeRef} 
          onGlobeClick={handleGlobeClick} 
          onMarkerClick={handleLocationSelect} 
          isChatOpen={isChatOpen} 
          savedTrips={isPinVisible ? globeRenderedTrips : []} 
          tempPinsData={isPinVisible ? filteredScoutedPins : []} 
          travelSpots={isPinVisible ? filteredSpots : []} 
          activePinId={selectedLocation?.id}
          pauseRender={isFocusMode} 
          globeTheme={globeTheme} 
        />
      </div>
      
      <HomeUI 
        onSearch={handleSmartSearch} onTickerClick={handleSmartSearch} onTagClick={handleSmartSearch} 
        externalInput={draftInput} savedTrips={filteredSavedTrips} 
        onTripClick={handleLocationSelect} onTripDelete={deleteTrip}
        onOpenChat={(p) => handleStartChat(selectedLocation?.name, p)}
        onLogoClick={() => setIsLogoPanelOpen(true)}
        relatedTags={relatedTags} isTagLoading={isTagLoading} 
        selectedCategory={category} onCategorySelect={setCategory}
        isTickerExpanded={isTickerExpanded} setIsTickerExpanded={setIsTickerExpanded}
        isPinVisible={isPinVisible} onTogglePinVisibility={() => setIsPinVisible(prev => !prev)}
        globeTheme={globeTheme} onThemeToggle={handleThemeToggle} 
        onClearScouts={() => { 
            if(window.confirm("임시 핀과 저장되지 않은 대화 기록을 모두 정리하시겠습니까?")) {
                clearScouts(); clearTemporaryTrips(); setDraftInput(''); setSelectedLocation(null); 
            } 
        }}
      />
      
      <LogoPanel isOpen={isLogoPanelOpen} onClose={() => setIsLogoPanelOpen(false)} user={user} bucketList={bucketList} onLogout={() => supabase.auth.signOut()} onStartAmbient={() => { setIsLogoPanelOpen(false); setIsAmbientMode(true); }} />
      {isAmbientMode && <AmbientMode bucketList={bucketList} onClose={() => setIsAmbientMode(false)} />}
      
      {isPlaceCardOpen && selectedLocation && (
        <PlaceCard 
          location={selectedLocation} 
          onClose={() => setIsPlaceCardOpen(false)}
          onChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onToggleBookmark={handleToggleBookmark} // 🚨 [Fix] 배선 연결
          onTicket={() => { setIsPlaceCardOpen(false); }}
          isCompactMode={isTickerExpanded}
          onExpandChange={setIsCardExpanded}
        />
      )}

      <ChatModal 
        isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); globeRef.current?.resumeRotation(); }} 
        initialQuery={initialQuery} chatHistory={filteredSavedTrips} 
        onUpdateChat={updateMessages} onToggleBookmark={toggleBookmark} 
        activeChatId={activeChatId} onSwitchChat={(id) => handleStartChat(null, null, id)} 
        onDeleteChat={deleteTrip} onClearChats={handleClearChats}
      />
    </div>
  );
}
export default Home;