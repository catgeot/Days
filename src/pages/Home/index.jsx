// src/pages/Home/index.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] ReportPanel 전역 상태 및 마운트 로직 완전 제거 (URL 라우팅으로 위임)
// 2. [Routing] isPlaceCardOpen 상태를 제거하고 React Router의 <Outlet />과 Deep Linking 동기화 적용
// 3. [Fix/New] 마커 클릭 시의 강제 라우팅을 제거하고, Summary 카드를 Home의 모달로 복귀. 확장을 누를 때만 라우팅 이동.
// 4. [Subtraction] 라우팅 분리에 따라 과거 단일 페이지 시절의 잔재인 '지구본 리소스 제한' CSS 족쇄 삭제.
// 5. [Fix] LogoPanel에서 버킷리스트 클릭 시 발생하는 써머리 깜빡임 해결.
// 6. [Fix/New] Clean Slate (유령 퇴치): 브라우저 뒤로가기를 통해 장소 카드에서 메인으로 돌아올 때 강제 초기화.
// 7. [Fix] Subtraction: URL 동기화 로직의 의존성 배열에서 selectedLocation 삭제.
// 8. 🚨 [Fix/New] URL Query Params(?search=) 브릿지 감지: 큐레이션 클릭 시 전달된 검색어를 기존 handleSmartSearch에 태우고 꼬리 자르기 적용.
// 9. 🚨 [Fix] 치명적 오타 수정: t.isBookmarked (undefined) -> DB 실제 컬럼명인 t.is_bookmarked 로 변경하여 즐겨찾기 마비 해결.
// 10. 🚨 [Fix/New] Safe Path 방어막 완화: 동적 URL 진입 및 새로고침 시 튕김을 막기 위한 1차/2차 상태 유지 방어 로직 추가.
// 11. 🚨 [Fix/New] 큐레이션 데이터 정규화(Hydration): AI가 추천한 장소 객체가 PlaceCard를 빈 화면으로 만들지 않도록 스키마 동기화.
// 12. 🚨 [Fix/New] "탐색된 도시" 버그 해결: URL 좌표 파싱 시 citiesData를 순회하여 실제 이름과 태그 데이터를 완벽히 복원(Hydration)하는 로직 추가.
// 13. 🚨 [Fix/New] URL 영문명 정규화(Normalization): formatUrlName 유틸리티를 추가하여 name_en 기반으로 라우팅 및 역추적 로직 단일화.

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
import { citiesData } from './data/citiesData';

// Hooks
import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';
import { useHomeHandlers } from './hooks/useHomeHandlers';

