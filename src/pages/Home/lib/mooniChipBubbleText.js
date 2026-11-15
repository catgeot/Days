/**
 * Chip taps send a long instruction to the model. The user bubble shows a short label.
 * Restored threads that still store the instruction map back to the same label.
 */
import { FESTIVAL_CHIP_BUBBLES } from './mooniChipInstruction.js';

export { FESTIVAL_CHIP_BUBBLES } from './mooniChipInstruction.js';

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

/** Short label for a chip instruction. Other text is returned unchanged. */
export function mooniUserBubbleText(text) {
  const raw = compact(text);
  if (!raw) return '';
  const row = FESTIVAL_CHIP_BUBBLES.find((item) => item.sendKo === raw || item.sendEn === raw);
  if (!row) return raw;
  return row.sendEn === raw ? row.bubbleEn : row.bubbleKo;
}

/** Instruction for the model. The bubble label stays on `text`. */
export function mooniUserPromptText(message) {
  const prompt = compact(message?.mooniPromptText);
  if (prompt) return prompt;
  if (!message) return '';
  if (typeof message.text === 'object') return compact(message.text?.text);
  return compact(message.text);
}
