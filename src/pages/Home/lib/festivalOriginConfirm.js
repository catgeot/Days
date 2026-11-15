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

/**
 * Enter sends a pinned city only while the suggestion list is closed and that pin was not already submitted.
 * A failed send must not ride a second Enter.
 * @param {{ suggestionsOpen?: boolean, pinnedId?: string, submittedId?: string }} input
 */
export function shouldResendPinnedOrigin(input = {}) {
  if (input.suggestionsOpen) return false;
  const pinnedId = String(input.pinnedId || '');
  if (!pinnedId) return false;
  return pinnedId !== String(input.submittedId || '');
}
