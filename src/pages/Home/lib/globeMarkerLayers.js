/** Mapbox GeoJSON layers for gateo globe markers (GPU-attached, no DOM jitter) */

export const GATEO_SOURCE_ID = 'gateo-spots';
export const GATEO_DOT_LAYER_ID = 'gateo-spots-dot';
export const GATEO_LABEL_LAYER_ID = 'gateo-spots-label';
export const GATEO_ACTIVE_LAYER_ID = 'gateo-spots-active';

export const GATEO_LAYER_IDS = [
  GATEO_DOT_LAYER_ID,
  GATEO_LABEL_LAYER_ID,
  GATEO_ACTIVE_LAYER_ID
];

const CATEGORY_COLORS = {
  paradise: '#67d6ff',
  nature: '#6ee7a6',
  urban: '#7ab6ff',
  nearby: '#ffd76a',
  adventure: '#ff9b8f',
  culture: '#b89cff',
  default: '#b7c7db'
};

const truncate = (str, length = 12) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}..` : str;
};

export function markerToFeature(marker, index = 0) {
  const lat = Number(marker.lat) + (Number(marker._offsetLat) || 0);
  const lng = Number(marker.lng) + (Number(marker._offsetLng) || 0);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const type = marker.type || 'major';
  const category = marker.category || 'default';
  const color = type === 'temp-base'
    ? '#94a3b8'
    : type === 'saved-base'
      ? '#e2e8f0'
      : (CATEGORY_COLORS[category] || CATEGORY_COLORS.default);

  return {
    type: 'Feature',
    id: marker.id || marker.tripId || marker.slug || `spot-${index}`,
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      markerId: String(marker.id || marker.tripId || marker.slug || `spot-${index}`),
      name: truncate(marker.name || marker.destination || '?', type === 'major' ? 12 : 10),
      fullName: marker.name || marker.destination || '',
      slug: marker.slug || '',
      type,
      category,
      color,
      tier: Number(marker.tier) || 3,
      isActive: marker.isActive ? 1 : 0,
      isGhost: marker.isGhost ? 1 : 0,
      isBookmarked: marker.isBookmarked ? 1 : 0,
      hasChat: marker.hasChat ? 1 : 0,
      hiddenClusterCount: Number(marker.hiddenClusterCount) || 0,
      opacity: marker.isGhost ? 0.55 : 1
    }
  };
}

export function markersToGeoJSON(markers = []) {
  const features = markers
    .map((marker, index) => markerToFeature(marker, index))
    .filter(Boolean);
  return { type: 'FeatureCollection', features };
}

export function isGateoLayer(layerId = '') {
  return GATEO_LAYER_IDS.some((id) => layerId === id || layerId.startsWith('gateo-spots'));
}

function safeMapUpdate(map, fn) {
  try {
    if (!map?.getStyle?.()?.layers) return;
    fn();
  } catch {
    // Style may be reloading after theme changes.
  }
}

export function setupGateoMarkerLayers(map) {
  if (!map) return;

  if (!map.getSource(GATEO_SOURCE_ID)) {
    map.addSource(GATEO_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }

  if (!map.getLayer(GATEO_DOT_LAYER_ID)) {
    map.addLayer({
      id: GATEO_DOT_LAYER_ID,
      type: 'circle',
      source: GATEO_SOURCE_ID,
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          1, 3,
          3, 5,
          6, 7
        ],
        'circle-color': ['get', 'color'],
        'circle-opacity': ['*', ['get', 'opacity'], 0.92],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(2,6,23,0.85)'
      }
    });
  }

  if (!map.getLayer(GATEO_LABEL_LAYER_ID)) {
    map.addLayer({
      id: GATEO_LABEL_LAYER_ID,
      type: 'symbol',
      source: GATEO_SOURCE_ID,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-offset': [0.9, 0],
        'text-anchor': 'left',
        'text-max-width': 8,
        'text-allow-overlap': false,
        'text-ignore-placement': false
      },
      paint: {
        'text-color': '#e6edf7',
        'text-halo-color': 'rgba(2,6,23,0.95)',
        'text-halo-width': 1.2,
        'text-opacity': ['get', 'opacity']
      }
    });
  }

  if (!map.getLayer(GATEO_ACTIVE_LAYER_ID)) {
    map.addLayer({
      id: GATEO_ACTIVE_LAYER_ID,
      type: 'circle',
      source: GATEO_SOURCE_ID,
      filter: ['==', ['get', 'isActive'], 1],
      paint: {
        'circle-radius': 14,
        'circle-color': '#ef4444',
        'circle-opacity': 0.85,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#7f1d1d'
      }
    });
  }
}

export function updateGateoMarkerSource(map, geojson) {
  safeMapUpdate(map, () => {
    const source = map.getSource(GATEO_SOURCE_ID);
    if (source) source.setData(geojson || { type: 'FeatureCollection', features: [] });
  });
}

export function findGateoMarkerAtPoint(map, point, thresholdPx = 28) {
  if (!map || !point) return null;

  const layers = [GATEO_DOT_LAYER_ID, GATEO_LABEL_LAYER_ID, GATEO_ACTIVE_LAYER_ID].filter((id) => map.getLayer(id));
  if (layers.length === 0) return null;

  const bbox = [
    [point.x - thresholdPx, point.y - thresholdPx],
    [point.x + thresholdPx, point.y + thresholdPx]
  ];

  const features = map.queryRenderedFeatures(bbox, { layers });
  if (!features?.length) return null;

  const top = features[0];
  const props = top.properties || {};
  return {
    id: props.markerId,
    name: props.fullName || props.name,
    slug: props.slug,
    lat: top.geometry?.coordinates?.[1],
    lng: top.geometry?.coordinates?.[0],
    type: props.type,
    category: props.category,
    isActive: props.isActive === 1,
    isBookmarked: props.isBookmarked === 1,
    hasChat: props.hasChat === 1,
    hiddenClusterCount: Number(props.hiddenClusterCount) || 0
  };
}
