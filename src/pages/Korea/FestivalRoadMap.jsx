import React, { useMemo, useState } from 'react';
import Map, { Layer, Marker, Source, useControl } from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';
import { festivalRoadLineOrder, festivalRoadPinOffsets } from './lib/festivalRoad.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const LINE_SOURCE = 'festival-road-line';

function LanguageControl() {
  useControl(() => new MapboxLanguage({ defaultLanguage: 'ko' }));
  return null;
}

/**
 * @param {{ stopIndex: number, lng: number, lat: number, label?: string, kind?: string }[]} points
 */
function lineFeature(points) {
  const ordered = festivalRoadLineOrder(points);
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: ordered.map((point) => [point.lng, point.lat]),
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
    {
      padding: { top: 32, bottom: 56, left: 32, right: 80 },
      duration: 0,
      maxZoom: 9,
    },
  );
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {() => void} onIdle
 */
function whenMapTilesIdle(map, onIdle) {
  let idleCount = 0;
  const finish = () => {
    idleCount += 1;
    if (idleCount < 2) {
      map.triggerRepaint();
      map.once('idle', finish);
      return;
    }
    onIdle();
  };
  map.once('idle', finish);
}

function PinMarker({ point, offset }) {
  const isStop = point.kind === 'stop' || point.kind === 'hub';
  const isSight = point.kind === 'sight';
  const baseClass = isStop
    ? 'flex h-5 w-5 items-center justify-center rounded-md border-2 border-stone-600 bg-stone-100 text-[10px] font-extrabold text-stone-800 shadow'
    : isSight
      ? 'flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-700 bg-white text-[10px] font-extrabold text-amber-800 shadow'
      : 'flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-[10px] font-extrabold text-white shadow';
  return (
    <span
      data-festival-road-pin={point.stopIndex}
      data-festival-road-pin-kind={point.kind || 'festival'}
      className={baseClass}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
      aria-label={point.label || String(point.stopIndex)}
    >
      {point.stopIndex}
    </span>
  );
}

/**
 * Route line and numbered pins. Loaded only after the panel has two or more points.
 * @param {{ points: { stopIndex: number, lng: number, lat: number, label?: string, kind?: string }[] }} props
 */
export default function FestivalRoadMap({ points }) {
  const [ready, setReady] = useState(false);
  const [tilesIdle, setTilesIdle] = useState(false);
  const line = useMemo(() => lineFeature(points), [points]);
  const pinOffsets = useMemo(() => festivalRoadPinOffsets(points), [points]);
  const viewKey = points.map((point) => `${point.stopIndex}:${point.kind}:${point.lng}:${point.lat}`).join('|');

  if (!MAPBOX_TOKEN || points.length < 2) return null;

  return (
    <div
      className="gateo-mapbox-map h-full w-full bg-stone-200"
      data-festival-road-map-ready={ready ? '1' : '0'}
      data-festival-road-map-tiles-idle={tilesIdle ? '1' : '0'}
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
        antialias
        scrollZoom={false}
        dragPan={false}
        dragRotate={false}
        touchZoomRotate={false}
        doubleClickZoom={false}
        keyboard={false}
        onLoad={(event) => {
          const map = event.target;
          fitRoad(map, points);
          whenMapTilesIdle(map, () => setTilesIdle(true));
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
        {festivalRoadLineOrder(points).map((point) => {
          const offset = pinOffsets.get(point.stopIndex) || { x: 0, y: 0 };
          return (
            <Marker
              key={`${point.stopIndex}-${point.kind}`}
              longitude={point.lng}
              latitude={point.lat}
              anchor="center"
              style={{
                zIndex: 120 - point.stopIndex,
              }}
            >
              <PinMarker point={point} offset={offset} />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
