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
