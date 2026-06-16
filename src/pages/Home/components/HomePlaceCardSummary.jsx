import React, { useMemo } from 'react';
import PlaceCardSummary from '../../../components/PlaceCard/modes/PlaceCardSummary';
import { useFlightCinema } from '../lib/FlightCinemaContext.jsx';
import {
  canPreviewFlightRoute,
  resolveSummaryFlightCinemaOd,
} from '../lib/globeFlightCinema.js';

/** 써머리 장소카드 — 항공 경로 시네마 진입 (플래너 Trip CTA와 분리) */
export default function HomePlaceCardSummary(props) {
  const { requestFlightCinema } = useFlightCinema();
  const { location } = props;

  const flightPreview = useMemo(
    () => resolveSummaryFlightCinemaOd(location),
    [location]
  );

  const canPreviewFlight = canPreviewFlightRoute(location);

  const handlePreviewFlightRoute = () => {
    if (!flightPreview) return;
    requestFlightCinema({
      location,
      originIata: flightPreview.originIata,
      destIata: flightPreview.destIata,
      origin: flightPreview.origin,
      dest: flightPreview.dest,
    });
  };

  return (
    <PlaceCardSummary
      {...props}
      canPreviewFlightRoute={canPreviewFlight}
      flightRouteLabel={
        flightPreview
          ? `${flightPreview.originIata} → ${flightPreview.destIata}`
          : null
      }
      onPreviewFlightRoute={canPreviewFlight ? handlePreviewFlightRoute : undefined}
    />
  );
}
