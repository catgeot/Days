import { GeminiProxyError } from './geminiProxyError.js';

/**
 * Chip ids the production Edge already accepts (prompt bundle before festival chips).
 * A client that ships first must retry with one of these, or with no chip.
 */
export const LEGACY_MOONI_CHIP_IDS = [
  'prep_flight',
  'visa_docs',
  'prep_hotel',
  'prep_transport',
  'access_origin',
  'from_seoul',
  'from_busan',
  'from_incheon',
  'ferry',
  'place_overview',
  'safety_vibe',
  'history',
  'why_go',
  'activities',
  'food',
  'itinerary',
  'companion',
];

const LEGACY_SET = new Set(LEGACY_MOONI_CHIP_IDS);

/** Nearest legacy chip when prod Edge rejects a festival chip id. */
export const MOONI_CHIP_EDGE_FALLBACK = {
  festival_sights: 'activities',
  festival_access: 'access_origin',
  festival_nearby: 'food',
  festival_day: 'itinerary',
  festival_overseas_visa: 'visa_docs',
  festival_overseas_flight: 'prep_flight',
  festival_overseas_airport: 'access_origin',
};

/**
 * @param {unknown} error
 */
export function isUnknownChipBadRequest(error) {
  if (!(error instanceof GeminiProxyError)) return false;
  if (error.kind !== 'generic') return false;
  if (error.errorCode === 'bad_request' || error.httpStatus === 400) return true;
  return /\bbad_request\b/.test(String(error.devDetail || ''));
}

/**
 * One retry when prod Edge does not know a new chip id yet.
 * Known legacy chips are not remapped. The retry is plain text when no neighbor exists.
 *
 * @param {(params: object) => Promise<unknown>} invoke
 * @param {object} params
 */
export async function invokeMooniChatToleratingChip(invoke, params) {
  try {
    return await invoke(params);
  } catch (error) {
    const chipId = params?.chipId == null || params.chipId === '' ? '' : String(params.chipId);
    if (!chipId || LEGACY_SET.has(chipId) || !isUnknownChipBadRequest(error)) throw error;
    const fallback = Object.prototype.hasOwnProperty.call(MOONI_CHIP_EDGE_FALLBACK, chipId)
      ? MOONI_CHIP_EDGE_FALLBACK[chipId]
      : null;
    return invoke({ ...params, chipId: fallback });
  }
}
