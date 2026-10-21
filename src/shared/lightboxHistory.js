/** History key for an open photo lightbox. Same URL as the page underneath. */
export const LIGHTBOX_HISTORY_KEY = 'gateoLightbox';

/** If history.back() never delivers popstate, drop the swallow listener. */
export const LIGHTBOX_HISTORY_SWALLOW_MS = 500;

export function isLightboxHistoryState(state) {
  return Boolean(state && typeof state === 'object' && state[LIGHTBOX_HISTORY_KEY] === true);
}

function scheduleTimeout(win, fn, ms) {
  const set = typeof win.setTimeout === 'function' ? win.setTimeout.bind(win) : setTimeout;
  return set(fn, ms);
}

function cancelTimeout(win, id) {
  if (id == null) return;
  const clear = typeof win.clearTimeout === 'function' ? win.clearTimeout.bind(win) : clearTimeout;
  clear(id);
}

function readHref(win) {
  try {
    const href = win.location?.href;
    return typeof href === 'string' ? href : '';
  } catch {
    return '';
  }
}

/**
 * One same-URL history entry per open lightbox.
 * Photo changes must not call open() again.
 * iOS edge-swipe pops this entry; capture-phase popstate closes the lightbox
 * and stopImmediatePropagation keeps React Router on the current route.
 * Explicit close / unmount calls history.back() once so the stack stays balanced.
 * A route push while open leaves this entry underneath; dispose steps back once
 * and replaceState restores the new route over that slot.
 */
export function createLightboxHistorySession(win, {
  enabled,
  onCloseFromPop,
  swallowTimeoutMs = LIGHTBOX_HISTORY_SWALLOW_MS,
} = {}) {
  let pushed = false;
  let lengthAtPush = 0;

  const onPop = (event) => {
    if (!pushed) return;
    event.stopImmediatePropagation();
    pushed = false;
    onCloseFromPop?.();
  };

  const armSwallow = (afterPop) => {
    let settled = false;
    let timer = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      win.removeEventListener('popstate', swallow, true);
      cancelTimeout(win, timer);
      timer = null;
    };
    const swallow = (event) => {
      event.stopImmediatePropagation();
      finish();
      afterPop?.();
    };
    win.addEventListener('popstate', swallow, true);
    timer = scheduleTimeout(win, finish, swallowTimeoutMs);
  };

  return {
    open() {
      if (!enabled || pushed) return;
      try {
        const prev = win.history.state;
        const base = prev && typeof prev === 'object' ? { ...prev } : {};
        win.history.pushState({ ...base, [LIGHTBOX_HISTORY_KEY]: true }, '');
        pushed = true;
        lengthAtPush = win.history.length;
        win.addEventListener('popstate', onPop, true);
      } catch {
        pushed = false;
      }
    },
    dispose() {
      win.removeEventListener('popstate', onPop, true);
      if (!pushed) return;
      const stillOnEntry = isLightboxHistoryState(win.history.state);
      pushed = false;
      if (stillOnEntry) {
        armSwallow();
        try {
          win.history.back();
        } catch {
          /* swallow listener drops itself on the timeout */
        }
        return;
      }
      const lengthNow = win.history.length;
      if (typeof lengthNow !== 'number' || lengthNow <= lengthAtPush) return;
      const restoreState = win.history.state;
      const restoreUrl = readHref(win);
      armSwallow(() => {
        if (!isLightboxHistoryState(win.history.state)) return;
        try {
          if (restoreUrl) win.history.replaceState(restoreState, '', restoreUrl);
          else win.history.replaceState(restoreState, '');
        } catch {
          /* the pop already removed the later entry; leave the lightbox slot */
        }
      });
      try {
        win.history.back();
      } catch {
        /* swallow listener drops itself on the timeout */
      }
    },
  };
}
