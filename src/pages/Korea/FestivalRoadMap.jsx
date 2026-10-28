import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, Source, useControl } from 'react-map-gl/mapbox';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  FESTIVAL_ROAD_PIN_MIN_GAP_PX,
  festivalRoadEmptyLineGeoJson,
  festivalRoadLineGeoJson,
  festivalRoadLineOrder,
  festivalRoadMarkerOffsetsFromProjections,
  festivalRoadPinLeaderGeoJson,
  festivalRoadPinOffsets,
} from './lib/festivalRoad.js';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
const LINE_SOURCE = 'festival-road-line';
const LEADER_SOURCE = 'festival-road-pin-leaders';
const EMPTY_LINE = festivalRoadEmptyLineGeoJson();
const EMPTY_LEADERS = { type: 'FeatureCollection', features: [] };

function LanguageControl() {
  useControl(() => new MapboxLanguage({ defaultLanguage: 'ko' }));
  return null;
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
 * @param {{ lng: number, lat: number, stopIndex: number }[]} points
 */
function projectPinOffsets(map, points) {
  const ordered = festivalRoadLineOrder(points);
  const projections = ordered.map((point) => {
    const pixel = map.project([point.lng, point.lat]);
    return { stopIndex: point.stopIndex, x: pixel.x, y: pixel.y };
  });
  return festivalRoadMarkerOffsetsFromProjections(projections, FESTIVAL_ROAD_PIN_MIN_GAP_PX);
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {{ lng: number, lat: number, stopIndex: number }[]} points
 * @param {Map<number, { x: number, y: number }>} offsets
 */
function leaderDataFor(map, points, offsets) {
  return festivalRoadPinLeaderGeoJson(
    points,
    offsets,
    (lng, lat) => map.project([lng, lat]),
    (x, y) => map.unproject([x, y]),
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
  const fallback = globalThis.setTimeout(finish, 4500);
  const onReady = () => {
    map.triggerRepaint();
    map.once('idle', () => {
      map.once('idle', () => {
        globalThis.clearTimeout(fallback);
        requestAnimationFrame(() => requestAnimationFrame(finish));
      });
    });
  };
  if (map.isStyleLoaded()) onReady();
  else map.once('load', onReady);
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {() => void} run
 */
function afterLayout(map, run) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      map.resize();
      run();
    });
  });
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {() => void} run
 */
