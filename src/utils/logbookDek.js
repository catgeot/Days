import { stripLogbookMarkdownSnippet } from '../pages/DailyReport/utils/logbookMarkdownSnippet.js';

export const LOGBOOK_DETAIL_TITLE_CLASS =
  'text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight leading-snug break-keep break-words';

export const LOGBOOK_DETAIL_DEK_CLASS =
  'text-base font-normal text-gray-600 leading-relaxed break-keep break-words mt-3 mb-8 sm:mb-10';

function normalizePlain(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

export function extractLogbookLeadParagraph(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const first = blocks[0] || normalized.split('\n').find((line) => line.trim()) || '';
  return stripLogbookMarkdownSnippet(first, 0);
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
