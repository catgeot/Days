/** @type {object | null} */
let currentGlobeApi = null;
/** @type {Set<(api: object) => void>} */
const listeners = new Set();

export function registerGlobeApi(api) {
  if (!api) return;
  currentGlobeApi = api;
  listeners.forEach((listener) => {
    try {
      listener(api);
    } catch {
      /* ignore */
    }
  });
}

export function unregisterGlobeApi(api) {
  if (currentGlobeApi === api) currentGlobeApi = null;
}

export function getGlobeApi() {
  return currentGlobeApi;
}

export function subscribeGlobeApi(listener) {
  listeners.add(listener);
  if (currentGlobeApi) listener(currentGlobeApi);
  return () => listeners.delete(listener);
}
