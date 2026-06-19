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
  const { requestFlightCinema } = useFlightCinema();
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
  const [flightCinemaGlobeReady, setFlightCinemaGlobeReady] = useState(readGlobeFlightReady);

  useEffect(() => {
    if (!hasFlightRoute || flightCinemaGlobeReady) return undefined;

    const bump = () => {
      if (readGlobeFlightReady()) {
        setFlightCinemaGlobeReady(true);
      }
    };

    bump();
    const interval = window.setInterval(bump, 250);
    return () => window.clearInterval(interval);
  }, [globeRef, hasFlightRoute, flightCinemaGlobeReady, location?.id]);

  const isFlightRouteReady = hasFlightRoute && flightCinemaGlobeReady;

  const handlePreviewFlightRoute = () => {
    if (!flightPreview || !isFlightRouteReady) return;
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
      flightRouteLabel={
        flightPreview
          ? (flightPreview.routeIatas ?? [flightPreview.originIata, flightPreview.destIata]).join(' → ')
          : null
      }
      onPreviewFlightRoute={isFlightRouteReady ? handlePreviewFlightRoute : undefined}
    />
  );
}
