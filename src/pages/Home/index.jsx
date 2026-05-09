import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, matchPath, Link } from 'react-router-dom';

import HomeGlobe from './components/HomeGlobeAdapter';
import HomeUI from './components/HomeUI';
import ChatModal from './components/ChatModal';
import SearchDiscoveryModal from './components/SearchDiscoveryModal';
import LogoPanel from './components/LogoPanel';
import PlaceCardSummary from '../../components/PlaceCard/modes/PlaceCardSummary';
import SEO from '../../components/SEO';

import { supabase } from '../../shared/api/supabase';
import { TRAVEL_SPOTS } from './data/travelSpots';
import { citiesData } from './data/citiesData';

import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';
import { useHomeHandlers } from './hooks/useHomeHandlers';
import { formatUrlName, getPlaceUrlParam } from './lib/formatUrlName';
import { cachePlaceLocation, mergeCachedPlaceIfCoordsMatch } from './lib/placeLocationCache';
import { getSystemPrompt } from './lib/prompts';

const DEFAULT_GLOBE_THEME = 'deep';

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

  const { scoutedPins, selectedLocation, setSelectedLocation, moveToLocation, addScoutPin, clearScouts } = useGlobeLogic(globeRef, user?.id);
  const { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip } = useTravelData(user);
  const { relatedTags, isTagLoading, processSearchKeywords } = useSearchEngine();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState(null);
  const [isLogoPanelOpen, setIsLogoPanelOpen] = useState(false);

  const setIsPlaceCardOpen = (isOpen) => {
    if (!isOpen) {
      setSelectedLocation(null);
      navigate('/');
    }
  };

  const [initialQuery, setInitialQuery] = useState(null);
  const [draftInput, setDraftInput] = useState('');

  const CATEGORY_IDS = useMemo(() => ['paradise', 'nature', 'urban', 'culture', 'adventure'], []);
  const [category, setCategory] = useState(() => {
    try {
      const lastIndex = parseInt(localStorage.getItem('gateo_last_category_index') || '-1', 10);
      const nextIndex = (lastIndex + 1) % 5;
      localStorage.setItem('gateo_last_category_index', nextIndex.toString());
      return ['paradise', 'nature', 'urban', 'culture', 'adventure'][nextIndex];
    } catch {
      return 'paradise';
    }
  });
  const [isPinVisible, setIsPinVisible] = useState(true);
  const [globeTheme, setGlobeTheme] = useState(DEFAULT_GLOBE_THEME);
  const [isTickerExpanded, setIsTickerExpanded] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isExploreFromPlace, setIsExploreFromPlace] = useState(false);
  const shouldPauseGlobe = isCardExpanded
    || routeLocation.pathname.startsWith('/place/')
    || routeLocation.pathname.startsWith('/explore');

  const {
    handleGlobeClick,
    handleLocationSelect,
    handleStartChat,
    handleToggleBookmark,
    handleSmartSearch
  } = useHomeHandlers({
    globeRef, user, category, isPinVisible, selectedLocation, savedTrips,
    setSelectedLocation, addScoutPin, moveToLocation, processSearchKeywords,
    setIsPlaceCardOpen, setIsCardExpanded, setIsPinVisible, setDraftInput,
    setIsChatOpen, setInitialQuery, setActiveChatId, setChatDraft, setSavedTrips, fetchData,
    toggleBookmark
  });

  const createTripOnFirstUserMessage = useCallback(async ({ destination, lat, lng, persona, firstUserText }) => {
    const systemPrompt = getSystemPrompt(persona, destination);
    const newTrip = {
      destination,
      lat: lat ?? 0,
      lng: lng ?? 0,
      date: new Date().toLocaleDateString(),
      prompt_summary: systemPrompt,
      messages: [{ role: 'user', text: firstUserText }],
      is_bookmarked: false,
      is_hidden: false,
      persona,
      category: category
    };
    const created = await saveNewTrip(newTrip);
    if (created) {
      setChatDraft(null);
      setActiveChatId(created.id);
    }
    return created;
  }, [category, saveNewTrip]);

  useEffect(() => {
    const searchParams = new URLSearchParams(routeLocation.search);
    const searchQuery = searchParams.get('search');

    if (searchQuery) {
      handleSmartSearch(searchQuery);
      navigate(routeLocation.pathname, { replace: true });
    }
  }, [routeLocation.search, routeLocation.pathname, handleSmartSearch, navigate]);

  useEffect(() => {
    cachePlaceLocation(selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    let match = matchPath({ path: "/place/:slug" }, routeLocation.pathname);
    if (!match) {
      match = matchPath({ path: "/place/:slug/:tab" }, routeLocation.pathname);
    }

    if (match && match.params.slug) {
      let targetSlug = match.params.slug;
      try {
        targetSlug = decodeURIComponent(targetSlug);
      } catch {
        // ignore malformed percent-encoding in slug
      }

      const normalizedTargetSlug = targetSlug.toLowerCase();

      let target = TRAVEL_SPOTS.find(s => s.slug === normalizedTargetSlug || String(s.id) === targetSlug)
                || savedTrips.find(t => {
                      const nameEn = t.name_en || t.curation_data?.locationEn || "";
                      return t.slug === normalizedTargetSlug || formatUrlName(nameEn) === normalizedTargetSlug || String(t.id) === targetSlug;
                    });

      if (!target) {
        const matchedCity = (citiesData || []).find(c => c.slug === normalizedTargetSlug);
        if (matchedCity) {
          target = {
            id: `city-${matchedCity.lat}-${matchedCity.lng}`,
            name: matchedCity.name,
            name_en: matchedCity.name_en,
            lat: matchedCity.lat,
            lng: matchedCity.lng,
            country: matchedCity.country || "Explore",
            country_en: matchedCity.country_en || "Explore",
            tags: matchedCity.tags || [],
            desc: matchedCity.desc || ""
          };
        }
      }

      if (!target && selectedLocation && (
          selectedLocation.slug === normalizedTargetSlug ||
          String(selectedLocation.id) === targetSlug ||
          selectedLocation.name === targetSlug
      )) {
          target = selectedLocation;
      }

      if (!target && (targetSlug.startsWith('city-') || targetSlug.startsWith('loc-') || targetSlug.startsWith('search-'))) {
        const coordsMatch = targetSlug.match(/-(-?\d+\.?\d*)-(-?\d+\.?\d*)$/);
        if (coordsMatch) {
          const parsedLat = parseFloat(coordsMatch[1]);
          const parsedLng = parseFloat(coordsMatch[2]);

          const fromSession = mergeCachedPlaceIfCoordsMatch(targetSlug, parsedLat, parsedLng);
          if (fromSession) {
            target = fromSession;
          } else {
            const matchedCity = (citiesData || []).find(c =>
              Math.abs(c.lat - parsedLat) < 0.001 && Math.abs(c.lng - parsedLng) < 0.001
            );

            target = {
              id: targetSlug,
              name: matchedCity ? matchedCity.name : (targetSlug.split('-')[0] === 'city' ? "알 수 없는 도시" : "알 수 없는 지역"),
              name_en: matchedCity ? matchedCity.name_en : "",
              lat: parsedLat,
              lng: parsedLng,
              country: matchedCity ? matchedCity.country : "Explore",
              country_en: matchedCity ? matchedCity.country_en : "Explore",
              tags: matchedCity ? matchedCity.tags : [],
              desc: matchedCity ? matchedCity.desc : ""
            };
          }
        }
      }

      if (target) {
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

        queueMicrotask(() => {
          const focusTarget = {
            ...hydratedTarget,
            id: hydratedTarget.id || `loc-${hydratedTarget.lat}-${hydratedTarget.lng}`,
            type: hydratedTarget.type || 'temp-base',
            category: hydratedTarget.category || category
          };
          setSelectedLocation(focusTarget);
          addScoutPin(focusTarget);
          moveToLocation(focusTarget.lat, focusTarget.lng, focusTarget.name, focusTarget.category);
        });
      }
      queueMicrotask(() => {
        setIsCardExpanded(true);
      });
    } else {
      queueMicrotask(() => {
        setIsCardExpanded(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- /place/ URL sync: only path + savedTrips; add selectedLocation/set/move would loop with microtask hydration
  }, [routeLocation.pathname, savedTrips]);

  const prevPathRef = useRef(routeLocation.pathname);
  useEffect(() => {
    const currentPath = routeLocation.pathname;
    const prevPath = prevPathRef.current;

    queueMicrotask(() => {
      if (currentPath.startsWith('/explore') && prevPath.startsWith('/place/')) {
        setIsExploreFromPlace(true);
      } else if (!currentPath.startsWith('/explore')) {
        setIsExploreFromPlace(false);
      }
    });

    prevPathRef.current = currentPath;

    if (currentPath === '/' && (prevPath.startsWith('/place/') || prevPath.startsWith('/explore'))) {
      if (routeLocation.state?.fromSearch) {
        return;
      }
      queueMicrotask(() => {
        setIsCardExpanded(false);
        setSelectedLocation(null);
      });
      if (globeRef.current && typeof globeRef.current.resumeRotation === 'function') {
        globeRef.current.resumeRotation();
      }
    }
  }, [routeLocation.pathname, routeLocation.state?.fromSearch, setSelectedLocation]);

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
  const globeSpots = useMemo(() => TRAVEL_SPOTS, []);
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
      <SEO />
      <div className="w-full h-full">
        <HomeGlobe
          ref={globeRef}
          onGlobeClick={handleGlobeClick}
          onMarkerClick={handleLocationSelect}
          isChatOpen={isChatOpen}
          savedTrips={isPinVisible ? globeRenderedTrips : []}
          tempPinsData={isPinVisible ? scoutedPins : []}
          travelSpots={isPinVisible ? filteredSpots : []}
          allTravelSpots={isPinVisible ? globeSpots : []}
          activePinId={selectedLocation?.id}
          pauseRender={shouldPauseGlobe}
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
          user={user} onLogout={() => supabase.auth.signOut()}
          onClearScouts={() => {
              if(window.confirm("임시 핀을 모두 삭제하시겠습니까?")) {
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
            const realCity = !realSpot ? (citiesData || []).find(c => c.name === trip.destination || c.name_en === trip.destination) : null;

            let hydratedLocation;
            if (realSpot) {
              hydratedLocation = { ...trip, ...realSpot, name: trip.destination };
            } else if (realCity) {
              hydratedLocation = { ...trip, ...realCity, name: trip.destination };
            } else {
              hydratedLocation = {
                ...trip,
                name: trip.destination || trip.curation_data?.location || "알 수 없는 장소",
                name_en: trip.curation_data?.locationEn || "",
                lat: trip.lat || 0,
                lng: trip.lng || 0,
                country: "Explore",
                country_en: "Explore",
                ai_context: {
                  summary: trip.curation_data?.description || "",
                  tags: trip.curation_data?.searchKeyword ? trip.curation_data.searchKeyword.split(" ") : []
                }
              };
            }
            navigate(`/place/${getPlaceUrlParam(hydratedLocation)}`);
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
              navigate(`/place/${getPlaceUrlParam(selectedLocation)}`);
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
            navigate('/explore');
          },
          onChat: (p) => handleStartChat(selectedLocation?.name, p),
          onToggleBookmark: handleToggleBookmark,
          onTicket: () => {
            navigate('/explore');
          },
          isTickerExpanded,
          initialExpanded: true,
          onExpandChange: setIsCardExpanded
        }} />

        <ChatModal
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setChatDraft(null);
            setActiveChatId(null);
            setInitialQuery(null);
            globeRef.current?.resumeRotation();
          }}
          initialQuery={initialQuery}
          chatHistory={savedTrips}
          chatDraft={chatDraft}
          onCreateTripOnFirstUserMessage={createTripOnFirstUserMessage}
          onUpdateChat={updateMessages} onToggleBookmark={toggleBookmark}
          activeChatId={activeChatId}
          onSwitchChat={(id) => {
            setChatDraft(null);
            setActiveChatId(id);
          }}
          onDeleteChat={deleteTrip}
        />

        <SearchDiscoveryModal
          isOpen={routeLocation.pathname.startsWith('/explore')}
          isFromPlaceCard={isExploreFromPlace}
          onClose={() => navigate('/')}
          onSelect={(spot) => {
            navigate(`/place/${getPlaceUrlParam(spot)}`);
          }}
          onSearch={async (query) => {
            const selectedFromSearch = await handleSmartSearch(query);

            if (selectedFromSearch?.name) {
              try {
                const key = 'gateo_recent_visited_destinations';
                const current = JSON.parse(localStorage.getItem(key) || '[]');
                const safeCurrent = Array.isArray(current) ? current : [];
                const next = [
                  selectedFromSearch.name,
                  ...safeCurrent.filter((item) => item !== selectedFromSearch.name)
                ].slice(0, 30);
                localStorage.setItem(key, JSON.stringify(next));

                const keywordVisitKey = 'gateo_recent_keyword_visits';
                const rawKeywordVisits = JSON.parse(localStorage.getItem(keywordVisitKey) || '[]');
                const keywordVisits = Array.isArray(rawKeywordVisits) ? rawKeywordVisits : [];
                const normalizedKeyword = (query || '').trim();

                if (normalizedKeyword) {
                  const matched = keywordVisits.find((entry) => entry?.keyword === normalizedKeyword);
                  let nextKeywordVisits;

                  if (matched) {
                    const updatedDestinations = [
                      selectedFromSearch.name,
                      ...(Array.isArray(matched.destinations) ? matched.destinations : []).filter((dest) => dest !== selectedFromSearch.name)
                    ].slice(0, 5);

                    nextKeywordVisits = [
                      { ...matched, destinations: updatedDestinations, updatedAt: Date.now() },
                      ...keywordVisits.filter((entry) => entry?.keyword !== normalizedKeyword)
                    ];
                  } else {
                    nextKeywordVisits = [
                      { keyword: normalizedKeyword, destinations: [selectedFromSearch.name], updatedAt: Date.now() },
                      ...keywordVisits
                    ];
                  }

                  localStorage.setItem(keywordVisitKey, JSON.stringify(nextKeywordVisits.slice(0, 30)));
                }
              } catch {
                // Ignore localStorage errors in private mode, etc.
              }
            }

            navigate('/', { state: { fromSearch: true } });
          }}
        />
      </div>

      {/* SEO를 위한 숨겨진 내부 링크 */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {/* 여행지 링크 */}
        {TRAVEL_SPOTS.map((spot, index) => (
          <Link key={`${spot.slug || spot.id}-${index}`} to={`/place/${spot.slug || spot.id}`}>
            {spot.name}
          </Link>
        ))}

        {/* Explore 링크 */}
        <Link to="/explore">여행지 탐색</Link>
        <Link to="/explore/paradise">낙원</Link>
        <Link to="/explore/nature">자연</Link>
        <Link to="/explore/urban">도시</Link>
        <Link to="/explore/culture">문화</Link>
        <Link to="/explore/adventure">모험</Link>
        <Link to="/explore/asia">아시아</Link>
        <Link to="/explore/europe">유럽</Link>
        <Link to="/explore/americas">아메리카</Link>
        <Link to="/explore/oceania">오세아니아</Link>
        <Link to="/explore/africa">아프리카</Link>
        <Link to="/explore/middle-east">중동</Link>
      </div>
    </div>
  );
}
export default Home;
