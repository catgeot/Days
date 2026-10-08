/**
 * save_place_chat_intro sentence-end guard (PREVENTION ⑥).
 * Keep in sync with supabase/migrations/20261008120000_save_place_chat_intro_sentence_end.sql
 */

/** Punctuation close — matches placeChatIntroLimits / gemini call.ts SUMMARY_SENTENCE_END_RE. */
export const PLACE_CHAT_INTRO_SENTENCE_END_RE = /[.!?。！？…]["'”’」』)\]]*\s*$/;

/** Mirrors Postgres btrim() on summary/key for PREVENTION ⑥ (RPC applies btrim before checks). */
export function pgBtrimSpaces(value) {
  return String(value ?? '').trim();
}

/**
 * @param {string} summary
 * @returns {'empty'|'trailing_punct'|'unclosed_markdown'|'mid_sentence_end'|null}
 */
export function placeChatIntroSentenceEndRejectReason(summary) {
  const text = pgBtrimSpaces(summary);
  if (!text) return 'empty';
  if (/[,;:：，、]\s*$/.test(text)) return 'trailing_punct';
  const starPairs = (text.match(/\*\*/g) || []).length;
  if (starPairs % 2 === 1) return 'unclosed_markdown';
  const backticks = (text.match(/`/g) || []).length;
  if (backticks % 2 === 1) return 'unclosed_markdown';
  if (!PLACE_CHAT_INTRO_SENTENCE_END_RE.test(text)) return 'mid_sentence_end';
  return null;
}

export function isPlaceChatIntroSentenceComplete(summary) {
  return placeChatIntroSentenceEndRejectReason(summary) === null;
}
