import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, matchPath, Link } from 'react-router-dom';

import HomeGlobe from './components/HomeGlobeAdapter';
import HomeUI from './components/HomeUI';
import ChatModal from './components/ChatModal';
import MooniAgentFab from './components/MooniAgentFab';
import SearchDiscoveryModal from './components/SearchDiscoveryModal';
import LogoPanel from './components/LogoPanel';
import SiteUpdateBanner from '../../shared/components/SiteUpdateBanner';
import HomePlaceCardSummary from './components/HomePlaceCardSummary';
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
import { hydrateLocationFromSavedTrip, resolvePlaceTargetFromSlug } from './lib/placeRouteHydrate';
import { getSystemPrompt } from './lib/prompts';
import { persistMooniLastChatId } from './lib/tripChatUtils';
import { enrichLocationWithRentalAirport } from '../../utils/rentalAirportMatch.js';
import { mergeCanonicalTravelSpot, isSameCanonicalPlace, resolveTravelSpotFromCoords } from '../../utils/travelSpotResolve.js';
import { GLOBE_MODE, isTourMode } from './lib/globeMode';
import { FlightCinemaProvider } from './lib/FlightCinemaContext.jsx';
import { pickRandomGlobeCategory } from './lib/globeCategoryFocus';

const DEFAULT_GLOBE_THEME = 'deep';

function hasValidCoords(loc) {
  return loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng));
}

