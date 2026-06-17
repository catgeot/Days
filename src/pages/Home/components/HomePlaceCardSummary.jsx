import React, { useMemo } from 'react';
import PlaceCardSummary from '../../../components/PlaceCard/modes/PlaceCardSummary';
import { useChatEssentialGuide } from '../../../hooks/useChatEssentialGuide.js';
import { useFlightCinema } from '../lib/FlightCinemaContext.jsx';
import {
  canPreviewFlightRoute,
  resolveSummaryFlightCinemaOd,
} from '../lib/globeFlightCinema.js';

/** 써머리 장소카드 — 항공 경로 시네마 진입 (플래너 Trip CTA와 분리) */
export default function HomePlaceCardSummary(props) {
  const { requestFlightCinema } = useFlightCinema();
  const { location } = props;

  const slug = location?.slug ? String(location.slug).trim().toLowerCase() : null;
  const essentialGuide = useChatEssentialGuide(slug, location?.name ?? '');

  const flightPreview = useMemo(
    () => resolveSummaryFlightCinemaOd(location, { essentialGuide }),
    [location, essentialGuide]
  );

  const canPreviewFlight = useMemo(
    () => canPreviewFlightRoute(location, { essentialGuide }),
    [location, essentialGuide]
  );

  const handlePreviewFlightRoute = () => {
    if (!flightPreview) return;
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
      canPreviewFlightRoute={canPreviewFlight}
      flightRouteLabel={
        flightPreview
          ? (flightPreview.routeIatas ?? [flightPreview.originIata, flightPreview.destIata]).join(' → ')
          : null
      }
      onPreviewFlightRoute={canPreviewFlight ? handlePreviewFlightRoute : undefined}
    />
  );
}
