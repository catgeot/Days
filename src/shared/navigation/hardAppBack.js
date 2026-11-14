import { canNavigateAppBack } from './navigateAppBack.js';

export function logbookEditorialBackFallback() {
  if (typeof window === 'undefined') return '/blog';
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') === 'en') return '/blog?lang=en';
  } catch {
    /* ignore */
  }
  return '/blog';
}

export function hardNavigateAppBack({ fallback } = {}) {
  if (typeof window === 'undefined') return;
  const target = fallback ?? logbookEditorialBackFallback();
  if (canNavigateAppBack() && window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.assign(target);
}
