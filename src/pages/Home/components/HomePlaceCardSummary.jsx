import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PlaceCardSummary from '../../../components/PlaceCard/modes/PlaceCardSummary';
import { useChatEssentialGuide } from '../../../hooks/useChatEssentialGuide.js';
import { useFlightCinema } from '../lib/FlightCinemaContext.jsx';
import {
  canPreviewFlightRoute,
  estimateFlightHoursChain,
  estimateFlightLegHours,
  getAirportHubCoords,
  normalizeFlightRouteIataChain,
  resolveSummaryFlightCinemaOd,
} from '../lib/globeFlightCinema.js';
import {
  persistFlightOriginIata,
  resolveDefaultFlightOriginIataForLocation,
} from '../lib/flightOriginPreference.js';
import { shouldResolveFlightRouteViaEdge } from '../../../utils/rentalAirportMatch.js';
import { resolveFlightRouteHubsForCinema } from '../../../utils/resolveFlightRouteEdge.js';
import {
  IMMERSE_ENTRY,
  nextImmerseAltitude,
  nextImmerseZoom,
  resolveImmerseCamera,
} from '../lib/globeImmerseZoom.js';
import { buildPlacePlannerPath } from '../../../utils/placePlannerPath.js';
import GlobeStayStrip from './GlobeStayStrip.jsx';
import GlobeTourStrip from './GlobeTourStrip.jsx';
import PlaceWorldEventsSection from '../../../components/PlaceCard/common/PlaceWorldEventsSection.jsx';
import PlaceCrossLinksSection from '../../../components/PlaceCard/common/PlaceCrossLinksSection.jsx';
import { isPlaceCrosslinkWorldEventsRailEnabled } from '../lib/placeCrosslinkRollout.js';
import { isPlaceServiceModalOpenEligible } from '../lib/placeServiceModalDeeplink.js';
import { trackEvent } from '../../../shared/analytics/trackEvent.js';
import { buildServiceModalOpenEvent } from '../../../shared/serviceRegion/serviceRegionSearchModel.js';

/** 연속 not-ready 폴링 횟수 — 250ms×4 ≈ 1s (일시적 레이어 공백·style idle 깜박임 흡수) */
const FLIGHT_ROUTE_NOT_READY_STREAK = 4;

/** 써머리 장소카드 — 항공 경로 시네마 진입 (플래너 Trip CTA와 분리) */
const PLACE_SERVICE_MODAL_DEEPLINK_WAIT_MS = 5000;

