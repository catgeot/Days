import { WORLD_EVENT_WAVE15_PILOT_EVENT_IDS } from './worldEventMedia.js';

/** Wave1.5 D5 — affiliate execution strip pilot (D5-b extends to all pilots). */
export const WORLD_EVENT_D5_PILOT_EVENT_IDS = ['bali-galungan-season-2026'];

/**
 * @param {string | null | undefined} eventId
 */
export function hasWorldEventD5Execution(eventId) {
  const id = String(eventId ?? '').trim();
  return WORLD_EVENT_D5_PILOT_EVENT_IDS.includes(id);
}

/**
 * @param {string | null | undefined} eventId
 */
export function hasWorldEventD5ShopChips(eventId) {
  return hasWorldEventD5Execution(eventId);
}

export { WORLD_EVENT_WAVE15_PILOT_EVENT_IDS };
