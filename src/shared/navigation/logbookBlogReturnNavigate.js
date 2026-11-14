import {
  clearPlaceReturnTo,
  isLogbookPlaceReturnPath,
} from '../../pages/Home/lib/placeReturnTo.js';

function blogReturnDomLooksStale() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.startsWith('/blog') &&
    Boolean(document.querySelector('[data-place-chrome-hit]'))
  );
}

/** @param {string} path */
function hardReplaceBlogReturn(path) {
  window.location.replace(path);
}

/**
 * Hub → place 후 /blog 복귀 (MainLayout↔DashboardLayout). WebKit에서 navigate만으로
 * 주소창만 /blog로 바뀌고 Place UI가 남는 경우가 있어 replace로 한 번 더 동기화.
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @param {string} path
 */
export function navigatePlaceReturnToBlog(navigate, path) {
  if (!isLogbookPlaceReturnPath(path)) {
    clearPlaceReturnTo();
    navigate(path);
    return;
  }
  navigate(path);
  const reconcile = () => {
    if (blogReturnDomLooksStale()) {
      hardReplaceBlogReturn(path);
      return;
    }
    clearPlaceReturnTo();
  };
  queueMicrotask(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(reconcile);
    });
  });
}

let popGuardInstalled = false;

export function installLogbookBlogReturnPopGuard() {
  if (popGuardInstalled || typeof window === 'undefined') return;
  popGuardInstalled = true;
  window.addEventListener('popstate', () => {
    requestAnimationFrame(() => {
      if (!blogReturnDomLooksStale()) return;
      hardReplaceBlogReturn(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
    });
  });
}