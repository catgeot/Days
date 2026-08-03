/**
 * 나라 칩 포커스 — Countries v1 육지 fill + Streets `admin` 분쟁 점선.
 * (satellite-streets · deep/neon). bbox·폴리곤 외곽선 미사용.
 * fill 유지 · 톤 다운은 fit 도착 줌 대비 상대(소국 고줌 fit도 도착 시 peak).
 * 해양 EEZ는 Mapbox에 없음.
 * ISO 3166-2(예: GB-SCT)는 Countries에 없어 로컬 GeoJSON fill·선 사용.
 */

// geoBoundaries GBR ADM1 · UK 구성국 (CC BY 4.0) · 글로브용 간소화
import ukSubdivisionGeoJSONByIso3166_2 from '../data/globeSubdivisionUk.json';

export const REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID = 'gateo-region-highlight-countries';
export const REGION_HIGHLIGHT_FILL_ID = 'gateo-region-highlight-fill';
export const REGION_HIGHLIGHT_LINE_ID = 'gateo-region-highlight-line';
export const REGION_HIGHLIGHT_HALO_ID = 'gateo-region-highlight-halo';
export const REGION_HIGHLIGHT_DISPUTED_ID = 'gateo-region-highlight-disputed';
export const REGION_HIGHLIGHT_SUBDIVISION_SOURCE_ID = 'gateo-region-highlight-subdivision';
export const REGION_HIGHLIGHT_SUBDIVISION_FILL_ID = 'gateo-region-highlight-subdivision-fill';
export const REGION_HIGHLIGHT_SUBDIVISION_LINE_ID = 'gateo-region-highlight-subdivision-line';
export const REGION_HIGHLIGHT_SUBDIVISION_HALO_ID = 'gateo-region-highlight-subdivision-halo';

/** @type {Record<string, { type: string, features: unknown[] }>} */
const SUBDIVISION_GEOJSON_BY_ISO3166_2 = ukSubdivisionGeoJSONByIso3166_2;

/** @deprecated outline → fill 전환 · 구 세션 잔여 제거용 */
export const REGION_HIGHLIGHT_OUTLINE_HALO_ID = 'gateo-region-highlight-outline-halo';
export const REGION_HIGHLIGHT_OUTLINE_LINE_ID = 'gateo-region-highlight-outline-line';

/** @deprecated bbox 폴백 제거 — 구 세션 잔여 정리용 */
export const REGION_HIGHLIGHT_FALLBACK_SOURCE_ID = 'gateo-region-highlight-fallback';
export const REGION_HIGHLIGHT_FALLBACK_LINE_ID = 'gateo-region-highlight-fallback-line';
export const REGION_HIGHLIGHT_FALLBACK_HALO_ID = 'gateo-region-highlight-fallback-halo';

export const REGION_HIGHLIGHT_LAYER_IDS = [
  REGION_HIGHLIGHT_FILL_ID,
  REGION_HIGHLIGHT_HALO_ID,
  REGION_HIGHLIGHT_LINE_ID,
  REGION_HIGHLIGHT_DISPUTED_ID,
  REGION_HIGHLIGHT_SUBDIVISION_FILL_ID,
  REGION_HIGHLIGHT_SUBDIVISION_HALO_ID,
  REGION_HIGHLIGHT_SUBDIVISION_LINE_ID,
];

const COUNTRY_HIGHLIGHT_LAYER_IDS = [
  REGION_HIGHLIGHT_FILL_ID,
  REGION_HIGHLIGHT_HALO_ID,
  REGION_HIGHLIGHT_LINE_ID,
  REGION_HIGHLIGHT_DISPUTED_ID,
];

const SUBDIVISION_HIGHLIGHT_LAYER_IDS = [
  REGION_HIGHLIGHT_SUBDIVISION_FILL_ID,
  REGION_HIGHLIGHT_SUBDIVISION_HALO_ID,
  REGION_HIGHLIGHT_SUBDIVISION_LINE_ID,
];

const LEGACY_LAYER_IDS = [
  REGION_HIGHLIGHT_OUTLINE_HALO_ID,
  REGION_HIGHLIGHT_OUTLINE_LINE_ID,
  REGION_HIGHLIGHT_FALLBACK_HALO_ID,
  REGION_HIGHLIGHT_FALLBACK_LINE_ID,
];

