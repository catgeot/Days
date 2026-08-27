const fixtureModules = import.meta.glob(
  '../../scripts/fixtures/event-travel-guide/*.json',
  { import: 'default' },
);

/**
 * Preview·DEV용 EventTravelGuide fixture (DB 미배포 시 Tier3 QA).
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
