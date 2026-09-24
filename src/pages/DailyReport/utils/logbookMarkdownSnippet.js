const PHOTO_PLACEHOLDER_RE = /\[사진\s*\d+\]/g;

export function stripLogbookMarkdownSnippet(raw, maxLen = 220) {
  if (!raw || typeof raw !== 'string') return '';

  let s = raw.replace(PHOTO_PLACEHOLDER_RE, ' ');
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

export const LOGBOOK_PHOTO_PLACEHOLDER_RE = /\[사진\s*\d+\]/;

export function splitLogbookPhotoPlaceholders(content) {
  if (!content) return [];
  const regex = /(\[사진\s*\d+\])/g;
  return content.split(regex).filter((part) => part !== '');
}

export function parseLogbookPhotoIndex(part) {
  const match = part.match(/^\[사진\s*(\d+)\]$/);
  if (!match) return null;
  return parseInt(match[1], 10) - 1;
}
