/** 카테고리 매칭·지구본 5면 카메라 SSOT (Mapbox·legacy 공통) */

export const GLOBE_CATEGORY_IDS = ['paradise', 'nature', 'urban', 'culture', 'adventure'];

/** 경도 360°를 카테고리 5개로 균등 분할 (각 72°) — 담당 권역 경계 */
export const GLOBE_FACE_SECTOR_DEG = 360 / GLOBE_CATEGORY_IDS.length;

/**
 * 면 pan 중심 — 사용자 큐레이션 (줌 유지 pan, 최대 확대 시 바다는 불가피).
 * 카테고리 버튼 순서: paradise → nature → urban → culture → adventure
 */
export const GLOBE_FACE_CENTER_BY_CATEGORY = {
  paradise: { lng: 126.978, lat: 37.566 },   // 서울
  nature: { lng: 24.0, lat: 6.0 },             // 아프리카 (동아프리카·킬리만자로 권)
  urban: { lng: 10.752, lat: 59.913 },         // 오슬로 (유럽)
  culture: { lng: -93.265, lat: 44.977 },      // 미니애폴리스 (북미)
  adventure: { lng: -58.0, lat: -15.0 }        // 남미 (브라질 중부)
};

/** 면 전환 pan flyTo 시간 — 줌·고도 변경 없음 */
export const GLOBE_FACE_FLY_MS = 2200;

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

/** 카테고리 버튼·홈 진입 시 pan 대상 (육지 편향 중심, 줌·고도는 호출 측 현재값 유지) */
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
