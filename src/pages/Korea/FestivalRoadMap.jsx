import React, { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source, useControl } from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  festivalRoadLineCoordinates,
  festivalRoadLineOrder,
  festivalRoadPinOffsets,
} from './lib/festivalRoad.js';

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
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: festivalRoadLineCoordinates(points),
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
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onIdle();
  };
  const fallback = globalThis.setTimeout(finish, 3200);
  const onReady = () => {
    map.triggerRepaint();
    map.once('idle', () => {
      globalThis.clearTimeout(fallback);
      requestAnimationFrame(() => requestAnimationFrame(finish));
    });
  };
  if (map.isStyleLoaded()) onReady();
  else map.once('load', onReady);
}

function PinMarker({ point }) {
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
      aria-label={point.label || String(point.stopIndex)}
    >
      {point.stopIndex}
    </span>
  );
}

/**
 * Route line and numbered pins. Loaded only after the panel has two or more points.
 * @param {{ points: { stopIndex: number, lng: number, lat: number, label?: string, kind?: string }[], routeKey?: number | string }} props
 */
export default function FestivalRoadMap({ points, routeKey = 0 }) {
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [tilesIdle, setTilesIdle] = useState(false);
  const pointsKey = useMemo(
    () => points.map((p) => `${p.stopIndex}:${p.kind}:${p.lng}:${p.lat}`).join('|'),
    [points],
  );
  const syncKey = `${routeKey}|${pointsKey}`;
  const line = useMemo(() => lineFeature(points), [pointsKey, points]);
  const pinOffsets = useMemo(() => festivalRoadPinOffsets(points), [pointsKey, points]);
  const initial = festivalRoadLineOrder(points)[0];

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || points.length < 2) return;
    setTilesIdle(false);
    const source = map.getSource(LINE_SOURCE);
    if (source && typeof source.setData === 'function') {
      source.setData(line);
    }
    if (typeof map.stop === 'function') map.stop();
    map.resize();
    fitRoad(map, points);
    whenMapTilesIdle(map, () => setTilesIdle(true));
  }, [syncKey, line, ready, points]);

  if (!MAPBOX_TOKEN || points.length < 2 || !initial) return null;

  return (
    <div
      className="gateo-mapbox-map relative isolate h-full w-full overflow-hidden bg-stone-200 [contain:paint]"
      data-festival-road-map-ready={ready ? '1' : '0'}
      data-festival-road-map-tiles-idle={tilesIdle ? '1' : '0'}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: initial.lng,
          latitude: initial.lat,
          zoom: 7,
        }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        logoPosition="bottom-left"
        reuseMaps
        antialias
        scrollZoom={false}
        dragPan={false}
        dragRotate={false}
        touchZoomRotate={false}
        doubleClickZoom={false}
        keyboard={false}
        onLoad={(event) => {
          mapRef.current = event.target;
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
              offset={[offset.x, offset.y]}
              style={{
                zIndex: 120 - point.stopIndex,
              }}
            >
              <PinMarker point={point} />
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
