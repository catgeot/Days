/** Place summary / cards — 3D tour eligibility without pulling globe3d or three. */
export function canStartGlobeTour(location) {
  if (!location || location.isScanning) return false;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}
