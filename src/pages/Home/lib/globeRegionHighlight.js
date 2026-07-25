/**
 * 나라 칩 포커스 — Mapbox Streets `composite`/`admin` 국경 하이라이트.
 * (satellite-streets · deep/neon). bbox 사각형 미사용.
 */

export const REGION_HIGHLIGHT_LINE_ID = 'gateo-region-highlight-line';
export const REGION_HIGHLIGHT_HALO_ID = 'gateo-region-highlight-halo';
export const REGION_HIGHLIGHT_DISPUTED_ID = 'gateo-region-highlight-disputed';

/** @deprecated bbox 폴백 제거 — 구 세션 잔여 정리용 */
export const REGION_HIGHLIGHT_FALLBACK_SOURCE_ID = 'gateo-region-highlight-fallback';
export const REGION_HIGHLIGHT_FALLBACK_LINE_ID = 'gateo-region-highlight-fallback-line';
export const REGION_HIGHLIGHT_FALLBACK_HALO_ID = 'gateo-region-highlight-fallback-halo';

export const REGION_HIGHLIGHT_LAYER_IDS = [
  REGION_HIGHLIGHT_HALO_ID,
  REGION_HIGHLIGHT_LINE_ID,
  REGION_HIGHLIGHT_DISPUTED_ID,
];

const LEGACY_FALLBACK_LAYER_IDS = [
  REGION_HIGHLIGHT_FALLBACK_HALO_ID,
  REGION_HIGHLIGHT_FALLBACK_LINE_ID,
];

/** 선택 나라 국경 — 앰버 */
const HIGHLIGHT_LINE = '#fbbf24';
const HIGHLIGHT_HALO = 'rgba(251, 191, 36, 0.45)';

/** 나라 포커스 중에는 저줌에서도 국경이 보이도록 */
const HIGHLIGHT_MIN_ZOOM = 1.8;
const HIGHLIGHT_MAX_ZOOM = 22;

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

function removeLegacyBboxLayers(map) {
  for (const layerId of LEGACY_FALLBACK_LAYER_IDS) {
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
    return Boolean(map.getLayer(REGION_HIGHLIGHT_LINE_ID));
  } catch {
    return false;
  }
}

export function setupRegionHighlightLayers(map) {
  if (!map?.getStyle?.() || !map.isStyleLoaded?.()) return false;

  try {
    removeLegacyBboxLayers(map);
  } catch {
    // ignore
  }

  const compositeId = findCompositeSourceId(map);
  if (!compositeId) return false;

  const haloOk = addAdminLineLayer(map, {
    id: REGION_HIGHLIGHT_HALO_ID,
    compositeId,
    paint: {
      'line-color': HIGHLIGHT_HALO,
      'line-width': ['interpolate', ['linear'], ['zoom'], 2, 3.5, 5, 7, 8, 10],
      'line-opacity': 0.85,
      'line-blur': 1.1,
    },
  });

  const lineOk = addAdminLineLayer(map, {
    id: REGION_HIGHLIGHT_LINE_ID,
    compositeId,
    paint: {
      'line-color': HIGHLIGHT_LINE,
      'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.4, 5, 2.6, 8, 3.4],
      'line-opacity': 0.95,
    },
  });

  addAdminLineLayer(map, {
    id: REGION_HIGHLIGHT_DISPUTED_ID,
    compositeId,
    paint: {
      'line-color': HIGHLIGHT_LINE,
      'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.2, 5, 2.2, 8, 3],
      'line-opacity': 0.85,
      'line-dasharray': [1.5, 1.5],
    },
  });

  if (!haloOk && !lineOk) return false;
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

/**
 * @param {import('mapbox-gl').Map} map
 * @param {{ iso?: string, bbox?: number[] } | null} region
 */
export function setRegionHighlight(map, region) {
  if (!map) return;

  const iso = region?.iso ? String(region.iso).toUpperCase() : '';
  if (!iso) {
    clearRegionHighlight(map);
    return;
  }

  const ready = setupRegionHighlightLayers(map);
  if (ready && (map.getLayer(REGION_HIGHLIGHT_LINE_ID) || map.getLayer(REGION_HIGHLIGHT_HALO_ID))) {
    const solid = admin0IsoFilter(iso, { disputed: false });
    const disputed = admin0IsoFilter(iso, { disputed: true });
    const any = admin0IsoFilter(iso);

    setLayerFilter(map, REGION_HIGHLIGHT_HALO_ID, any);
    setLayerFilter(map, REGION_HIGHLIGHT_LINE_ID, solid);
    setLayerFilter(map, REGION_HIGHLIGHT_DISPUTED_ID, disputed);

    setVisibility(map, REGION_HIGHLIGHT_HALO_ID, 'visible');
    setVisibility(map, REGION_HIGHLIGHT_LINE_ID, 'visible');
    setVisibility(map, REGION_HIGHLIGHT_DISPUTED_ID, 'visible');
    raiseHighlightLayers(map);
    return;
  }

  // Mapbox Standard — 국가 단위 필터 불가, 행정경계 on만
  setStandardAdminBoundaries(map, true);
}

export function clearRegionHighlight(map) {
  if (!map) return;
  for (const layerId of [...REGION_HIGHLIGHT_LAYER_IDS, ...LEGACY_FALLBACK_LAYER_IDS]) {
    setVisibility(map, layerId, 'none');
  }
  setStandardAdminBoundaries(map, false);
}
