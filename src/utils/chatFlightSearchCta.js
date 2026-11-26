function normalizeBookingIata(value) {
  const code = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : '';
}

/** MOONi 교통·티켓 — 출발·도착 게이트웨이 IATA가 같으면 항공 CTA 생략(육로·픽업만). */
export function shouldShowChatFlightSearchCta(departureIata, arrivalIata) {
  const depart = normalizeBookingIata(departureIata);
  const arrive = normalizeBookingIata(arrivalIata);
  if (!depart || !arrive) return true;
  return depart !== arrive;
}