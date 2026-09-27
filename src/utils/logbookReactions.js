/** Stored public likes. Missing column (pre-migration) stays hidden. */
export function readLogbookLikeCount(report) {
  return readNonNegativeInt(report?.like_count);
}

/** Stored public comments. Missing column (pre-migration) stays hidden. */
export function readLogbookCommentCount(report) {
  return readNonNegativeInt(report?.comment_count);
}

export const LOGBOOK_COMMENT_MAX = 500;
export const LOGBOOK_COMMENTS_HASH = 'logbook-comments';

export function logbookCommentsHref(path) {
  const base = String(path || '').trim();
  if (!base) return '';
  return `${base}#${LOGBOOK_COMMENTS_HASH}`;
}

export function nextLogbookLikeState({ liked, likeCount }) {
  const nextLiked = !liked;
  const base = Number.isFinite(likeCount) ? likeCount : 0;
  return {
    liked: nextLiked,
    likeCount: Math.max(0, base + (nextLiked ? 1 : -1)),
  };
}

export function normalizeLogbookCommentBody(raw) {
  const body = String(raw ?? '').trim();
  if (!body) return '';
  return body.slice(0, LOGBOOK_COMMENT_MAX);
}

export function isLogbookReactionSchemaMissing(error) {
  if (!error) return false;
  const code = String(error.code || '');
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST204') return true;
  const msg = String(error.message || '');
  return /does not exist|schema cache|Could not find/i.test(msg)
    && /report_likes|report_comments|like_count|comment_count/i.test(msg);
}

export function chunkList(items, size = 100) {
  const list = Array.isArray(items) ? items : [];
  const n = Number.isFinite(size) && size > 0 ? Math.floor(size) : 100;
  const out = [];
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out;
}

function readNonNegativeInt(raw) {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}
