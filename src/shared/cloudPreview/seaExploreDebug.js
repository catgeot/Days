import { isCloudPreviewSurface } from './isCloudPreviewSurface';

const MAX_LINES = 48;
/** @type {string[]} */
const buffer = [];
/** @type {Set<() => void>} */
const listeners = new Set();
let globalHooksInstalled = false;

export function isSeaExploreDebugEnabled() {
  if (typeof window === 'undefined') return false;
  if (!isCloudPreviewSurface() && !import.meta.env.DEV) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'sea') return true;
    return localStorage.getItem('gateo:sea-debug') === '1';
  } catch {
    return false;
  }
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

/**
 * Preview·로컬 QA용 — `?debug=sea` 또는 localStorage `gateo:sea-debug=1`
 * @param {string} tag
 * @param {unknown} [detail]
 */
export function logSeaExplore(tag, detail) {
  if (!isSeaExploreDebugEnabled()) return;
  const suffix = detail == null
    ? ''
    : ` ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
  const line = `${new Date().toISOString().slice(11, 23)} ${tag}${suffix}`;
  buffer.push(line);
  if (buffer.length > MAX_LINES) buffer.shift();
  console.log(`[sea] ${line}`);
  notify();
}

export function getSeaExploreDebugLines() {
  return [...buffer];
}

export function subscribeSeaExploreDebug(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installSeaExploreDebugGlobalHooks() {
  if (globalHooksInstalled || !isSeaExploreDebugEnabled()) return;
  globalHooksInstalled = true;
  window.addEventListener('error', (event) => {
    const detail = [
      event.message || 'unknown',
      event.filename ? `@${String(event.filename).split('/').pop()}` : '',
      event.lineno ? `:${event.lineno}` : '',
    ].join('');
    logSeaExplore('window.error', detail.trim());
  });
  window.addEventListener('unhandledrejection', (event) => {
    logSeaExplore('unhandledrejection', String(event.reason ?? 'unknown'));
  });
  logSeaExplore('debug.on', window.location.hostname);
}
