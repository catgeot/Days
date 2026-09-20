import { isCloudPreviewSurface } from './isCloudPreviewSurface.js';

const MAX_LINES = 64;
const SESSION_KEY = 'gateo:curation-debug-session';
const PERSIST_KEY = 'gateo:curation-debug';
const LOG_BUFFER_KEY = 'gateo:curation-debug-lines';

/** @type {string[]} */
let buffer = [];
/** @type {Set<() => void>} */
const listeners = new Set();
let globalHooksInstalled = false;

function loadPersistedLogBuffer() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(LOG_BUFFER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((line) => typeof line === 'string') : [];
  } catch {
    return [];
  }
}

function persistLogBuffer() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(LOG_BUFFER_KEY, JSON.stringify(buffer));
  } catch {
    /* private mode */
  }
}

if (typeof window !== 'undefined') {
  buffer = loadPersistedLogBuffer();
}

export function armCurationHandoffDebugSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
}

export function isCurationHandoffDebugEnabled() {
  if (typeof window === 'undefined') return false;
  if (!isCloudPreviewSurface() && !import.meta.env.DEV) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'curation') return true;
    if (localStorage.getItem(PERSIST_KEY) === '1') return true;
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

function formatDetail(detail) {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

/**
 * Preview·로컬 QA — `?debug=curation` · localStorage `gateo:curation-debug=1`
 * · 큐레이션 CTA 클릭 시 session 자동 arm
 */
export function logCurationHandoff(tag, detail) {
  if (!isCurationHandoffDebugEnabled()) return;
  const suffix = detail == null ? '' : ` ${formatDetail(detail)}`;
  const line = `${new Date().toISOString().slice(11, 23)} ${tag}${suffix}`;
  buffer.push(line);
  if (buffer.length > MAX_LINES) buffer.shift();
  persistLogBuffer();
  console.log(`[curation-handoff] ${line}`);
  notify();
}

export function getCurationHandoffDebugLines() {
  return [...buffer];
}

export function clearCurationHandoffDebugLines() {
  buffer.length = 0;
  persistLogBuffer();
  notify();
}

export function subscribeCurationHandoffDebug(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installCurationHandoffDebugGlobalHooks() {
  if (globalHooksInstalled || !isCurationHandoffDebugEnabled()) return;
  globalHooksInstalled = true;
  buffer = loadPersistedLogBuffer();
  notify();
  window.addEventListener('error', (event) => {
    const detail = [
      event.message || 'unknown',
      event.filename ? `@${String(event.filename).split('/').pop()}` : '',
      event.lineno ? `:${event.lineno}` : '',
    ].join('');
    logCurationHandoff('window.error', detail.trim());
  });
  window.addEventListener('unhandledrejection', (event) => {
    logCurationHandoff('unhandledrejection', String(event.reason ?? 'unknown'));
  });
  logCurationHandoff('debug.on', {
    host: window.location.hostname,
    path: window.location.pathname,
    ua: navigator.userAgent?.slice(0, 80),
  });
}

export async function copyCurationHandoffDebugLines(lines = getCurationHandoffDebugLines()) {
  const text = lines.join('\n');
  if (!text) return { ok: false, reason: 'empty' };
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok ? { ok: true, method: 'execCommand' } : { ok: false, reason: 'execCommand-fail' };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}
