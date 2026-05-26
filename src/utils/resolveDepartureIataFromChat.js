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
 * @param {string} userText
 * @param {Array<{ text?: string, departureLabel?: string }>} [chatHistory]
 * @returns {string | null} IATA or null
 */
export function resolveDepartureIataFromChat(userText, chatHistory = []) {
  const combined = [
    userText,
    ...chatHistory.slice(-6).flatMap((m) => [m.text ?? '', m.departureLabel ?? '']),
  ]
    .filter(Boolean)
    .join(' ');

  for (const [label, iata] of Object.entries(DEPARTURE_IATA)) {
    if (combined.includes(label)) return iata;
  }

  if (/한국|korea|korean/i.test(combined)) return 'ICN';
  return null;
}