/**
 * fill = 딥 보라 · 국경선 = 최초 앰버(육지 admin 라인).
 * 선은 섬 윤곽 전부가 아니라 Streets admin0(육지 접경)만.
 */
const HIGHLIGHT_FILL = '#7c3aed';
const HIGHLIGHT_LINE = '#fbbf24';
const HIGHLIGHT_HALO = 'rgba(251, 191, 36, 0.5)';

/** 나라 포커스 중에는 저줌에서도 국경이 보이도록 */
const HIGHLIGHT_MIN_ZOOM = 1.8;
const HIGHLIGHT_MAX_ZOOM = 22;

/** fit 도착 줌 기준 상대 페이드 — 소국(고줌 fit)도 도착 시점에는 peak 유지 */
const FILL_PEAK_OPACITY = 0.48;
const LINE_PEAK_OPACITY = 0.95;
const HALO_PEAK_OPACITY = 0.85;
const DISPUTED_PEAK_OPACITY = 0.85;
const DEFAULT_SETTLE_ZOOM = 4.2;

/**
 * @param {number} settleZoom fit/도착 줌
 * @param {number} peak 도착 줌 이하에서의 불투명도
 */
function opacityExprFromSettle(settleZoom, peak) {
  const z = Number.isFinite(settleZoom) ? settleZoom : DEFAULT_SETTLE_ZOOM;
  const zPeak = Math.max(HIGHLIGHT_MIN_ZOOM, z);
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    zPeak,
    peak,
    zPeak + 0.8,
    peak * 0.45,
    zPeak + 1.6,
    peak * 0.12,
    zPeak + 2.4,
    0,
  ];
}

export function isRegionHighlightLayer(layerId = '') {
  return String(layerId).startsWith('gateo-region-highlight');
}

function setVisibility(map, layerId, visibility) {
  if (!map?.getLayer?.(layerId)) return false;
  try {
    map.setLayoutProperty(layerId, 'visibility', visibility);
    return true;
  } catch {
    return false;
  }
}

function setLayerFilter(map, layerId, filter) {
  if (!map?.getLayer?.(layerId)) return false;
  try {
    map.setFilter(layerId, filter);
    return true;
  } catch {
    return false;
  }
}

function findCompositeSourceId(map) {
  try {
    const sources = map.getStyle()?.sources || {};
    if (sources.composite?.type === 'vector') return 'composite';
  } catch {
    // ignore
  }
  return null;
}

