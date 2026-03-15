// src/pages/Home/index.jsx
// ?š¨ [Fix/New] ?˜ì • ?´ìœ :
// 1. [Subtraction] ReportPanel ?„ì—­ ?íƒœ ë°?ë§ˆìš´??ë¡œì§ ?„ì „ ?œê±° (URL ?¼ìš°?…ìœ¼ë¡??„ì„)
// 2. [Routing] isPlaceCardOpen ?íƒœë¥??œê±°?˜ê³  React Router??<Outlet />ê³?Deep Linking ?™ê¸°???ìš©
// 3. [Fix/New] ë§ˆì»¤ ?´ë¦­ ?œì˜ ê°•ì œ ?¼ìš°?…ì„ ?œê±°?˜ê³ , Summary ì¹´ë“œë¥?Home??ëª¨ë‹¬ë¡?ë³µê?. ?•ì¥???„ë? ?Œë§Œ ?¼ìš°???´ë™.
// 4. [Subtraction] ?¼ìš°??ë¶„ë¦¬???°ë¼ ê³¼ê±° ?¨ì¼ ?˜ì´ì§€ ?œì ˆ???”ì¬??'ì§€êµ¬ë³¸ ë¦¬ì†Œ???œí•œ' CSS ì¡±ì‡„ ?? œ.
// 5. [Fix] LogoPanel?ì„œ ë²„í‚·ë¦¬ìŠ¤???´ë¦­ ??ë°œìƒ?˜ëŠ” ?¨ë¨¸ë¦?ê¹œë¹¡???´ê²°.
// 6. [Fix/New] Clean Slate (? ë ¹ ?´ì¹˜): ë¸Œë¼?°ì? ?¤ë¡œê°€ê¸°ë? ?µí•´ ?¥ì†Œ ì¹´ë“œ?ì„œ ë©”ì¸?¼ë¡œ ?Œì•„????ê°•ì œ ì´ˆê¸°??
// 7. [Fix] Subtraction: URL ?™ê¸°??ë¡œì§???˜ì¡´??ë°°ì—´?ì„œ selectedLocation ?? œ.
// 8. ?š¨ [Fix/New] URL Query Params(?search=) ë¸Œë¦¿ì§€ ê°ì?: ?ë ˆ?´ì…˜ ?´ë¦­ ???„ë‹¬??ê²€?‰ì–´ë¥?ê¸°ì¡´ handleSmartSearch???œìš°ê³?ê¼¬ë¦¬ ?ë¥´ê¸??ìš©.
// 9. ?š¨ [Fix] ì¹˜ëª…???¤í? ?˜ì •: t.isBookmarked (undefined) -> DB ?¤ì œ ì»¬ëŸ¼ëª…ì¸ t.is_bookmarked ë¡?ë³€ê²½í•˜??ì¦ê²¨ì°¾ê¸° ë§ˆë¹„ ?´ê²°.
// 10. ?š¨ [Fix/New] Safe Path ë°©ì–´ë§??„í™”: ?™ì  URL ì§„ì… ë°??ˆë¡œê³ ì¹¨ ???•ê???ë§‰ê¸° ?„í•œ 1ì°?2ì°??íƒœ ? ì? ë°©ì–´ ë¡œì§ ì¶”ê?.
// 11. ?š¨ [Fix/New] ?ë ˆ?´ì…˜ ?°ì´???•ê·œ??Hydration): AIê°€ ì¶”ì²œ???¥ì†Œ ê°ì²´ê°€ PlaceCardë¥?ë¹??”ë©´?¼ë¡œ ë§Œë“¤ì§€ ?Šë„ë¡??¤í‚¤ë§??™ê¸°??
// 12. ?š¨ [Fix/New] "?ìƒ‰???„ì‹œ" ë²„ê·¸ ?´ê²°: URL ì¢Œí‘œ ?Œì‹± ??citiesDataë¥??œíšŒ?˜ì—¬ ?¤ì œ ?´ë¦„ê³??œê·¸ ?°ì´?°ë? ?„ë²½??ë³µì›(Hydration)?˜ëŠ” ë¡œì§ ì¶”ê?.
// 13. ?š¨ [Fix/New] URL ?ë¬¸ëª??•ê·œ??Normalization): formatUrlName ? í‹¸ë¦¬í‹°ë¥?ì¶”ê??˜ì—¬ name_en ê¸°ë°˜?¼ë¡œ ?¼ìš°??ë°???¶”??ë¡œì§ ?¨ì¼??

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

