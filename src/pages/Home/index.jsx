// src/pages/Home/index.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] ChatModal의 대화 전환(onSwitchChat)을 복잡한 handleStartChat 함수 대신 순수 상태 변경 함수인 setActiveChatId로 다이렉트 연결하여 100% 확실한 동작 보장.
// 2. [Dead Code 제거] 이전 세션에서 삭제했던 clearTemporaryTrips가 여전히 남아있어 발생할 수 있는 잠재적 크래시(시한폭탄) 원천 제거.
// 3. [Dead Code 제거] ChatModal 컴포넌트에서 더 이상 받지 않는 onClearChats 프롭스 제거.
// 4. LogoPanel 다이렉트 오픈 버그 수정 (기존 유지)
// 5. 🚨 [Fix] 선택적 격벽 해제 (Smart Prison Break): 기존 카테고리 필터링 로직을 복구하여 지구본 과부하를 막고, '검색한 핀(scoutedPins)'과 '현재 활성화된 장소(VIP)'만 예외적으로 지구본에 통과시킴.
// 6. 🚨 [New] Zen Mode(힐링 모드) 상태 및 브라우저 Fullscreen API 연동. ESC 키를 통한 네이티브 해제 시에도 안전하게 상태를 동기화(Pessimistic First).
// 7. 🚨 [New] UI Ghosting: isZenMode 활성화 시 모든 UI 레이어를 투명화 및 이벤트 차단하여 지구본 감상에 집중.

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
  
  const { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip } = useTravelData();
  
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
            isCompactMode={isTickerExpanded}
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