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
import { logSeaExplore } from '../../shared/cloudPreview/seaExploreDebug.js';
import { logCurationHandoff } from '../../shared/cloudPreview/curationHandoffDebug';
import { TRAVEL_SPOTS } from './data/travelSpots';
import { citiesData } from './data/citiesData';

import { useGlobeLogic } from './hooks/useGlobeLogic';
import { useTravelData } from './hooks/useTravelData';
import { useSearchEngine } from './hooks/useSearchEngine';
import { useHomeHandlers } from './hooks/useHomeHandlers';
import { formatUrlName, getPlaceUrlParam } from './lib/formatUrlName';
import { cachePlaceLocation, mergeCachedPlaceIfCoordsMatch } from './lib/placeLocationCache';
import {
  pushRecentVisited,
  pushKeywordVisit,
} from './lib/exploreRecentHistory';
import {
  hydrateLocationFromSavedTrip,
  overlaySessionCuration,
  resolvePlaceTargetFromSlug,
} from './lib/placeRouteHydrate';
import { getSystemPrompt, PERSONA_TYPES } from './lib/prompts';
import { persistMooniLastChatId } from './lib/tripChatUtils';
import { enrichLocationWithRentalAirport } from '../../utils/rentalAirportMatch.js';
import {
  mergeCanonicalTravelSpot,
  healPlaceholderCountry,
  isPlaceholderCountry,
  isSameCanonicalPlace,
  resolveTravelSpotFromCoords,
} from '../../utils/travelSpotResolve.js';
import { getAddressFromCoordinates } from './lib/geocoding';
import { resolveSessionBoundSpot } from '../../utils/resolveDestinationFromChat';
import {
  buildMooniBoundSpotFromLocation,
  ensurePlaceChatIntroForLocation,
  needsPlaceChatIntroHydration,
} from './lib/placeChatIntro';
import { GLOBE_MODE, isTourMode } from './lib/globeMode';
import { FlightCinemaProvider } from './lib/FlightCinemaContext.jsx';
import { pickRandomGlobeCategory } from './lib/globeCategoryFocus';
import { getDefaultFaceSubregionId } from './lib/globeFaceSubregions.js';
import {
  buildHierarchicalSeaBasinRail,
  getSeaBasinById,
  resolveTopOceanForBasin,
  seaBasinToFlyRegion,
  topOceanToFlyRegion,
} from './lib/seaBasinRail.js';
import { syncHomeViewportAfterInput, syncHomeChromeAfterNavigation } from '../../shared/lib/mobileViewport';
import {
  clearPlaceReturnTo,
  peekPlaceReturnTo,
} from './lib/placeReturnTo';
import {
  consumeCurationHomeOpen,
  hasValidCurationCoords,
} from './lib/curationPlaceBridge';

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
      healPlaceholderCountry(
        mergeCanonicalTravelSpot({
          ...target,
          id: target.id || `loc-${target.lat}-${target.lng}`,
          type: target.type || 'temp-base',
          category: target.category || category,
        }),
      ),
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

  useEffect(() => {
    if (sessionStorage.getItem('gateo_reset_viewport') !== '1') return undefined;
    sessionStorage.removeItem('gateo_reset_viewport');
    syncHomeViewportAfterInput();
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
  const [faceRegionsOpen, setFaceRegionsOpen] = useState(false);
  const [selectedFaceRegionId, setSelectedFaceRegionId] = useState(null);
  const [selectedFaceSubregionId, setSelectedFaceSubregionId] = useState(null);
  const [selectedSeaBasinId, setSelectedSeaBasinId] = useState(null);
  const [selectedTopOceanId, setSelectedTopOceanId] = useState(null);

  const selectedFaceSubregionIdRef = useRef(selectedFaceSubregionId);
  selectedFaceSubregionIdRef.current = selectedFaceSubregionId;
  const selectedTopOceanIdRef = useRef(selectedTopOceanId);
  selectedTopOceanIdRef.current = selectedTopOceanId;
  const selectedSeaBasinIdRef = useRef(selectedSeaBasinId);
  selectedSeaBasinIdRef.current = selectedSeaBasinId;
  const pendingSeaBasinFlyRef = useRef(null);
  const seaBasinFlyTimerRef = useRef(null);
  const pendingTopOceanFlyRef = useRef(null);
  const topOceanFlyTimerRef = useRef(null);

  const clearPendingRegionFlies = useCallback(() => {
    pendingSeaBasinFlyRef.current = null;
    pendingTopOceanFlyRef.current = null;
    if (seaBasinFlyTimerRef.current) {
      window.clearTimeout(seaBasinFlyTimerRef.current);
      seaBasinFlyTimerRef.current = null;
    }
    if (topOceanFlyTimerRef.current) {
      window.clearTimeout(topOceanFlyTimerRef.current);
      topOceanFlyTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearPendingRegionFlies();
  }, [clearPendingRegionFlies]);

  const revealRandomGlobeFace = useCallback(() => {
    const next = pickRandomGlobeCategory();
    setCategory(next);
    setCategoryFaceEpoch((epoch) => epoch + 1);
    setFaceRegionsOpen(false);
    setSelectedFaceRegionId(null);
    setSelectedFaceSubregionId(getDefaultFaceSubregionId(next));
    setSelectedSeaBasinId(null);
    setSelectedTopOceanId(null);
    globeRef.current?.clearRegionFocus?.();
  }, []);

  const closeFaceRegions = useCallback(() => {
    clearPendingRegionFlies();
    setFaceRegionsOpen(false);
    setSelectedFaceRegionId(null);
    setSelectedFaceSubregionId(null);
    setSelectedSeaBasinId(null);
    setSelectedTopOceanId(null);
    globeRef.current?.clearRegionFocus?.();
  }, [clearPendingRegionFlies]);

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
  /** 모바일 숙소 패널 펼침 — 스크림·회전 정지·MOONi 숨김 */
  const [isStayStripExpanded, setIsStayStripExpanded] = useState(false);
  const [isPlaceImmersed, setIsPlaceImmersed] = useState(false);
  const [homeChromeEpoch, setHomeChromeEpoch] = useState(0);
  const bumpHomeChromeEpoch = useCallback(() => {
    setHomeChromeEpoch((n) => n + 1);
  }, []);
  const prevChatOpenRef = useRef(false);
  const prevPathnameRef = useRef(routeLocation.pathname);

  useEffect(() => {
    if (prevChatOpenRef.current && !isChatOpen && isMobileViewport) {
      syncHomeViewportAfterInput();
      queueMicrotask(() => {
        globeRef.current?.wakeAfterOverlay?.();
      });
    }
    prevChatOpenRef.current = isChatOpen;
  }, [isChatOpen, isMobileViewport]);

  useEffect(() => {
    const prevPath = prevPathnameRef.current;
    const wasExplore = prevPath.startsWith('/explore');
    const isExplore = routeLocation.pathname.startsWith('/explore');
    if (wasExplore && !isExplore && isMobileViewport) {
      syncHomeViewportAfterInput();
    }
    prevPathnameRef.current = routeLocation.pathname;
  }, [routeLocation.pathname, isMobileViewport]);

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
  const mobilePlaceScrim = isMobileViewport && isPlaceCardSummaryVisible && !isPlaceImmersed;
  const mobileStayScrimStrong = mobilePlaceScrim && isStayStripExpanded;
  /** 써머리 카드 닫힘·투어 X 탈출 후에도 마지막 방문 핀·지명 강조 유지 */
  const globeActivePinId = selectedLocation?.id ?? scoutedPins[0]?.id ?? null;
  const globeFocusSlug = selectedLocation?.slug ?? scoutedPins[0]?.slug ?? null;

  useEffect(() => {
    if (!isPlaceCardSummaryVisible) {
      setIsStayStripExpanded(false);
      setIsPlaceImmersed(false);
    }
  }, [isPlaceCardSummaryVisible, selectedLocation?.id]);

  useEffect(() => {
    if (!mobileStayScrimStrong) return undefined;
    globeRef.current?.pauseRotation?.();
    return () => {
      globeRef.current?.resumeRotation?.();
    };
  }, [mobileStayScrimStrong]);
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

  const handleCategorySelect = useCallback(async (nextCategory) => {
    if (flightCinemaActive) {
      globeRef.current?.closeFlightCinema?.();
    }
    const activeMode = globeRef.current?.getGlobeMode?.() ?? globeMode;
    if (isTourMode(activeMode)) {
      tourReadyAnchorRef.current = null;
      setTourPivoted(false);
      setTourLaunchPending(false);
      await globeRef.current?.endTour?.();
    }

    if (nextCategory === category && faceRegionsOpen) {
      clearPendingRegionFlies();
      setFaceRegionsOpen(false);
      setSelectedFaceRegionId(null);
      setSelectedFaceSubregionId(null);
      setSelectedSeaBasinId(null);
      setSelectedTopOceanId(null);
      globeRef.current?.clearRegionFocus?.();
      return;
    }

    setCategory(nextCategory);
    setFaceRegionsOpen(true);
    setSelectedFaceRegionId(null);
    setSelectedFaceSubregionId(getDefaultFaceSubregionId(nextCategory));
    setSelectedSeaBasinId(null);
    setSelectedTopOceanId(null);
    globeRef.current?.clearRegionFocus?.();
    setCategoryFaceEpoch((epoch) => epoch + 1);
  }, [category, faceRegionsOpen, clearPendingRegionFlies, flightCinemaActive, globeMode]);

  const handleFaceSubregionSelect = useCallback((subregionId) => {
    const next = subregionId || null;
    if (selectedFaceSubregionIdRef.current === next && !selectedTopOceanIdRef.current) return;
    selectedFaceSubregionIdRef.current = next;
    selectedTopOceanIdRef.current = null;
    setSelectedTopOceanId(null);
    setSelectedFaceSubregionId(next);
    setSelectedFaceRegionId(null);
    setSelectedSeaBasinId(null);
    globeRef.current?.clearRegionFocus?.();
  }, []);

  const seaBasinHierarchy = useMemo(() => {
    if (!selectedTopOceanId) return null;
    return buildHierarchicalSeaBasinRail({
      selectedTopOceanId,
      selectedSeaBasinId,
      category,
      omitTopOceans: true,
    });
  }, [selectedTopOceanId, selectedSeaBasinId, category]);

  const handleRelatedPlaceClickWithCinemaExit = useCallback((placeData, isBridge) => {
    if (flightCinemaActive) {
      globeRef.current?.closeFlightCinema?.();
    }
    handleRelatedPlaceClick(placeData, isBridge);
  }, [flightCinemaActive, handleRelatedPlaceClick]);

  const openMooniFromPlace = useCallback((payload = {}) => {
    const boundSpot = buildMooniBoundSpotFromLocation(selectedLocation);
    if (!boundSpot?.name) return;
    handleStartChat('MOONi', {
      ...payload,
      boundSpot,
    });
  }, [handleStartChat, selectedLocation]);

  useEffect(() => {
    const st = routeLocation.state;
    if (!st?.openMooni || !st?.boundSpot?.name) return;
    const boundSpot = st.boundSpot;
    navigate('.', { replace: true, state: {} });
    handleStartChat('MOONi', {
      persona: PERSONA_TYPES.GENERAL,
      boundSpot,
    });
  }, [routeLocation.state, navigate, handleStartChat]);

  /** 무니 인트로 → 장소카드/검색 desc 재사용 */
  const handlePlaceIntroReady = useCallback(({ summary, placeName }) => {
    if (!summary) return;
    setSelectedLocation((prev) => {
      if (!prev?.name) return prev;
      const prevName = String(prev.name).trim();
      const needle = String(placeName || '').trim();
      const needleCore = needle.replace(/^[^\s]+\s+/, ''); // 「일본 …」국가 접두
      if (
        needle &&
        prevName !== needle &&
        prevName !== needleCore &&
        !needle.includes(prevName) &&
        !prevName.includes(needleCore || needle)
      ) {
        return prev;
      }
      return {
        ...prev,
        desc: summary,
      };
    });
  }, [setSelectedLocation]);

  const selectedLocationRef = useRef(selectedLocation);
  const lastGlobeFocusRef = useRef(null);
  /** 홈(지구본) 복귀 시 moveToLocation SSOT — navigateToPlace·goHomeFromPlace가 명시 설정 */
  const pendingGlobeHomeFocusRef = useRef(null);
  /** /place X 닫기 등 — 홈 복귀 시 써머리 재오픈 생략(핀 flyTo는 유지) */
  const skipHomeSummaryRestoreRef = useRef(false);
  const placeRouteSyncRef = useRef(0);
  const dismissRotateResumeTimerRef = useRef(null);

  const clearDismissRotateResumeTimer = useCallback(() => {
    if (dismissRotateResumeTimerRef.current != null) {
      window.clearTimeout(dismissRotateResumeTimerRef.current);
      dismissRotateResumeTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearDismissRotateResumeTimer(), [clearDismissRotateResumeTimer]);

  const rememberGlobeFocus = useCallback((loc) => {
    if (!hasValidCoords(loc)) return;
    lastGlobeFocusRef.current = loc;
  }, []);

  // 블로그 AI 큐레이션 → 홈 써머리(±무니) 핸드오프
  useEffect(() => {
    const pending = consumeCurationHomeOpen();
    if (!pending?.location || !hasValidCurationCoords(pending.location)) return;

    logCurationHandoff('home.effect.start', {
      openMooni: pending.openMooni,
      mobile: isMobileViewport,
    });

    const pin = healPlaceholderCountry(
      mergeCanonicalTravelSpot({
        ...pending.location,
        type: pending.location.type || 'temp-base',
        category: pending.location.category || category,
      }),
    );

    pendingGlobeHomeFocusRef.current = pin;
    rememberGlobeFocus(pin);
    selectedLocationRef.current = pin;
    handleLocationSelect(pin);
    logCurationHandoff('home.select', { name: pin.name, openMooni: pending.openMooni });

    const boundSpotForMooni = pending.openMooni
      ? buildMooniBoundSpotFromLocation(pin)
      : null;
    logCurationHandoff('home.mooni.bound', {
      requested: pending.openMooni,
      hasBound: Boolean(boundSpotForMooni?.name),
      label: boundSpotForMooni?.name || null,
    });

    const syncDelayMs = isMobileViewport ? 360 : 180;
    logCurationHandoff('home.sync.schedule', { delayMs: syncDelayMs });
    const syncTimer = window.setTimeout(() => {
      logCurationHandoff('home.sync.run', { globeReady: Boolean(globeRef.current) });
      syncHomeViewportAfterInput();
      if (isMobileViewport) {
        bumpHomeChromeEpoch();
        syncHomeChromeAfterNavigation();
      }
      globeRef.current?.wakeAfterOverlay?.();
      if (hasValidCoords(pin)) {
        moveToLocation(pin.lat, pin.lng, pin.name, pin.category || category, { location: pin });
        logCurationHandoff('home.flyTo', { name: pin.name });
      }

      if (boundSpotForMooni?.name) {
        requestAnimationFrame(() => {
          logCurationHandoff('home.mooni.open', { label: boundSpotForMooni.name });
          handleStartChat('MOONi', {
            boundSpot: boundSpotForMooni,
            persona: PERSONA_TYPES.INSPIRER,
          });
        });
      } else if (pending.openMooni) {
        logCurationHandoff('home.mooni.skip', { reason: 'no-bound-spot' });
      }
    }, syncDelayMs);

    return () => {
      window.clearTimeout(syncTimer);
      logCurationHandoff('home.effect.cleanup', { reason: 'unmount-or-deps' });
    };
  }, [category, handleLocationSelect, handleStartChat, moveToLocation, rememberGlobeFocus, isMobileViewport, bumpHomeChromeEpoch]);

  useEffect(() => {
    logCurationHandoff('home.ui', {
      isChatOpen,
      mooniChatEntry,
      summary: selectedLocation?.name || null,
      path: routeLocation.pathname,
    });
  }, [isChatOpen, mooniChatEntry, selectedLocation?.name, routeLocation.pathname]);

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
  const navigateToPlace = useCallback((targetPlace, { tab } = {}) => {
    if (!targetPlace) return;

    const prepared = enrichLocationWithRentalAirport(
      healPlaceholderCountry(
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
      )
    );

    const tabSuffix =
      typeof tab === 'string' && tab.trim()
        ? `/${tab.trim().toLowerCase()}`
        : '';

    const param = getPlaceUrlParam(prepared);
    if (!param) {
      if (targetPlace.lat != null && targetPlace.lng != null) {
        navigate(`/place/city-${targetPlace.lat}-${targetPlace.lng}${tabSuffix}`);
      }
      return;
    }

    selectedLocationRef.current = prepared;
    pendingGlobeHomeFocusRef.current = prepared;
    rememberGlobeFocus(prepared);
    setSelectedLocation(prepared);
    addScoutPin(prepared);
    moveToLocation(prepared.lat, prepared.lng, prepared.name, prepared.category || category, { location: prepared });
    navigate(`/place/${param}${tabSuffix}`);
  }, [category, navigate, addScoutPin, moveToLocation, rememberGlobeFocus, setSelectedLocation]);

  /** 장소카드 헤더 지구본 — URL SSOT 포커스 고정 후 홈 (연관 키워드 점프 후 stale selectedLocation race 방지) */
  const goHomeFromPlace = useCallback(() => {
    clearPlaceReturnTo();
    const focusLoc = routeLocation.pathname.startsWith('/place/')
      ? resolveFocusLocationFromPlacePath(routeLocation.pathname, category, savedTrips)
      : null;
    const target = focusLoc || lastGlobeFocusRef.current || selectedLocationRef.current;
    if (target && hasValidCoords(target)) {
      pendingGlobeHomeFocusRef.current = target;
      selectedLocationRef.current = target;
      rememberGlobeFocus(target);
      addScoutPin(target);
      setSelectedLocation(target);
    }
    navigate('/');
    if (isMobileViewport) {
      bumpHomeChromeEpoch();
      syncHomeChromeAfterNavigation();
      globeRef.current?.wakeAfterOverlay?.();
    }
  }, [routeLocation.pathname, category, navigate, rememberGlobeFocus, addScoutPin, setSelectedLocation, isMobileViewport, bumpHomeChromeEpoch]);

  const leavePlaceCard = useCallback(() => {
    const returnTo = peekPlaceReturnTo(routeLocation.state);
    if (returnTo) {
      clearPlaceReturnTo();
      navigate(returnTo);
      return;
    }
    // 써머리→/place 오탭 후 X: explore 루프 대신 홈으로. 써머리 재오픈은 skipHomeSummaryRestoreRef.
    clearPlaceReturnTo();
    skipHomeSummaryRestoreRef.current = true;
    pendingGlobeHomeFocusRef.current = null;
    setIsCardExpanded(false);
    setSelectedLocation(null);
    navigate('/');
    if (isMobileViewport) {
      bumpHomeChromeEpoch();
      syncHomeChromeAfterNavigation();
      globeRef.current?.wakeAfterOverlay?.();
    }
  }, [isMobileViewport, navigate, routeLocation.state, setSelectedLocation, bumpHomeChromeEpoch]);

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
              country: matchedCity?.country || undefined,
              country_en: matchedCity?.country_en || undefined,
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

          const focusTarget = overlaySessionCuration(
            enrichLocationWithRentalAirport(
              healPlaceholderCountry(
                mergeCanonicalTravelSpot({
                  ...hydratedTarget,
                  id: hydratedTarget.id || `loc-${hydratedTarget.lat}-${hydratedTarget.lng}`,
                  type: hydratedTarget.type || 'temp-base',
                  category: hydratedTarget.category || category,
                })
              )
            ),
            { selectedLocation: selectedLocationRef.current },
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

          // place_chat_intro (홈 써머리·갤러리 overview — SSOT 하드코딩도 통일)
          if (needsPlaceChatIntroHydration(focusTarget)) {
            const pinId = focusTarget?.id;
            const pinName = focusTarget?.name;
            ensurePlaceChatIntroForLocation(focusTarget, { generateIfMissing: true })
              .then((summary) => {
                if (!summary || syncId !== placeRouteSyncRef.current) return;
                setSelectedLocation((prev) => {
                  if (!prev) return prev;
                  const same =
                    (pinId && prev.id === pinId) ||
                    (pinName && prev.name === pinName) ||
                    isSameCanonicalPlace(prev, focusTarget);
                  if (!same || !needsPlaceChatIntroHydration(prev)) return prev;
                  const next = {
                    ...prev,
                    desc: summary,
                    placeChatIntroApplied: true,
                  };
                  selectedLocationRef.current = next;
                  return next;
                });
              })
              .catch(() => {});
          }

          // SSOT 미등록 uiPlace — URL 복원 시 Explore/빈 국가·좌표-only 표시명을 역지오로 복구
          const needsCountryHeal = isPlaceholderCountry(focusTarget.country);
          const needsNameHeal =
            !focusTarget.name ||
            focusTarget.name === '알 수 없는 지역' ||
            focusTarget.name === '알 수 없는 도시' ||
            focusTarget.name === '좌표 탐색';
          if (
            (needsCountryHeal || needsNameHeal) &&
            Number.isFinite(Number(focusTarget.lat)) &&
            Number.isFinite(Number(focusTarget.lng))
          ) {
            getAddressFromCoordinates(focusTarget.lat, focusTarget.lng)
              .then((address) => {
                if (!address) return;
                if (syncId !== placeRouteSyncRef.current) return;
                const healedCountry =
                  address.country && !isPlaceholderCountry(address.country)
                    ? address.country
                    : null;
                const healedName =
                  address.name_ko || address.city || address.name_en || null;
                if (!healedCountry && !healedName) return;
                setSelectedLocation((prev) => {
                  if (!prev || !isSameCanonicalPlace(prev, focusTarget)) return prev;
                  const countryStillBad =
                    isPlaceholderCountry(prev.country) && isPlaceholderCountry(prev.country_en);
                  const nameStillBad =
                    !prev.name ||
                    prev.name === '알 수 없는 지역' ||
                    prev.name === '알 수 없는 도시' ||
                    prev.name === '좌표 탐색';
                  if (!countryStillBad && !nameStillBad) return prev;
                  const healed = enrichLocationWithRentalAirport(
                    healPlaceholderCountry({
                      ...prev,
                      ...(countryStillBad && healedCountry
                        ? {
                            country: healedCountry,
                            country_en: address.country_en || healedCountry,
                          }
                        : {}),
                      ...(nameStillBad && healedName
                        ? {
                            name: healedName,
                            name_ko: healedName,
                            name_en: address.name_en || prev.name_en || healedName,
                          }
                        : {}),
                    }),
                  );
                  selectedLocationRef.current = healed;
                  addScoutPin(healed);
                  return healed;
                });
              })
              .catch(() => {});
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
      if (isMobileViewport && prevPath.startsWith('/place/')) {
        bumpHomeChromeEpoch();
      }
      const fromSearch = Boolean(routeLocation.state?.fromSearch);
      const fromPrevPlacePath =
        !fromSearch && prevPath.startsWith('/place/')
          ? resolveFocusLocationFromPlacePath(prevPath, category, savedTrips)
          : null;
      const focusForHome =
        pendingGlobeHomeFocusRef.current ||
        fromPrevPlacePath ||
        (hasValidCoords(selectedLocationRef.current) && selectedLocationRef.current) ||
        (hasValidCoords(lastGlobeFocusRef.current) && lastGlobeFocusRef.current);
      pendingGlobeHomeFocusRef.current = null;

      queueMicrotask(() => {
        setIsCardExpanded(false);
      });

      if (focusForHome) {
        rememberGlobeFocus(focusForHome);
        selectedLocationRef.current = focusForHome;
        const skipSummary = skipHomeSummaryRestoreRef.current;
        skipHomeSummaryRestoreRef.current = false;
        if (!fromSearch && !skipSummary) {
          setSelectedLocation(focusForHome);
        }
        const { lat, lng, name } = focusForHome;
        const focusCategory = focusForHome.category || category;
        // Explore pause 직후: resize·입력 복구 없이 flyTo가 씹히는 경우(hub·신규 지역) 방지
        window.setTimeout(() => {
          globeRef.current?.wakeAfterOverlay?.();
          moveToLocation(lat, lng, name, focusCategory, { location: focusForHome });
        }, 150);
        return;
      }

      if (!fromSearch) {
        revealRandomGlobeFace();
      }
    }
  }, [routeLocation.pathname, routeLocation.state?.fromSearch, category, moveToLocation, rememberGlobeFocus, revealRandomGlobeFace, setSelectedLocation, isMobileViewport, bumpHomeChromeEpoch]);

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
  // 해역 선택 = 지도 fill·라벨 하이라이트만. 핀은 뷰 기준 전체 유지(플랜 §4.6 하이라이트).
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
    if (globeMode === GLOBE_MODE.TOUR_READY && selectedLocation && !tourReadyAnchorRef.current) {
      tourReadyAnchorRef.current = selectedLocation;
    }
  }, [globeMode, selectedLocation]);

  useEffect(() => {
    if (globeMode !== GLOBE_MODE.TOUR_READY || !selectedLocation || !tourReadyAnchorRef.current) return;
    if (isSameCanonicalPlace(tourReadyAnchorRef.current, selectedLocation)) return;

    setTourPivoted(true);
    globeRef.current?.pivotTourExplore?.(selectedLocation);
  }, [globeMode, selectedLocation]);

  /** 써머리·투어 UI만 닫고 지구본 마지막 방문 핀은 유지 */
  const dismissPlaceSelectionKeepGlobePin = useCallback(() => {
    if (selectedLocation) {
      const lat = Number(selectedLocation.lat);
      const lng = Number(selectedLocation.lng);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
      const immersed = isPlaceImmersed || globeRef.current?.isImmersed?.();

      if (immersed && hasCoords) {
        globeRef.current?.exitImmerse?.(lat, lng);
      } else {
        globeRef.current?.clearImmerseState?.();
      }

      addScoutPin(selectedLocation);
      rememberGlobeFocus(selectedLocation);

      if (hasCoords) {
        moveToLocation(lat, lng, selectedLocation.name, selectedLocation.category || category, {
          location: selectedLocation,
        });
      }
    }
    setIsCardExpanded(false);
    setSelectedLocation(null);
    setTourLaunchPending(false);
    tourReadyAnchorRef.current = null;
    setTourPivoted(false);
    if (globeRef.current?.getGlobeMode?.() !== GLOBE_MODE.GLOBE_2D) {
      globeRef.current?.endTour?.();
    }
    globeRef.current?.pauseRotation?.();
    clearDismissRotateResumeTimer();
    dismissRotateResumeTimerRef.current = window.setTimeout(() => {
      dismissRotateResumeTimerRef.current = null;
      globeRef.current?.resumeRotation?.();
    }, 3000);
    if (isMobileViewport) {
      bumpHomeChromeEpoch();
      syncHomeChromeAfterNavigation();
      globeRef.current?.wakeAfterOverlay?.();
    }
  }, [
    addScoutPin,
    bumpHomeChromeEpoch,
    category,
    clearDismissRotateResumeTimer,
    isPlaceImmersed,
    moveToLocation,
    rememberGlobeFocus,
    selectedLocation,
    setSelectedLocation,
    isMobileViewport,
  ]);

  /** 나라 칩 포커스 시 써머리만 닫고 국가 단위 fitBounds — PC는 카드와 메뉴 동시 표시 */
  const handleFaceRegionSelect = useCallback((region) => {
    if (!region || !Number.isFinite(region.lat) || !Number.isFinite(region.lng)) return;
    if (flightCinemaActive) {
      globeRef.current?.closeFlightCinema?.();
    }
    if (selectedLocation && routeLocation.pathname === '/') {
      dismissPlaceSelectionKeepGlobePin();
    }
    setSelectedSeaBasinId(null);
    setSelectedTopOceanId(null);
    setSelectedFaceRegionId(region.id);
    globeRef.current?.flyToRegion?.(region);
  }, [
    dismissPlaceSelectionKeepGlobePin,
    flightCinemaActive,
    routeLocation.pathname,
    selectedLocation,
  ]);

  const handleTopOceanSelect = useCallback((ocean) => {
    if (!ocean?.id) return;
    if (selectedTopOceanIdRef.current === ocean.id && !selectedSeaBasinIdRef.current) return;
    const flyRegion = topOceanToFlyRegion(ocean.id);
    if (!flyRegion) return;
    if (flightCinemaActive) {
      globeRef.current?.closeFlightCinema?.();
    }
    if (selectedLocation && routeLocation.pathname === '/') {
      dismissPlaceSelectionKeepGlobePin();
    }
    selectedFaceSubregionIdRef.current = null;
    selectedTopOceanIdRef.current = ocean.id;
    selectedSeaBasinIdRef.current = null;
    setSelectedFaceRegionId(null);
    setSelectedFaceSubregionId(null);
    setSelectedTopOceanId(ocean.id);
    setSelectedSeaBasinId(null);
    const hadPendingSeaBasinFly = Boolean(seaBasinFlyTimerRef.current);
    if (seaBasinFlyTimerRef.current) {
      window.clearTimeout(seaBasinFlyTimerRef.current);
      seaBasinFlyTimerRef.current = null;
    }
    pendingSeaBasinFlyRef.current = null;
    const hadQueuedFly = Boolean(topOceanFlyTimerRef.current);
    const useImmediate = isMobileViewport || hadQueuedFly || hadPendingSeaBasinFly;
    logSeaExplore('ocean.tap', {
      id: ocean.id,
      immediate: useImmediate,
      queued: hadQueuedFly,
      mobile: isMobileViewport,
    });
    if (isMobileViewport && performance.memory) {
      logSeaExplore('mem.mb', Math.round(performance.memory.usedJSHeapSize / 1048576));
    }
    pendingTopOceanFlyRef.current = { ...flyRegion, immediate: useImmediate };
    if (topOceanFlyTimerRef.current) {
      window.clearTimeout(topOceanFlyTimerRef.current);
    }
    const delayMs = isMobileViewport
      ? (hadQueuedFly ? 32 : 72)
      : (hadQueuedFly ? 50 : 160);
    topOceanFlyTimerRef.current = window.setTimeout(() => {
      topOceanFlyTimerRef.current = null;
      const region = pendingTopOceanFlyRef.current;
      pendingTopOceanFlyRef.current = null;
      if (region) {
        logSeaExplore('ocean.fly', { id: ocean.id, immediate: region.immediate });
        globeRef.current?.flyToRegion?.(region);
      }
    }, delayMs);
  }, [
    dismissPlaceSelectionKeepGlobePin,
    flightCinemaActive,
    isMobileViewport,
    routeLocation.pathname,
    selectedLocation,
  ]);

  const handleSeaBasinSelect = useCallback((basin) => {
    if (!basin?.id) return;
    if (selectedSeaBasinIdRef.current === basin.id) return;
    const flyRegion = seaBasinToFlyRegion(basin);
    if (!flyRegion) return;
    if (flightCinemaActive) {
      globeRef.current?.closeFlightCinema?.();
    }
    if (selectedLocation && routeLocation.pathname === '/') {
      dismissPlaceSelectionKeepGlobePin();
    }
    const topOcean = resolveTopOceanForBasin(basin);
    selectedTopOceanIdRef.current = topOcean;
    selectedSeaBasinIdRef.current = basin.id;
    setSelectedFaceRegionId(null);
    setSelectedTopOceanId(topOcean);
    setSelectedSeaBasinId(basin.id);
    const hadPendingOceanFly = Boolean(topOceanFlyTimerRef.current);
    if (topOceanFlyTimerRef.current) {
      window.clearTimeout(topOceanFlyTimerRef.current);
      topOceanFlyTimerRef.current = null;
    }
    pendingTopOceanFlyRef.current = null;
    const hadQueuedFly = Boolean(seaBasinFlyTimerRef.current);
    const useImmediate = isMobileViewport || hadQueuedFly || hadPendingOceanFly;
    logSeaExplore('basin.tap', {
      id: basin.id,
      immediate: useImmediate,
      queued: hadQueuedFly,
      mobile: isMobileViewport,
    });
    if (isMobileViewport && performance.memory) {
      logSeaExplore('mem.mb', Math.round(performance.memory.usedJSHeapSize / 1048576));
    }
    pendingSeaBasinFlyRef.current = { ...flyRegion, immediate: useImmediate };
    if (seaBasinFlyTimerRef.current) {
      window.clearTimeout(seaBasinFlyTimerRef.current);
    }
    const delayMs = isMobileViewport
      ? (hadQueuedFly ? 32 : 72)
      : (hadQueuedFly ? 50 : 160);
    seaBasinFlyTimerRef.current = window.setTimeout(() => {
      seaBasinFlyTimerRef.current = null;
      const region = pendingSeaBasinFlyRef.current;
      pendingSeaBasinFlyRef.current = null;
      if (region) {
        logSeaExplore('basin.fly', { id: basin.id, immediate: region.immediate });
        globeRef.current?.flyToRegion?.(region);
      }
    }, delayMs);
  }, [
    dismissPlaceSelectionKeepGlobePin,
    flightCinemaActive,
    isMobileViewport,
    routeLocation.pathname,
    selectedLocation,
  ]);

  const handleTourBarClose = dismissPlaceSelectionKeepGlobePin;

  const handleGlobeModeChange = useCallback((mode) => {
    setGlobeMode(mode);
    if (!isTourMode(mode) || mode === GLOBE_MODE.TOUR_READY) {
      setTourLaunchPending(false);
    }
  }, []);

  /** 모바일 — Mapbox 엔진·index globeMode 불일치 시 TourMobileBar Skip 고착 방지 */
  useEffect(() => {
    if (!isMobileViewport || !isTourActive) return undefined;

    const syncEngineMode = () => {
      const engineMode = globeRef.current?.getGlobeMode?.();
      if (!engineMode || engineMode === globeMode) return;
      setGlobeMode(engineMode);
      if (engineMode === GLOBE_MODE.TOUR_READY || engineMode === GLOBE_MODE.GLOBE_2D) {
        setTourLaunchPending(false);
      }
    };

    syncEngineMode();
    const timer = window.setInterval(syncEngineMode, 400);
    return () => window.clearInterval(timer);
  }, [globeMode, isMobileViewport, isTourActive]);

  const beginGlobeTour = useCallback(async (location) => {
    if (!location) return;
    if (isMobileViewport) {
      setTourLaunchPending(true);
    }
    globeRef.current?.clearImmerseState?.();
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
          activePinId={globeActivePinId}
          pauseRender={shouldPauseGlobe}
          isFlightCinemaActive={flightCinemaActive}
          globeTheme={globeTheme}
          isZenMode={isZenMode}
          isPinVisible={isPinVisible}
          onGlobeModeChange={handleGlobeModeChange}
          hideTourControls={isTourCinema}
          highlightCategory={category}
          categoryFaceEpoch={categoryFaceEpoch}
          focusSlug={globeFocusSlug}
          onReturnToSpace={closeFaceRegions}
        />
      </div>

      <div className={`relative z-10 transition-opacity duration-1000 ${isZenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <SiteUpdateBanner />
        <HomeUI
          homeChromeEpoch={homeChromeEpoch}
          onSearch={handleSmartSearch} onTickerClick={handleSmartSearch}
          onRelatedPlaceClick={handleRelatedPlaceClickWithCinemaExit}
          externalInput={draftInput}
          savedTrips={filteredSavedTrips}
          onTripClick={handleLocationSelect} onTripDelete={deleteTrip}
          onOpenChat={(p) => handleStartChat(selectedLocation?.name, p)}
          onLogoClick={() => setIsLogoPanelOpen(true)}
          relatedPlaces={relatedPlaces} isTagLoading={isTagLoading}
          selectedCategory={category} onCategorySelect={handleCategorySelect}
          faceRegionsOpen={faceRegionsOpen}
          onFaceRegionsDismiss={closeFaceRegions}
          selectedFaceRegionId={selectedFaceRegionId}
          onFaceRegionSelect={handleFaceRegionSelect}
          selectedFaceSubregionId={selectedFaceSubregionId}
          onFaceSubregionSelect={handleFaceSubregionSelect}
          selectedTopOceanId={selectedTopOceanId}
          onTopOceanSelect={handleTopOceanSelect}
          seaBasinHierarchy={seaBasinHierarchy}
          selectedSeaBasinId={selectedSeaBasinId}
          onSeaBasinSelect={handleSeaBasinSelect}
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
            if (!hydrated) return;
            // 확장 /place 가 아니라 홈 써머리 장소카드(숙소·투어·항공 등)
            if (routeLocation.pathname !== '/') {
              pendingGlobeHomeFocusRef.current = hydrated;
              selectedLocationRef.current = hydrated;
              rememberGlobeFocus(hydrated);
              navigate('/');
            }
            handleLocationSelect(hydrated);
          }}
        />

        {mobilePlaceScrim ? (
          <div
            aria-hidden="true"
            className={`fixed inset-0 z-[55] transition-colors duration-300 ${
              mobileStayScrimStrong ? 'bg-black/55' : 'bg-black/30'
            }`}
          />
        ) : null}

        {selectedLocation && routeLocation.pathname === '/' && !isTourCinema && !flightCinemaActive && (
          <HomePlaceCardSummary
            key={`summary-${homeChromeEpoch}-${selectedLocation.id ?? selectedLocation.slug ?? selectedLocation.name}`}
            globeRef={globeRef}
            location={selectedLocation}
            isBookmarked={savedTrips.some(t => t.destination === selectedLocation.name && t.is_bookmarked)}
            onClose={dismissPlaceSelectionKeepGlobePin}
            onExpand={() => {
              const param = getPlaceUrlParam(selectedLocation);
              if (!param) return;
              setIsCardExpanded(true);
              navigate(`/place/${param}`);
            }}
            onChat={openMooniFromPlace}
            onToggleBookmark={handleToggleBookmark}
            onStartTour={(location) => {
              void beginGlobeTour(location);
            }}
            onStayExpandedChange={setIsStayStripExpanded}
            onImmersedChange={setIsPlaceImmersed}
          />
        )}

        <div className={flightCinemaActive ? 'invisible pointer-events-none' : undefined}>
        <Outlet context={{
          location: selectedLocation,
          isBookmarked: selectedLocation ? savedTrips.some(t => t.destination === selectedLocation.name && t.is_bookmarked) : false,
          onClose: leavePlaceCard,
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
            hideForStayPanel={mobileStayScrimStrong}
            onOpenChat={(payload) => handleStartChat('MOONi', payload)}
          />
        )}

        <ChatModal
          isOpen={isChatOpen}
          overlaySuppressed={flightCinemaActive}
          mooniEntry={mooniChatEntry}
          mooniPlaceContext={mooniPlaceContext}
          onPlaceIntroReady={handlePlaceIntroReady}
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
            // 오버레이·viewport sync 직후 몰입 flyTo가 먹히도록 Mapbox 입력/리사이즈 복구
            queueMicrotask(() => {
              globeRef.current?.wakeAfterOverlay?.();
            });
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
            const trip = savedTrips.find((t) => String(t.id) === String(id));
            const spot = trip
              ? resolveSessionBoundSpot(trip.destination, trip.messages || [])
              : null;
            if (spot) {
              setMooniPlaceContext(buildMooniBoundSpotFromLocation(spot));
            } else if (
              trip?.destination &&
              String(trip.destination).trim() !== 'MOONi'
            ) {
              setMooniPlaceContext({
                slug: null,
                name: String(trip.destination).trim(),
                displayLabel: String(trip.destination).trim(),
                country: trip.curation_data?.country ?? null,
                lat: trip.lat ?? null,
                lng: trip.lng ?? null,
              });
            } else {
              setMooniPlaceContext(null);
            }
          }}
          onDeleteChat={deleteTrip}
        />

        <SearchDiscoveryModal
          isOpen={routeLocation.pathname.startsWith('/explore')}
          isFromPlaceCard={isExploreFromPlace}
          onClose={() => navigate('/')}
          onSelect={(spot) => {
            // 검색 선택(카탈로그 포함) → 홈 써머리 장소카드 (/place 직행 금지)
            const lat = Number(spot?.lat);
            const lng = Number(spot?.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
            const pin = { ...spot, lat, lng };
            // Explore→홈 race: path effect가 selectedLocation 반영 전에 돌 수 있어 동기 SSOT
            pendingGlobeHomeFocusRef.current = pin;
            rememberGlobeFocus(pin);
            selectedLocationRef.current = pin;
            handleLocationSelect(pin);
            navigate('/', { state: { fromSearch: true } });
          }}
          onSearch={async (query) => {
            const selectedFromSearch = await handleSmartSearch(query, { requireChoice: true });

            // 선택 카드 유지 (홈으로 나가지 않음)
            if (selectedFromSearch?.__disambiguation === true) {
              return selectedFromSearch;
            }

            // 결과 없을 때 Explore를 닫고 홈만 열지 않음 (반딧불 isConcept null 회귀 방지)
            if (!selectedFromSearch?.name) return selectedFromSearch;

            try {
              pushRecentVisited(selectedFromSearch);
              pushKeywordVisit(query, selectedFromSearch);
            } catch {
              // Ignore localStorage errors in private mode, etc.
            }

            if (hasValidCoords(selectedFromSearch)) {
              pendingGlobeHomeFocusRef.current = selectedFromSearch;
              rememberGlobeFocus(selectedFromSearch);
              selectedLocationRef.current = selectedFromSearch;
            }
            navigate('/', { state: { fromSearch: true } });
            return selectedFromSearch;
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
        <Link to="/explore/island">섬여행</Link>
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

        {/* 국내 축제·명승 투톱 */}
        <Link to="/korea">한국의 축제</Link>
        <Link to="/korea/theme/scenic">한국의 명승</Link>
      </div>
    </div>
    </FlightCinemaProvider>
  );
}
export default Home;
