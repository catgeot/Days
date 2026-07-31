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
const HINT_FILL = 'gateo-geo-puzzle-hint-fill';
const HINT_LINE = 'gateo-geo-puzzle-hint-line';

export const GEO_PUZZLE_HIT_LAYER = HIT_FILL;

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

function worldviewFilter() {
  return [
    'any',
    ['!', ['has', 'worldview']],
    ['==', ['get', 'worldview'], 'all'],
    ['in', 'US', ['to-string', ['get', 'worldview']]],
    ['in', 'us', ['to-string', ['get', 'worldview']]],
  ];
}

/** 홈 나라 하이라이트와 동일 패턴 — match/upcase 대신 == (글로브에서 안정) */
function multiIsoFilter(isos) {
  const list = [...new Set((isos || []).map((s) => String(s).toUpperCase()).filter(Boolean))];
  if (!list.length) {
    return ['==', ['get', 'iso_3166_1'], '__none__'];
  }
  const isoAny = [
    'any',
    ...list.flatMap((up) => [
      ['==', ['get', 'iso_3166_1'], up],
      ['==', ['get', 'iso_3166_1'], up.toLowerCase()],
    ]),
  ];
  return [
    'all',
    worldviewFilter(),
    isoAny,
  ];
}

const PUZZLE_LAYER_IDS = [
  HIT_FILL,
  SLOT_FILL,
  SLOT_LINE,
  PLACED_FILL,
  PLACED_LINE,
  HINT_FILL,
  HINT_LINE,
];

function raisePuzzleLayers(map) {
  for (const id of PUZZLE_LAYER_IDS) {
    if (!map.getLayer(id)) continue;
    try {
      map.moveLayer(id);
    } catch {
      /* ignore */
    }
  }
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
        'fill-emissive-strength': 1,
      },
      filter: worldviewFilter(),
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
        'fill-opacity': 0.14,
        'fill-emissive-strength': 1,
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
        'line-opacity': 0.45,
        'line-emissive-strength': 1,
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
        'fill-opacity': 0.62,
        'fill-emissive-strength': 1,
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
        'line-width': 1.8,
        'line-opacity': 0.95,
        'line-emissive-strength': 1,
      },
      filter: multiIsoFilter([]),
    });
  }
  if (!map.getLayer(HINT_FILL)) {
    map.addLayer({
      id: HINT_FILL,
      type: 'fill',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'fill-color': '#fbbf24',
        'fill-opacity': 0.45,
        'fill-emissive-strength': 1,
      },
      filter: multiIsoFilter([]),
    });
  }
  if (!map.getLayer(HINT_LINE)) {
    map.addLayer({
      id: HINT_LINE,
      type: 'line',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'line-color': '#fde68a',
        'line-width': 2.2,
        'line-opacity': 0.95,
        'line-emissive-strength': 1,
      },
      filter: multiIsoFilter([]),
    });
  }
  raisePuzzleLayers(map);
}

/**
 * #31 전용 게임 글로브 — 지명·국경 라벨 숨김 · 슬롯 아웃라인 · 힌트 하이라이트.
 */
export default function GeoPuzzleGlobe({
  filledIds = [],
  slotIds = [],
  hintCountryId = null,
  findActive = false,
  onMapReady,
  onMapClick,
}) {
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const filledRef = useRef(filledIds);
  const slotRef = useRef(slotIds);
  const hintRef = useRef(hintCountryId);
  filledRef.current = filledIds;
  slotRef.current = slotIds;
  hintRef.current = hintCountryId;

  const syncFills = useCallback((map) => {
    if (!map) return;
    ensurePlacedLayers(map);
    const filled = filledRef.current || [];
    const slots = slotRef.current || [];
    const filledIsos = filled
      .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
      .filter(Boolean);
    const filledSet = new Set(filled);
    const slotIsos = slots
      .filter((id) => !filledSet.has(id))
      .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
      .filter(Boolean);
    // 이미 채운 나라는 PLACED(cyan)만 — 힌트 금색이 덮지 않음
    const hintId = hintRef.current;
    const hintIso = hintId && !filledSet.has(hintId)
      ? GLOBE_COUNTRY_CATALOG[hintId]?.iso
      : null;
    try {
      map.setPaintProperty(PLACED_FILL, 'fill-emissive-strength', 1);
      map.setPaintProperty(PLACED_FILL, 'fill-opacity', 0.62);
      map.setPaintProperty(PLACED_FILL, 'fill-color', '#22d3ee');
      map.setPaintProperty(HINT_FILL, 'fill-emissive-strength', 1);
      map.setPaintProperty(HINT_FILL, 'fill-opacity', 0.45);
      map.setPaintProperty(SLOT_FILL, 'fill-emissive-strength', 1);
      map.setPaintProperty(SLOT_LINE, 'line-emissive-strength', 1);
      map.setPaintProperty(PLACED_LINE, 'line-emissive-strength', 1);
      map.setPaintProperty(HINT_LINE, 'line-emissive-strength', 1);
      map.setFilter(PLACED_FILL, multiIsoFilter(filledIsos));
      map.setFilter(PLACED_LINE, multiIsoFilter(filledIsos));
      map.setFilter(SLOT_FILL, multiIsoFilter(slotIsos));
      map.setFilter(SLOT_LINE, multiIsoFilter(slotIsos));
      map.setFilter(HINT_FILL, multiIsoFilter(hintIso ? [hintIso] : []));
      map.setFilter(HINT_LINE, multiIsoFilter(hintIso ? [hintIso] : []));
      raisePuzzleLayers(map);
    } catch {
      /* ignore */
    }
  }, []);

  const flyToCountry = useCallback((countryId) => {
    const map = mapRef.current?.getMap?.();
    const c = GLOBE_COUNTRY_CATALOG[countryId];
    if (!map || !c) return;
    const bbox = c.bbox;
    try {
      if (Array.isArray(bbox) && bbox.length === 4) {
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ],
          { padding: 64, maxZoom: 5.8, duration: 1200, pitch: 0, bearing: 0 },
        );
        return;
      }
      map.flyTo({
        center: [c.lng, c.lat],
        zoom: c.zoom || 4,
        duration: 1200,
        essential: true,
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !readyRef.current) return;
    syncFills(map);
  }, [filledIds, slotIds, hintCountryId, syncFills]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    readyRef.current = true;
    forceHideLabelsAndBorders(map);
    ensurePlacedLayers(map);
    syncFills(map);
    onMapReady?.({
      map,
      flyToCountry,
      queryIsoAtPoint: (point) => {
        try {
          const features = map.queryRenderedFeatures(point, { layers: [HIT_FILL] });
          const props = features?.[0]?.properties || {};
          const raw = props.iso_3166_1 || '';
          const iso = String(raw).toUpperCase().slice(0, 2);
          return /^[A-Z]{2}$/.test(iso) ? iso : '';
        } catch {
          return '';
        }
      },
    });

    map.on('style.load', () => {
      forceHideLabelsAndBorders(map);
      ensurePlacedLayers(map);
      syncFills(map);
    });
  }, [flyToCountry, onMapReady, syncFills]);

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
    <div className={`relative h-full w-full gateo-mapbox-map ${findActive ? 'cursor-crosshair' : ''}`}>
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
        dragPan
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
