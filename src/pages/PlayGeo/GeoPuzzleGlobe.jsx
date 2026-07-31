import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map from 'react-map-gl/mapbox';
import { GLOBE_COUNTRY_CATALOG } from '../Home/lib/globeCountryCatalog.js';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../data/mapboxAttribution.js';
import { useCoarsePointer } from '../../shared/hooks/useMobileInputViewport.js';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
const COUNTRIES_SOURCE = 'gateo-geo-puzzle-countries';
const HIT_FILL = 'gateo-geo-puzzle-hit-fill';
const PLACED_FILL = 'gateo-geo-puzzle-placed-fill';
const PLACED_LINE = 'gateo-geo-puzzle-placed-line';
const PLACED_EXTRUSION = 'gateo-geo-puzzle-placed-extrusion';
const SLOT_LINE = 'gateo-geo-puzzle-slot-line';
const SLOT_FILL = 'gateo-geo-puzzle-slot-fill';
const HINT_FILL = 'gateo-geo-puzzle-hint-fill';
const HINT_LINE = 'gateo-geo-puzzle-hint-line';

export const GEO_PUZZLE_HIT_LAYER = HIT_FILL;

/** 정답 채움 — 위성 위에서 구분되는 진 보라 */
const PLACED_FILL_COLOR = '#5b21b6';
const PLACED_FILL_OPACITY = 0.78;

const DEFAULT_VIEW = {
  longitude: 140,
  latitude: 20,
  zoom: 1.35,
  pitch: 0,
  bearing: 0,
};

