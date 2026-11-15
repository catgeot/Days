import { shouldConfirmHangulEntry } from '../../../utils/hangulSearch.js';

/**
 * Keyboard send confirms only a single non-choseong, non-typo candidate, and never during IME composition.
 * @param {{ composing?: boolean, key?: string, suggestion?: { confirmOnEnter?: boolean, cities?: unknown[] }, send?: (city: unknown) => void }} input
 */
export function tryOriginKeyboardConfirm(input = {}) {
  if (!shouldConfirmHangulEntry({ composing: input.composing === true, key: input.key || 'Enter' })) {
    return false;
  }
  const cities = input.suggestion?.cities || [];
  if (input.suggestion?.confirmOnEnter !== true || cities.length !== 1) return false;
  input.send?.(cities[0]);
  return true;
}
