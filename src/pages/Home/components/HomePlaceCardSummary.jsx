import React, { useEffect, useMemo, useState } from 'react';
import PlaceCardSummary from '../../../components/PlaceCard/modes/PlaceCardSummary';
import { useChatEssentialGuide } from '../../../hooks/useChatEssentialGuide.js';
import { useFlightCinema } from '../lib/FlightCinemaContext.jsx';
import {
  canPreviewFlightRoute,
  resolveSummaryFlightCinemaOd,
} from '../lib/globeFlightCinema.js';

/** 써머리 장소카드 — 항공 경로 시네마 진입 (플래너 Trip CTA와 분리) */
export default function HomePlaceCardSummary({ globeRef, ...props }) {
  const { requestFlightCinema, flightCinemaRequestPending } = useFlightCinema();
  const { location } = props;

  const slug = location?.slug ? String(location.slug).trim().toLowerCase() : null;
  const essentialGuide = useChatEssentialGuide(slug, location?.name ?? '');

  const flightPreview = useMemo(
    () => resolveSummaryFlightCinemaOd(location, { essentialGuide }),
    [location, essentialGuide]
  );

  const hasFlightRoute = useMemo(
    () => canPreviewFlightRoute(location, { essentialGuide }),
    [location, essentialGuide]
  );

  const readGlobeFlightReady = () => Boolean(globeRef?.current?.isFlightCinemaReady?.());
  const [flightCinemaGlobeReady, setFlightCinemaGlobeReady] = useState(false);

  useEffect(() => {
    if (!hasFlightRoute) {
      setFlightCinemaGlobeReady(false);
      return undefined;
    }

    const syncReady = () => {
      setFlightCinemaGlobeReady((prev) => {
        const next = readGlobeFlightReady();
        return prev === next ? prev : next;
      });
    };

    syncReady();
    const interval = window.setInterval(syncReady, 250);
    return () => window.clearInterval(interval);
  }, [globeRef, hasFlightRoute, location?.id]);

  const isFlightRouteReady = hasFlightRoute && flightCinemaGlobeReady && Boolean(flightPreview);

  const handlePreviewFlightRoute = () => {
    if (!flightPreview || !isFlightRouteReady || flightCinemaRequestPending) return;
    void requestFlightCinema({
      location,
      essentialGuide,
      originIata: flightPreview.originIata,
      destIata: flightPreview.destIata,
      origin: flightPreview.origin,
      dest: flightPreview.dest,
      hubIatas: flightPreview.hubIatas,
    });
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
      onPreviewFlightRoute={isFlightRouteReady ? handlePreviewFlightRoute : undefined}
    />
  );
}
