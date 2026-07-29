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
const GHOST_FILL = 'gateo-geo-puzzle-ghost-fill';

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
        'line-width': 1.4,
        'line-opacity': 0.9,
      },
      filter: multiIsoFilter([]),
    });
  }
  if (!map.getLayer(GHOST_FILL)) {
    map.addLayer({
      id: GHOST_FILL,
      type: 'fill',
      source: COUNTRIES_SOURCE,
      'source-layer': 'country_boundaries',
      paint: {
        'fill-color': '#a78bfa',
        'fill-opacity': 0.18,
      },
      filter: multiIsoFilter([]),
      layout: { visibility: 'none' },
    });
  }
}

/**
 * @param {{ filledIds: string[], previewIso?: string | null, dragPan?: boolean, onMapReady?: (map: import('mapbox-gl').Map) => void }} props
 */
export default function GeoPuzzleGlobe({
  filledIds = [],
  previewIso = null,
  dragPan = true,
  onMapReady,
}) {
  const mapRef = useRef(null);
  const readyRef = useRef(false);

  const syncFills = useCallback((map, ids, preview) => {
    if (!map) return;
    ensurePlacedLayers(map);
    const isos = (ids || [])
      .map((id) => GLOBE_COUNTRY_CATALOG[id]?.iso)
      .filter(Boolean);
    try {
      map.setFilter(PLACED_FILL, multiIsoFilter(isos));
      map.setFilter(PLACED_LINE, multiIsoFilter(isos));
      if (preview) {
        map.setFilter(GHOST_FILL, multiIsoFilter([preview]));
        map.setLayoutProperty(GHOST_FILL, 'visibility', 'visible');
      } else {
        map.setLayoutProperty(GHOST_FILL, 'visibility', 'none');
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !readyRef.current) return;
    syncFills(map, filledIds, previewIso);
  }, [filledIds, previewIso, syncFills]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    readyRef.current = true;
    forceHideLabelsAndBorders(map);
    ensurePlacedLayers(map);
    syncFills(map, filledIds, previewIso);
    onMapReady?.(map);

    map.on('style.load', () => {
      forceHideLabelsAndBorders(map);
      ensurePlacedLayers(map);
      syncFills(map, filledIds, previewIso);
    });
  }, [filledIds, onMapReady, previewIso, syncFills]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-sm text-white/70">
        Mapbox 토큰이 없습니다.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full gateo-mapbox-map">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        projection="globe"
        initialViewState={DEFAULT_VIEW}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        onLoad={handleLoad}
        dragRotate={false}
        pitchWithRotate={false}
        dragPan={dragPan}
        scrollZoom
      />
      <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex gap-2 text-[10px] text-white/70">
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
