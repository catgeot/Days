import { getAppHistoryPath, isInAppRelativePath } from './appHistoryPathIndex';

export function canNavigateAppBack() {
  if (typeof window === 'undefined') return false;
  const idx = window.history.state?.idx;
  if (typeof idx !== 'number' || idx <= 0) return false;
  const prevPath = getAppHistoryPath(idx - 1);
  return isInAppRelativePath(prevPath);
}

export function navigateAppBack(navigate, { fallback = '/blog' } = {}) {
  if (typeof navigate !== 'function') return;
  if (canNavigateAppBack()) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}
