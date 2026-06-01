import { RENTAL_AIRPORT_HUBS } from './rentalAirportHubs.js';
import { aliasMatchesHay } from './rentalAirportMatch.js';

const MIN_ALIAS_LEN = 4;

/** 한국 도시·공항 단축 (허브 aliases와 병합 — 김포→GMP 등 세분화 우선) */
const DEPARTURE_IATA = {
  서울: 'ICN',
  인천: 'ICN',
  김포: 'GMP',
  부산: 'PUS',
  제주: 'CJU',
  seoul: 'ICN',
  incheon: 'ICN',
  busan: 'PUS',
  jeju: 'CJU',
};

/**
 * @param {import('./rentalAirportHubs.js').RentalAirportHub} hub
 * @param {string} matchedAlias
 */
function hubCityLabel(hub, matchedAlias) {
  if (/[가-힣]/.test(matchedAlias)) return matchedAlias;
  const ko = (hub.aliases || []).find((a) => /[가-힣]/.test(a));
  if (ko) return ko;
  return matchedAlias.length >= 2
    ? matchedAlias.charAt(0).toUpperCase() + matchedAlias.slice(1)
    : matchedAlias;
}

/**
 * access_route 발화에서 출발지 후보만 추출 — 목적지 지명(방콕 등)과 분리.
 * @param {string} text
 * @returns {string}
 */
function extractDepartureFragment(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return raw;

  const koFrom =
    raw.match(/^(.+?)에서(?:\s|$|[?!.])/u) ||
    raw.match(/(?:^|\s)(.+?)에서(?:\s|$|[?!.])/u);
  if (koFrom?.[1]) return koFrom[1].trim();

  const enFrom = raw.match(/\bfrom\s+(.+?)(?:\s+to\b|\s*$|,|\.|\?|!)/iu);
  if (enFrom?.[1]) return enFrom[1].trim();

  if (
    /^[\p{L}\p{N}\s.'-]{1,40}$/u.test(raw) &&
    !/(?:어떻게|가는|how\s*to\s*get)/iu.test(raw)
  ) {
    return raw;
  }

  return raw;
}

/**
 * @param {string} text
 * @returns {{ iata: string, label: string } | null}
 */
function matchDepartureInText(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  const fragment = extractDepartureFragment(raw);
  const hay = fragment.toLowerCase();

  for (const [label, iata] of Object.entries(DEPARTURE_IATA)) {
    if (hay.includes(label.toLowerCase())) {
      return { iata, label: /[가-힣]/.test(label) ? label : hubCityLabel({ aliases: [label] }, label) };
    }
  }

  let best = null;
  let bestLen = 0;
  for (const hub of RENTAL_AIRPORT_HUBS) {
    const iataLower = hub.iata.toLowerCase();
    for (const alias of hub.aliases || []) {
      const al = alias.toLowerCase();
      const isIataToken = al.length === 3 && /^[a-z]{3}$/.test(al) && al === iataLower;
      const isKorean = /[가-힣]/.test(alias);
      const minLen = isKorean ? 2 : MIN_ALIAS_LEN;
      if (al.length < minLen && !isIataToken) continue;
      if (!aliasMatchesHay(hay, alias, hub.iata)) continue;
      if (al.length > bestLen) {
        bestLen = al.length;
        best = { iata: hub.iata, label: hubCityLabel(hub, alias) };
      }
    }
  }

  if (/한국|korea|korean/i.test(hay)) {
    return { iata: 'ICN', label: '서울' };
  }

  return best;
}

/**
 * @param {string} userText
 * @param {Array<{ text?: string, departureLabel?: string, role?: string }>} [chatHistory]
 * @returns {{ iata: string, label: string } | null}
 */
function isExcludedDeparture(match, excludeIata) {
  if (!match || !excludeIata) return false;
  return String(match.iata).trim().toUpperCase() === String(excludeIata).trim().toUpperCase();
}

/**
 * @param {string} userText
 * @param {Array<{ text?: string, departureLabel?: string, role?: string }>} [chatHistory]
 * @param {{ excludeIata?: string | null }} [options]
 * @returns {{ iata: string, label: string } | null}
 */
export function resolveDepartureFromChat(userText, chatHistory = [], options = {}) {
  const excludeIata = options.excludeIata ?? null;

  const current = matchDepartureInText(userText);
  if (current && !isExcludedDeparture(current, excludeIata)) return current;

  const slice = chatHistory.slice(-6).reverse();
  for (const m of slice) {
    const fromText = matchDepartureInText(m.text);
    if (fromText && !isExcludedDeparture(fromText, excludeIata)) return fromText;
    const fromLabel = matchDepartureInText(m.departureLabel);
    if (fromLabel && !isExcludedDeparture(fromLabel, excludeIata)) return fromLabel;
  }

  return null;
}

/**
 * @param {string} userText
 * @param {Array<{ text?: string, departureLabel?: string }>} [chatHistory]
 * @returns {string | null} IATA or null (미매칭 → Trip ICN 폴백)
 */
export function resolveDepartureIataFromChat(userText, chatHistory = [], options = {}) {
  return resolveDepartureFromChat(userText, chatHistory, options)?.iata ?? null;
}

/**
 * access_route 발화에서 출발지 라벨 (칩 UI용) — 현재 턴 우선.
 * @param {string} userText
 * @param {Array<{ text?: string, departureLabel?: string, role?: string }>} [chatHistory]
 * @returns {string | null}
 */
export function resolveDepartureLabelFromChat(userText, chatHistory = []) {
  return resolveDepartureFromChat(userText, chatHistory)?.label ?? null;
}
