/** @param {number | null | undefined} km */
export function formatFestivalDistKm(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))}m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)}km`;
}
