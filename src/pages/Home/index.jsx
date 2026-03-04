// src/pages/Home/index.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] ReportPanel 전역 상태 및 마운트 로직 완전 제거 (URL 라우팅으로 위임)
// 2. [Routing] isPlaceCardOpen 상태를 제거하고 React Router의 <Outlet />과 Deep Linking 동기화 적용
// 3. 기존의 Zen Mode, UI Ghosting, VIP 프리패스 로직 유지

import React, { useState, useRef, useEffect, useMemo } from 'react';
// 🚨 [Fix/New] 라우팅 제어를 위한 훅 추가
import { Outlet, useNavigate, useLocation, matchPath } from 'react-router-dom';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import ChatModal from './components/ChatModal'; 
// 🚨 [Fix] PlaceCard, ReportPanel 하드코딩 임포트 제거 (Outlet으로 대체)
import LogoPanel from './components/LogoPanel';

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
  
  // 🚨 [Fix/New] 라우터 훅 초기화
  const navigate = useNavigate();
  const routeLocation = useLocation();

  useEffect(() => { 
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const { scoutedPins, setScoutedPins, selectedLocation, setSelectedLocation, moveToLocation, addScoutPin, clearScouts } = useGlobeLogic(globeRef, user?.id);
  const { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip } = useTravelData(user);
  const { relatedTags, isTagLoading, processSearchKeywords } = useSearchEngine();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);
  
  // 🚨 [Fix] isPlaceCardOpen 제거 완료. 
  // 단, useHomeHandlers와의 호환성을 위해 닫기 액션 발생 시 URL을 Home으로 돌리는 함수로 대체
  const setIsPlaceCardOpen = (isOpen) => {
    if (!isOpen) navigate('/');
  };

  const [initialQuery, setInitialQuery] = useState(null);
  const [draftInput, setDraftInput] = useState('');
  const [category, setCategory] = useState('paradise');
  const [isPinVisible, setIsPinVisible] = useState(true);
  const [globeTheme, setGlobeTheme] = useState('neon');
  const [isTickerExpanded, setIsTickerExpanded] = useState(false); 
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

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

  // 🚨 [New] Deep Linking 1: 지도에서 마커 선택 시 URL 변경
  useEffect(() => {
    if (selectedLocation && routeLocation.pathname === '/') {
      navigate(`/place/${selectedLocation.id || selectedLocation.name}`);
    }
  }, [selectedLocation, routeLocation.pathname, navigate]);

  // 🚨 [New] Deep Linking 2: URL 직접 입력 시 데이터(선택된 장소) 동기화
  useEffect(() => {
    const match = matchPath({ path: "/place/:id" }, routeLocation.pathname);
    if (match && match.params.id && !selectedLocation) {
      const targetId = match.params.id;
      const target = TRAVEL_SPOTS.find(s => String(s.id) === targetId || s.name === targetId) 
                  || savedTrips.find(t => String(t.id) === targetId || t.name === targetId);
      
      if (target) {
        setSelectedLocation(target);
        moveToLocation(target.lat, target.lng);
      }
    }
  }, [routeLocation.pathname, savedTrips, selectedLocation, setSelectedLocation, moveToLocation]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsZenMode(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleZenMode = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsZenMode(true);
      } catch (err) {
        console.error("Fullscreen API Error:", err);
      }
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
    }
  };

  const filteredSavedTrips = useMemo(() => savedTrips.filter(t => t.category === category), [savedTrips, category]);
  const filteredSpots = useMemo(() => TRAVEL_SPOTS.filter(s => s.category === category), [category]);
  const bucketList = useMemo(() => savedTrips.filter(t => t.is_bookmarked), [savedTrips]);
  
  const globeRenderedTrips = useMemo(() => {
    return savedTrips.filter(t => {
      if (t.lat === 0 && t.lng === 0) return false;
      const isCurrentCategory = t.category === category;
      const isSelectedVIP = selectedLocation && (t.id === selectedLocation.id || t.destination === selectedLocation.name);
      return isCurrentCategory || isSelectedVIP;
    });
  }, [savedTrips, category, selectedLocation]);

  // 🚨 [Fix] isFocusMode 계산 로직에서 isReportOpen, isPlaceCardOpen 제거. 라우터 기반으로 판단.
  const isFocusMode = useMemo(() => {
    if (isChatOpen) return true;
    if (routeLocation.pathname.startsWith('/place') && isCardExpanded) return true;
    return false;
  }, [isChatOpen, routeLocation.pathname, isCardExpanded]);

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
          tempPinsData={isPinVisible ? scoutedPins : []} 
          travelSpots={isPinVisible ? filteredSpots : []} 
          activePinId={selectedLocation?.id}
          pauseRender={isFocusMode} 
          globeTheme={globeTheme} 
          isZenMode={isZenMode}
        />
      </div>
      
      <div className={`transition-opacity duration-1000 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <HomeUI 
          onSearch={handleSmartSearch} onTickerClick={handleSmartSearch} onTagClick={handleSmartSearch} 
          externalInput={draftInput} 
          savedTrips={filteredSavedTrips} 
          onTripClick={handleLocationSelect} onTripDelete={deleteTrip}
          onOpenChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onLogoClick={() => setIsLogoPanelOpen(true)}
          relatedTags={relatedTags} isTagLoading={isTagLoading} 
          selectedCategory={category} onCategorySelect={setCategory}
          isTickerExpanded={isTickerExpanded} setIsTickerExpanded={setIsTickerExpanded}
          isPinVisible={isPinVisible} onTogglePinVisibility={() => setIsPinVisible(prev => !prev)}
          globeTheme={globeTheme} onThemeToggle={handleThemeToggle} 
          isZenMode={isZenMode} onToggleZenMode={toggleZenMode}
          onClearScouts={() => { 
              if(window.confirm("임시 핀을 모두 정리하시겠습니까?")) {
                  clearScouts(); setDraftInput(''); setSelectedLocation(null); 
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
        
        {/* 🚨 [Fix/New] 하드코딩된 PlaceCard 대신 Outlet 마운트. 필요한 헬퍼 함수를 Context로 전달 */}
        <Outlet context={{ 
          location: selectedLocation, 
          isBookmarked: selectedLocation ? savedTrips.some(t => t.destination === selectedLocation.name && t.is_bookmarked) : false,
          onClose: () => { setIsCardExpanded(false); navigate('/'); },
          onChat: (p) => handleStartChat(selectedLocation?.name, p),
          onToggleBookmark: handleToggleBookmark,
          onTicket: () => { setIsCardExpanded(false); navigate('/'); },
          isTickerExpanded,
          initialExpanded: isCardExpanded,
          onExpandChange: setIsCardExpanded
        }} />

        <ChatModal 
          isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); globeRef.current?.resumeRotation(); }} 
          initialQuery={initialQuery} 
          chatHistory={savedTrips} 
          onUpdateChat={updateMessages} onToggleBookmark={toggleBookmark} 
          activeChatId={activeChatId} 
          onSwitchChat={setActiveChatId} 
          onDeleteChat={deleteTrip} 
        />
      </div>
    </div>
  );
}
export default Home;