/** iOS Safari 등 모바일 글로브에서 country fill이 안 그려지는 경우가 많아 평면 투영 사용 */
function usePreferFlatMap() {
  const coarse = useCoarsePointer();
  const [narrow, setNarrow] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(max-width: 1023px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return Boolean(coarse || narrow);
}

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

/** 초기 MVP(ef6be28)와 동일한 ISO 필터 — 그때 필이 동작했음 */
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

function safeSetFilter(map, layerId, filter) {
  if (!map.getLayer(layerId)) return;
  try {
    map.setFilter(layerId, filter);
  } catch {
    /* ignore */
  }
}

function safeSetPaint(map, layerId, prop, value) {
  if (!map.getLayer(layerId)) return;
  try {
    map.setPaintProperty(layerId, prop, value);
  } catch {
    /* ignore */
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
        'fill-opacity': 0.1,
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
        'line-opacity': 0.4,
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
        'fill-opacity': 0.72,
        'fill-emissive-strength': 1,
      },
      filter: multiIsoFilter([]),
    });
  }
  // 데스크톱 글로브 보조 — 모바일(mercator)에서는 fill만으로 충분
  if (!map.getLayer(PLACED_EXTRUSION)) {
    try {
      map.addLayer({
        id: PLACED_EXTRUSION,
        type: 'fill-extrusion',
        source: COUNTRIES_SOURCE,
        'source-layer': 'country_boundaries',
        paint: {
          'fill-extrusion-color': '#22d3ee',
          'fill-extrusion-opacity': 0.7,
          'fill-extrusion-height': 80000,
          'fill-extrusion-base': 0,
          'fill-extrusion-emissive-strength': 1,
        },
        filter: multiIsoFilter([]),
      });
    } catch {
      /* older GL without extrusion emissive — retry without */
      try {
        map.addLayer({
          id: PLACED_EXTRUSION,
          type: 'fill-extrusion',
          source: COUNTRIES_SOURCE,
          'source-layer': 'country_boundaries',
          paint: {
            'fill-extrusion-color': '#22d3ee',
            'fill-extrusion-opacity': 0.7,
            'fill-extrusion-height': 80000,
            'fill-extrusion-base': 0,
          },
          filter: multiIsoFilter([]),
        });
      } catch {
        /* ignore */
      }
    }
  }
  if (!map.getLayer(PLACED_LINE)) {
    map.addLayer({
      id: PLACED_LINE,
      type: 'line',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'line-color': '#fbbf24',
        'line-width': 2,
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
        'fill-opacity': 0.4,
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
}

/**
 * #31 전용 게임 글로브 — 초기 MVP filledIds→setFilter.
 * 모바일은 mercator(필 안정) · 데스크톱은 globe.
 */
export default function GeoPuzzleGlobe({
  filledIds = [],
  slotIds = [],
  hintCountryId = null,
  findActive = false,
  onMapReady,
  onMapClick,
}) {
  const preferFlat = usePreferFlatMap();
  const projection = preferFlat ? 'mercator' : 'globe';
  const initialView = useMemo(
    () => (preferFlat ? { ...DEFAULT_VIEW, zoom: 1.55 } : DEFAULT_VIEW),
    [preferFlat],
  );
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
    const hintId = hintRef.current;
    const filledIsos = filled
      .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
      .filter(Boolean);
    const filledSet = new Set(filled);
    const slotIsos = slots
      .filter((id) => !filledSet.has(id))
      .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
      .filter(Boolean);
    const hintIso = hintId && !filledSet.has(hintId)
      ? GLOBE_COUNTRY_CATALOG[hintId]?.iso
      : null;

    // setFilter는 paint와 분리 — paint 실패가 필 동기화를 막지 않게 (초기 MVP 경로)
    const placedFilter = multiIsoFilter(filledIsos);
    safeSetFilter(map, PLACED_FILL, placedFilter);
    safeSetFilter(map, PLACED_EXTRUSION, placedFilter);
    safeSetFilter(map, PLACED_LINE, placedFilter);
    safeSetFilter(map, SLOT_FILL, multiIsoFilter(slotIsos));
    safeSetFilter(map, SLOT_LINE, multiIsoFilter(slotIsos));
    safeSetFilter(map, HINT_FILL, multiIsoFilter(hintIso ? [hintIso] : []));
    safeSetFilter(map, HINT_LINE, multiIsoFilter(hintIso ? [hintIso] : []));

    safeSetPaint(map, PLACED_FILL, 'fill-emissive-strength', 1);
    safeSetPaint(map, PLACED_FILL, 'fill-opacity', 0.72);
    safeSetPaint(map, PLACED_FILL, 'fill-color', '#22d3ee');
    // 모바일 mercator에서는 extrusion 숨김(필만) · 데스크톱 글로브만 보조
    if (map.getLayer(PLACED_EXTRUSION)) {
      try {
        const isGlobe = map.getProjection?.()?.name === 'globe';
        map.setLayoutProperty(
          PLACED_EXTRUSION,
          'visibility',
          isGlobe ? 'visible' : 'none',
        );
      } catch {
        /* ignore */
      }
    }
    safeSetPaint(map, PLACED_EXTRUSION, 'fill-extrusion-emissive-strength', 1);
    safeSetPaint(map, PLACED_EXTRUSION, 'fill-extrusion-opacity', 0.7);
    safeSetPaint(map, HINT_FILL, 'fill-emissive-strength', 1);
    safeSetPaint(map, SLOT_FILL, 'fill-emissive-strength', 1);
    safeSetPaint(map, PLACED_LINE, 'line-emissive-strength', 1);
    safeSetPaint(map, HINT_LINE, 'line-emissive-strength', 1);
    safeSetPaint(map, SLOT_LINE, 'line-emissive-strength', 1);

    for (const id of [
      HIT_FILL,
      SLOT_FILL,
      SLOT_LINE,
      PLACED_FILL,
      PLACED_EXTRUSION,
      PLACED_LINE,
      HINT_FILL,
      HINT_LINE,
    ]) {
      if (!map.getLayer(id)) continue;
      try {
        map.moveLayer(id);
      } catch {
        /* ignore */
      }
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

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !readyRef.current || !map.setProjection) return;
    try {
      map.setProjection(projection);
      syncFills(map);
    } catch {
      /* ignore */
    }
  }, [projection, syncFills]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    readyRef.current = true;
    try {
      map.setProjection?.(projection);
    } catch {
      /* ignore */
    }
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

    // country-boundaries 타일 도착 후 필터 재적용 (Preview·저속망)
    map.on('sourcedata', (evt) => {
      if (evt?.sourceId !== COUNTRIES_SOURCE || !evt?.isSourceLoaded) return;
      syncFills(map);
    });
  }, [flyToCountry, onMapReady, projection, syncFills]);

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
        projection={projection}
        initialViewState={initialView}
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