export default function HomePlaceCardSummary({
  globeRef,
  onStayExpandedChange,
  onImmersedChange,
  pendingServiceModalOpen = null,
  onPendingServiceModalOpenConsumed,
  deeplinkTourOpenSignal = 0,
  deeplinkStayOpenSignal = 0,
  ...props
}) {
  const {
    requestFlightCinema,
    flightCinemaRequestPending,
    browserOriginSuggestion,
    browserOriginHint,
  } = useFlightCinema();
  const { location } = props;
  const crosslinkWorldEventsRail = isPlaceCrosslinkWorldEventsRailEnabled();

  const slug = location?.slug ? String(location.slug).trim().toLowerCase() : null;
  const essentialGuide = useChatEssentialGuide(slug, location?.name ?? '');
  /** place_toolkit essential_guide가 있을 때만 써머리 「플래너 보기」링크 */
  const plannerUrl = essentialGuide ? buildPlacePlannerPath(slug) : null;

  const [selectedOriginIata, setSelectedOriginIata] = useState(() =>
    resolveDefaultFlightOriginIataForLocation(location)
  );
  const [isImmersed, setIsImmersed] = useState(false);
  const [stayOpen, setStayOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  /** 상대 모달 외부 열기 — 0은 무시, bump 시에만 반응 */
  const [openStaySignal, setOpenStaySignal] = useState(0);
  const [openTourSignal, setOpenTourSignal] = useState(0);
  const stayOpenRef = useRef(false);
  const tourOpenRef = useRef(false);

  const handleStayExpandedChange = useCallback(
    (open) => {
      stayOpenRef.current = open;
      setStayOpen(open);
      onStayExpandedChange?.(Boolean(open || tourOpenRef.current));
    },
    [onStayExpandedChange]
  );

  const handleTourExpandedChange = useCallback(
    (open) => {
      tourOpenRef.current = open;
      setTourOpen(open);
      onStayExpandedChange?.(Boolean(stayOpenRef.current || open));
    },
    [onStayExpandedChange]
  );

  const handleSwitchToTour = useCallback(() => {
    const { name, params } = buildServiceModalOpenEvent({
      service: 'tour',
      from: 'switch',
      slug: slug || '',
    });
    trackEvent(name, params);
    setOpenTourSignal((n) => n + 1);
  }, [slug]);

  const handleSwitchToStay = useCallback(() => {
    const { name, params } = buildServiceModalOpenEvent({
      service: 'stay',
      from: 'switch',
      slug: slug || '',
    });
    trackEvent(name, params);
    setOpenStaySignal((n) => n + 1);
  }, [slug]);

  useEffect(() => {
    if (!pendingServiceModalOpen) return undefined;
    const { service } = pendingServiceModalOpen;
    let cancelled = false;
    let opened = false;

    const consume = () => {
      if (cancelled || opened) return;
      opened = true;
      onPendingServiceModalOpenConsumed?.();
    };

    const tryOpen = () => {
      if (cancelled || opened) return;
      if (location?.isScanning) return;
      if (!isPlaceServiceModalOpenEligible(location, service)) {
        consume();
        return;
      }
      consume();
    };

    tryOpen();
    const wait = window.setTimeout(consume, PLACE_SERVICE_MODAL_DEEPLINK_WAIT_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(wait);
    };
  }, [pendingServiceModalOpen, location, slug, onPendingServiceModalOpenConsumed]);

  useEffect(() => {
    queueMicrotask(() => setSelectedOriginIata(resolveDefaultFlightOriginIataForLocation(location)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 장소가 바뀔 때만 기본값 재계산 (사용자 선택 유지)
  }, [location?.id]);

  useEffect(() => {
    queueMicrotask(() => {
      setIsImmersed(Boolean(globeRef?.current?.isImmersed?.()));
    });
  }, [globeRef, location?.id]);

  useEffect(() => {
    onImmersedChange?.(isImmersed);
  }, [isImmersed, onImmersedChange]);

  useEffect(() => {
    return () => {
      onImmersedChange?.(false);
    };
  }, [onImmersedChange]);

  const syncFlightPreview = useMemo(
    () => resolveSummaryFlightCinemaOd(location, { essentialGuide, originIata: selectedOriginIata }),
    [location, essentialGuide, selectedOriginIata]
  );

  const needsEdgeFlightHubs = useMemo(
    () =>
      Boolean(
        syncFlightPreview &&
          shouldResolveFlightRouteViaEdge(location, {
            originIata: selectedOriginIata,
            destIata: syncFlightPreview.destIata,
            essentialGuide,
          })
      ),
    [location, essentialGuide, selectedOriginIata, syncFlightPreview]
  );

  const [edgeFlightHubs, setEdgeFlightHubs] = useState(null);
  const [edgeFlightHubsLoading, setEdgeFlightHubsLoading] = useState(false);

  useEffect(() => {
    if (!syncFlightPreview || !needsEdgeFlightHubs) {
      setEdgeFlightHubs(null);
      setEdgeFlightHubsLoading(false);
      return undefined;
    }

    let cancelled = false;
    setEdgeFlightHubs(null);
    setEdgeFlightHubsLoading(true);

    void resolveFlightRouteHubsForCinema(location, {
      originIata: selectedOriginIata,
      destIata: syncFlightPreview.destIata,
      essentialGuide,
    })
      .then((result) => {
        if (cancelled) return;
        setEdgeFlightHubs(result);
        setEdgeFlightHubsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setEdgeFlightHubs(null);
        setEdgeFlightHubsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location, essentialGuide, selectedOriginIata, syncFlightPreview, needsEdgeFlightHubs]);

  const flightPreview = useMemo(() => {
    if (!syncFlightPreview) return null;
    if (!needsEdgeFlightHubs) return syncFlightPreview;
    if (!edgeFlightHubs) {
      return edgeFlightHubsLoading
        ? { ...syncFlightPreview, edgePending: true }
        : syncFlightPreview;
    }

    const hubIatas = Array.isArray(edgeFlightHubs.hubIatas) ? edgeFlightHubs.hubIatas : [];
    const destIata = String(edgeFlightHubs.destIata || syncFlightPreview.destIata)
      .trim()
      .toUpperCase();
    const dest = getAirportHubCoords(destIata) || syncFlightPreview.dest;
    const routeIatas = normalizeFlightRouteIataChain(
      syncFlightPreview.originIata,
      hubIatas,
      destIata
    );
    const chainPoints = [
      syncFlightPreview.origin,
      ...hubIatas.map((iata) => getAirportHubCoords(iata)).filter(Boolean),
      dest,
    ].filter(Boolean);

    return {
      ...syncFlightPreview,
      destIata,
      dest,
      hubIatas,
      routeIatas,
      isConnecting: hubIatas.length > 0,
      flightHours: estimateFlightHoursChain(chainPoints),
      flightLegHours: estimateFlightLegHours(routeIatas),
      edgePending: false,
    };
  }, [syncFlightPreview, needsEdgeFlightHubs, edgeFlightHubs, edgeFlightHubsLoading]);

  const hasFlightRoute = useMemo(
    () => canPreviewFlightRoute(location, { essentialGuide, originIata: selectedOriginIata }),
    [location, essentialGuide, selectedOriginIata]
  );

  const canToggleImmerse = useMemo(() => {
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && !location?.isScanning;
  }, [location?.lat, location?.lng, location?.isScanning]);

  const readGlobeFlightReady = () => Boolean(globeRef?.current?.isFlightCinemaReady?.());
  const [flightCinemaGlobeReady, setFlightCinemaGlobeReady] = useState(false);
  const [flightGlobePending, setFlightGlobePending] = useState(false);
  const notReadyStreakRef = useRef(0);

  useEffect(() => {
    if (!hasFlightRoute) {
      notReadyStreakRef.current = 0;
      setFlightCinemaGlobeReady(false);
      setFlightGlobePending(false);
      return undefined;
    }

    notReadyStreakRef.current = 0;
    let cancelled = false;
    setFlightGlobePending(true);
    globeRef?.current?.wakeAfterOverlay?.();

    const syncReady = () => {
      const next = readGlobeFlightReady();
      if (next) {
        notReadyStreakRef.current = 0;
        setFlightCinemaGlobeReady(true);
        setFlightGlobePending(false);
        return;
      }

      notReadyStreakRef.current += 1;
      if (notReadyStreakRef.current >= FLIGHT_ROUTE_NOT_READY_STREAK) {
        setFlightCinemaGlobeReady(false);
        setFlightGlobePending(false);
      }
    };

    syncReady();
    const interval = window.setInterval(syncReady, 250);
    void (async () => {
      const wait = globeRef?.current?.waitForFlightCinemaReady?.({ timeoutMs: 8000 });
      if (wait) await wait;
      if (cancelled) return;
      syncReady();
      if (readGlobeFlightReady()) setFlightGlobePending(false);
    })();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      notReadyStreakRef.current = 0;
    };
  }, [globeRef, hasFlightRoute, location?.id]);

  const flightPreviewReady = Boolean(flightPreview) && !flightPreview?.edgePending;
  const isFlightRouteReady =
    hasFlightRoute &&
    flightPreviewReady &&
    !(needsEdgeFlightHubs && edgeFlightHubsLoading && !edgeFlightHubs);

  const flyImmerseTo = (options) => {
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    let ok = globeRef?.current?.immerseToPin?.(lat, lng, options);
    if (!ok) {
      globeRef?.current?.wakeAfterOverlay?.();
      ok = globeRef?.current?.immerseToPin?.(lat, lng, options);
    }
    return Boolean(ok);
  };

  const handleToggleImmerse = () => {
    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (isImmersed) {
      globeRef?.current?.exitImmerse?.(lat, lng);
      setIsImmersed(false);
      return;
    }

    const camera = resolveImmerseCamera('base');
    if (flyImmerseTo({
      zoom: camera.zoom,
      pitch: camera.pitch,
      altitude: camera.altitude,
    })) {
      setIsImmersed(true);
    }
  };

  /** ×2 / ×4 — 현재 줌에서 누적 확대만 (동일 버튼 재클릭도 후퇴 없음) */
  const handleImmerseZoomStep = (step) => {
    if (!isImmersed) return;
    const view = globeRef?.current?.getMapView?.() ?? null;
    const zoom = nextImmerseZoom(view?.zoom, step);
    const altitude = nextImmerseAltitude(view?.altitude, step);
    flyImmerseTo({
      zoom,
      pitch: IMMERSE_ENTRY.pitchDeep,
      altitude,
    });
  };

  const handlePreviewFlightRoute = () => {
    if (!flightPreview || !isFlightRouteReady || flightCinemaRequestPending) return;
    if (!flightCinemaGlobeReady && !readGlobeFlightReady()) return;
    if (isImmersed) {
      globeRef?.current?.clearImmerseState?.();
      setIsImmersed(false);
    }
    persistFlightOriginIata(selectedOriginIata);
    void requestFlightCinema({
      location,
      essentialGuide,
      originIata: selectedOriginIata,
      destIata: flightPreview.destIata,
      origin: flightPreview.origin,
      dest: flightPreview.dest,
      hubIatas: flightPreview.edgePending ? undefined : flightPreview.hubIatas,
      skipEdgeHubResolve:
        !needsEdgeFlightHubs ||
        (Boolean(edgeFlightHubs) && !flightPreview?.edgePending),
    });
  };

  const handleSelectOrigin = (iata) => {
    const code = String(iata ?? 'ICN').trim().toUpperCase();
    setSelectedOriginIata(code);
    persistFlightOriginIata(code);
  };

  const handleApplyBrowserOriginSuggestion = () => {
    if (!browserOriginSuggestion?.iata) return;
    handleSelectOrigin(browserOriginSuggestion.iata);
  };

  return (
    <GlobeStayStrip
      location={location}
      peerOpen={tourOpen}
      openSignal={openStaySignal + deeplinkStayOpenSignal}
      onSwitchToTour={handleSwitchToTour}
      onExpandedChange={handleStayExpandedChange}
      essentialGuide={essentialGuide}
      flightOriginIata={selectedOriginIata}
      canPreviewFlightRoute={hasFlightRoute}
    >
      {({ toggle, mobilePanel, expanded: stayExpanded, close: closeStay }) => (
        <GlobeTourStrip
          location={location}
          peerOpen={stayOpen}
          openSignal={openTourSignal + deeplinkTourOpenSignal}
          onSwitchToStay={handleSwitchToStay}
          onExpandedChange={handleTourExpandedChange}
        >
          {({ tourTab, close: closeTour, expanded: tourExpanded }) => {
            const dismissSidePanels = () => {
              closeTour?.();
              closeStay?.();
            };

            return (
              <PlaceCardSummary
                {...props}
                location={location}
                canPreviewFlightRoute={hasFlightRoute}
                isFlightRouteReady={isFlightRouteReady}
                isFlightRoutePending={
                  flightCinemaRequestPending ||
                  flightGlobePending ||
                  (needsEdgeFlightHubs && (edgeFlightHubsLoading || Boolean(flightPreview?.edgePending)))
                }
                flightRouteLabel={
                  flightPreview && !flightPreview.edgePending
                    ? (flightPreview.routeIatas ?? [flightPreview.originIata, flightPreview.destIata]).join(' → ')
                    : null
                }
                flightRouteHours={
                  flightPreview && !flightPreview.edgePending ? (flightPreview.flightHours ?? null) : null
                }
                selectedFlightOriginIata={selectedOriginIata}
                flightBrowserOriginHint={browserOriginHint}
                onSelectFlightOrigin={handleSelectOrigin}
                onApplyBrowserOriginSuggestion={
                  browserOriginSuggestion?.iata ? handleApplyBrowserOriginSuggestion : undefined
                }
                initialOriginExpanded={false}
                onPreviewFlightRoute={
                  isFlightRouteReady
                    ? () => {
                        dismissSidePanels();
                        handlePreviewFlightRoute();
                      }
                    : undefined
                }
                plannerUrl={plannerUrl}
                canToggleImmerse={canToggleImmerse}
                isImmersed={isImmersed}
                onToggleImmerse={() => {
                  dismissSidePanels();
                  handleToggleImmerse();
                }}
                onImmerseZoomStep={(step) => {
                  dismissSidePanels();
                  handleImmerseZoomStep(step);
                }}
                onStartTour={(loc) => {
                  dismissSidePanels();
                  props.onStartTour?.(loc);
                }}
                onExpand={() => {
                  dismissSidePanels();
                  props.onExpand?.();
                }}
                onChat={() => {
                  dismissSidePanels();
                  props.onChat?.();
                }}
                stayToggle={toggle}
                stayExpanded={stayExpanded}
                tourTab={tourTab}
                tourExpanded={tourExpanded}
                eventsSection={
                  crosslinkWorldEventsRail ? (
                    <PlaceCrossLinksSection location={location} variant="summary" />
                  ) : (
                    <PlaceWorldEventsSection location={location} variant="summary" />
                  )
                }
                belowCard={mobilePanel}
              />
            );
          }}
        </GlobeTourStrip>
      )}
    </GlobeStayStrip>
  );
}
