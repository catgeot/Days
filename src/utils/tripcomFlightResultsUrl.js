import { addDaysYmd, todayYmd } from './tripcomFlightDateRange.js';

/**
 * Trip.com 항공 검색 결과 딥링크 — /flights/ 홈은 항공+호텔 검색박스라 출도착이 비거나 이전 검색이 남음.
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

function isOneWayTripType(value) {
  const raw = String(value || '').trim().toLowerCase();
  return ['ow', 'oneway', 'one-way', 'oway'].includes(raw);
}

/**
 * tickets 결과 URL용 일정. 검색바에 일정이 없으면 +14/+21(왕복)으로 채워 항공 검색 페이지로 직행.
 * @param {{ tripType?: unknown, departDate?: string | null, returnDate?: string | null, today?: string }} [opts]
 * @returns {{ ddate: string, rdate: string, tripType: 'RT' | 'OW' }}
 */
export function resolveTripcomFlightTicketsDates(opts = {}) {
  const today = opts.today || todayYmd();
  const outbound = opts.departDate || addDaysYmd(today, 14);
  if (isOneWayTripType(opts.tripType)) {
    return { ddate: outbound, rdate: '', tripType: 'OW' };
  }
  const inbound =
    opts.returnDate && opts.returnDate > outbound
      ? opts.returnDate
      : addDaysYmd(outbound, 7);
  return { ddate: outbound, rdate: inbound, tripType: 'RT' };
}
