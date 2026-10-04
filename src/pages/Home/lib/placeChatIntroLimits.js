/** save_place_chat_intro 와 같은 검사. Postgres char_length = 유니코드 코드포인트. */

export const PLACE_CHAT_INTRO_MIN_CHARS = 40;
export const PLACE_CHAT_INTRO_MAX_CHARS = 1200;
export const PLACE_CHAT_INTRO_KEY_MAX_CHARS = 120;

function pgBtrim(value) {
  return String(value ?? '').replace(/^ +| +$/g, '');
}

export function placeChatIntroCodePoints(value) {
  return Array.from(pgBtrim(value)).length;
}

const SUMMARY_CONTROL_RE = /[\u0001-\u0009\u000b-\u001f\u007f<>]/;
const SUMMARY_URL_RE = /https?:|www\.|:\/\/|javascript:|data:/i;
const KEY_CONTROL_RE = /[\u0000-\u001f\u007f-\u009f<>\\]/;
const KEY_URL_RE = /https?:|www\.|:\/\//i;

export function isPlaceChatIntroSummaryAccepted(summary) {
  const text = pgBtrim(summary);
  const n = Array.from(text).length;
  if (n < PLACE_CHAT_INTRO_MIN_CHARS || n > PLACE_CHAT_INTRO_MAX_CHARS) return false;
  if (SUMMARY_CONTROL_RE.test(text)) return false;
  if (SUMMARY_URL_RE.test(text)) return false;
  return true;
}

export function isPlaceChatIntroKeyAccepted(destinationKey) {
  const key = pgBtrim(destinationKey);
  const n = Array.from(key).length;
  if (n < 1 || n > PLACE_CHAT_INTRO_KEY_MAX_CHARS) return false;
  if (KEY_CONTROL_RE.test(key)) return false;
  if (KEY_URL_RE.test(key)) return false;
  return true;
}

export function isPlaceChatIntroRpcLength(summary) {
  return isPlaceChatIntroSummaryAccepted(summary);
}
