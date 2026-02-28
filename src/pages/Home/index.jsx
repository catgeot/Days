// src/pages/Home/index.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] ChatModal 대화 전환 다이렉트 연결 유지.
// 2. [Dead Code 제거] 잠재적 크래시 원천 제거 유지.
// 3. [Dead Code 제거] ChatModal 미사용 프롭스 제거 유지.
// 4. LogoPanel 다이렉트 오픈 버그 수정 유지.
// 5. 🚨 [Fix] 선택적 격벽 해제 (Smart Prison Break) 유지.
// 6. 🚨 [New] Zen Mode(힐링 모드) 유지.
// 7. 🚨 [New] UI Ghosting 유지.
// 8. 🚨 [Fix] Auth 연동: useTravelData 훅에 user 객체를 주입(Dependency Injection)하여, 로그인 상태에 따라 DB와 로컬 스토리지를 분기할 수 있도록 연결.

import React, { useState, useRef, useEffect, useMemo } from 'react';

// Components
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import ChatModal from './components/ChatModal'; 
import PlaceCard from '../../components/PlaceCard/index'; 
import LogoPanel from './components/LogoPanel';

// 일기장 통합 오버레이 패널 컴포넌트 마운트
import ReportPanel from './components/ReportPanel';

// Libs & Utils
import { supabase } from '../../shared/api/supabase';
import { TRAVEL_SPOTS } from './data/travelSpots';

// Hooks
import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';
import { useHomeHandlers } from './hooks/useHomeHandlers';

// 일기장 전역 상태를 가져오기 위한 훅 추가 (Phase 2)
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
  
  // 🚨 [Fix] user 객체를 useTravelData에 주입하여 Data Lake 분리 제어권 부여
  const { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip } = useTravelData(user);
  
  const { relatedTags, isTagLoading, processSearchKeywords } = useSearchEngine();

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

  // 🚨 [New] Zen Mode (전체화면 힐링 모드) 상태 추가
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

  // 🚨 fetchData는 useTravelData 내부에서 user 의존성을 가지므로, 로그인 상태가 변경될 때 자동 재호출됨
  useEffect(() => { fetchData(); }, [fetchData]);

  // 🚨 [New] Zen Mode 전체화면 동기화 (Pessimistic First: ESC 키 감지 시 무조건 false로 덮어씌움)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsZenMode(false);
      }
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
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        // exitFullscreen 호출 시 fullscreenchange 이벤트가 발생하여 setIsZenMode(false)가 자동 처리됩니다.
      }
    }
  };

  // 🚨 [Fix] 기본 리스트/마커 필터링 복구 (지구본 과부하 방지)
  const filteredSavedTrips = useMemo(() => savedTrips.filter(t => t.category === category), [savedTrips, category]);
  const filteredSpots = useMemo(() => TRAVEL_SPOTS.filter(s => s.category === category), [category]);
  const bucketList = useMemo(() => savedTrips.filter(t => t.is_bookmarked), [savedTrips]);
  
  // 🚨 [Fix] VIP 프리패스 1: 저장된 여행지 중 '현재 활성화된 장소(selectedLocation)'는 카테고리가 달라도 무조건 렌더링
  const globeRenderedTrips = useMemo(() => {
    return savedTrips.filter(t => {
      if (t.lat === 0 && t.lng === 0) return false;
      const isCurrentCategory = t.category === category;
      const isSelectedVIP = selectedLocation && (t.id === selectedLocation.id || t.destination === selectedLocation.name);
      return isCurrentCategory || isSelectedVIP;
    });
  }, [savedTrips, category, selectedLocation]);

  const isFocusMode = useMemo(() => {
    if (isChatOpen) return true;
    if (isPlaceCardOpen && isCardExpanded) return true;
    if (isReportOpen) return true; 
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
          
          // 🚨 [Fix] 선택적 격벽 해제 적용
          savedTrips={isPinVisible ? globeRenderedTrips : []} 
          // VIP 프리패스 2: 방금 검색한 임시 핀(scoutedPins)은 필터링 없이 100% 통과 (관심사 최우선)
          tempPinsData={isPinVisible ? scoutedPins : []} 
          travelSpots={isPinVisible ? filteredSpots : []} 
          
          activePinId={selectedLocation?.id}
          pauseRender={isFocusMode} 
          globeTheme={globeTheme} 
          isZenMode={isZenMode} // 🚨 [New] Zen Mode 프롭 전달
        />
      </div>
      
      {/* 🚨 [New] UI Ghosting Wrapper: Zen Mode 시 모든 UI 투명화 및 클릭 차단 (뺄셈의 미학) */}
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
          isZenMode={isZenMode} onToggleZenMode={toggleZenMode} // 🚨 [New] 프롭 전달
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
            
            // 🚨 [Fix/New] 트래블 티커 여백 동적 회피 기동
            isTickerExpanded={isTickerExpanded} 
            
            initialExpanded={isCardExpanded} 
            onExpandChange={setIsCardExpanded} 
          />
        )}

        <ChatModal 
          isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); globeRef.current?.resumeRotation(); }} 
          initialQuery={initialQuery} 
          // 🚨 [Fix] 카테고리 의존성 탈피: 채팅 기록은 항상 원본 전체(savedTrips) 데이터 사용
          chatHistory={savedTrips} 
          onUpdateChat={updateMessages} onToggleBookmark={toggleBookmark} 
          activeChatId={activeChatId} 
          onSwitchChat={setActiveChatId} 
          onDeleteChat={deleteTrip} 
        />

        <ReportPanel />
      </div>
    </div>
  );
}
export default Home;