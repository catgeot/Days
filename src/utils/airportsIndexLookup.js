/**
 * OurAirports 경량 인덱스 — rentalAirportHubs에 없는 IATA 좌표 폴백 (시네마 arc 전용).
 * 배너·렌터카 매칭은 rentalAirportHubs SSOT 유지.
 *
 * SSOT 생성: npm run generate:airports-index
 */
import airportsIndexData from '../pages/Home/data/airportsIndex.json' with { type: 'json' };

/** @type {Map<string, { lat: number, lng: number }> | null} */
let byIata = null;

function buildIndex() {
  if (byIata) return byIata;
  byIata = new Map();
  const entries = airportsIndexData?.byIata ?? {};
  for (const [code, row] of Object.entries(entries)) {
    const lat = row?.lat;
    const lng = row?.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    byIata.set(String(code).trim().toUpperCase(), { lat, lng });
  }
  return byIata;
}

/** @param {string} iata */
export function getAirportsIndexCoords(iata) {
  const code = String(iata || '').trim().toUpperCase();
  if (!code) return null;
  const row = buildIndex().get(code);
  if (!row) return null;
  return { iata: code, lat: row.lat, lng: row.lng };
}

export function getAirportsIndexMeta() {
  return {
    generatedAt: airportsIndexData?.generatedAt ?? null,
    count: airportsIndexData?.count ?? buildIndex().size,
    rentalHubCount: airportsIndexData?.rentalHubCount ?? null,
    source: airportsIndexData?.source ?? null,
  };
}

const toRad = (deg) => (deg * Math.PI) / 180;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * uiPlace·좌표 핀 — rental 허브 밖 scheduled 공항 (arc 도착 IATA).
 * @param {number} lat
 * @param {number} lng
 * @param {{ maxKm?: number }} [options]
 * @returns {{ iata: string, lat: number, lng: number, km: number } | null}
 */
export function findNearestAirportInIndex(lat, lng, options = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const maxKm = options.maxKm ?? 650;

  let best = null;
  let bestKm = Infinity;
  for (const [code, row] of buildIndex()) {
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng)) continue;
    const km = haversineKm(lat, lng, row.lat, row.lng);
    if (km < bestKm) {
      bestKm = km;
      best = { iata: code, lat: row.lat, lng: row.lng, km };
    }
  }

  if (!best || bestKm > maxKm) return null;
  return best;
}