function afterContainerResize(map, run) {
  afterLayout(map, () => {
    if (typeof map.triggerRepaint === 'function') map.triggerRepaint();
    run();
  });
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
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const [ready, setReady] = useState(false);
  const [tilesIdle, setTilesIdle] = useState(false);
  const [pinOffsets, setPinOffsets] = useState(() => festivalRoadPinOffsets(points));
  const [leaderData, setLeaderData] = useState(EMPTY_LEADERS);
  const pointsKey = useMemo(
    () => points.map((p) => `${p.stopIndex}:${p.kind}:${p.lng}:${p.lat}`).join('|'),
    [points],
  );
  const syncKey = `${routeKey}|${pointsKey}`;
  const orderedPoints = useMemo(() => festivalRoadLineOrder(points), [pointsKey, points]);
  const initial = orderedPoints[0];

  const applyPinLayout = useCallback((map) => {
    const currentPoints = pointsRef.current;
    const offsets = projectPinOffsets(map, currentPoints);
    setPinOffsets(offsets);
    const leaders = leaderDataFor(map, currentPoints, offsets);
    setLeaderData(leaders);
    const leaderSource = map.getSource(LEADER_SOURCE);
    if (leaderSource && typeof leaderSource.setData === 'function') {
      leaderSource.setData(leaders);
    }
    const root = containerRef.current;
    if (root && typeof map.getZoom === 'function') {
      root.setAttribute('data-festival-road-map-zoom', String(Number(map.getZoom().toFixed(3))));
    }
    if (root) {
      const canvas = root.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        root.setAttribute(
          'data-festival-road-canvas-sync',
          `${canvas.width}x${canvas.height}:${Math.round(rect.width)}x${Math.round(rect.height)}`,
        );
      }
    }
  }, []);

  const scheduleContainerSync = useCallback(
    (map) => {
      afterContainerResize(map, () => {
        map.resize();
        applyPinLayout(map);
      });
    },
    [applyPinLayout],
  );

  useEffect(() => {
    setPinOffsets(festivalRoadPinOffsets(points));
    setLeaderData(EMPTY_LEADERS);
  }, [pointsKey, points]);

  useEffect(() => {
    const el = containerRef.current;
    const map = mapRef.current;
    if (!el || !map || !ready) return;
    const onCaptureZoom = (event) => {
      const delta = Number(event?.detail?.delta);
      if (!Number.isFinite(delta) || delta === 0) return;
      const next = Math.min(22, Math.max(0, map.getZoom() + delta));
      map.jumpTo({ zoom: next, center: map.getCenter() });
      applyPinLayout(map);
    };
    el.addEventListener('festival-road-capture-zoom', onCaptureZoom);
    const onZoomEnd = () => applyPinLayout(map);
    const onMapResize = () => applyPinLayout(map);
    const onContainerResize = () => scheduleContainerSync(map);
    map.on('zoomend', onZoomEnd);
    map.on('resize', onMapResize);
    const slotEl = el.closest('[data-festival-road-map]');
    const clipEl = el.querySelector('[data-festival-road-map-clip]');
    const ro = new ResizeObserver(onContainerResize);
    ro.observe(el);
    if (slotEl instanceof HTMLElement && slotEl !== el) ro.observe(slotEl);
    if (clipEl instanceof HTMLElement) ro.observe(clipEl);
    const scrollRoot = el.closest('[role="dialog"]');
    let scrollTimer = 0;
    const onScroll = () => {
      globalThis.clearTimeout(scrollTimer);
      scrollTimer = globalThis.setTimeout(() => scheduleContainerSync(map), 100);
    };
    scrollRoot?.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.05)) {
          scheduleContainerSync(map);
        }
      },
      { threshold: [0, 0.1, 0.5, 1] },
    );
    io.observe(el);
    return () => {
      el.removeEventListener('festival-road-capture-zoom', onCaptureZoom);
      map.off('zoomend', onZoomEnd);
      map.off('resize', onMapResize);
      scrollRoot?.removeEventListener('scroll', onScroll);
      globalThis.clearTimeout(scrollTimer);
      io.disconnect();
      ro.disconnect();
    };
  }, [ready, applyPinLayout, scheduleContainerSync]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || points.length < 2) return;
    const root = containerRef.current;
    if (root) root.setAttribute('data-festival-road-line-ready', '0');
    setTilesIdle(false);
    afterLayout(map, () => {
      const source = map.getSource(LINE_SOURCE);
      const line = festivalRoadLineGeoJson(points);
      if (source && typeof source.setData === 'function') {
        source.setData(EMPTY_LINE);
        source.setData(line);
      }
      if (typeof map.stop === 'function') map.stop();
      map.resize();
      fitRoad(map, points);
      applyPinLayout(map);
      whenMapTilesIdle(map, () => {
        afterContainerResize(map, () => {
          map.resize();
          applyPinLayout(map);
          if (root) root.setAttribute('data-festival-road-line-ready', '1');
          setTilesIdle(true);
        });
      });
    });
  }, [syncKey, ready, points, applyPinLayout]);

  if (!MAPBOX_TOKEN || points.length < 2 || !initial) return null;

  return (
    <div
      ref={containerRef}
      className="gateo-mapbox-map relative h-full w-full bg-stone-200"
      data-festival-road-map-ready={ready ? '1' : '0'}
      data-festival-road-map-tiles-idle={tilesIdle ? '1' : '0'}
    >
      <div
        className="h-full w-full overflow-hidden rounded-2xl [transform:translateZ(0)] [backface-visibility:hidden]"
        data-festival-road-map-clip=""
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
          reuseMaps={false}
          scrollZoom={false}
          dragPan={false}
          dragRotate={false}
          touchZoomRotate={false}
          doubleClickZoom={false}
          keyboard={false}
          onLoad={(event) => {
            const map = event.target;
            mapRef.current = map;
            afterLayout(map, () => setReady(true));
          }}
        >
          <LanguageControl />
          <Source id={LINE_SOURCE} type="geojson" data={EMPTY_LINE}>
            <Layer
              id="festival-road-line-layer"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#b45309',
                'line-width': 3,
                'line-opacity': tilesIdle ? 1 : 0,
              }}
            />
          </Source>
          <Source id={LEADER_SOURCE} type="geojson" data={leaderData}>
            <Layer
              id="festival-road-pin-leader-layer"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#78350f',
                'line-width': 2,
                'line-opacity': tilesIdle ? 1 : 0,
                'line-dasharray': [1.2, 1.2],
              }}
            />
          </Source>
          {orderedPoints.map((point) => {
            const offset = pinOffsets.get(point.stopIndex) || { x: 0, y: 0 };
            return (
              <Marker
                key={`${point.stopIndex}-${point.kind}`}
                longitude={point.lng}
                latitude={point.lat}
                anchor="center"
                offset={[offset.x, offset.y]}
                style={{
                  zIndex: 100 + point.stopIndex,
                }}
              >
                <PinMarker point={point} />
              </Marker>
            );
          })}
        </Map>
      </div>
    </div>
  );
}
