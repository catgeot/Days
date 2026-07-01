/** 카테고리 매칭·지구본 5면 카메라 SSOT (Mapbox·legacy 공통) */

export const GLOBE_CATEGORY_IDS = ['paradise', 'nature', 'urban', 'culture', 'adventure'];

/** 경도 360°를 카테고리 5개로 균등 분할 (각 72°) — 담당 권역 경계 */
export const GLOBE_FACE_SECTOR_DEG = 360 / GLOBE_CATEGORY_IDS.length;

/**
 * 면 pan 중심 — 사용자 큐레이션 (최대 확대 시 바다는 불가피).
 * 카테고리 버튼 순서: paradise → nature → urban → culture → adventure
 */
export const GLOBE_FACE_CENTER_BY_CATEGORY = {
  paradise: { lng: 126.978, lat: 37.566 },   // 서울
  nature: { lng: 24.0, lat: 6.0 },             // 아프리카 (동아프리카·킬리만자로 권)
  urban: { lng: 10.752, lat: 59.913 },         // 오슬로 (유럽)
  culture: { lng: -93.265, lat: 44.977 },      // 미니애폴리스 (북미)
  adventure: { lng: -58.0, lat: -15.0 }        // 남미 (브라질 중부)
};

/** 면 전환 flyTo 시간 — 확대 상태면 호출 측에서 줌·고도 조정 후 pan */
export const GLOBE_FACE_FLY_MS = 2200;

/** Mapbox — [`HomeGlobeMapbox`](../components/HomeGlobeMapbox.jsx) `GLOBE_VIEW`와 동기화 */
export const GLOBE_CATEGORY_MAPBOX_ZOOM = {
  default: 1.25,
  fly: 2.35
};

/** legacy react-globe.gl — [`HomeGlobe`](../components/HomeGlobe.jsx) `GLOBE_CAMERA_CONFIG`와 동기화 */
export const GLOBE_CATEGORY_LEGACY_ALT = {
  default: 2.5,
  fly: 2.1
};

/** [`Home/index.jsx`](../index.jsx) `isMobileViewport`와 동일 (max-width 1023px) */
export const GLOBE_CATEGORY_MOBILE_MAX_WIDTH_PX = 1023;

export function isGlobeCategoryMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${GLOBE_CATEGORY_MOBILE_MAX_WIDTH_PX}px)`).matches;
}

/**
 * 카테고리 면 pan 줌 — 확대 중일 때만 조정.
 * 모바일: 초기 줌 · 데스크톱: flyTo 줌(executeFocus와 동일).
 */
export function resolveCategoryFaceMapboxZoom(currentZoom, isMobile = isGlobeCategoryMobileViewport()) {
  const { default: defaultZoom, fly: flyZoom } = GLOBE_CATEGORY_MAPBOX_ZOOM;
  if (currentZoom <= defaultZoom) return currentZoom;
  return isMobile ? defaultZoom : flyZoom;
}

/**
 * 카테고리 면 pan 고도 — 확대 중일 때만 조정 (altitude 낮을수록 확대).
 * 모바일: 초기 고도 · 데스크톱: flyTo 고도.
 */
export function resolveCategoryFaceLegacyAltitude(currentAlt, isMobile = isGlobeCategoryMobileViewport()) {
  const { default: defaultAlt, fly: flyAlt } = GLOBE_CATEGORY_LEGACY_ALT;
  if (currentAlt >= defaultAlt) return currentAlt;
  return isMobile ? defaultAlt : flyAlt;
}

export function spotMatchesCategory(spot, category) {
  if (!category || !spot) return true;
  if (spot.category === category || spot.primaryCategory === category) return true;
  return Array.isArray(spot.categories) && spot.categories.includes(category);
}

export function getCategoryGlobeFaceIndex(category) {
  const idx = GLOBE_CATEGORY_IDS.indexOf(category);
  return idx >= 0 ? idx : 0;
}

/** 카테고리 → 담당 면의 균등분할 경도 (참고·권역 경계) */
export function getCategoryGlobeFaceLng(category) {
  const idx = getCategoryGlobeFaceIndex(category);
  return -180 + GLOBE_FACE_SECTOR_DEG * (idx + 0.5);
}

/** 카테고리 버튼·홈 진입 시 pan 대상 (육지 편향 중심; 확대 중 줌·고도는 `resolveCategoryFace*`) */
export function getCategoryGlobeFaceView(category) {
  if (!category) return null;
  const center = GLOBE_FACE_CENTER_BY_CATEGORY[category];
  if (!center) return null;
  return { lat: center.lat, lng: center.lng };
}

/** 새로고침·다른 탭에서 홈 복귀 시 랜덤 카테고리(= 랜덤 면) */
export function pickRandomGlobeCategory() {
  return GLOBE_CATEGORY_IDS[Math.floor(Math.random() * GLOBE_CATEGORY_IDS.length)];
}

/** @deprecated spots 인자는 하위 호환용 — 카메라는 5면 SSOT만 사용 */
export function getCategoryFocusView(_spots = [], category) {
  return getCategoryGlobeFaceView(category);
}
