import { ensureItineraryMarkdownLineBreaks } from '../../../utils/mooniTruncatedContinue.js';
import { recoverMooniCollapsedGfmTables } from '../../../utils/mooniGfmTableRecover.js';
import { sanitizeMooniMarkdownLinks } from '../../../utils/mooniPlaceholderUrls.js';
import { sanitizeMooniModelReply } from '../../../utils/mooniReplySanitizer.js';
import { normalizeMooniMarkdownBoldSpacing } from '../../../utils/mooniMarkdownBoldSpacing.js';
import { stripMooniScheduleTrailingPipes } from '../../../utils/mooniMarkdownScheduleLine.js';
import { continueMooniOrderedListNumbers } from '../../../utils/mooniMarkdownOrderedList.js';

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
  const preTable = recoverMooniCollapsedGfmTables(raw);
  const { text } = sanitizeMooniModelReply(preTable, options);
  let md = recoverMooniCollapsedGfmTables(text);
  md = stripMooniScheduleTrailingPipes(md);
  md = continueMooniOrderedListNumbers(md);
  md = ensureItineraryMarkdownLineBreaks(sanitizeMooniMarkdownLinks(md));
  return normalizeMooniMarkdownBoldSpacing(md);
}
