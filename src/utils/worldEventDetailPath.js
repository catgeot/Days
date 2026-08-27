/**
 * @param {string | null | undefined} eventId
 * @returns {string}
 */
export function buildWorldEventDetailPath(eventId) {
  const id = String(eventId || '').trim();
  if (!id) return '/world-events';
  return `/world-events/${encodeURIComponent(id)}`;
}
