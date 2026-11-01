/**
 * 한국 공항 IATA — rentalAirportMatch ↔ flightOriginMetroGateways 순환 import를 피하려고 leaf로 둔다.
 * SHO 금지: IATA SHO는 에스와티니(airportsIndex) · 구 속초는 YNY.
 */
export const KOREA_AIRPORT_IATAS = new Set([
  'ICN',
  'GMP',
  'SEL',
  'CJU',
  'PUS',
  'CJJ',
  'TAE',
  'KWJ',
  'RSU',
  'USN',
  'HIN',
  'KUV',
  'WJU',
  'YNY',
  'MWX',
  'KPO',
]);

const SEOUL_METRO_IATAS = new Set(['ICN', 'GMP', 'SEL']);

function normalizeIata(value) {
  return String(value ?? '').trim().toUpperCase();
}

/** 출·도착이 모두 한국 공항 — 국내선 (경유 hub 조회 불필요) */
export function isKoreaDomesticFlightOd(originIata, destIata) {
  const origin = normalizeIata(originIata);
  const dest = normalizeIata(destIata);
  if (origin === dest) return false;
  return KOREA_AIRPORT_IATAS.has(origin) && KOREA_AIRPORT_IATAS.has(dest);
}

/** 서울권 밖 한국 도착 공항 (제주·김해·여수 등) */
export function isKoreaDomesticDestIata(destIata) {
  const dest = normalizeIata(destIata);
  return KOREA_AIRPORT_IATAS.has(dest) && !SEOUL_METRO_IATAS.has(dest);
}
