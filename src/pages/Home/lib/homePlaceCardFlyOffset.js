export const PLACE_CARD_FLY_OFFSET_DESKTOP_MIN = 1024;

/**
 * Degrees to aim the camera south of a pin so the pin sits in the open
 * space above the bottom summary card. Pixel shift stays roughly constant
 * across zoom; desktop (side card) is unchanged.
 */
export function placeCardFlyLatitudeOffsetDeg({
  viewportHeight = 844,
  zoom = 2.35,
} = {}) {
  const worldSize = 512 * 2 ** Number(zoom);
  const radius = worldSize / (2 * Math.PI);
  const pxPerDeg = (radius * Math.PI) / 180;
  if (!Number.isFinite(pxPerDeg) || pxPerDeg <= 0) return 12;
  const shiftPx = Math.min(200, Math.max(120, Number(viewportHeight) * 0.22));
  const deg = shiftPx / pxPerDeg;
  return Math.min(26, Math.max(10, Number(deg.toFixed(2))));
}

export function offsetPlaceCardFlyCenter(lat, lng, {
  viewportWidth = 390,
  viewportHeight = 844,
  zoom = 2.35,
  desktopMinWidth = PLACE_CARD_FLY_OFFSET_DESKTOP_MIN,
} = {}) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { lat: latitude, lng: longitude };
  }
  if (Number(viewportWidth) >= desktopMinWidth) {
    return { lat: latitude, lng: longitude };
  }
  const delta = placeCardFlyLatitudeOffsetDeg({ viewportHeight, zoom });
  const shifted = Math.max(-85, Math.min(85, latitude - delta));
  return { lat: shifted, lng: longitude };
}
