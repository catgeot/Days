import { peekExploreReturn } from '../../pages/Home/lib/exploreReturnSnapshot.js';

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
  window.location.assign(target);
}

function exploreBackTarget(prevPath) {
  const snap = peekExploreReturn();
  if (snap?.path?.startsWith('/explore')) return snap.path;
  if (typeof prevPath === 'string' && prevPath.startsWith('/explore')) return prevPath;
  return '/explore';
}

/** @param {{ type: string, path?: string }} action */
export function placeBackShouldFullPageToExplore(action, prevPath) {
  if (!action) return false;
  if (action.type === 'push' && typeof action.path === 'string' && action.path.startsWith('/explore')) {
    return true;
  }
  if (action.type === 'history') {
    if (typeof prevPath === 'string' && prevPath.startsWith('/explore')) return true;
    if (peekExploreReturn()?.path?.startsWith('/explore')) return true;
  }
  return false;
}

export function hardNavigatePlaceExploreBack(prevPath) {
  if (typeof window === 'undefined') return;
  window.location.assign(exploreBackTarget(prevPath));
}
