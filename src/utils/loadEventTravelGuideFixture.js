const fixtureModules = import.meta.glob(
  '../../scripts/fixtures/event-travel-guide/*.json',
  { import: 'default' },
);

/**
 * EventTravelGuide fixture (Wave1 #1~#4). DB row 없을 때 PROD·Preview 공통 폴백.
 * @param {string} eventId
 */
export async function loadEventTravelGuideFixture(eventId) {
  const id = String(eventId ?? '').trim();
  if (!id) return null;

  const key = Object.keys(fixtureModules).find((path) => path.endsWith(`/${id}.json`));
  if (!key) return null;

  const fixture = await fixtureModules[key]();
  return fixture && typeof fixture === 'object' ? fixture : null;
}
