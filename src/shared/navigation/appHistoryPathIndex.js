const pathByHistoryIdx = new Map();
const STORAGE_KEY = 'gateo:app-history-idx';
const MAX_STORED = 40;

function readStoredPaths() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredPaths(stored) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* quota */
  }
}

export function recordAppHistoryPath(pathname, search = '') {
  if (typeof window === 'undefined') return;
  const idx = window.history.state?.idx;
  if (typeof idx !== 'number') return;
  const path = `${pathname || ''}${search || ''}`;
  if (!isInAppRelativePath(path)) return;
  pathByHistoryIdx.set(idx, path);
  const stored = readStoredPaths();
  if (!stored) return;
  stored[String(idx)] = path;
  const keys = Object.keys(stored)
    .map((key) => Number(key))
    .filter((key) => Number.isFinite(key))
    .sort((a, b) => a - b);
  while (keys.length > MAX_STORED) {
    delete stored[String(keys.shift())];
  }
  writeStoredPaths(stored);
}

export function getAppHistoryPath(idx) {
  if (typeof idx !== 'number') return null;
  const cached = pathByHistoryIdx.get(idx);
  if (cached) return cached;
  const stored = readStoredPaths();
  const path = stored ? stored[String(idx)] : null;
  if (typeof path !== 'string' || !isInAppRelativePath(path)) return null;
  pathByHistoryIdx.set(idx, path);
  return path;
}

/** Drops the in-memory index. sessionStorage stays so a reload can still resolve idx. */
export function clearAppHistoryPathMemory() {
  pathByHistoryIdx.clear();
}

export function isInAppRelativePath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}
