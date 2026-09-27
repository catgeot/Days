import { isCloudPreviewSurface } from './isCloudPreviewSurface.js';

const MAX_LINES = 80;
const SESSION_KEY = 'gateo:flight-debug-session';
const PERSIST_KEY = 'gateo:flight-debug';
const LOG_BUFFER_KEY = 'gateo:flight-debug-lines';

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

export function armFlightDebugSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
}

export function isFlightDebugEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'flight' || params.get('debug') === '1') return true;
    if (localStorage.getItem(PERSIST_KEY) === '1') return true;
    if (sessionStorage.getItem(SESSION_KEY)) return true;
    // Vercel Preview 또는 dev 환경에서는 기본 활성화
    if (isCloudPreviewSurface() || import.meta.env.DEV) return true;
    return false;
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
 * 모바일·플래너 항공 위젯 진단 로깅
 * @param {string} tag
 * @param {unknown} [detail]
 */
export function logFlightDebug(tag, detail) {
  if (!isFlightDebugEnabled()) return;
  const suffix = detail == null ? '' : ` ${formatDetail(detail)}`;
  const line = `${new Date().toISOString().slice(11, 23)} ${tag}${suffix}`;
  buffer.push(line);
  if (buffer.length > MAX_LINES) buffer.shift();
  persistLogBuffer();
  console.log(`[flight-debug] ${line}`);
  notify();
}

export function getFlightDebugLines() {
  return [...buffer];
}

export function clearFlightDebugLines() {
  buffer.length = 0;
  persistLogBuffer();
  notify();
}

export function subscribeFlightDebug(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 현재 화면 및 플래너 위젯 DOM 상태 전체 스냅샷 생성 */
export function captureFlightSnapshot() {
  if (typeof window === 'undefined') return;
  const container = document.querySelector('[data-tripcom-flight-banner="1"]');
  const iframe = container ? container.querySelector('iframe') : null;
  const containerRect = container ? container.getBoundingClientRect() : null;
  const iframeRect = iframe ? iframe.getBoundingClientRect() : null;

  logFlightDebug('snapshot', {
    viewport: {
      innerW: window.innerWidth,
      innerH: window.innerHeight,
      screenW: window.screen?.width,
      screenH: window.screen?.height,
      dpr: window.devicePixelRatio,
      ua: navigator.userAgent?.slice(0, 70),
    },
    container: containerRect
      ? {
          w: Math.round(containerRect.width),
          h: Math.round(containerRect.height),
          top: Math.round(containerRect.top),
          display: window.getComputedStyle(container).display,
          visibility: window.getComputedStyle(container).visibility,
        }
      : 'not_found',
    iframe: iframeRect
      ? {
          w: Math.round(iframeRect.width),
          h: Math.round(iframeRect.height),
          src: iframe.getAttribute('src')?.slice(0, 100),
        }
      : 'not_found',
  });
}

export function installFlightDebugGlobalHooks() {
  if (globalHooksInstalled || !isFlightDebugEnabled()) return;
  globalHooksInstalled = true;
  buffer = loadPersistedLogBuffer();
  notify();

  window.addEventListener('error', (event) => {
    const detail = [
      event.message || 'unknown',
      event.filename ? `@${String(event.filename).split('/').pop()}` : '',
      event.lineno ? `:${event.lineno}` : '',
    ].join('');
    logFlightDebug('window.error', detail.trim());
  });

  window.addEventListener('unhandledrejection', (event) => {
    logFlightDebug('unhandledrejection', String(event.reason ?? 'unknown'));
  });

  // 초기 뷰포트 정보 1회 기록
  logFlightDebug('env.init', {
    host: window.location.hostname,
    path: window.location.pathname,
    inner: `${window.innerWidth}x${window.innerHeight}`,
    screen: `${window.screen?.width}x${window.screen?.height}`,
    dpr: window.devicePixelRatio,
    isMobileUa: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
  });

  // 플래너 DOM 확인 지연 스냅샷
  setTimeout(() => {
    captureFlightSnapshot();
  }, 1200);
}

export async function copyFlightDebugLines(lines = getFlightDebugLines()) {
  const envInfo = typeof window !== 'undefined'
    ? [
        `=== Flight Debug Log (${new Date().toLocaleString()}) ===`,
        `Host: ${window.location.hostname}${window.location.pathname}`,
        `Viewport: ${window.innerWidth}x${window.innerHeight} (Screen: ${window.screen?.width}x${window.screen?.height}, DPR: ${window.devicePixelRatio})`,
        `UA: ${navigator.userAgent}`,
        '----------------------------------------',
      ].join('\n')
    : '';

  const text = `${envInfo}\n${lines.join('\n')}`.trim();
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