/** /place/:slug 복귀 시 지구본 포커스용 — 연관 키워드 점프 후 ref/state race 대비 */
function resolveFocusLocationFromPlacePath(pathname, category, savedTrips = []) {
  let match = matchPath({ path: '/place/:slug' }, pathname);
  if (!match) {
    match = matchPath({ path: '/place/:slug/:tab' }, pathname);
  }
  if (!match?.params?.slug) return null;

  let slug = match.params.slug;
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // ignore malformed percent-encoding in slug
  }

  const target = resolvePlaceTargetFromSlug(slug, { savedTrips, category });
  if (target && hasValidCoords(target)) {
    return enrichLocationWithRentalAirport(
      mergeCanonicalTravelSpot({
        ...target,
        id: target.id || `loc-${target.lat}-${target.lng}`,
        type: target.type || 'temp-base',
        category: target.category || category,
      }),
    );
  }

  const normalized = slug.toLowerCase();
  if (normalized.startsWith('label-') || normalized.startsWith('loc-') || normalized.startsWith('search-')) {
    const coordsMatch = slug.match(/-(-?\d+\.?\d*)-(-?\d+\.?\d*)$/);
    if (coordsMatch) {
      const parsedLat = parseFloat(coordsMatch[1]);
      const parsedLng = parseFloat(coordsMatch[2]);
      const rawSession = mergeCachedPlaceIfCoordsMatch(slug, parsedLat, parsedLng);
      if (rawSession && hasValidCoords(rawSession)) {
        return enrichLocationWithRentalAirport(mergeCanonicalTravelSpot(rawSession));
      }
    }
  }

  return null;
}

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

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const syncMobileViewport = () => setIsMobileViewport(mq.matches);
    syncMobileViewport();
    mq.addEventListener('change', syncMobileViewport);
    return () => mq.removeEventListener('change', syncMobileViewport);
  }, []);

  const { scoutedPins, selectedLocation, setSelectedLocation, moveToLocation, addScoutPin, clearScouts } = useGlobeLogic(globeRef, user?.id);
  const { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, updateTripDestination, toggleBookmark, deleteTrip } = useTravelData(user);
  const { relatedPlaces, isTagLoading, processSearchKeywords } = useSearchEngine();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mooniChatEntry, setMooniChatEntry] = useState(false);
  const [mooniPlaceContext, setMooniPlaceContext] = useState(null);
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

  const [category, setCategory] = useState(() => pickRandomGlobeCategory());
  const [categoryFaceEpoch, setCategoryFaceEpoch] = useState(0);

  const revealRandomGlobeFace = useCallback(() => {
    setCategory(pickRandomGlobeCategory());
    setCategoryFaceEpoch((epoch) => epoch + 1);
  }, []);

  const [isPinVisible, setIsPinVisible] = useState(true);
  const [globeTheme, setGlobeTheme] = useState(DEFAULT_GLOBE_THEME);
  const [isTickerExpanded, setIsTickerExpanded] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [globeMode, setGlobeMode] = useState(GLOBE_MODE.GLOBE_2D);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });
  const [isExploreFromPlace, setIsExploreFromPlace] = useState(false);
  const [tourPivoted, setTourPivoted] = useState(false);
  const [flightCinemaActive, setFlightCinemaActive] = useState(false);
  const [tourLaunchPending, setTourLaunchPending] = useState(false);
  const isTourActive = isTourMode(globeMode);
  /** 모바일 투어 UI — TourMobileBar·써머리 숨김 (globeMode 동기화 전 launch pending 포함) */
  const isTourCinema = isMobileViewport && (isTourActive || tourLaunchPending);
  const isPlaceCardSummaryVisible = Boolean(
    selectedLocation && routeLocation.pathname === '/' && !isTourCinema && !flightCinemaActive
  );
  const tourReadyAnchorRef = useRef(null);
  const prevGlobeModeRef = useRef(globeMode);
  const isPlaceRoute = routeLocation.pathname.startsWith('/place/');
  const shouldPauseGlobe =
    !flightCinemaActive
    && (isCardExpanded || isPlaceRoute || routeLocation.pathname.startsWith('/explore'));

  const {
    handleGlobeClick,
    handleLocationSelect,
    handleRelatedPlaceClick,
    handleStartChat,
    handleToggleBookmark,
    handleSmartSearch
  } = useHomeHandlers({
    globeRef, user, category, isPinVisible, selectedLocation, savedTrips,
    setSelectedLocation, addScoutPin, moveToLocation, processSearchKeywords,
    setIsPlaceCardOpen, setIsCardExpanded, setIsPinVisible, setDraftInput,
    setIsChatOpen, setInitialQuery, setActiveChatId, setChatDraft, setSavedTrips, setMooniChatEntry, setMooniPlaceContext, fetchData,
    toggleBookmark
  });

  const handleCategorySelect = useCallback((nextCategory) => {
    if (flightCinemaActive) {
      globeRef.current?.closeFlightCinema?.();
    }
    setCategory(nextCategory);
    setCategoryFaceEpoch((epoch) => epoch + 1);
  }, [flightCinemaActive]);

  const handleRelatedPlaceClickWithCinemaExit = useCallback((placeData, isBridge) => {
    if (flightCinemaActive) {
      globeRef.current?.closeFlightCinema?.();
    }
    handleRelatedPlaceClick(placeData, isBridge);
  }, [flightCinemaActive, handleRelatedPlaceClick]);

  const openMooniFromPlace = useCallback((payload = {}) => {
    if (!selectedLocation?.name) return;
    handleStartChat('MOONi', {
      ...payload,
      boundSpot: {
        slug: selectedLocation.slug ?? null,
        name: selectedLocation.name,
        lat: selectedLocation.lat ?? 0,
        lng: selectedLocation.lng ?? 0,
      },
    });
  }, [handleStartChat, selectedLocation]);

  const selectedLocationRef = useRef(selectedLocation);
  const lastGlobeFocusRef = useRef(null);
  /** 홈(지구본) 복귀 시 moveToLocation SSOT — navigateToPlace·goHomeFromPlace가 명시 설정 */
  const pendingGlobeHomeFocusRef = useRef(null);
  const placeRouteSyncRef = useRef(0);

  const rememberGlobeFocus = useCallback((loc) => {
    if (!hasValidCoords(loc)) return;
    lastGlobeFocusRef.current = loc;
  }, []);

  useEffect(() => {
    if (!selectedLocation) {
      selectedLocationRef.current = null;
      return;
    }
    if (routeLocation.pathname.startsWith('/place/')) {
      const urlFocus = resolveFocusLocationFromPlacePath(routeLocation.pathname, category, savedTrips);
      if (urlFocus && !isSameCanonicalPlace(selectedLocation, urlFocus)) {
        return;
      }
    }
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation, routeLocation.pathname, category]);

  /** 연관 키워드 등 — URL 변경 전 selectedLocation을 먼저 맞춰 route-sync race 방지 */
  const navigateToPlace = useCallback((targetPlace) => {
    if (!targetPlace) return;

    const prepared = enrichLocationWithRentalAirport(
      mergeCanonicalTravelSpot({
        ...targetPlace,
        id:
          targetPlace.id ||
          (targetPlace.lat != null && targetPlace.lng != null
            ? `city-${targetPlace.lat}-${targetPlace.lng}`
            : undefined),
        type: targetPlace.type || 'temp-base',
        category: targetPlace.category || category,
      })
    );

    const param = getPlaceUrlParam(prepared);
    if (!param) {
      if (targetPlace.lat != null && targetPlace.lng != null) {
        navigate(`/place/city-${targetPlace.lat}-${targetPlace.lng}`);
      }
      return;
    }

    selectedLocationRef.current = prepared;
    pendingGlobeHomeFocusRef.current = prepared;
    rememberGlobeFocus(prepared);
    setSelectedLocation(prepared);
    addScoutPin(prepared);
    moveToLocation(prepared.lat, prepared.lng, prepared.name, prepared.category || category);
    navigate(`/place/${param}`);
  }, [category, navigate, addScoutPin, moveToLocation, rememberGlobeFocus, setSelectedLocation]);

  /** 장소카드 헤더 지구본 — URL SSOT 포커스 고정 후 홈 (연관 키워드 점프 후 stale selectedLocation race 방지) */
  const goHomeFromPlace = useCallback(() => {
    const focusLoc = routeLocation.pathname.startsWith('/place/')
      ? resolveFocusLocationFromPlacePath(routeLocation.pathname, category, savedTrips)
      : null;
    const target = focusLoc || lastGlobeFocusRef.current || selectedLocationRef.current;
    if (target && hasValidCoords(target)) {
      pendingGlobeHomeFocusRef.current = target;
      selectedLocationRef.current = target;
      rememberGlobeFocus(target);
      setSelectedLocation(target);
    }
    navigate('/');
  }, [routeLocation.pathname, category, navigate, rememberGlobeFocus, setSelectedLocation]);

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
      if (mooniChatEntry || destination === 'MOONi') {
        persistMooniLastChatId(created.id, user?.id ?? null);
      }
    }
    return created;
  }, [category, saveNewTrip, mooniChatEntry, user?.id]);

  const updateChatDraftDestination = useCallback((patch) => {
    setChatDraft((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

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

      let target = resolvePlaceTargetFromSlug(targetSlug, {
        savedTrips,
        category,
        selectedLocation,
      });

      if (!target && (targetSlug.startsWith('city-') || targetSlug.startsWith('loc-') || targetSlug.startsWith('search-') || targetSlug.startsWith('label-'))) {
        const coordsMatch = targetSlug.match(/-(-?\d+\.?\d*)-(-?\d+\.?\d*)$/);
        if (coordsMatch) {
          const parsedLat = parseFloat(coordsMatch[1]);
          const parsedLng = parseFloat(coordsMatch[2]);

          const rawSession = mergeCachedPlaceIfCoordsMatch(targetSlug, parsedLat, parsedLng);
          const fromSession = rawSession
            ? enrichLocationWithRentalAirport(mergeCanonicalTravelSpot(rawSession))
            : null;
          if (fromSession) {
            target = fromSession;
          } else {
            const matchedSpot = resolveTravelSpotFromCoords(parsedLat, parsedLng);
            if (matchedSpot) {
              target = matchedSpot;
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

        const syncId = ++placeRouteSyncRef.current;

        queueMicrotask(() => {
          if (syncId !== placeRouteSyncRef.current) return;

          const focusTarget = enrichLocationWithRentalAirport(
            mergeCanonicalTravelSpot({
              ...hydratedTarget,
              id: hydratedTarget.id || `loc-${hydratedTarget.lat}-${hydratedTarget.lng}`,
              type: hydratedTarget.type || 'temp-base',
              category: hydratedTarget.category || category,
            })
          );

          const canonicalParam = getPlaceUrlParam(focusTarget);
          if (canonicalParam && canonicalParam.toLowerCase() !== normalizedTargetSlug) {
            const tabSuffix = match.params.tab ? `/${match.params.tab}` : '';
            navigate(`/place/${canonicalParam}${tabSuffix}`, { replace: true });
            return;
          }

          const alreadySynced =
            isSameCanonicalPlace(selectedLocationRef.current, focusTarget) &&
            canonicalParam?.toLowerCase() === normalizedTargetSlug;

          if (!alreadySynced) {
            selectedLocationRef.current = focusTarget;
            pendingGlobeHomeFocusRef.current = focusTarget;
            rememberGlobeFocus(focusTarget);
            addScoutPin(focusTarget);
            moveToLocation(focusTarget.lat, focusTarget.lng, focusTarget.name, focusTarget.category);
          } else {
            rememberGlobeFocus(focusTarget);
            selectedLocationRef.current = focusTarget;
            pendingGlobeHomeFocusRef.current = focusTarget;
            setSelectedLocation(focusTarget);
          }

          setIsCardExpanded(true);
        });
      } else {
        queueMicrotask(() => setIsCardExpanded(true));
      }
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
      const fromPrevPlacePath = prevPath.startsWith('/place/')
        ? resolveFocusLocationFromPlacePath(prevPath, category, savedTrips)
        : null;
      const focusForHome =
        pendingGlobeHomeFocusRef.current ||
        fromPrevPlacePath ||
        (hasValidCoords(lastGlobeFocusRef.current) && lastGlobeFocusRef.current) ||
        (hasValidCoords(selectedLocationRef.current) && selectedLocationRef.current);
      pendingGlobeHomeFocusRef.current = null;

      queueMicrotask(() => {
        setIsCardExpanded(false);
      });

      if (focusForHome) {
        rememberGlobeFocus(focusForHome);
        selectedLocationRef.current = focusForHome;
        setSelectedLocation(focusForHome);
        const { lat, lng, name } = focusForHome;
        const focusCategory = focusForHome.category || category;
        window.setTimeout(() => {
          moveToLocation(lat, lng, name, focusCategory);
        }, 150);
        return;
      }

      revealRandomGlobeFace();
    }
  }, [routeLocation.pathname, routeLocation.state?.fromSearch, category, moveToLocation, rememberGlobeFocus, revealRandomGlobeFace, setSelectedLocation]);

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
  // Mapbox 지구본은 마커 겹침을 자연스럽게 처리하므로 카테고리와 무관하게 전체 여행지 노출
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

  useEffect(() => {
    const prev = prevGlobeModeRef.current;
    prevGlobeModeRef.current = globeMode;

    if (globeMode === GLOBE_MODE.GLOBE_2D) {
      tourReadyAnchorRef.current = null;
      setTourPivoted(false);
      return;
    }

    if (globeMode === GLOBE_MODE.TOUR_READY && prev !== GLOBE_MODE.TOUR_READY && selectedLocation) {
      tourReadyAnchorRef.current = selectedLocation;
      setTourPivoted(false);
    }
  }, [globeMode, selectedLocation]);

  useEffect(() => {
    if (globeMode !== GLOBE_MODE.TOUR_READY || !selectedLocation || !tourReadyAnchorRef.current) return;
    if (isSameCanonicalPlace(tourReadyAnchorRef.current, selectedLocation)) return;

    setTourPivoted(true);
    globeRef.current?.pivotTourExplore?.(selectedLocation);
  }, [globeMode, selectedLocation]);

  const handleTourBarClose = useCallback(() => {
    setIsCardExpanded(false);
    setSelectedLocation(null);
    setTourLaunchPending(false);
    tourReadyAnchorRef.current = null;
    setTourPivoted(false);
    if (globeRef.current?.getGlobeMode?.() !== GLOBE_MODE.GLOBE_2D) {
      globeRef.current?.endTour?.();
    }
    globeRef.current?.resumeRotation?.();
  }, [setSelectedLocation]);

  const handleGlobeModeChange = useCallback((mode) => {
    setGlobeMode(mode);
    if (!isTourMode(mode)) {
      setTourLaunchPending(false);
    }
  }, []);

  const beginGlobeTour = useCallback(async (location) => {
    if (!location) return;
    if (isMobileViewport) {
      setTourLaunchPending(true);
    }
    globeRef.current?.closeFlightCinema?.();
    globeRef.current?.pauseRotation?.();
    const ok = await globeRef.current?.startTour?.(location);
    const mode = globeRef.current?.getGlobeMode?.() ?? GLOBE_MODE.GLOBE_2D;
    if (isTourMode(mode)) {
      setGlobeMode(mode);
      return;
    }
    setTourLaunchPending(false);
    if (!ok && import.meta.env.DEV) {
      console.warn('[beginGlobeTour] startTour returned false');
    }
  }, [isMobileViewport]);

  const handleTourBarStartTour = useCallback(() => {
    if (!selectedLocation) return;
    void beginGlobeTour(selectedLocation);
  }, [beginGlobeTour, selectedLocation]);

  const endTourForFlightCinema = useCallback(async () => {
    await globeRef.current?.endTour?.();
  }, []);

  return (
    <FlightCinemaProvider
      globeRef={globeRef}
      isTourActive={isTourActive}
      endTourForCinema={endTourForFlightCinema}
      onActiveChange={setFlightCinemaActive}
    >
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
          travelSpots={isPinVisible ? globeSpots : []}
          allTravelSpots={isPinVisible ? globeSpots : []}
          activePinId={selectedLocation?.id}
          pauseRender={shouldPauseGlobe}
          isFlightCinemaActive={flightCinemaActive}
          globeTheme={globeTheme}
          isZenMode={isZenMode}
          isPinVisible={isPinVisible}
          onGlobeModeChange={handleGlobeModeChange}
          hideTourControls={isTourCinema}
          highlightCategory={category}
          categoryFaceEpoch={categoryFaceEpoch}
          focusSlug={selectedLocation?.slug ?? null}
        />
      </div>

      <div className={`transition-opacity duration-1000 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <SiteUpdateBanner />
        <HomeUI
          onSearch={handleSmartSearch} onTickerClick={handleSmartSearch}
          onRelatedPlaceClick={handleRelatedPlaceClickWithCinemaExit}
          externalInput={draftInput}
          savedTrips={filteredSavedTrips}
          onTripClick={handleLocationSelect} onTripDelete={deleteTrip}
          onOpenChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onLogoClick={() => setIsLogoPanelOpen(true)}
          relatedPlaces={relatedPlaces} isTagLoading={isTagLoading}
          selectedCategory={category} onCategorySelect={handleCategorySelect}
          isTickerExpanded={isTickerExpanded} setIsTickerExpanded={setIsTickerExpanded}
          isPinVisible={isPinVisible} onTogglePinVisibility={() => setIsPinVisible(prev => !prev)}
          globeTheme={globeTheme} onThemeToggle={handleThemeToggle}
          isZenMode={isZenMode} onToggleZenMode={toggleZenMode}
          isTourCinema={isTourCinema}
          isFlightCinema={flightCinemaActive}
          isPlaceCardVisible={isPlaceCardSummaryVisible}
          tourLocation={selectedLocation}
          tourPivoted={tourPivoted}
          globeMode={globeMode}
          onTourSkip={() => globeRef.current?.skipTour?.()}
          onTourEnd={() => globeRef.current?.endTour?.()}
          onTourBarClose={handleTourBarClose}
          onTourBarStartTour={handleTourBarStartTour}
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
            const hydrated = hydrateLocationFromSavedTrip(trip, category);
            if (hydrated) navigateToPlace(hydrated);
          }}
        />

        {selectedLocation && routeLocation.pathname === '/' && !isTourCinema && !flightCinemaActive && (
          <HomePlaceCardSummary
            globeRef={globeRef}
            location={selectedLocation}
            isBookmarked={savedTrips.some(t => t.destination === selectedLocation.name && t.is_bookmarked)}
            onClose={() => {
              setIsCardExpanded(false);
              setSelectedLocation(null);
              if (globeRef.current?.getGlobeMode?.() !== 'globe2d') {
                globeRef.current?.endTour?.();
              }
              if (globeRef.current && typeof globeRef.current.resumeRotation === 'function') {
                globeRef.current.resumeRotation();
              }
            }}
            onExpand={() => {
              setIsCardExpanded(true);
              navigate(`/place/${getPlaceUrlParam(selectedLocation)}`);
            }}
            onChat={openMooniFromPlace}
            onToggleBookmark={handleToggleBookmark}
            onStartTour={(location) => {
              void beginGlobeTour(location);
            }}
          />
        )}

        <div className={flightCinemaActive ? 'invisible pointer-events-none' : undefined}>
        <Outlet context={{
          location: selectedLocation,
          isBookmarked: selectedLocation ? savedTrips.some(t => t.destination === selectedLocation.name && t.is_bookmarked) : false,
          onClose: () => {
            navigate('/explore');
          },
          onOpenMooni: openMooniFromPlace,
          onNavigateToPlace: navigateToPlace,
          onGoHome: goHomeFromPlace,
          onToggleBookmark: handleToggleBookmark,
          onTicket: () => {
            navigate('/explore');
          },
          isTickerExpanded,
          initialExpanded: true,
          onExpandChange: setIsCardExpanded
        }} />
        </div>

        {!isPlaceRoute && !flightCinemaActive && (
          <MooniAgentFab
            isChatOpen={isChatOpen}
            isZenMode={isZenMode}
            isTourActive={isTourActive}
            onOpenChat={(payload) => handleStartChat('MOONi', payload)}
          />
        )}

        <ChatModal
          isOpen={isChatOpen}
          overlaySuppressed={flightCinemaActive}
          mooniEntry={mooniChatEntry}
          mooniPlaceContext={mooniPlaceContext}
          onClose={() => {
            if (activeChatId && mooniChatEntry) {
              persistMooniLastChatId(activeChatId, user?.id ?? null);
            }
            setIsChatOpen(false);
            setChatDraft(null);
            setActiveChatId(null);
            setInitialQuery(null);
            setMooniPlaceContext(null);
            globeRef.current?.resumeRotation();
          }}
          initialQuery={initialQuery}
          chatHistory={savedTrips}
          chatDraft={chatDraft}
          onCreateTripOnFirstUserMessage={createTripOnFirstUserMessage}
          onUpdateChat={updateMessages}
          onUpdateTripDestination={updateTripDestination}
          onUpdateChatDraft={updateChatDraftDestination}
          onToggleBookmark={toggleBookmark}
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
          <Link key={`${spot.slug || spot.id}-${index}`} to={`/place/${getPlaceUrlParam(spot)}`}>
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
    </FlightCinemaProvider>
  );
}
export default Home;
