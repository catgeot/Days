/** gemini-proxy `normalizeHistory` — per-turn cap (tasks.ts, no client trim on edge). */
export const MOONI_GEMINI_HISTORY_MAX_TURN_CHARS = 2000;
export const MOONI_GEMINI_HISTORY_MAX_TURNS = 12;
export const MOONI_GEMINI_HISTORY_MAX_TOTAL_CHARS = 12_000;

const MODEL_OMIT_MARKER = '\n…\n';
const MODEL_TAIL_OMIT_PREFIX = '…(앞부분 생략)\n';
const USER_OMIT_PREFIX = '…\n';

/**
 * API 요청용 history 한 턴 text만 축약. UI·저장 문자열에는 쓰지 않음.
 *
 * @param {string} text
 * @param {'user' | 'model' | string} role
 * @param {number} [maxLen]
 */
export function truncateMooniHistoryTurnText(
  text,
  role,
  maxLen = MOONI_GEMINI_HISTORY_MAX_TURN_CHARS,
  options = {},
) {
  const raw = String(text ?? '');
  if (raw.length <= maxLen) return raw;

  if (role === 'model' && options.preferCutTail) {
    const prefix = MODEL_TAIL_OMIT_PREFIX;
    const tailBudget = maxLen - prefix.length;
    if (tailBudget < 40) {
      return raw.slice(-maxLen);
    }
    return `${prefix}${raw.slice(-tailBudget)}`;
  }

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
export function prepareMooniGeminiHistory(turns, options = {}) {
  /** @type {Array<{ role: 'user' | 'model', text: string }>} */
  const normalized = [];
  for (const turn of turns ?? []) {
    if (!turn || (turn.role !== 'user' && turn.role !== 'model')) continue;
    normalized.push({
      role: turn.role,
      text: String(turn.text ?? ''),
    });
  }

  let lastModelIdx = -1;
  for (let i = normalized.length - 1; i >= 0; i -= 1) {
    if (normalized[i].role === 'model') {
      lastModelIdx = i;
      break;
    }
  }

  for (let i = 0; i < normalized.length; i += 1) {
    const turn = normalized[i];
    const preferCutTail =
      Boolean(options.tailPreferLastModelTurn) && i === lastModelIdx && turn.role === 'model';
    turn.text = truncateMooniHistoryTurnText(turn.text, turn.role, MOONI_GEMINI_HISTORY_MAX_TURN_CHARS, {
      preferCutTail,
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
