import React, { useMemo, useState } from 'react';
import Map, { Layer, Marker, Source, useControl } from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const LINE_SOURCE = 'festival-road-line';

function LanguageControl() {
  useControl(() => new MapboxLanguage({ defaultLanguage: 'ko' }));
  return null;
}

/**
 * @param {{ stopIndex: number, lng: number, lat: number, label?: string }[]} points
 */
function lineFeature(points) {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((point) => [point.lng, point.lat]),
    },
  };
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {{ lng: number, lat: number }[]} points
 */
function fitRoad(map, points) {
  const lngs = points.map((point) => point.lng);
  const lats = points.map((point) => point.lat);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  if (west === east && south === north) {
    map.jumpTo({ center: [west, south], zoom: 9 });
    return;
  }
  map.fitBounds(
    [
      [west, south],
      [east, north],
    ],
    { padding: 28, duration: 0, maxZoom: 9 },
  );
}

/**
 * Route line and numbered pins. Loaded only after the panel has two or more points.
 * @param {{ points: { stopIndex: number, lng: number, lat: number, label?: string }[] }} props
 */
export default function FestivalRoadMap({ points }) {
  const [ready, setReady] = useState(false);
  const line = useMemo(() => lineFeature(points), [points]);
  const viewKey = points.map((point) => `${point.stopIndex}:${point.lng}:${point.lat}`).join('|');

  if (!MAPBOX_TOKEN || points.length < 2) return null;

  return (
    <div
      className="gateo-mapbox-map h-full w-full"
      data-festival-road-map-ready={ready ? '1' : '0'}
    >
      <Map
        key={viewKey}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: points[0].lng,
          latitude: points[0].lat,
          zoom: 7,
        }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        logoPosition="bottom-left"
        reuseMaps={false}
        preserveDrawingBuffer
        canvasContextAttributes={{ preserveDrawingBuffer: true }}
        scrollZoom={false}
        dragPan={false}
        dragRotate={false}
        touchZoomRotate={false}
        doubleClickZoom={false}
        keyboard={false}
        onLoad={(event) => {
          fitRoad(event.target, points);
          setReady(true);
        }}
      >
        <LanguageControl />
        <Source id={LINE_SOURCE} type="geojson" data={line}>
          <Layer
            id="festival-road-line-layer"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': '#b45309', 'line-width': 3 }}
          />
        </Source>
        {points.map((point) => (
          <Marker
            key={point.stopIndex}
            longitude={point.lng}
            latitude={point.lat}
            anchor="center"
          >
            <span
              data-festival-road-pin={point.stopIndex}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-[10px] font-extrabold text-white shadow"
              aria-label={point.label || String(point.stopIndex)}
            >
              {point.stopIndex}
            </span>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
