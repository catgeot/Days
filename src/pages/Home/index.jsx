// src/pages/Home/index.jsx
// 🚨 [Fix] LogoPanel 다이렉트 오픈 버그 수정: 병합 순서를 { ...trip, ...realSpot }으로 교체하여 원본 ID(예: 203) 보존 (유튜브 정상화)

import React, { useState, useRef, useEffect, useMemo } from 'react';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import ChatModal from './components/ChatModal'; 
import PlaceCard from '../../components/PlaceCard/index'; 
import LogoPanel from './components/LogoPanel';

// 🚨 [New] 일기장 통합 오버레이 패널 컴포넌트 마운트
import ReportPanel from './components/ReportPanel';

// Libs & Utils
import { supabase } from '../../shared/api/supabase';
import { TRAVEL_SPOTS } from './data/travelSpots';

// Hooks
import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';
import { useHomeHandlers } from './hooks/useHomeHandlers';

// 🚨 [New] 일기장 전역 상태를 가져오기 위한 훅 추가 (Phase 2)
import { useReport } from '../../context/ReportContext';

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

  // 🚨 [New] ReportContext에서 일기장 오픈 상태(isOpen)를 가져와 isReportOpen으로 할당
  const { isOpen: isReportOpen } = useReport();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);
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
    handleToggleBookmark, 
    handleSmartSearch,
    handleClearChats
  } = useHomeHandlers({
    globeRef, user, category, isPinVisible, selectedLocation, savedTrips,
    setSelectedLocation, addScoutPin, moveToLocation, processSearchKeywords,
    setIsPlaceCardOpen, setIsCardExpanded, setIsPinVisible, setDraftInput,
    setIsChatOpen, setInitialQuery, setActiveChatId, saveNewTrip, setSavedTrips, fetchData,
    toggleBookmark 
  });

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSavedTrips = useMemo(() => savedTrips.filter(t => t.category === category), [savedTrips, category]);
  const filteredScoutedPins = useMemo(() => scoutedPins.filter(p => p.category === category), [scoutedPins, category]);
  const filteredSpots = useMemo(() => TRAVEL_SPOTS.filter(s => s.category === category), [category]);
  const bucketList = useMemo(() => savedTrips.filter(t => t.is_bookmarked), [savedTrips]);
  const globeRenderedTrips = useMemo(() => filteredSavedTrips.filter(t => t.lat !== 0 || t.lng !== 0), [filteredSavedTrips]);

  // 🚨 [Fix] isReportOpen 상태를 의존성 배열에 추가하고, 열려있을 때 렌더링을 차단하도록 뺄셈의 미학 적용
  const isFocusMode = useMemo(() => {
    if (isChatOpen) return true;
    if (isPlaceCardOpen && isCardExpanded) return true;
    if (isReportOpen) return true; // 일기장이 열리면 지구본 멈춤
    return false;
  }, [isChatOpen, isPlaceCardOpen, isCardExpanded, isReportOpen]);

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
      
      <LogoPanel 
        isOpen={isLogoPanelOpen} 
        onClose={() => setIsLogoPanelOpen(false)} 
        user={user} 
        bucketList={bucketList} 
        onLogout={() => supabase.auth.signOut()} 
        onToggleBookmark={toggleBookmark} 
        onTripSelect={(trip) => { 
          setIsLogoPanelOpen(false);
          const realSpot = TRAVEL_SPOTS.find(s => s.name === trip.destination || s.name_en === trip.destination);
          const hydratedLocation = realSpot ? { ...trip, ...realSpot, name: trip.destination } : { ...trip, name: trip.destination };
          handleLocationSelect(hydratedLocation); 
          setIsCardExpanded(true);
        }}
      />
      
      {isPlaceCardOpen && selectedLocation && (
        <PlaceCard 
          location={selectedLocation} 
          isBookmarked={savedTrips.some(t => t.destination === selectedLocation.name && t.is_bookmarked)}
          onClose={() => { 
            setIsPlaceCardOpen(false); 
            setIsCardExpanded(false); 
          }}
          onChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onToggleBookmark={handleToggleBookmark} 
          onTicket={() => { setIsPlaceCardOpen(false); setIsCardExpanded(false); }}
          isCompactMode={isTickerExpanded}
          initialExpanded={isCardExpanded} 
          onExpandChange={setIsCardExpanded} 
        />
      )}

      <ChatModal 
        isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); globeRef.current?.resumeRotation(); }} 
        initialQuery={initialQuery} chatHistory={filteredSavedTrips} 
        onUpdateChat={updateMessages} onToggleBookmark={toggleBookmark} 
        activeChatId={activeChatId} onSwitchChat={(id) => handleStartChat(null, null, id)} 
        onDeleteChat={deleteTrip} 
        onClearChats={handleClearChats}
      />

      {/* 🚨 [New] 일기장 패널 마운트 (가장 높은 z-index로 화면을 덮습니다) */}
      <ReportPanel />
    </div>
  );
}
export default Home;