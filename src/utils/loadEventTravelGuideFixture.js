import { EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS } from './eventTravelGuideSurface.js';

const fixtureModules = import.meta.glob(
  '../../scripts/fixtures/event-travel-guide/*.json',
  { import: 'default' },
);

/**
 * Preview·DEV용 EventTravelGuide fixture (DB 미배포 시 Tier3 QA).
 * Wave1.5 pilot eventId만 로드.
 *
 * @param {string} eventId
 */
export async function loadEventTravelGuideFixture(eventId) {
  const id = String(eventId ?? '').trim();
  if (!id || !EVENT_TRAVEL_GUIDE_PILOT_EVENT_IDS.includes(id)) return null;

  const key = Object.keys(fixtureModules).find((path) => path.endsWith(`/${id}.json`));
  if (!key) return null;

  const fixture = await fixtureModules[key]();
  return fixture && typeof fixture === 'object' ? fixture : null;
}
