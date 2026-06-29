import { getAirportHubCoords } from './globeFlightCinema.js';

/**
 * 경도 기반 UTC offset(시) — DST 미반영 근사 (Bar jet-lag 힌트용).
 * @param {number} lng
 * @returns {number}
 */
function approximateUtcOffsetHours(lng) {
  if (!Number.isFinite(lng)) return 0;
  return Math.round(lng / 15);
}

/**
 * 출발·도착 공항 간 시차(시) — 도착지 기준 양수 = 더 서쪽/늦은 현지시.
 * @param {string} originIata
 * @param {string} destIata
 * @returns {number | null}
 */
export function estimateAirportTimezoneDiffHours(originIata, destIata) {
  const origin = getAirportHubCoords(originIata);
  const dest = getAirportHubCoords(destIata);
  if (!origin || !dest) return null;
  return approximateUtcOffsetHours(dest.lng) - approximateUtcOffsetHours(origin.lng);
}

/**
 * @param {number | null} diffHours
 * @returns {string | null}
 */
export function formatTimezoneDiffHint(diffHours) {
  if (diffHours == null) return null;
  if (diffHours === 0) return '시차 없음';
  const sign = diffHours > 0 ? '+' : '';
  return `시차 약 ${sign}${diffHours}h`;
}

/**
 * @param {{ iata: string, label: string, timeZone?: string } | null | undefined} browserSuggestion
 * @returns {string | null}
 */
export function formatBrowserTimezoneOriginHint(browserSuggestion) {
  if (!browserSuggestion?.iata) return null;
  const label = browserSuggestion.label || browserSuggestion.iata;
  return `브라우저 시간대 → ${label}(${browserSuggestion.iata}) 출발 제안`;
}