/** 선택 ISO — 단독 코드 또는 `KP-KR` 형태 공유 국경 */
function isoMatchExpr(iso) {
  const up = String(iso || '').toUpperCase();
  const low = up.toLowerCase();
  return [
    'any',
    ['==', ['get', 'iso_3166_1'], up],
    ['==', ['get', 'iso_3166_1'], low],
    ['in', up, ['to-string', ['coalesce', ['get', 'iso_3166_1'], '']]],
    ['in', low, ['to-string', ['coalesce', ['get', 'iso_3166_1'], '']]],
  ];
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

function admin0IsoFilter(iso, { disputed = null } = {}) {
  const parts = [
    ['==', ['to-number', ['get', 'admin_level']], 0],
    isoMatchExpr(iso),
    worldviewFilter(),
  ];
  if (disputed === true) {
    parts.push(['==', ['to-string', ['get', 'disputed']], 'true']);
  } else if (disputed === false) {
    parts.push(['!=', ['to-string', ['get', 'disputed']], 'true']);
  }
  return ['all', ...parts];
}

/** Mapbox Countries v1 — 육지 폴리곤 (worldview + ISO) */
function countryFillFilter(iso) {
  const up = String(iso || '').toUpperCase();
  return [
    'all',
    ['==', ['get', 'disputed'], 'false'],
    worldviewFilter(),
    [
      'any',
      ['==', ['get', 'iso_3166_1'], up],
      ['==', ['get', 'iso_3166_1'], up.toLowerCase()],
    ],
  ];
}

function raiseHighlightLayers(map) {
  for (const layerId of REGION_HIGHLIGHT_LAYER_IDS) {
    if (!map.getLayer(layerId)) continue;
    try {
      map.moveLayer(layerId);
    } catch {
      // Layer may be mid-transition.
    }
  }
}

function removeLegacyLayers(map) {
  for (const layerId of LEGACY_LAYER_IDS) {
    if (!map.getLayer(layerId)) continue;
    try {
      map.removeLayer(layerId);
    } catch {
      // ignore
    }
  }
  if (map.getSource(REGION_HIGHLIGHT_FALLBACK_SOURCE_ID)) {
    try {
      map.removeSource(REGION_HIGHLIGHT_FALLBACK_SOURCE_ID);
    } catch {
      // ignore
    }
  }
}

function ensureCountriesSource(map) {
  if (map.getSource(REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID)) return true;
  try {
    map.addSource(REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID, {
      type: 'vector',
      url: 'mapbox://mapbox.country-boundaries-v1',
    });
    return Boolean(map.getSource(REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID));
  } catch {
    return false;
  }
}

function addCountryFillLayer(map) {
  if (map.getLayer(REGION_HIGHLIGHT_FILL_ID)) return true;
  if (!ensureCountriesSource(map)) return false;
  try {
    map.addLayer({
      id: REGION_HIGHLIGHT_FILL_ID,
      type: 'fill',
      source: REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID,
      'source-layer': 'country_boundaries',
      minzoom: HIGHLIGHT_MIN_ZOOM,
      maxzoom: HIGHLIGHT_MAX_ZOOM,
      filter: ['==', ['get', 'disputed'], 'false'],
      layout: { visibility: 'none' },
      paint: {
        'fill-color': HIGHLIGHT_FILL,
        'fill-opacity': opacityExprFromSettle(DEFAULT_SETTLE_ZOOM, FILL_PEAK_OPACITY),
      },
    });
    return Boolean(map.getLayer(REGION_HIGHLIGHT_FILL_ID));
  } catch {
    return false;
  }
}

function addAdminLineLayer(map, { id, compositeId, paint, layout = {} }) {
  if (map.getLayer(id)) return true;
  try {
    map.addLayer({
      id,
      type: 'line',
      source: compositeId,
      'source-layer': 'admin',
      minzoom: HIGHLIGHT_MIN_ZOOM,
      maxzoom: HIGHLIGHT_MAX_ZOOM,
      filter: ['==', ['to-number', ['get', 'admin_level']], 0],
      layout: {
        visibility: 'none',
        'line-join': 'round',
        'line-cap': 'round',
        ...layout,
      },
      paint,
    });
    return Boolean(map.getLayer(id));
  } catch {
    return false;
  }
}

export function regionHighlightLayersReady(map) {
  if (!map?.getStyle?.()) return false;
  try {
    return Boolean(
      map.getLayer(REGION_HIGHLIGHT_FILL_ID) || map.getLayer(REGION_HIGHLIGHT_LINE_ID)
    );
  } catch {
    return false;
  }
}

export function setupRegionHighlightLayers(map) {
  if (!map?.getStyle?.() || !map.isStyleLoaded?.()) return false;

  try {
    removeLegacyLayers(map);
  } catch {
    // ignore
  }

  const fillOk = addCountryFillLayer(map);

  const compositeId = findCompositeSourceId(map);
  let haloOk = false;
  let lineOk = false;
  if (compositeId) {
    haloOk = addAdminLineLayer(map, {
      id: REGION_HIGHLIGHT_HALO_ID,
      compositeId,
      paint: {
        'line-color': HIGHLIGHT_HALO,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 3.5, 5, 7, 8, 10],
        'line-opacity': opacityExprFromSettle(DEFAULT_SETTLE_ZOOM, HALO_PEAK_OPACITY),
        'line-blur': 1.1,
      },
    });

    lineOk = addAdminLineLayer(map, {
      id: REGION_HIGHLIGHT_LINE_ID,
      compositeId,
      paint: {
        'line-color': HIGHLIGHT_LINE,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.4, 5, 2.6, 8, 3.4],
        'line-opacity': opacityExprFromSettle(DEFAULT_SETTLE_ZOOM, LINE_PEAK_OPACITY),
      },
    });

    addAdminLineLayer(map, {
      id: REGION_HIGHLIGHT_DISPUTED_ID,
      compositeId,
      paint: {
        'line-color': HIGHLIGHT_LINE,
        'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.2, 5, 2.2, 8, 3],
        'line-opacity': opacityExprFromSettle(DEFAULT_SETTLE_ZOOM, DISPUTED_PEAK_OPACITY),
        'line-dasharray': [1.5, 1.5],
      },
    });
  }

  if (!fillOk && !haloOk && !lineOk) return false;
  raiseHighlightLayers(map);
  return true;
}

