/** Stored public reads. Missing column (pre-migration) stays hidden. */
export function readLogbookViewCount(report) {
  const raw = report?.view_count;
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export function logbookViewSessionKey(reportId) {
  const id = String(reportId ?? '').trim();
  if (!id) return '';
  return `viewed_report_${id}`;
}

/** One increment per browser session, same idea as place-review views. */
export function claimLogbookViewSession(reportId, storage) {
  const key = logbookViewSessionKey(reportId);
  if (!key || !storage || typeof storage.getItem !== 'function') return false;
  if (storage.getItem(key)) return false;
  storage.setItem(key, '1');
  return true;
}

export function releaseLogbookViewSession(reportId, storage) {
  const key = logbookViewSessionKey(reportId);
  if (!key || !storage || typeof storage.removeItem !== 'function') return;
  storage.removeItem(key);
}
