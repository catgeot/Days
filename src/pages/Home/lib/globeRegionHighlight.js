/**
 * 나라 칩 포커스 — Countries v1 육지 외곽선 + Streets `admin` 국경 라인.
 * (satellite-streets · deep/neon). fill·bbox 미사용.
 * 해양 EEZ는 Mapbox에 없음 — 섬 윤곽은 Countries 폴리곤을 line으로 스트로크.
 */

export const REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID = 'gateo-region-highlight-countries';
export const REGION_HIGHLIGHT_OUTLINE_HALO_ID = 'gateo-region-highlight-outline-halo';
export const REGION_HIGHLIGHT_OUTLINE_LINE_ID = 'gateo-region-highlight-outline-line';
export const REGION_HIGHLIGHT_LINE_ID = 'gateo-region-highlight-line';
export const REGION_HIGHLIGHT_HALO_ID = 'gateo-region-highlight-halo';
export const REGION_HIGHLIGHT_DISPUTED_ID = 'gateo-region-highlight-disputed';

/** @deprecated fill → outline 전환 · 구 세션 잔여 제거용 */
export const REGION_HIGHLIGHT_FILL_ID = 'gateo-region-highlight-fill';

/** @deprecated bbox 폴백 제거 — 구 세션 잔여 정리용 */
export const REGION_HIGHLIGHT_FALLBACK_SOURCE_ID = 'gateo-region-highlight-fallback';
export const REGION_HIGHLIGHT_FALLBACK_LINE_ID = 'gateo-region-highlight-fallback-line';
export const REGION_HIGHLIGHT_FALLBACK_HALO_ID = 'gateo-region-highlight-fallback-halo';

export const REGION_HIGHLIGHT_LAYER_IDS = [
  REGION_HIGHLIGHT_OUTLINE_HALO_ID,
  REGION_HIGHLIGHT_OUTLINE_LINE_ID,
  REGION_HIGHLIGHT_HALO_ID,
  REGION_HIGHLIGHT_LINE_ID,
  REGION_HIGHLIGHT_DISPUTED_ID,
];

const LEGACY_LAYER_IDS = [
  REGION_HIGHLIGHT_FILL_ID,
  REGION_HIGHLIGHT_FALLBACK_HALO_ID,
  REGION_HIGHLIGHT_FALLBACK_LINE_ID,
];

/** 선택 나라 — 앰버 */
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

/** Mapbox Countries v1 — 육지 폴리곤 외곽 (worldview + ISO) */
function countryOutlineFilter(iso) {
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

function addCountryOutlineLayer(map, { id, paint }) {
  if (map.getLayer(id)) return true;
  if (!ensureCountriesSource(map)) return false;
  try {
    map.addLayer({
      id,
      type: 'line',
      source: REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID,
      'source-layer': 'country_boundaries',
      minzoom: HIGHLIGHT_MIN_ZOOM,
      maxzoom: HIGHLIGHT_MAX_ZOOM,
      filter: ['==', ['get', 'disputed'], 'false'],
      layout: {
        visibility: 'none',
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint,
    });
    return Boolean(map.getLayer(id));
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
      map.getLayer(REGION_HIGHLIGHT_OUTLINE_LINE_ID)
      || map.getLayer(REGION_HIGHLIGHT_LINE_ID)
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

  const outlineHaloOk = addCountryOutlineLayer(map, {
    id: REGION_HIGHLIGHT_OUTLINE_HALO_ID,
    paint: {
      'line-color': HIGHLIGHT_HALO,
      'line-width': ['interpolate', ['linear'], ['zoom'], 2, 3.5, 5, 7, 8, 10],
      'line-opacity': 0.85,
      'line-blur': 1.1,
    },
  });

  const outlineLineOk = addCountryOutlineLayer(map, {
    id: REGION_HIGHLIGHT_OUTLINE_LINE_ID,
    paint: {
      'line-color': HIGHLIGHT_LINE,
      'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.4, 5, 2.6, 8, 3.4],
      'line-opacity': 0.95,
    },
  });

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
        'line-opacity': 0.85,
        'line-blur': 1.1,
      },
    });

    lineOk = addAdminLineLayer(map, {
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
  }

  if (!outlineHaloOk && !outlineLineOk && !haloOk && !lineOk) return false;
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
  const hasOutline = Boolean(
    map.getLayer(REGION_HIGHLIGHT_OUTLINE_LINE_ID)
    || map.getLayer(REGION_HIGHLIGHT_OUTLINE_HALO_ID)
  );
  const hasAdmin = Boolean(
    map.getLayer(REGION_HIGHLIGHT_LINE_ID) || map.getLayer(REGION_HIGHLIGHT_HALO_ID)
  );

  if (ready && (hasOutline || hasAdmin)) {
    if (hasOutline) {
      const outline = countryOutlineFilter(iso);
      setLayerFilter(map, REGION_HIGHLIGHT_OUTLINE_HALO_ID, outline);
      setLayerFilter(map, REGION_HIGHLIGHT_OUTLINE_LINE_ID, outline);
      setVisibility(map, REGION_HIGHLIGHT_OUTLINE_HALO_ID, 'visible');
      setVisibility(map, REGION_HIGHLIGHT_OUTLINE_LINE_ID, 'visible');
      // Countries 외곽선이 해안·육지 경계를 포함 — admin 실선은 이중 스트로크 방지로 숨김
      setVisibility(map, REGION_HIGHLIGHT_HALO_ID, 'none');
      setVisibility(map, REGION_HIGHLIGHT_LINE_ID, 'none');
      if (map.getLayer(REGION_HIGHLIGHT_DISPUTED_ID)) {
        setLayerFilter(map, REGION_HIGHLIGHT_DISPUTED_ID, admin0IsoFilter(iso, { disputed: true }));
        setVisibility(map, REGION_HIGHLIGHT_DISPUTED_ID, 'visible');
      }
    } else if (hasAdmin) {
      const solid = admin0IsoFilter(iso, { disputed: false });
      const disputed = admin0IsoFilter(iso, { disputed: true });
      const any = admin0IsoFilter(iso);

      setLayerFilter(map, REGION_HIGHLIGHT_HALO_ID, any);
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
