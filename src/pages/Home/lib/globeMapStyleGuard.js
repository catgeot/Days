/**
 * Style readiness = style.load (parsed), not map.isStyleLoaded() (tiles/sources).
 * getStyle/getLayer throw until style.load; setData/setLayoutProperty are safe once latched.
 */

const latchStateByMap = new WeakMap();

function getLatchState(map) {
  if (!map) return null;
  let state = latchStateByMap.get(map);
  if (!state) {
    state = { latched: false, waiters: [], bound: false, callbacks: new Set() };
    latchStateByMap.set(map, state);
  }
  return state;
}

function resolveWaiters(map, ok) {
  const state = getLatchState(map);
  if (!state) return;
  const waiters = state.waiters.splice(0);
  waiters.forEach((fn) => {
    try {
      fn(ok);
    } catch {
      // ignore
    }
  });
}

function latchStyleReady(map) {
  const state = getLatchState(map);
  if (!state || state.latched) return;
  state.latched = true;
  resolveWaiters(map, true);
}

/** Theme swap / style reload — wait for the next style.load. */
export function resetGlobeMapStyleLatch(map) {
  const state = latchStateByMap.get(map);
  if (!state) return;
  state.latched = false;
}

/**
 * @param {object} map
 * @param {{ onLatched?: () => void }} [options]
 */
export function bindGlobeMapStyleLatch(map, { onLatched } = {}) {
  if (!map || map._removed) return;
  const state = getLatchState(map);

  const fireLatched = () => {
    if (!state.latched) return;
    state.callbacks.forEach((cb) => {
      try {
        cb();
      } catch {
        // ignore
      }
    });
  };

  if (onLatched) state.callbacks.add(onLatched);

  if (!state.bound) {
    state.bound = true;
    map.on('style.load', () => {
      latchStyleReady(map);
      fireLatched();
    });
  }

  try {
    if (map.getStyle?.()) {
      latchStyleReady(map);
      fireLatched();
    }
  } catch {
    // wait for style.load
  }
}

/** Style JSON parsed (style.load) — safe for getStyle/getLayer and camera/focus gates. */
export function isGlobeMapStyleReady(map) {
  return Boolean(map && !map._removed && getLatchState(map)?.latched);
}

/** Alias for focus/camera readiness (parsed latch, not tile/source settlement). */
export function isGlobeMapStyleParsed(map) {
  return isGlobeMapStyleReady(map);
}

/** Tiles/sources settled — use before setData / setLayoutProperty re-sync loops. */
export function isGlobeMapStyleSettled(map) {
  return Boolean(map && !map._removed && map.isStyleLoaded?.());
}

export function whenGlobeMapStyleReady(map, { timeoutMs = 8000 } = {}) {
  if (!map || map._removed) return Promise.resolve(false);
  bindGlobeMapStyleLatch(map);
  if (isGlobeMapStyleReady(map)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const state = getLatchState(map);
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      const idx = state.waiters.indexOf(onReady);
      if (idx >= 0) state.waiters.splice(idx, 1);
      resolve(ok);
    };
    const onReady = (ok) => finish(ok);
    state.waiters.push(onReady);
    if (timeoutMs > 0) {
      window.setTimeout(() => finish(isGlobeMapStyleReady(map)), timeoutMs);
    }
  });
}