// ?š¨ [Fix/New] URL ?ë¬¸ëª??•ê·œ??? í‹¸ë¦¬í‹° (ê³µë°±, ?¹ìˆ˜ë¬¸ì ì¹˜í™˜ ë°??Œë¬¸?í™”, ?¤êµ­???¡ì„¼???œê±° ??ê²¬ê³ ???¥ìƒ)
export const formatUrlName = (nameEn) => {
  if (!nameEn) return "";
  return nameEn
    .normalize("NFD") // ? ë‹ˆì½”ë“œ ?•ê·œ??(?¡ì„¼??ë¶„ë¦¬)
    .replace(/[\u0300-\u036f]/g, "") // ë¶„ë¦¬???¡ì„¼??ë§ˆí¬ ?œê±° (?? Ã© -> e)
    .toLowerCase()
    .replace(/[\s_]+/g, '-') // ê³µë°±ê³??¸ë”?¤ì½”?´ë? ?˜ì´?ˆìœ¼ë¡?ë³€ê²?
    .replace(/[^a-z0-9-]/g, '') // ?ŒíŒŒë²??Œë¬¸?? ?«ì, ?˜ì´???´ì™¸ ?œê±°
    .replace(/-+/g, '-') // ?°ì†???˜ì´???¨ì¼??
    .replace(/^-|-$/g, ''); // ë¬¸ì???ë’¤ ?˜ì´???œê±°
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
  // ?š¨ [Fix/New] ê¸°ë³¸ê°’ì´ ?„ë‹Œ ?œë¤?´ë‚˜ ?œíšŒ?˜ëŠ” ?œìŠ¤?œì„ êµ¬ì¶• (ì´ˆê¸° ì¹´í…Œê³ ë¦¬ë¥??œíšŒ ë°©ì‹?¼ë¡œ ë³€ê²?
  const CATEGORY_IDS = useMemo(() => ['paradise', 'nature', 'urban', 'culture', 'adventure'], []);
  const [category, setCategory] = useState(() => {
    try {
      const lastIndex = parseInt(localStorage.getItem('gateo_last_category_index') || '-1', 10);
      const nextIndex = (lastIndex + 1) % 5; // CATEGORY_IDS.length
      localStorage.setItem('gateo_last_category_index', nextIndex.toString());
      return ['paradise', 'nature', 'urban', 'culture', 'adventure'][nextIndex];
    } catch (e) {
      return 'paradise'; // Fallback
    }
  });
  const [isPinVisible, setIsPinVisible] = useState(true);
  const [globeTheme, setGlobeTheme] = useState('deep');
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

  // ?¸ë? ?¼ìš°?…ì„ ?µí•œ ê²€??ë¸Œë¦¿ì§€ (Pessimistic First: ê¼¬ë¦¬ ?ë¥´ê¸?
  useEffect(() => {
    const searchParams = new URLSearchParams(routeLocation.search);
    const searchQuery = searchParams.get('search');
    
    if (searchQuery) {
      handleSmartSearch(searchQuery);
      navigate(routeLocation.pathname, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocation.search]);

  // ?¼ìš°??ê¸°ë°˜ ?¥ì†Œ ? íƒ ?™ê¸°??ë¡œì§
  useEffect(() => {
    const match = matchPath({ path: "/place/:slug" }, routeLocation.pathname);
    if (match && match.params.slug) {
      let targetSlug = match.params.slug;
      try {
        targetSlug = decodeURIComponent(targetSlug);
      } catch (e) { /* ignore */ }
      
      const normalizedTargetSlug = targetSlug.toLowerCase(); // ?€?Œë¬¸??ë¬´ì‹œ ë¹„êµ??
      
      // ?š¨ [Fix/New] 1ì°?ë°©ì–´ë§? slugë¥?ìµœìš°? ìœ¼ë¡?ë§¤ì¹­
      let target = TRAVEL_SPOTS.find(s => s.slug === normalizedTargetSlug || String(s.id) === targetSlug) 
                || savedTrips.find(t => {
                     const nameEn = t.name_en || t.curation_data?.locationEn || "";
                     return t.slug === normalizedTargetSlug || formatUrlName(nameEn) === normalizedTargetSlug || String(t.id) === targetSlug;
                   });

      // ?š¨ [Fix/New] Data Lake(citiesData) slug ?ìƒ‰ ì¶”ê?
      if (!target) {
        const matchedCity = (citiesData || []).find(c => c.slug === normalizedTargetSlug);
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
      
      // ê¸°ì¡´ 1ì°?ë°©ì–´ë§? ë¬¼ë¦¬??DB???†ë”?¼ë„, ?„ì¬ ë©”ëª¨ë¦?State)???ˆëŠ” ? íƒì§€?¼ë©´ ?¹ì¸
      if (!target && selectedLocation && (
          selectedLocation.slug === normalizedTargetSlug ||
          String(selectedLocation.id) === targetSlug || 
          selectedLocation.name === targetSlug
      )) {
          target = selectedLocation;
      }

      // ?š¨ [Fix/New] 2ì°?ë°©ì–´ë§? URL?ì„œ ì§ì ‘ ?Œì‹± (?ˆë¡œê³ ì¹¨ ???•ê? ë°©ì? ë°?Hydration Fallback)
      if (!target && (targetSlug.startsWith('city-') || targetSlug.startsWith('loc-') || targetSlug.startsWith('search-'))) {
        const coordsMatch = targetSlug.match(/-(-?\d+\.?\d*)-(-?\d+\.?\d*)$/);
        if (coordsMatch) {
          const parsedLat = parseFloat(coordsMatch[1]);
          const parsedLng = parseFloat(coordsMatch[2]);
          
          const matchedCity = (citiesData || []).find(c => 
            Math.abs(c.lat - parsedLat) < 0.001 && Math.abs(c.lng - parsedLng) < 0.001
          );

          target = {
            id: targetSlug,
            name: matchedCity ? matchedCity.name : (targetSlug.split('-')[0] === 'city' ? "?????†ëŠ” ?„ì‹œ" : "?????†ëŠ” ì§€??),
            name_en: matchedCity ? matchedCity.name_en : "",
            lat: parsedLat,
            lng: parsedLng,
            tags: matchedCity ? matchedCity.tags : [],
            desc: matchedCity ? matchedCity.desc : ""
          };
        }
      }

      if (target) {
        // ?š¨ [Fix/New] DB?ì„œ ??ê°ì²´??name???†ê³  destinationë§??ˆì„ ???ˆìœ¼ë¯€ë¡?ê¹Šì? ë³µì‚¬ ??Hydration ?˜í–‰
        const hydratedTarget = { ...target };

        if (!hydratedTarget.name && hydratedTarget.destination) {
          hydratedTarget.name = hydratedTarget.destination;
        }

        if (hydratedTarget.curation_data) {
          hydratedTarget.name = hydratedTarget.name || hydratedTarget.curation_data.location;
          hydratedTarget.name_en = hydratedTarget.name_en || hydratedTarget.curation_data.locationEn || "";
          
          if (!hydratedTarget.ai_context) {
            hydratedTarget.ai_context = {
              summary: hydratedTarget.curation_data.description || "",
              tags: hydratedTarget.curation_data.searchKeyword ? hydratedTarget.curation_data.searchKeyword.split(" ") : []
            };
          }
        }

        setSelectedLocation(hydratedTarget);
        moveToLocation(hydratedTarget.lat, hydratedTarget.lng);
      }
      setIsCardExpanded(true);
    } else {
      setIsCardExpanded(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLocation.pathname, savedTrips]); 

  // Pessimistic Clean Slate: ë¸Œë¼?°ì? ?¤ë¡œê°€ê¸?Back) ?€??
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
          pauseRender={isCardExpanded}
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
              if(window.confirm("?„ì‹œ ?€??ëª¨ë‘ ?•ë¦¬?˜ì‹œê² ìŠµ?ˆê¹Œ?")) {
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
                name: trip.destination || trip.curation_data?.location || "?????†ëŠ” ?¥ì†Œ",
                name_en: trip.curation_data?.locationEn || "",
                lat: trip.lat || 0,
                lng: trip.lng || 0,
                ai_context: {
                  summary: trip.curation_data?.description || "",
                  tags: trip.curation_data?.searchKeyword ? trip.curation_data.searchKeyword.split(" ") : []
                }
              };
            }
            // ?š¨ [Fix/New] ?ë¬¸ëª?URL ë°œì‚¬
            const urlParam = hydratedLocation.slug || (hydratedLocation.id || hydratedLocation.name);
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
              // ?š¨ [Fix/New] ?ë¬¸ëª?URL ë°œì‚¬
              const urlParam = selectedLocation.slug || (selectedLocation.id || selectedLocation.name);
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
