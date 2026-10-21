/** History key for an open photo lightbox. Same URL as the page underneath. */
export const LIGHTBOX_HISTORY_KEY = 'gateoLightbox';

export function isLightboxHistoryState(state) {
  return Boolean(state && typeof state === 'object' && state[LIGHTBOX_HISTORY_KEY] === true);
}

/**
 * One same-URL history entry per open lightbox.
 * Photo changes must not call open() again.
 * iOS edge-swipe pops this entry; capture-phase popstate closes the lightbox
 * and stopImmediatePropagation keeps React Router on the current route.
 * Explicit close / unmount calls history.back() once so the stack stays balanced.
 */
export function createLightboxHistorySession(win, { enabled, onCloseFromPop }) {
  let pushed = false;

  const onPop = (event) => {
    if (!pushed) return;
    event.stopImmediatePropagation();
    pushed = false;
    onCloseFromPop?.();
  };

  return {
    open() {
      if (!enabled || pushed) return;
      try {
        const prev = win.history.state;
        const base = prev && typeof prev === 'object' ? { ...prev } : {};
        win.history.pushState({ ...base, [LIGHTBOX_HISTORY_KEY]: true }, '');
        pushed = true;
        win.addEventListener('popstate', onPop, true);
      } catch {
        pushed = false;
      }
    },
    dispose() {
      win.removeEventListener('popstate', onPop, true);
      if (!pushed || !isLightboxHistoryState(win.history.state)) {
        pushed = false;
        return;
      }
      pushed = false;
      const swallow = (event) => {
        event.stopImmediatePropagation();
        win.removeEventListener('popstate', swallow, true);
      };
      win.addEventListener('popstate', swallow, true);
      win.history.back();
    },
  };
}
