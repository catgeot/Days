/**
 * Mapbox globe — 클릭/드래그가 지구본 디스크 밖(우주)이면 무시.
 * event.point · map.project 와 동일한 CSS 픽셀 좌표계.
 */

function getGlobeRadiusPx(map) {
  const tr = map?.transform;
  if (tr && typeof tr.getGlobeRadius === 'function') {
    return tr.getGlobeRadius();
  }
  const zoom = map.getZoom();
  const worldSize = tr?.worldSize ?? 512 * 2 ** zoom;
  return worldSize / (2 * Math.PI);
}

function getViewportGlobeCenter(map) {
  const container = map.getContainer?.();
  if (!container) return { cx: 0, cy: 0 };
  return {
    cx: container.clientWidth / 2,
    cy: container.clientHeight / 2
  };
}

export function isScreenPointOnGlobe(map, point) {
  if (!map || !point || typeof point.x !== 'number' || typeof point.y !== 'number') {
    return false;
  }

  const projection = map.getProjection?.()?.name ?? map.transform?.projection?.name;
  if (projection !== 'globe') return true;

  const { cx, cy } = getViewportGlobeCenter(map);
  const dx = point.x - cx;
  const dy = point.y - cy;
  const distSq = dx * dx + dy * dy;

  const radius = getGlobeRadiusPx(map);
  const viewportHalfDiag = Math.hypot(cx, cy) + 8;
  if (radius >= viewportHalfDiag) return true;

  // 대기권 halo 바깥(별/우주) 클릭 제외
  const maxDist = radius * 0.96;
  return distSq <= maxDist * maxDist;
}

function pickEventPoint(event) {
  if (event?.point) return event.point;
  if (Array.isArray(event?.points) && event.points[0]) return event.points[0];
  return null;
}

export function clientCoordsToMapPoint(map, clientX, clientY) {
  const container = map?.getContainer?.();
  if (!container || typeof clientX !== 'number' || typeof clientY !== 'number') return null;
  const rect = container.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function isClientPointOnGlobe(map, clientX, clientY) {
  const point = clientCoordsToMapPoint(map, clientX, clientY);
  return point ? isScreenPointOnGlobe(map, point) : false;
}

export function isMapEventOnGlobe(map, event) {
  const point = pickEventPoint(event);
  if (point) return isScreenPointOnGlobe(map, point);
  const original = event?.originalEvent;
  if (original && typeof original.clientX === 'number') {
    return isClientPointOnGlobe(map, original.clientX, original.clientY);
  }
  return false;
}

/** 우주에서 시작한 pan/drag 가 지구본을 당기지 않도록 */
export function bindGlobeSpaceDragGuard(map) {
  if (!map || map._gateoSpaceDragGuard) return () => {};

  let dragBlocked = false;

  const onPointerDown = (event) => {
    const point = pickEventPoint(event);
    if (!point) return;
    if (isScreenPointOnGlobe(map, point)) {
      dragBlocked = false;
      return;
    }
    dragBlocked = true;
    try {
      map.dragPan.disable();
      map.stop();
    } catch {
      // ignore
    }
  };

  const onPointerUp = () => {
    if (!dragBlocked) return;
    dragBlocked = false;
    try {
      map.dragPan.enable();
    } catch {
      // ignore
    }
  };

  const onDragStart = (event) => {
    const point = pickEventPoint(event);
    if (!point || isScreenPointOnGlobe(map, point)) return;
    try {
      map.stop();
      map.dragPan.disable();
      dragBlocked = true;
    } catch {
      // ignore
    }
  };

  map.on('mousedown', onPointerDown);
  map.on('touchstart', onPointerDown);
  map.on('mouseup', onPointerUp);
  map.on('touchend', onPointerUp);
  map.on('touchcancel', onPointerUp);
  map.on('dragstart', onDragStart);

  map._gateoSpaceDragGuard = true;

  return () => {
    map.off('mousedown', onPointerDown);
    map.off('touchstart', onPointerDown);
    map.off('mouseup', onPointerUp);
    map.off('touchend', onPointerUp);
    map.off('touchcancel', onPointerUp);
    map.off('dragstart', onDragStart);
    delete map._gateoSpaceDragGuard;
    try {
      map.dragPan.enable();
    } catch {
      // ignore
    }
  };
}
