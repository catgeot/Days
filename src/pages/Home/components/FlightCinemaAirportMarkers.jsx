import React from 'react';
import { Marker } from 'react-map-gl/mapbox';
import { buildFlightCinemaAirportMarkers } from '../lib/globeFlightCinema.js';

const ROLE_OFFSET = {
  origin: [10, 0],
  hub: [8, 0],
  dest: [10, 0],
};

/**
 * 항공 시네마 공항 IATA — react-map-gl Marker (Mapbox symbol 레이어 대체).
 * 영문화 setLanguage 이후 symbol continuePlacement 크래시 회피.
 */
export default function FlightCinemaAirportMarkers({ routeIatas = [] }) {
  const markers = buildFlightCinemaAirportMarkers(routeIatas);
  if (!markers.length) return null;

  return markers.map(({ iata, lng, lat, role }) => (
    <Marker
      key={iata}
      longitude={lng}
      latitude={lat}
      anchor="left"
      offset={ROLE_OFFSET[role] ?? [10, 0]}
    >
      <span
        className="pointer-events-none select-none whitespace-nowrap font-bold tabular-nums tracking-wide text-white"
        style={{
          fontSize: 'clamp(13px, 2.2vw, 16px)',
          letterSpacing: '0.06em',
          textShadow:
            '0 0 6px rgba(2,6,23,0.95), 0 1px 2px rgba(0,0,0,0.9), 1px 0 0 rgba(2,6,23,0.8), -1px 0 0 rgba(2,6,23,0.8)',
        }}
      >
        {iata}
      </span>
    </Marker>
  ));
}
