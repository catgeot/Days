import { buildMooniContinueUserText, mergeMooniContinuation } from '../../../utils/mooniTruncatedContinue.js';
import { sanitizeMooniModelReply } from '../../../utils/mooniReplySanitizer.js';

export function messageTextPlain(msg) {
  if (!msg) return '';
  if (typeof msg.text === 'object') return String(msg.text?.text ?? '');
  return String(msg.text ?? '');
}

/**
 * @param {Array<{ role?: string, mooniRawReply?: string, text?: string }>} messages
 * @param {number} modelIndex
 */
export function buildMooniGeminiHistory(messages, modelIndex) {
  /** @type {Array<{ role: string, text: string }>} */
  const history = [];
  for (let i = 0; i < modelIndex; i += 1) {
    const m = messages[i];
    if (m?.role === 'user') {
      history.push({ role: 'user', text: messageTextPlain(m) });
    } else if (m?.role === 'model') {
      history.push({
        role: 'model',
        text: String(m.mooniRawReply ?? messageTextPlain(m)),
      });
    }
  }
  return history;
}

/**
 * @param {{
 *   priorRaw: string,
 *   continuationText: string,
 *   stripPhantomTicketMention?: boolean,
 * }} params
 */
export function finalizeMooniContinuation({
  priorRaw,
  continuationText,
  stripPhantomTicketMention = true,
}) {
  const mergedRaw = mergeMooniContinuation(priorRaw, continuationText);
  const { text: displayText, hadBracketLinks } = sanitizeMooniModelReply(mergedRaw, {
    stripPhantomTicketMention,
  });
  return { mergedRaw, displayText, hadBracketLinks };
}

export { buildMooniContinueUserText };