function setStandardAdminBoundaries(map, enabled) {
  if (typeof map?.setConfigProperty !== 'function') return;
  try {
    map.setConfigProperty('basemap', 'showAdminBoundaries', Boolean(enabled));
  } catch {
    // Standard 외 스타일
  }
}

function hideHighlightLayers(map, layerIds) {
  for (const layerId of layerIds) {
    setVisibility(map, layerId, 'none');
  }
}

function ensureSubdivisionSource(map, featureCollection) {
  const existing = map.getSource(REGION_HIGHLIGHT_SUBDIVISION_SOURCE_ID);
  if (existing) {
    try {
      existing.setData(featureCollection);
      return true;
    } catch {
      return false;
    }
  }
  try {
    map.addSource(REGION_HIGHLIGHT_SUBDIVISION_SOURCE_ID, {
      type: 'geojson',
      data: featureCollection,
    });
    return Boolean(map.getSource(REGION_HIGHLIGHT_SUBDIVISION_SOURCE_ID));
  } catch {
    return false;
  }
}

function ensureSubdivisionLayers(map) {
  if (!map.getSource(REGION_HIGHLIGHT_SUBDIVISION_SOURCE_ID)) return false;

  if (!map.getLayer(REGION_HIGHLIGHT_SUBDIVISION_FILL_ID)) {
    try {
      map.addLayer({
        id: REGION_HIGHLIGHT_SUBDIVISION_FILL_ID,
        type: 'fill',
        source: REGION_HIGHLIGHT_SUBDIVISION_SOURCE_ID,
        minzoom: HIGHLIGHT_MIN_ZOOM,
        maxzoom: HIGHLIGHT_MAX_ZOOM,
        layout: { visibility: 'none' },
        paint: {
          'fill-color': HIGHLIGHT_FILL,
          'fill-opacity': opacityExprFromSettle(DEFAULT_SETTLE_ZOOM, FILL_PEAK_OPACITY),
        },
      });
    } catch {
      return false;
    }
  }

  if (!map.getLayer(REGION_HIGHLIGHT_SUBDIVISION_HALO_ID)) {
    try {
      map.addLayer({
        id: REGION_HIGHLIGHT_SUBDIVISION_HALO_ID,
        type: 'line',
        source: REGION_HIGHLIGHT_SUBDIVISION_SOURCE_ID,
        minzoom: HIGHLIGHT_MIN_ZOOM,
        maxzoom: HIGHLIGHT_MAX_ZOOM,
        layout: {
          visibility: 'none',
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': HIGHLIGHT_HALO,
          'line-width': ['interpolate', ['linear'], ['zoom'], 2, 3.5, 5, 7, 8, 10],
          'line-opacity': opacityExprFromSettle(DEFAULT_SETTLE_ZOOM, HALO_PEAK_OPACITY),
          'line-blur': 1.1,
        },
      });
    } catch {
      // continue — fill alone is usable
    }
  }

  if (!map.getLayer(REGION_HIGHLIGHT_SUBDIVISION_LINE_ID)) {
    try {
      map.addLayer({
        id: REGION_HIGHLIGHT_SUBDIVISION_LINE_ID,
        type: 'line',
        source: REGION_HIGHLIGHT_SUBDIVISION_SOURCE_ID,
        minzoom: HIGHLIGHT_MIN_ZOOM,
        maxzoom: HIGHLIGHT_MAX_ZOOM,
        layout: {
          visibility: 'none',
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': HIGHLIGHT_LINE,
          'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.4, 5, 2.6, 8, 3.4],
          'line-opacity': opacityExprFromSettle(DEFAULT_SETTLE_ZOOM, LINE_PEAK_OPACITY),
        },
      });
    } catch {
      // continue
    }
  }

  return Boolean(map.getLayer(REGION_HIGHLIGHT_SUBDIVISION_FILL_ID));
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {{ iso?: string, iso3166_2?: string, bbox?: number[], settleZoom?: number } | null} region
 */
export function setRegionHighlight(map, region) {
  if (!map) return;

  const iso = region?.iso ? String(region.iso).toUpperCase() : '';
  const iso3166_2 = region?.iso3166_2 ? String(region.iso3166_2).toUpperCase() : '';
  const subdivisionFc = iso3166_2
    ? SUBDIVISION_GEOJSON_BY_ISO3166_2[iso3166_2]
    : null;

  if (!iso && !subdivisionFc) {
    clearRegionHighlight(map);
    return;
  }

  const settleZoom = Number.isFinite(region?.settleZoom)
    ? region.settleZoom
    : DEFAULT_SETTLE_ZOOM;
  const fillOpacity = opacityExprFromSettle(settleZoom, FILL_PEAK_OPACITY);
  const lineOpacity = opacityExprFromSettle(settleZoom, LINE_PEAK_OPACITY);
  const haloOpacity = opacityExprFromSettle(settleZoom, HALO_PEAK_OPACITY);
  const disputedOpacity = opacityExprFromSettle(settleZoom, DISPUTED_PEAK_OPACITY);

  const ready = setupRegionHighlightLayers(map);

  if (subdivisionFc) {
    hideHighlightLayers(map, COUNTRY_HIGHLIGHT_LAYER_IDS);
    if (ensureSubdivisionSource(map, subdivisionFc) && ensureSubdivisionLayers(map)) {
      try {
        map.setPaintProperty(REGION_HIGHLIGHT_SUBDIVISION_FILL_ID, 'fill-opacity', fillOpacity);
        map.setPaintProperty(REGION_HIGHLIGHT_SUBDIVISION_HALO_ID, 'line-opacity', haloOpacity);
        map.setPaintProperty(REGION_HIGHLIGHT_SUBDIVISION_LINE_ID, 'line-opacity', lineOpacity);
      } catch {
        // ignore
      }
      for (const layerId of SUBDIVISION_HIGHLIGHT_LAYER_IDS) {
        setVisibility(map, layerId, 'visible');
      }
      raiseHighlightLayers(map);
      return;
    }
  }

  hideHighlightLayers(map, SUBDIVISION_HIGHLIGHT_LAYER_IDS);

  const hasFill = Boolean(map.getLayer(REGION_HIGHLIGHT_FILL_ID));
  const hasAdmin = Boolean(
    map.getLayer(REGION_HIGHLIGHT_LINE_ID) || map.getLayer(REGION_HIGHLIGHT_HALO_ID)
  );

  if (ready && iso && (hasFill || hasAdmin)) {
    if (hasFill) {
      try {
        map.setPaintProperty(REGION_HIGHLIGHT_FILL_ID, 'fill-opacity', fillOpacity);
      } catch {
        // ignore
      }
      setLayerFilter(map, REGION_HIGHLIGHT_FILL_ID, countryFillFilter(iso));
      setVisibility(map, REGION_HIGHLIGHT_FILL_ID, 'visible');
    }

    // 앰버 국경: halo·solid는 비분쟁만(분쟁 halo는 IL 등 fill보다 큰 빈 외곽을 만듦). 분쟁은 dashed만.
    if (hasAdmin) {
      const solid = admin0IsoFilter(iso, { disputed: false });
      const disputed = admin0IsoFilter(iso, { disputed: true });

      try {
        map.setPaintProperty(REGION_HIGHLIGHT_HALO_ID, 'line-opacity', haloOpacity);
        map.setPaintProperty(REGION_HIGHLIGHT_LINE_ID, 'line-opacity', lineOpacity);
        map.setPaintProperty(REGION_HIGHLIGHT_DISPUTED_ID, 'line-opacity', disputedOpacity);
      } catch {
        // ignore
      }

      setLayerFilter(map, REGION_HIGHLIGHT_HALO_ID, solid);
      setLayerFilter(map, REGION_HIGHLIGHT_LINE_ID, solid);
      setLayerFilter(map, REGION_HIGHLIGHT_DISPUTED_ID, disputed);

      setVisibility(map, REGION_HIGHLIGHT_HALO_ID, 'visible');
      setVisibility(map, REGION_HIGHLIGHT_LINE_ID, 'visible');
      setVisibility(map, REGION_HIGHLIGHT_DISPUTED_ID, 'visible');
    }

    raiseHighlightLayers(map);
    return;
  }

  // Mapbox Standard — 국가 단위 필터 불가, 행정경계 on만
  setStandardAdminBoundaries(map, true);
}

export function clearRegionHighlight(map) {
  if (!map) return;
  for (const layerId of [...REGION_HIGHLIGHT_LAYER_IDS, ...LEGACY_LAYER_IDS]) {
    setVisibility(map, layerId, 'none');
  }
  setStandardAdminBoundaries(map, false);
}
