import { isCloudPreviewSurface } from '../shared/cloudPreview/isCloudPreviewSurface';

/** Wave1.5 pilot — Preview QA only until G2 schema freeze. */
export const EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS = [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'bali-galungan-season-2026',
];

/**
 * Tier3 panel is suppressed on PROD and for non-pilot events.
 * Static Tier0~0.5 remains the primary detail content.
 *
 * @param {string | undefined | null} eventId
 */
export function shouldShowEventTravelGuidePanel(eventId) {
  const id = String(eventId ?? '').trim();
  if (!id || !EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS.includes(id)) return false;
  return isCloudPreviewSurface();
}
