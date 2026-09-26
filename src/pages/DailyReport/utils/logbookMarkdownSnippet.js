const PHOTO_PLACEHOLDER_RE = /\[사진\s*\d+\]/g;
const LEGACY_PHOTO_PLACEHOLDER_RE = /\[LOGBOOK_PHOTO:\s*(\d+)\]/gi;

/** Canonical embed token in markdown: `[사진 1]` (1-based, matches parseLogbookPhotoIndex). */
export function normalizeLogbookPhotoPlaceholders(content) {
  if (!content || typeof content !== 'string') return content || '';
  return content.replace(LEGACY_PHOTO_PLACEHOLDER_RE, (_, idx) => {
    const n = parseInt(idx, 10);
    if (!Number.isFinite(n) || n < 0) return _;
    return `[사진 ${n + 1}]`;
  });
}

export function stripLogbookMarkdownSnippet(raw, maxLen = 220) {
  if (!raw || typeof raw !== 'string') return '';

  let s = normalizeLogbookPhotoPlaceholders(raw);
  s = s.replace(PHOTO_PLACEHOLDER_RE, ' ');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/_([^_]+)_/g, '$1');
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  s = s.replace(/^---+$/gm, ' ');
  s = s.replace(/\n+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  if (maxLen > 0 && s.length > maxLen) {
    return `${s.slice(0, maxLen).trim()}…`;
  }
  return s;
}

export const LOGBOOK_PHOTO_PLACEHOLDER_RE = /\[사진\s*\d+\]|\[LOGBOOK_PHOTO:\s*\d+\]/i;

export function contentHasLogbookPhotoPlaceholders(content) {
  return LOGBOOK_PHOTO_PLACEHOLDER_RE.test(normalizeLogbookPhotoPlaceholders(content || ''));
}

export function splitLogbookPhotoPlaceholders(content) {
  if (!content) return [];
  const normalized = normalizeLogbookPhotoPlaceholders(content);
  const regex = /(\[사진\s*\d+\])/g;
  return normalized.split(regex).filter((part) => part !== '');
}

export function parseLogbookPhotoIndex(part) {
  const match = part.match(/^\[사진\s*(\d+)\]$/);
  if (!match) return null;
  return parseInt(match[1], 10) - 1;
}
