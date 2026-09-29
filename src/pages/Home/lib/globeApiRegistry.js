import { logCurationHandoff } from '../../../shared/cloudPreview/curationHandoffDebug.js';

/** @type {object | null} */
let currentGlobeApi = null;
/** @type {Set<(api: object) => void>} */
const listeners = new Set();

const WINDOW_GLOBE_KEY = '__gateoGlobeApi';

export function registerGlobeApi(api) {
  if (!api) return;
  currentGlobeApi = api;
  if (typeof window !== 'undefined') {
    window[WINDOW_GLOBE_KEY] = api;
  }
  logCurationHandoff('globe.api.register', {
    hasWhenReady: Boolean(api.whenGlobeFocusReady),
    hasFlyTo: Boolean(api.flyToAndPin),
  });
  listeners.forEach((listener) => {
    try {
      listener(api);
    } catch {
      /* ignore */
    }
  });
}

export function unregisterGlobeApi(api) {
  if (currentGlobeApi === api) {
    currentGlobeApi = null;
    if (typeof window !== 'undefined' && window[WINDOW_GLOBE_KEY] === api) {
      delete window[WINDOW_GLOBE_KEY];
    }
  }
}

export function getGlobeApi() {
  if (currentGlobeApi) return currentGlobeApi;
  if (typeof window !== 'undefined' && window[WINDOW_GLOBE_KEY]) {
    return window[WINDOW_GLOBE_KEY];
  }
  return null;
}

export function subscribeGlobeApi(listener) {
  listeners.add(listener);
  const api = getGlobeApi();
  if (api) listener(api);
  return () => listeners.delete(listener);
}

/** Latest-wins slot for camera commands while the lazy globe child is still loading. */
export function createGlobeAdapterCameraQueue() {
  /** @type {{ kind: string, args: unknown[] } | null} */
  let pending = null;
  return {
    set(kind, args) {
      pending = { kind, args };
    },
    take() {
      const cmd = pending;
      pending = null;
      return cmd;
    },
    clear() {
      pending = null;
    },
    peek() {
      return pending;
    },
  };
}

export function flushGlobeAdapterCameraQueue(queue, child) {
  if (!queue || !child) return;
  const cmd = queue.take();
  if (!cmd) return;
  const fn = child[cmd.kind];
  if (typeof fn === 'function') {
    fn(...cmd.args);
  }
}
