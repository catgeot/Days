// src/pages/Home/index.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] ReportPanel 전역 상태 및 마운트 로직 완전 제거 (URL 라우팅으로 위임)
// 2. [Routing] isPlaceCardOpen 상태를 제거하고 React Router의 <Outlet />과 Deep Linking 동기화 적용
// 3. 🚨 [Fix/New] 마커 클릭 시의 강제 라우팅(Deep Linking 1)을 제거하고, Summary 카드를 Home의 모달로 복귀. 확장을 누를 때만 라우팅 이동(Soft Transition).
// 4. 🚨 [Subtraction] 라우팅 분리에 따라 과거 단일 페이지 시절의 잔재인 '지구본 리소스 제한' CSS 족쇄 삭제.
// 5. 🚨 [Fix] LogoPanel에서 버킷리스트 클릭 시 발생하는 써머리 깜빡임(Flickering) 해결.
// 6. 🚨 [Fix/New] Clean Slate (유령 퇴치): 브라우저 뒤로가기를 통해 장소 카드에서 메인으로 돌아올 때 강제 초기화.
// 7. 🚨 [Fix] Subtraction: 확장 카드 닫기 시 발생하는 '좀비 핀 꽂기' 및 '두 번 깜빡임'을 원천 차단하기 위해, URL 동기화 로직의 감시 카메라(의존성 배열)에서 selectedLocation을 삭제했습니다. 이제 오직 URL이 바뀔 때만 평화롭게 반응합니다.

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, matchPath } from 'react-router-dom';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import ChatModal from './components/ChatModal'; 
import LogoPanel from './components/LogoPanel';
import PlaceCardSummary from '../../components/PlaceCard/modes/PlaceCardSummary';

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
  
  const setIsPlaceCardOpen = (isOpen) => {
    if (!isOpen) {
      setSelectedLocation(null);
      navigate('/');
    }
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

  // 🚨 [Fix] Subtraction: 의존성 배열 다이어트 (좀비 부활 차단)
  // 장소 데이터가 비워지는 순간 불필요하게 렌더링을 덮어씌우는 헛발질을 막기 위해 
  // selectedLocation을 의존성 배열에서 완전히 제거했습니다. 오직 URL이 바뀔 때만 작동합니다.
  useEffect(() => {
    const match = matchPath({ path: "/place/:id" }, routeLocation.pathname);
    if (match && match.params.id) {
      const targetId = match.params.id;
      
      const target = TRAVEL_SPOTS.find(s => String(s.id) === targetId || s.name === targetId) 
                  || savedTrips.find(t => String(t.id) === targetId || t.name === targetId);
      
      if (target) {
        setSelectedLocation(target);
        moveToLocation(target.lat, target.lng);
      }
      setIsCardExpanded(true);
    } else {
      setIsCardExpanded(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocation.pathname]); // 🚨 완벽한 뺄셈: 오직 주소 변경시에만 작동

  // Pessimistic Clean Slate: 브라우저 뒤로가기(Back) 대응
  const prevPathRef = useRef(routeLocation.pathname);
  useEffect(() => {
    const currentPath = routeLocation.pathname;
    const prevPath = prevPathRef.current;
    prevPathRef.current = currentPath;

    // 방금 전까지 /place/ 에 있다가 메인(/)으로 복귀한 경우에만 강제 초기화 실행
    if (currentPath === '/' && prevPath.startsWith('/place/')) {
      setSelectedLocation(null); 
      if (globeRef.current && typeof globeRef.current.resumeRotation === 'function') {
        globeRef.current.resumeRotation();
      }
    }
  }, [routeLocation.pathname, setSelectedLocation]);

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

  const handleThemeToggle = () => {
    const themes = ['neon', 'bright', 'deep'];
    const nextIndex = (themes.indexOf(globeTheme) + 1) % themes.length;
    setGlobeTheme(themes[nextIndex]);
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      <div className="w-full h-full">
        <HomeGlobe 
          ref={globeRef} 
          onGlobeClick={handleGlobeClick} 
          onMarkerClick={handleLocationSelect} 
          isChatOpen={isChatOpen} 
          savedTrips={isPinVisible ? globeRenderedTrips : []} 
          tempPinsData={isPinVisible ? scoutedPins : []} 
          travelSpots={isPinVisible ? filteredSpots : []} 
          activePinId={selectedLocation?.id}
          pauseRender={false}
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
            navigate(`/place/${hydratedLocation.id || hydratedLocation.name}`);
          }}
        />

        {selectedLocation && routeLocation.pathname === '/' && (
          <PlaceCardSummary
            location={selectedLocation}
            isBookmarked={savedTrips.some(t => t.destination === selectedLocation.name && t.isBookmarked)}
            onClose={() => {
              setIsCardExpanded(false);
              setSelectedLocation(null); 
              if (globeRef.current && typeof globeRef.current.resumeRotation === 'function') {
                globeRef.current.resumeRotation();
              }
            }}
            onExpand={() => {
              setIsCardExpanded(true);
              navigate(`/place/${selectedLocation.id || selectedLocation.name}`);
            }}
            onChat={(p) => handleStartChat(selectedLocation?.name, p)}
            onToggleBookmark={handleToggleBookmark}
            isTickerExpanded={isTickerExpanded}
          />
        )}
        
        <Outlet context={{ 
          location: selectedLocation, 
          isBookmarked: selectedLocation ? savedTrips.some(t => t.destination === selectedLocation.name && t.isBookmarked) : false,
          onClose: () => { 
            setIsCardExpanded(false); 
            setSelectedLocation(null);
            if (globeRef.current && typeof globeRef.current.resumeRotation === 'function') {
              globeRef.current.resumeRotation();
            }
            navigate('/'); 
          },
          onChat: (p) => handleStartChat(selectedLocation?.name, p),
          onToggleBookmark: handleToggleBookmark,
          onTicket: () => { 
            setIsCardExpanded(false); 
            setSelectedLocation(null);
            if (globeRef.current && typeof globeRef.current.resumeRotation === 'function') {
              globeRef.current.resumeRotation();
            }
            navigate('/'); 
          },
          isTickerExpanded,
          initialExpanded: true, 
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