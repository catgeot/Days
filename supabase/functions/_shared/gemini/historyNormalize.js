export const HISTORY_TURN_MAX = 2000;
export const MODEL_TAIL_OMIT_PREFIX = "…(앞부분 생략)\n";
const USER_OMIT_PREFIX = "…\n";

/**
 * Over-cap turns are trimmed. Model turns keep the end (the cut point).
 * @param {string} role
 * @param {string} text
 * @param {number} [maxLen]
 */
export function trimHistoryTurnText(role, text, maxLen = HISTORY_TURN_MAX) {
  const raw = String(text ?? "");
  if (raw.length <= maxLen) return raw;
  if (role === "model") {
    const prefix = MODEL_TAIL_OMIT_PREFIX;
    const tailBudget = maxLen - prefix.length;
    if (tailBudget < 40) return raw.slice(-maxLen);
    return `${prefix}${raw.slice(-tailBudget)}`;
  }
  const tailBudget = maxLen - USER_OMIT_PREFIX.length;
  if (tailBudget < 1) return raw.slice(-maxLen);
  return `${USER_OMIT_PREFIX}${raw.slice(-tailBudget)}`;
}
