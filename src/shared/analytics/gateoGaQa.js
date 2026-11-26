const QA_STORAGE_KEY = 'gateo_qa';
const GA_MEASUREMENT_ID = 'G-7949KKNHRX';
export const GATEO_GA_PRODUCTION_HOST = 'www.gateo.kr';

/** @param {string} [hostname] */
export function isGateoGaProductionHost(hostname) {
  return String(hostname ?? '') === GATEO_GA_PRODUCTION_HOST;
}
const BOT_UA_RE = /bot|crawler|spider|slurp|headless|lighthouse|preview/i;

function defaultTrafficEnv() {
  if (typeof window === 'undefined') return {};
  return { window };
}

/**
 * @param {{ window?: Window, navigator?: Navigator, localStorage?: Storage, search?: string, userAgent?: string, webdriver?: boolean }} [env]
 */
export function readGateoTrafficSignals(env = defaultTrafficEnv()) {
  const win = env.window;
  const nav = env.navigator ?? win?.navigator;
  const storage = env.localStorage ?? win?.localStorage;
  const search = env.search ?? win?.location?.search ?? '';
  let qa = false;
  try {
    if (storage?.getItem(QA_STORAGE_KEY) === '1') qa = true;
    const q = new URLSearchParams(String(search || ''));
    if (q.get('qa') === '1') qa = true;
  } catch {
    /* ignore */
  }
  return {
    webdriver: Boolean(env.webdriver ?? nav?.webdriver),
    qa,
    userAgent: String(env.userAgent ?? nav?.userAgent ?? ''),
  };
}

/** @param {string} [userAgent] */
export function isGateoBotUserAgent(userAgent) {
  return BOT_UA_RE.test(String(userAgent ?? ''));
}

/**
 * GA·리뷰 조회수 등 자동화/QA·봇 UA 트래픽 — 메트릭 증가·태그 로드 억제.
 * @param {Parameters<typeof readGateoTrafficSignals>[0]} [env]
 */
export function shouldSkipGateoAutomatedTraffic(env) {
  const { webdriver, qa, userAgent } = readGateoTrafficSignals(env);
  if (webdriver) return true;
  if (qa) return true;
  if (isGateoBotUserAgent(userAgent)) return true;
  return false;
}

export function gateoQaStorageKey() {
  return QA_STORAGE_KEY;
}

export function persistGateoQaMarkerFromUrl(search = '') {
  if (typeof window === 'undefined') return false;
  try {
    const q = new URLSearchParams(String(search || window.location.search || ''));
    if (q.get('qa') === '1') {
      window.localStorage.setItem(QA_STORAGE_KEY, '1');
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * @param {Parameters<typeof readGateoTrafficSignals>[0]} [env]
 */
export function isGateoQaTraffic(env) {
  const { webdriver, qa } = readGateoTrafficSignals(env);
  return webdriver || qa;
}

/**
 * QA marker (`gateo_qa` / `?qa=1`), `navigator.webdriver`, or `?crawler=1`.
 * Real visitors are unmarked.
 * @param {Parameters<typeof readGateoTrafficSignals>[0]} [env]
 */
export function shouldMarkGateoInternalTraffic(env) {
  if (isGateoQaTraffic(env)) return true;
  const win = env?.window;
  const search = env?.search ?? win?.location?.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  try {
    return new URLSearchParams(String(search || '')).get('crawler') === '1';
  } catch {
    return false;
  }
}

/**
 * Copies params and adds `traffic_type: 'internal'` only for automated traffic.
 * @param {Record<string, unknown>} [params]
 * @param {Parameters<typeof readGateoTrafficSignals>[0]} [env]
 */
export function withGateoTrafficType(params, env) {
  const base = params && typeof params === 'object' ? { ...params } : {};
  if (!shouldMarkGateoInternalTraffic(env)) return base;
  return { ...base, traffic_type: 'internal' };
}

/**
 * @param {Parameters<typeof readGateoTrafficSignals>[0]} [env]
 */
export function shouldSkipGateoGaLoad(env = defaultTrafficEnv()) {
  const win = env.window;
  const hostname = env.hostname ?? win?.location?.hostname ?? '';
  if (!isGateoGaProductionHost(hostname)) return true;
  return isGateoQaTraffic(env);
}

export function gateoGaMeasurementId() {
  return GA_MEASUREMENT_ID;
}

/** Append qa=1 for automation hitting production HTML. */
export function withGateoQaQuery(url) {
  try {
    const u = new URL(url, 'https://www.gateo.kr/');
    if (!u.searchParams.has('qa')) u.searchParams.set('qa', '1');
    return u.toString();
  } catch {
    return url;
  }
}