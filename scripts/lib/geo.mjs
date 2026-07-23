/** Shared geo helpers for attraction/settlement audits. */

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function haversineM(lat1, lng1, lat2, lng2) {
  return haversineKm(lat1, lng1, lat2, lng2) * 1000;
}

export function decimalPlaces(n) {
  const s = String(n);
  if (!s.includes('.')) return 0;
  return s.split('.')[1].replace(/0+$/, '').length || s.split('.')[1].length;
}

export function normalizeKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

/** Wide / island hubs — distance soft limits only; not a substitute for POI verify. */
export const WIDE_HUB_IDS = new Set([
  'palawan',
  'crete',
  'ongjin',
  'sinan',
  'fiji',
  'chongqing',
  'cappadocia',
  'cinque-terre',
  'bora-bora',
  'tahiti',
  'mauritius',
  'hawaii',
  'honolulu',
]);

export function isKrHub(hub) {
  const c = String(hub?.country_en || hub?.country || '').toLowerCase();
  return (
    c.includes('korea') ||
    c.includes('한국') ||
    hub?.country === '대한민국' ||
    hub?.country_en === 'South Korea'
  );
}
