/**
 * Trip.com 항공 검색 결과 딥링크 — /flights/ 홈은 dAirportCode를 비움.
 * @param {string} origin
 * @param {string} departIata
 * @param {string} arriveIata
 * @param {URLSearchParams} params
 */
export function buildTripcomFlightTicketsHref(origin, departIata, arriveIata, params) {
  const d = String(departIata || '').trim().toLowerCase();
  const a = String(arriveIata || '').trim().toLowerCase();
  return `${origin}/flights/${d}-to-${a}/tickets-${d}-${a}?${params.toString()}`;
}
