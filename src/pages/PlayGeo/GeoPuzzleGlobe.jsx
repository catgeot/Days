import React, { useCallback, useEffect, useRef } from 'react';
import Map from 'react-map-gl/mapbox';
import { GLOBE_COUNTRY_CATALOG } from '../Home/lib/globeCountryCatalog.js';
import { GLOBE_FACE_CENTER_BY_CATEGORY } from '../Home/lib/globeCategoryFocus.js';
import { MAPBOX_ATTRIBUTION_LINKS } from '../../data/mapboxAttribution.js';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
const COUNTRIES_SOURCE = 'gateo-geo-puzzle-countries';
const HIT_FILL = 'gateo-geo-puzzle-hit-fill';
const PLACED_FILL = 'gateo-geo-puzzle-placed-fill';
const PLACED_LINE = 'gateo-geo-puzzle-placed-line';
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

const FACE_ZOOM = 1.55;

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

function ensureLayers(map) {
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
  if (!map.getLayer(PLACED_FILL)) {
    map.addLayer({
      id: PLACED_FILL,
      type: 'fill',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'fill-color': '#22d3ee',
        'fill-opacity': 0.42,
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
  if (!map.getLayer(HINT_FILL)) {
    map.addLayer({
      id: HINT_FILL,
      type: 'fill',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'fill-color': '#7c3aed',
        'fill-opacity': 0.4,
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
        'line-color': '#fbbf24',
        'line-width': 2,
        'line-opacity': 0.95,
      },
      filter: multiIsoFilter([]),
    });
  }
}

/**
 * 전용 게임 글로브 — 지명·국경 라벨 숨김 · 장소카드/홈 탐색 로직 없음.
 */
export default function GeoPuzzleGlobe({
  clearedIds = [],
  hintCountryId = null,
  faceCategory = null,
  findActive = false,
  onMapReady,
  onMapClick,
}) {
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const clearedRef = useRef(clearedIds);
  const hintRef = useRef(hintCountryId);
  clearedRef.current = clearedIds;
  hintRef.current = hintCountryId;

  const syncOverlays = useCallback((map) => {
    if (!map) return;
    ensureLayers(map);
    const clearedIsos = (clearedRef.current || [])
      .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
      .filter(Boolean);
    const hintIso = hintRef.current
      ? GLOBE_COUNTRY_CATALOG[hintRef.current]?.iso
      : null;
    try {
      map.setFilter(PLACED_FILL, multiIsoFilter(clearedIsos));
      map.setFilter(PLACED_LINE, multiIsoFilter(clearedIsos));
      map.setFilter(HINT_FILL, multiIsoFilter(hintIso ? [hintIso] : []));
      map.setFilter(HINT_LINE, multiIsoFilter(hintIso ? [hintIso] : []));
    } catch {
      /* ignore */
    }
  }, []);

  const flyToFace = useCallback((category) => {
    const map = mapRef.current?.getMap?.();
    if (!map || !category) return;
    const center = GLOBE_FACE_CENTER_BY_CATEGORY[category];
    if (!center) return;
    try {
      map.flyTo({
        center: [center.lng, center.lat],
        zoom: FACE_ZOOM,
        pitch: 0,
        bearing: 0,
        duration: 1100,
        essential: true,
      });
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
    syncOverlays(map);
  }, [clearedIds, hintCountryId, syncOverlays]);

  useEffect(() => {
    if (!readyRef.current || !faceCategory) return;
    // 찾기 시작·권역 전환 시 넓게 — 나라 미리 포커스 금지(힌트만 flyToCountry)
    if (!hintCountryId) {
      flyToFace(faceCategory);
    }
  }, [faceCategory, flyToFace, hintCountryId]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    readyRef.current = true;
    forceHideLabelsAndBorders(map);
    ensureLayers(map);
    syncOverlays(map);
    onMapReady?.({
      map,
      flyToFace,
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
      ensureLayers(map);
      syncOverlays(map);
    });
  }, [flyToCountry, flyToFace, onMapReady, syncOverlays]);

  const handleClick = useCallback((evt) => {
    const handler = onMapClickRef.current;
    if (!handler) return;
    const point = evt?.point;
    const lngLat = evt?.lngLat;
    if (!point || !lngLat) return;
    handler({
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
