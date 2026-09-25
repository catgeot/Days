import { stripLogbookMarkdownSnippet } from '../pages/DailyReport/utils/logbookMarkdownSnippet.js';

export const LOGBOOK_DETAIL_TITLE_CLASS =
  'text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight leading-snug break-keep break-words';

export const LOGBOOK_DETAIL_DEK_CLASS =
  'text-base font-normal text-gray-600 leading-relaxed break-keep break-words mt-3 mb-8 sm:mb-10';

function normalizePlain(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

const MARKDOWN_NUMBERED_HEADING_RE = /^#{1,6}\s*\d+\.\s/;
const PLAIN_NUMBERED_HEADING_RE = /^\d+\.\s+\S/;

function isNumberedSectionHeadingOnly(block) {
  const trimmed = String(block || '').trim();
  if (!trimmed) return false;
  if (MARKDOWN_NUMBERED_HEADING_RE.test(trimmed)) {
    const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean);
    return lines.every((line) => MARKDOWN_NUMBERED_HEADING_RE.test(line));
  }

  const stripped = stripLogbookMarkdownSnippet(trimmed, 0);
  if (!PLAIN_NUMBERED_HEADING_RE.test(stripped)) return false;

  const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean);
  const strippedLines = lines
    .map((line) => stripLogbookMarkdownSnippet(line, 0))
    .map((line) => line.trim())
    .filter(Boolean);

  return strippedLines.length > 0 && strippedLines.every((line) => PLAIN_NUMBERED_HEADING_RE.test(line));
}

function leadFromBlock(block) {
  const lead = stripLogbookMarkdownSnippet(block, 0).trim();
  if (!lead || isNumberedSectionHeadingOnly(block)) return '';
  return lead;
}

export function extractLogbookLeadParagraph(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const lead = leadFromBlock(block);
    if (lead) return lead;
  }

  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const lead = leadFromBlock(line);
    if (lead) return lead;
  }

  return '';
}

/**
 * Subtitle under the title: explicit `dek` on the row, else first body lead (not the title).
 */
export function resolveLogbookDek(report, { maxLeadLen = 480 } = {}) {
  if (!report) return '';
  const titleNorm = normalizePlain(report.title);
  const explicit = normalizePlain(report.dek ?? report.excerpt ?? '');
  if (explicit && explicit !== titleNorm) {
    return maxLeadLen > 0 && explicit.length > maxLeadLen
      ? `${explicit.slice(0, maxLeadLen).trim()}…`
      : explicit;
  }

  const lead = extractLogbookLeadParagraph(report.content);
  const leadNorm = normalizePlain(lead);
  if (!leadNorm || leadNorm === titleNorm) return '';

  if (maxLeadLen > 0 && leadNorm.length > maxLeadLen) {
    return `${leadNorm.slice(0, maxLeadLen).trim()}…`;
  }
  return leadNorm;
}

export function resolveLogbookFeedExcerpt(report, maxLen = 160) {
  const dek = resolveLogbookDek(report, { maxLeadLen: maxLen });
  if (dek) return dek;
  return stripLogbookMarkdownSnippet(report?.content, maxLen);
}
