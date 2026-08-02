import React, { useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl/mapbox';
import { GLOBE_COUNTRY_CATALOG } from '../Home/lib/globeCountryCatalog.js';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../data/mapboxAttribution.js';
import { getGeoPuzzleCountryPolygon } from './data/geoPuzzleCountryPolygons.js';
import { dissolvePlacedOutline } from './lib/dissolvePlacedOutline.js';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
const COUNTRIES_SOURCE = 'gateo-geo-puzzle-countries';
const PLACED_GEOJSON_SOURCE = 'gateo-geo-puzzle-placed-geojson';
const PLACED_OUTLINE_SOURCE = 'gateo-geo-puzzle-placed-outline';
const HIT_FILL = 'gateo-geo-puzzle-hit-fill';
const PLACED_FILL = 'gateo-geo-puzzle-placed-fill';
const PLACED_LINE = 'gateo-geo-puzzle-placed-line';
const PLACED_GEO_FILL = 'gateo-geo-puzzle-placed-geo-fill';
const PLACED_GEO_LINE = 'gateo-geo-puzzle-placed-geo-line';
const SLOT_LINE = 'gateo-geo-puzzle-slot-line';
const SLOT_FILL = 'gateo-geo-puzzle-slot-fill';
const HINT_FILL = 'gateo-geo-puzzle-hint-fill';
const HINT_LINE = 'gateo-geo-puzzle-hint-line';

export const GEO_PUZZLE_HIT_LAYER = HIT_FILL;

/** 정답 채움 — 위성 위에서 구분되는 진 보라 */
const PLACED_FILL_COLOR = '#5b21b6';
const PLACED_FILL_OPACITY = 0.82;

/** 퍼즐은 항상 mercator — globe에서 fill이 위성에 가려지거나 안 그려지는 기기 대응 */
const PUZZLE_PROJECTION = 'mercator';

const DEFAULT_VIEW = {
  longitude: 105,
  latitude: 28,
  zoom: 2.35,
  pitch: 0,
  bearing: 0,
};

/** PC 와이드에서 zoom≈1 mercator가 월드 복제(남미·남극 타일)로 보이는 것 방지 */
const PUZZLE_MIN_ZOOM = 1.45;
const PUZZLE_MAX_ZOOM = 8;

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

function ensurePlacedGeoJsonSource(map) {
  if (!map.getSource(PLACED_GEOJSON_SOURCE)) {
    map.addSource(PLACED_GEOJSON_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getSource(PLACED_OUTLINE_SOURCE)) {
    map.addSource(PLACED_OUTLINE_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
}

/** Mapbox country-boundaries — 홈 하이라이트와 동일(worldview·disputed·ISO) */
function multiIsoFilter(isos) {
  const list = [...new Set((isos || []).map((s) => String(s).toUpperCase()).filter(Boolean))];
  if (!list.length) {
    return ['==', ['get', 'iso_3166_1'], '__none__'];
  }
  const isoAny = [
    'any',
    ...list.flatMap((iso) => {
      const low = iso.toLowerCase();
      return [
        ['==', ['get', 'iso_3166_1'], iso],
        ['==', ['get', 'iso_3166_1'], low],
      ];
    }),
  ];
  // disputed 제외 시 접경 분쟁 띠가 빈 틈으로 보임 → 퍼즐 필에서는 포함
  return [
    'all',
    [
      'any',
      ['!', ['has', 'worldview']],
      ['==', ['get', 'worldview'], 'all'],
      ['in', 'US', ['to-string', ['get', 'worldview']]],
      ['in', 'us', ['to-string', ['get', 'worldview']]],
    ],
    isoAny,
  ];
}

function safeSetFilter(map, layerId, filter) {
  if (!map.getLayer(layerId)) return false;
  try {
    map.setFilter(layerId, filter);
    return true;
  } catch {
    return false;
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

function addFillLayer(map, spec) {
  if (map.getLayer(spec.id)) return true;
  const withEmissive = {
    ...spec,
    paint: { ...spec.paint, 'fill-emissive-strength': 1 },
  };
  try {
    map.addLayer(withEmissive);
    return Boolean(map.getLayer(spec.id));
  } catch {
    try {
      map.addLayer(spec);
      return Boolean(map.getLayer(spec.id));
    } catch {
      return false;
    }
  }
}

function addLineLayer(map, spec) {
  if (map.getLayer(spec.id)) return true;
  const withEmissive = {
    ...spec,
    paint: { ...spec.paint, 'line-emissive-strength': 1 },
  };
  try {
    map.addLayer(withEmissive);
    return Boolean(map.getLayer(spec.id));
  } catch {
    try {
      map.addLayer(spec);
      return Boolean(map.getLayer(spec.id));
    } catch {
      return false;
    }
  }
}

/** 캠페인 SSOT 폴리곤 — bbox 사각형 폴백 금지(박스로 보임) */
function collectPlacedGeoFeatures(filledIds) {
  const features = [];
  for (const id of filledIds || []) {
    const geometry = getGeoPuzzleCountryPolygon(id);
    if (!geometry) continue;
    features.push({
      type: 'Feature',
      properties: { id },
      geometry,
    });
  }
  return features;
}

/** Mapbox 타일이 로드돼 정답 ISO 피처가 있으면 벡터 필 사용 */
function vectorPlacedReady(map, filledIsos) {
  if (!map?.getSource?.(COUNTRIES_SOURCE) || !filledIsos?.length) return false;
  try {
    const queried = map.querySourceFeatures(COUNTRIES_SOURCE, {
      sourceLayer: 'country_boundaries',
      filter: multiIsoFilter(filledIsos),
    });
    return (queried || []).length > 0;
  } catch {
    return false;
  }
}

function ensurePlacedLayers(map) {
  ensureCountriesSource(map);
  ensurePlacedGeoJsonSource(map);

  addFillLayer(map, {
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

  addFillLayer(map, {
    id: SLOT_FILL,
    type: 'fill',
    source: COUNTRIES_SOURCE,
    'source-layer': 'country_boundaries',
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': 0.12,
    },
    filter: multiIsoFilter([]),
  });

  addLineLayer(map, {
    id: SLOT_LINE,
    type: 'line',
    source: COUNTRIES_SOURCE,
    'source-layer': 'country_boundaries',
    paint: {
      'line-color': '#ffffff',
      'line-width': 1.2,
      'line-opacity': 0.45,
    },
    filter: multiIsoFilter([]),
  });

  addFillLayer(map, {
    id: PLACED_FILL,
    type: 'fill',
    source: COUNTRIES_SOURCE,
    'source-layer': 'country_boundaries',
    paint: {
      'fill-color': PLACED_FILL_COLOR,
      'fill-opacity': PLACED_FILL_OPACITY,
    },
    filter: multiIsoFilter([]),
  });

  addLineLayer(map, {
    id: PLACED_LINE,
    type: 'line',
    source: COUNTRIES_SOURCE,
    'source-layer': 'country_boundaries',
    paint: {
      'line-color': '#fbbf24',
      'line-width': 2.2,
      'line-opacity': 0.95,
    },
    filter: multiIsoFilter([]),
  });

  addFillLayer(map, {
    id: PLACED_GEO_FILL,
    type: 'fill',
    source: PLACED_GEOJSON_SOURCE,
    paint: {
      'fill-color': PLACED_FILL_COLOR,
      'fill-opacity': PLACED_FILL_OPACITY,
    },
  });

  addLineLayer(map, {
    id: PLACED_GEO_LINE,
    type: 'line',
    source: PLACED_OUTLINE_SOURCE,
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#fbbf24',
      'line-width': 1.5,
      'line-opacity': 0.85,
    },
  });

  addFillLayer(map, {
    id: HINT_FILL,
    type: 'fill',
    source: COUNTRIES_SOURCE,
    'source-layer': 'country_boundaries',
    paint: {
      'fill-color': '#fbbf24',
      'fill-opacity': 0.42,
    },
    filter: multiIsoFilter([]),
  });

  addLineLayer(map, {
    id: HINT_LINE,
    type: 'line',
    source: COUNTRIES_SOURCE,
    'source-layer': 'country_boundaries',
    paint: {
      'line-color': '#fde68a',
      'line-width': 2.2,
      'line-opacity': 0.95,
    },
    filter: multiIsoFilter([]),
  });
}

function buildFillDiag(map, filledIds) {
  const filled = filledIds || [];
  const isos = filled
    .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
    .filter(Boolean);
  const polyN = filled.filter((id) => getGeoPuzzleCountryPolygon(id)).length;
  const useVector = vectorPlacedReady(map, isos);
  return {
    filled: filled.join(',') || '—',
    isos: isos.join(',') || '—',
    placedLayer: map?.getLayer?.(PLACED_FILL) ? 'ok' : 'missing',
    geoLayer: map?.getLayer?.(PLACED_GEO_FILL) ? 'ok' : 'missing',
    poly: `${polyN}/${filled.length || 0}`,
    fill: useVector ? 'mapbox' : 'geo',
    projection: PUZZLE_PROJECTION,
  };
}

/**
 * #31 전용 게임 지도 — mercator · Mapbox 경계 필(조각) · union 조립 윤곽.
 */
export default function GeoPuzzleGlobe({
  filledIds = [],
  slotIds = [],
  hintCountryId = null,
  findActive = false,
  onMapReady,
  onMapClick,
  onProjectionChange,
  onFillDiag,
}) {
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const filledRef = useRef(filledIds);
  const slotRef = useRef(slotIds);
  const hintRef = useRef(hintCountryId);
  const onFillDiagRef = useRef(onFillDiag);
  filledRef.current = filledIds;
  slotRef.current = slotIds;
  hintRef.current = hintCountryId;
  onFillDiagRef.current = onFillDiag;

  useEffect(() => {
    onProjectionChange?.(PUZZLE_PROJECTION);
  }, [onProjectionChange]);

  const syncFills = useCallback((map) => {
    if (!map) return;
    try {
      ensurePlacedLayers(map);
    } catch {
      /* ignore */
    }
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

    const placedFilter = multiIsoFilter(filledIsos);
    safeSetFilter(map, PLACED_FILL, placedFilter);
    safeSetFilter(map, PLACED_LINE, multiIsoFilter([]));
    safeSetFilter(map, SLOT_FILL, multiIsoFilter(slotIsos));
    safeSetFilter(map, SLOT_LINE, multiIsoFilter(slotIsos));
    safeSetFilter(map, HINT_FILL, multiIsoFilter(hintIso ? [hintIso] : []));
    safeSetFilter(map, HINT_LINE, multiIsoFilter(hintIso ? [hintIso] : []));

    const geoFeatures = collectPlacedGeoFeatures(filled);
    const outline = dissolvePlacedOutline(geoFeatures);
    // Mapbox 경계 타일 = 퍼즐 조각(접경 공유). 타일 없으면 조립(union) 필 폴백.
    const useVector = vectorPlacedReady(map, filledIsos);
    const vectorOpacity = useVector ? PLACED_FILL_OPACITY : 0;
    const geoOpacity = !useVector && outline ? PLACED_FILL_OPACITY : 0;
    safeSetPaint(map, PLACED_FILL, 'fill-opacity', vectorOpacity);
    safeSetPaint(map, PLACED_FILL, 'fill-color', PLACED_FILL_COLOR);
    safeSetPaint(map, PLACED_LINE, 'line-opacity', 0);
    safeSetPaint(map, PLACED_GEO_FILL, 'fill-opacity', geoOpacity);
    safeSetPaint(map, PLACED_GEO_FILL, 'fill-color', PLACED_FILL_COLOR);

    // 나라별 GeoJSON을 그대로 채우면 간소화 틈이 빈 공간으로 보임 → union 한 덩어리만
    const assembled = outline ? [outline] : [];
    const geoSource = map.getSource(PLACED_GEOJSON_SOURCE);
    if (geoSource?.setData) {
      try {
        geoSource.setData({ type: 'FeatureCollection', features: assembled });
      } catch {
        /* ignore */
      }
    }
    const outlineSource = map.getSource(PLACED_OUTLINE_SOURCE);
    if (outlineSource?.setData) {
      try {
        outlineSource.setData({ type: 'FeatureCollection', features: assembled });
      } catch {
        /* ignore */
      }
    }

    for (const id of [
      HIT_FILL,
      SLOT_FILL,
      SLOT_LINE,
      PLACED_FILL,
      PLACED_LINE,
      PLACED_GEO_FILL,
      PLACED_GEO_LINE,
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

    onFillDiagRef.current?.(buildFillDiag(map, filled));
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
    try {
      map.setProjection?.(PUZZLE_PROJECTION);
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
          const features = map.queryRenderedFeatures(point, {
            layers: [HIT_FILL, SLOT_FILL, PLACED_FILL].filter((id) => map.getLayer(id)),
          });
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

    map.on('sourcedata', (evt) => {
      if (evt?.sourceId !== COUNTRIES_SOURCE || !evt?.isSourceLoaded) return;
      syncFills(map);
    });

    map.on('idle', () => {
      if ((filledRef.current || []).length) syncFills(map);
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
        projection={PUZZLE_PROJECTION}
        initialViewState={DEFAULT_VIEW}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        renderWorldCopies={false}
        minZoom={PUZZLE_MIN_ZOOM}
        maxZoom={PUZZLE_MAX_ZOOM}
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
