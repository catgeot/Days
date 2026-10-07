/** gemini-proxy `normalizeHistory` — per-turn cap (tasks.ts, no client trim on edge). */
export const MOONI_GEMINI_HISTORY_MAX_TURN_CHARS = 2000;
export const MOONI_GEMINI_HISTORY_MAX_TURNS = 12;
export const MOONI_GEMINI_HISTORY_MAX_TOTAL_CHARS = 12_000;

const MODEL_OMIT_MARKER = '\n…\n';
const USER_OMIT_PREFIX = '…\n';

/**
 * API 요청용 history 한 턴 text만 축약. UI·저장 문자열에는 쓰지 않음.
 *
 * @param {string} text
 * @param {'user' | 'model' | string} role
 * @param {number} [maxLen]
 */
export function truncateMooniHistoryTurnText(text, role, maxLen = MOONI_GEMINI_HISTORY_MAX_TURN_CHARS) {
  const raw = String(text ?? '');
  if (raw.length <= maxLen) return raw;

  if (role === 'model') {
    const lines = raw.split('\n');
    const firstLine = lines[0] ?? '';
    const headBudget = Math.min(firstLine.length, Math.floor(maxLen * 0.25), 240);
    const head = firstLine.length > headBudget ? `${firstLine.slice(0, headBudget)}…` : firstLine;
    const tailBudget = maxLen - head.length - MODEL_OMIT_MARKER.length;
    if (tailBudget < 40) {
      return `${raw.slice(0, maxLen - 1)}…`;
    }
    return `${head}${MODEL_OMIT_MARKER}${raw.slice(-tailBudget)}`;
  }

  const tailBudget = maxLen - USER_OMIT_PREFIX.length;
  return `${USER_OMIT_PREFIX}${raw.slice(-tailBudget)}`;
}

/**
 * @param {Array<{ role?: string, text?: string }>} turns
 * @returns {Array<{ role: 'user' | 'model', text: string }>}
 */
export function prepareMooniGeminiHistory(turns) {
  /** @type {Array<{ role: 'user' | 'model', text: string }>} */
  const normalized = [];
  for (const turn of turns ?? []) {
    if (!turn || (turn.role !== 'user' && turn.role !== 'model')) continue;
    normalized.push({
      role: turn.role,
      text: truncateMooniHistoryTurnText(turn.text, turn.role),
    });
  }

  let kept = normalized.slice(-MOONI_GEMINI_HISTORY_MAX_TURNS);
  const totalLen = () => kept.reduce((sum, t) => sum + t.text.length, 0);

  while (kept.length > 1 && totalLen() > MOONI_GEMINI_HISTORY_MAX_TOTAL_CHARS) {
    kept = kept.slice(1);
  }

  if (totalLen() > MOONI_GEMINI_HISTORY_MAX_TOTAL_CHARS && kept.length === 1) {
    const only = kept[0];
    kept = [
      {
        role: only.role,
        text: truncateMooniHistoryTurnText(
          only.text,
          only.role,
          Math.min(
            MOONI_GEMINI_HISTORY_MAX_TURN_CHARS,
            MOONI_GEMINI_HISTORY_MAX_TOTAL_CHARS,
          ),
        ),
      },
    ];
  }

  for (const turn of kept) {
    if (turn.text.length > MOONI_GEMINI_HISTORY_MAX_TURN_CHARS) {
      turn.text = truncateMooniHistoryTurnText(turn.text, turn.role);
    }
  }

  return kept;
}
