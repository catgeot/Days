const pathByHistoryIdx = new Map();

export function recordAppHistoryPath(pathname, search = '') {
  if (typeof window === 'undefined') return;
  const idx = window.history.state?.idx;
  if (typeof idx !== 'number') return;
  const path = `${pathname || ''}${search || ''}`;
  pathByHistoryIdx.set(idx, path);
}

export function getAppHistoryPath(idx) {
  if (typeof idx !== 'number') return null;
  return pathByHistoryIdx.get(idx) ?? null;
}

export function isInAppRelativePath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}
