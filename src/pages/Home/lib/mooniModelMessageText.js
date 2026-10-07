import { ensureItineraryMarkdownLineBreaks } from '../../../utils/mooniTruncatedContinue.js';
import { sanitizeMooniModelReply } from '../../../utils/mooniReplySanitizer.js';

/** @param {{ mooniRawReply?: string, text?: string | { text?: string } }} msg */
export function getMooniModelRawText(msg) {
  if (!msg) return '';
  if (msg.mooniRawReply) return String(msg.mooniRawReply);
  if (typeof msg.text === 'object') return String(msg.text?.text ?? '');
  return String(msg.text ?? '');
}

/**
 * @param {string} raw
 * @param {{ stripPhantomTicketMention?: boolean }} [options]
 */
export function getMooniModelMarkdownForRender(raw, options = {}) {
  const { text } = sanitizeMooniModelReply(raw, options);
  return ensureItineraryMarkdownLineBreaks(text);
}
