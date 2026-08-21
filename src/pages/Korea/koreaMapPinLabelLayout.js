/**
 * 축제·명승 지도 핀 라벨 — 넓은 뷰는 줄임, 확대 시 전체 제목.
 * GeoJSON `title` + `titleShort` 속성과 함께 사용.
 */
export const KOREA_MAP_PIN_LABEL_FULL_ZOOM = 12;

/** @type {import('mapbox-gl').Expression} */
export const koreaMapPinLabelTextField = [
  'step',
  ['zoom'],
  ['get', 'titleShort'],
  KOREA_MAP_PIN_LABEL_FULL_ZOOM,
  ['coalesce', ['get', 'title'], ['get', 'titleShort']],
];

/** @type {import('mapbox-gl').SymbolLayout} */
export const koreaMapPinLabelLayout = {
  'text-field': koreaMapPinLabelTextField,
  'text-size': [
    'interpolate',
    ['linear'],
    ['zoom'],
    8,
    11,
    12,
    12,
    14,
    13,
  ],
  'text-offset': [0, 1.35],
  'text-anchor': 'top',
  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
  'text-max-width': [
    'interpolate',
    ['linear'],
    ['zoom'],
    8,
    8,
    12,
    11,
    14,
    14,
  ],
};
