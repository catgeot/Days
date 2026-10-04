export const PLACE_CHAT_INTRO_MIN_CHARS = 40;
export const PLACE_CHAT_INTRO_MAX_CHARS = 1200;

/** save_place_chat_intro 는 이 길이만 받는다. 밖이면 RPC를 호출하지 않는다. */
export function isPlaceChatIntroRpcLength(summary) {
  const n = String(summary ?? '').trim().length;
  return n >= PLACE_CHAT_INTRO_MIN_CHARS && n <= PLACE_CHAT_INTRO_MAX_CHARS;
}