// 🚨 [Fix/New] URL 영문명 정규화 유틸리티 (공백, 특수문자 치환 및 소문자화)
export const formatUrlName = (nameEn) => {
  if (!nameEn) return "";
  return nameEn.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
};

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

  // 외부 라우팅을 통한 검색 브릿지 (Pessimistic First: 꼬리 자르기)
  useEffect(() => {
    const searchParams = new URLSearchParams(routeLocation.search);
    const searchQuery = searchParams.get('search');
    
    if (searchQuery) {
      handleSmartSearch(searchQuery);
      navigate(routeLocation.pathname, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocation.search]);

  // 라우팅 기반 장소 선택 동기화 로직
  useEffect(() => {
    const match = matchPath({ path: "/place/:id" }, routeLocation.pathname);
    if (match && match.params.id) {
      const targetId = match.params.id;
      
      // 🚨 [Fix/New] 1차 방어막: 영문명 정규화(name_en) 매칭을 최우선으로 적용 (Hydration)
      let target = TRAVEL_SPOTS.find(s => formatUrlName(s.name_en) === targetId || String(s.id) === targetId || s.name === targetId) 
                || savedTrips.find(t => formatUrlName(t.name_en) === targetId || String(t.id) === targetId || t.name === targetId);

      // 🚨 [Fix/New] Data Lake(citiesData) 영문명 탐색 추가
      if (!target) {
        const matchedCity = (citiesData || []).find(c => formatUrlName(c.name_en) === targetId);
        if (matchedCity) {
          target = {
            id: `city-${matchedCity.lat}-${matchedCity.lng}`,
            name: matchedCity.name,
            name_en: matchedCity.name_en,
            lat: matchedCity.lat,
            lng: matchedCity.lng,
            tags: matchedCity.tags || [],
            desc: matchedCity.desc || ""
          };
        }
      }
      
      // 기존 1차 방어막: 물리적 DB에 없더라도, 현재 메모리(State)에 있는 선택지라면 승인
      if (!target && selectedLocation && (
          formatUrlName(selectedLocation.name_en) === targetId || 
          String(selectedLocation.id) === targetId || 
          selectedLocation.name === targetId
      )) {
        target = selectedLocation;
      }

      // 🚨 [Fix/New] 2차 방어막: URL에서 직접 파싱 (새로고침 시 튕김 방지 및 Hydration Fallback)
      if (!target && (targetId.startsWith('city-') || targetId.startsWith('loc-') || targetId.startsWith('search-'))) {
        const coordsMatch = targetId.match(/-(-?\d+\.?\d*)-(-?\d+\.?\d*)$/);
        if (coordsMatch) {
          const parsedLat = parseFloat(coordsMatch[1]);
          const parsedLng = parseFloat(coordsMatch[2]);
          
          const matchedCity = (citiesData || []).find(c => 
            Math.abs(c.lat - parsedLat) < 0.001 && Math.abs(c.lng - parsedLng) < 0.001
          );

          target = {
            id: targetId,
            name: matchedCity ? matchedCity.name : (targetId.split('-')[0] === 'city' ? "알 수 없는 도시" : "알 수 없는 지역"),
            name_en: matchedCity ? matchedCity.name_en : "",
            lat: parsedLat,
            lng: parsedLng,
            tags: matchedCity ? matchedCity.tags : [],
            desc: matchedCity ? matchedCity.desc : ""
          };
        }
      }

      if (target) {
        if (target.curation_data) {
          target.name = target.destination || target.curation_data.location;
          target.name_en = target.curation_data.locationEn || "";
          target.ai_context = {
            summary: target.curation_data.description || "",
            tags: target.curation_data.searchKeyword ? target.curation_data.searchKeyword.split(" ") : []
          };
        }

        setSelectedLocation(target);
        moveToLocation(target.lat, target.lng);
      }
      setIsCardExpanded(true);
    } else {
      setIsCardExpanded(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocation.pathname, savedTrips]); 

  // Pessimistic Clean Slate: 브라우저 뒤로가기(Back) 대응
  const prevPathRef = useRef(routeLocation.pathname);
  useEffect(() => {
    const currentPath = routeLocation.pathname;
    const prevPath = prevPathRef.current;
    prevPathRef.current = currentPath;

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
            
            let hydratedLocation;
            if (realSpot) {
              hydratedLocation = { ...trip, ...realSpot, name: trip.destination };
            } else {
              hydratedLocation = { 
                ...trip, 
                name: trip.destination || trip.curation_data?.location || "알 수 없는 장소",
                name_en: trip.curation_data?.locationEn || "",
                lat: trip.lat || 0,
                lng: trip.lng || 0,
                ai_context: {
                  summary: trip.curation_data?.description || "",
                  tags: trip.curation_data?.searchKeyword ? trip.curation_data.searchKeyword.split(" ") : []
                }
              };
            }
            // 🚨 [Fix/New] 영문명 URL 발사
            const urlParam = hydratedLocation.name_en ? formatUrlName(hydratedLocation.name_en) : (hydratedLocation.id || hydratedLocation.name);
            navigate(`/place/${urlParam}`);
          }}
        />

        {selectedLocation && routeLocation.pathname === '/' && (
          <PlaceCardSummary
            location={selectedLocation}
            isBookmarked={savedTrips.some(t => t.destination === selectedLocation.name && t.is_bookmarked)}
            onClose={() => {
              setIsCardExpanded(false);
              setSelectedLocation(null); 
              if (globeRef.current && typeof globeRef.current.resumeRotation === 'function') {
                globeRef.current.resumeRotation();
              }
            }}
            onExpand={() => {
              setIsCardExpanded(true);
              // 🚨 [Fix/New] 영문명 URL 발사
              const urlParam = selectedLocation.name_en ? formatUrlName(selectedLocation.name_en) : (selectedLocation.id || selectedLocation.name);
              navigate(`/place/${urlParam}`);
            }}
            onChat={(p) => handleStartChat(selectedLocation?.name, p)}
            onToggleBookmark={handleToggleBookmark}
            isTickerExpanded={isTickerExpanded}
          />
        )}
        
        <Outlet context={{ 
          location: selectedLocation, 
          isBookmarked: selectedLocation ? savedTrips.some(t => t.destination === selectedLocation.name && t.is_bookmarked) : false,
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