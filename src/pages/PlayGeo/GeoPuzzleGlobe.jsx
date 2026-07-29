import React, { useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl/mapbox';
import { GLOBE_COUNTRY_CATALOG } from '../Home/lib/globeCountryCatalog.js';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../data/mapboxAttribution.js';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
const COUNTRIES_SOURCE = 'gateo-geo-puzzle-countries';
const HIT_FILL = 'gateo-geo-puzzle-hit-fill';
const PLACED_FILL = 'gateo-geo-puzzle-placed-fill';
const PLACED_LINE = 'gateo-geo-puzzle-placed-line';
const SLOT_LINE = 'gateo-geo-puzzle-slot-line';
const SLOT_FILL = 'gateo-geo-puzzle-slot-fill';

const DEFAULT_VIEW = {
  longitude: 140,
  latitude: 20,
  zoom: 1.35,
  pitch: 0,
  bearing: 0,
};

const CAPTION_LINKS = MAPBOX_ATTRIBUTION_LINKS.filter(
  (item) => item.label === '© Mapbox' || item.label === '© OpenStreetMap',
);

function forceHideLabelsAndBorders(map) {
  if (!map?.getStyle) return;
  let layers;
  try {
    layers = map.getStyle().layers || [];
  } catch {
    return;
  }
  for (const layer of layers) {
    const id = layer.id || '';
    if (id.startsWith('gateo-geo-puzzle')) continue;
    const sourceLayer = layer['source-layer'] || '';
    const isSymbol = layer.type === 'symbol';
    const isAdmin = /admin|boundary|border|disputed/i.test(`${id} ${sourceLayer}`);
    if (isSymbol || isAdmin) {
      try {
        map.setLayoutProperty(id, 'visibility', 'none');
      } catch {
        /* ignore */
      }
    }
  }
}

function ensureCountriesSource(map) {
  if (map.getSource(COUNTRIES_SOURCE)) return;
  map.addSource(COUNTRIES_SOURCE, {
    type: 'vector',
    url: 'mapbox://mapbox.country-boundaries-v1',
  });
}

function multiIsoFilter(isos) {
  const list = [...new Set((isos || []).map((s) => String(s).toUpperCase()).filter(Boolean))];
  if (!list.length) {
    return ['==', ['get', 'iso_3166_1'], '__none__'];
  }
  return [
    'all',
    [
      'any',
      ['!', ['has', 'worldview']],
      ['==', ['get', 'worldview'], 'all'],
      ['in', 'US', ['to-string', ['get', 'worldview']]],
    ],
    [
      'match',
      ['upcase', ['to-string', ['get', 'iso_3166_1']]],
      list,
      true,
      false,
    ],
  ];
}

function ensurePlacedLayers(map) {
  ensureCountriesSource(map);
  if (!map.getLayer(HIT_FILL)) {
    map.addLayer({
      id: HIT_FILL,
      type: 'fill',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'fill-color': '#000000',
        'fill-opacity': 0.01,
      },
      filter: [
        'any',
        ['!', ['has', 'worldview']],
        ['==', ['get', 'worldview'], 'all'],
        ['in', 'US', ['to-string', ['get', 'worldview']]],
      ],
    });
  }
  if (!map.getLayer(SLOT_FILL)) {
    map.addLayer({
      id: SLOT_FILL,
      type: 'fill',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': 0.06,
      },
      filter: multiIsoFilter([]),
    });
  }
  if (!map.getLayer(SLOT_LINE)) {
    map.addLayer({
      id: SLOT_LINE,
      type: 'line',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'line-color': '#ffffff',
        'line-width': 1.1,
        'line-opacity': 0.35,
      },
      filter: multiIsoFilter([]),
    });
  }
  if (!map.getLayer(PLACED_FILL)) {
    map.addLayer({
      id: PLACED_FILL,
      type: 'fill',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'fill-color': '#22d3ee',
        'fill-opacity': 0.48,
      },
      filter: multiIsoFilter([]),
    });
  }
  if (!map.getLayer(PLACED_LINE)) {
    map.addLayer({
      id: PLACED_LINE,
      type: 'line',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'line-color': '#fbbf24',
        'line-width': 1.5,
        'line-opacity': 0.95,
      },
      filter: multiIsoFilter([]),
    });
  }
}

/**
 * @param {{
 *   filledIds: string[],
 *   slotIds?: string[],
 *   dragPan?: boolean,
 *   placeMode?: boolean,
 *   onMapReady?: (map: import('mapbox-gl').Map) => void,
 *   onMapClick?: (args: {
 *     clientX: number,
 *     clientY: number,
 *     point: { x: number, y: number },
 *     lngLat: { lng: number, lat: number },
 *   }) => void,
 * }} props
 */
export default function GeoPuzzleGlobe({
  filledIds = [],
  slotIds = [],
  dragPan = true,
  placeMode = false,
  onMapReady,
  onMapClick,
}) {
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const syncFills = useCallback((map, filled, slots) => {
    if (!map) return;
    ensurePlacedLayers(map);
    const filledIsos = (filled || [])
      .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
      .filter(Boolean);
    const filledSet = new Set(filled || []);
    const slotIsos = (slots || [])
      .filter((id) => !filledSet.has(id))
      .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
      .filter(Boolean);
    try {
      map.setFilter(PLACED_FILL, multiIsoFilter(filledIsos));
      map.setFilter(PLACED_LINE, multiIsoFilter(filledIsos));
      map.setFilter(SLOT_FILL, multiIsoFilter(slotIsos));
      map.setFilter(SLOT_LINE, multiIsoFilter(slotIsos));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !readyRef.current) return;
    syncFills(map, filledIds, slotIds);
  }, [filledIds, slotIds, syncFills]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    readyRef.current = true;
    forceHideLabelsAndBorders(map);
    ensurePlacedLayers(map);
    syncFills(map, filledIds, slotIds);
    onMapReady?.(map);

    map.on('style.load', () => {
      forceHideLabelsAndBorders(map);
      ensurePlacedLayers(map);
      syncFills(map, filledIds, slotIds);
    });
  }, [filledIds, onMapReady, slotIds, syncFills]);

  const handleClick = useCallback((evt) => {
    const handler = onMapClickRef.current;
    if (!handler) return;
    const oe = evt?.originalEvent;
    const point = evt?.point;
    const lngLat = evt?.lngLat;
    if (!point || !lngLat) return;
    handler({
      clientX: oe?.clientX ?? 0,
      clientY: oe?.clientY ?? 0,
      point: { x: point.x, y: point.y },
      lngLat: { lng: lngLat.lng, lat: lngLat.lat },
    });
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-sm text-white/70">
        Mapbox 토큰이 없습니다.
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full gateo-mapbox-map ${placeMode ? 'cursor-crosshair' : ''}`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        projection="globe"
        initialViewState={DEFAULT_VIEW}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        onLoad={handleLoad}
        onClick={handleClick}
        dragRotate={false}
        pitchWithRotate={false}
        dragPan={dragPan}
        scrollZoom
      />
      <div className="pointer-events-none absolute bottom-1 left-1 z-10 flex gap-2 text-[9px] text-white/60">
        {CAPTION_LINKS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto underline-offset-2 hover:underline"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export { DEFAULT_VIEW as GEO_PUZZLE_DEFAULT_VIEW };
