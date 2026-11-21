/**
 * 지구본 우상단 컨트롤(무드·젠·마커·임시핀)은 홈에서만 보인다.
 * /place/:slug 와 /place/:slug/reviews 는 장소 카드가 그 자리를 쓴다.
 */
export function shouldShowGlobeHomeControls({
  pathname = '',
  isPlaceCardVisible = false,
} = {}) {
  if (isPlaceCardVisible) return false;
  const path = String(pathname || '');
  if (path.startsWith('/place/')) return false;
  return true;
}
