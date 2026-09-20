/** 홈 지구본에서만 브라우저 페이지 핀치 줌을 잠근다. /place 본문 핀치는 유지. */

export function shouldLockHomeGlobePageZoom(pathname) {
  if (typeof pathname !== 'string' || !pathname) return false;
  if (pathname.startsWith('/place/')) return false;
  if (pathname === '/') return true;
  if (pathname.startsWith('/explore')) return true;
  return false;
}

export function isMultiTouchMapEvent(event) {
  const native = event?.originalEvent;
  const touchCount = native?.touches?.length ?? native?.targetTouches?.length ?? 0;
  if (touchCount >= 2) return true;
  if (Array.isArray(event?.points) && event.points.length >= 2) return true;
  return false;
}
