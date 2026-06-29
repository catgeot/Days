import React, { useEffect, useMemo, useRef, useState } from 'react';
import PlaceCardSummary from '../../../components/PlaceCard/modes/PlaceCardSummary';
import { useChatEssentialGuide } from '../../../hooks/useChatEssentialGuide.js';
import { useFlightCinema } from '../lib/FlightCinemaContext.jsx';
import {
  canPreviewFlightRoute,
  resolveSummaryFlightCinemaOd,
} from '../lib/globeFlightCinema.js';
import {
  getStoredFlightOriginIata,
  persistFlightOriginIata,
  resolveDefaultFlightOriginIata,
} from '../lib/flightOriginPreference.js';

/** 연속 not-ready 폴링 횟수 — 250ms×4 ≈ 1s (일시적 레이어 공백·style idle 깜박임 흡수) */
const FLIGHT_ROUTE_NOT_READY_STREAK = 4;

/** 써머리 장소카드 — 항공 경로 시네마 진입 (플래너 Trip CTA와 분리) */
export default function HomePlaceCardSummary({ globeRef, ...props }) {
  const {
    requestFlightCinema,
    flightCinemaRequestPending,
    browserOriginSuggestion,
    browserOriginHint,
  } = useFlightCinema();
  const { location } = props;

  const slug = location?.slug ? String(location.slug).trim().toLowerCase() : null;
  const essentialGuide = useChatEssentialGuide(slug, location?.name ?? '');

  const [selectedOriginIata, setSelectedOriginIata] = useState(() => resolveDefaultFlightOriginIata());

  useEffect(() => {
    queueMicrotask(() => setSelectedOriginIata(resolveDefaultFlightOriginIata()));
  }, [location?.id]);

  const flightPreview = useMemo(
    () => resolveSummaryFlightCinemaOd(location, { essentialGuide, originIata: selectedOriginIata }),
    [location, essentialGuide, selectedOriginIata]
  );

  const hasFlightRoute = useMemo(
    () => canPreviewFlightRoute(location, { essentialGuide, originIata: selectedOriginIata }),
    [location, essentialGuide, selectedOriginIata]
  );

  const readGlobeFlightReady = () => Boolean(globeRef?.current?.isFlightCinemaReady?.());
  const [flightCinemaGlobeReady, setFlightCinemaGlobeReady] = useState(false);
  const notReadyStreakRef = useRef(0);

  useEffect(() => {
    if (!hasFlightRoute) {
      notReadyStreakRef.current = 0;
      setFlightCinemaGlobeReady(false);
      return undefined;
    }

    notReadyStreakRef.current = 0;

    const syncReady = () => {
      const next = readGlobeFlightReady();
      if (next) {
        notReadyStreakRef.current = 0;
        setFlightCinemaGlobeReady(true);
        return;
      }

      notReadyStreakRef.current += 1;
      if (notReadyStreakRef.current >= FLIGHT_ROUTE_NOT_READY_STREAK) {
        setFlightCinemaGlobeReady(false);
      }
    };

    syncReady();
    const interval = window.setInterval(syncReady, 250);
    return () => {
      window.clearInterval(interval);
      notReadyStreakRef.current = 0;
    };
  }, [globeRef, hasFlightRoute, location?.id]);

  const isFlightRouteReady = hasFlightRoute && flightCinemaGlobeReady && Boolean(flightPreview);

  const handlePreviewFlightRoute = () => {
    if (!flightPreview || !isFlightRouteReady || flightCinemaRequestPending) return;
    persistFlightOriginIata(selectedOriginIata);
    void requestFlightCinema({
      location,
      essentialGuide,
      originIata: selectedOriginIata,
      destIata: flightPreview.destIata,
      origin: flightPreview.origin,
      dest: flightPreview.dest,
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
    <PlaceCardSummary
      {...props}
      location={location}
      canPreviewFlightRoute={hasFlightRoute}
      isFlightRouteReady={isFlightRouteReady}
      isFlightRoutePending={flightCinemaRequestPending}
      flightRouteLabel={
        flightPreview
          ? (flightPreview.routeIatas ?? [flightPreview.originIata, flightPreview.destIata]).join(' → ')
          : null
      }
      flightRouteHours={flightPreview?.flightHours ?? null}
      selectedFlightOriginIata={selectedOriginIata}
      flightBrowserOriginHint={browserOriginHint}
      onSelectFlightOrigin={handleSelectOrigin}
      onApplyBrowserOriginSuggestion={
        browserOriginSuggestion?.iata ? handleApplyBrowserOriginSuggestion : undefined
      }
      initialOriginExpanded={!getStoredFlightOriginIata()}
      onPreviewFlightRoute={isFlightRouteReady ? handlePreviewFlightRoute : undefined}
    />
  );
}
