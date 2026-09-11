/** Wave1.5 pilot — fixture·DB 있을 때 Tier3 패널 표시 (PROD·Preview 공통). */
export const EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS = [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'bali-galungan-season-2026',
];

/**
 * Tier3 panel for pilot events when guide data exists (fixture or DB).
 * Non-pilot events stay static Tier0~0.5 only.
 *
 * @param {string | undefined | null} eventId
 */
export function shouldShowEventTravelGuidePanel(eventId) {
  const id = String(eventId ?? '').trim();
  return Boolean(id && EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS.includes(id));
}
