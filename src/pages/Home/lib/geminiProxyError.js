/** @typedef {'config' | 'quota' | 'busy' | 'generic' | 'rate_limited' | 'too_large' | 'budget'} GeminiProxyErrorKind */

import { ensureI18n } from '../../../i18n/config.js';
import { normalizeAppLocale } from '../../../i18n/constants.js';

export const GEMINI_PROXY_ERROR_KIND = {
  CONFIG: 'config',
  QUOTA: 'quota',
  BUSY: 'busy',
  GENERIC: 'generic',
  RATE_LIMITED: 'rate_limited',
  TOO_LARGE: 'too_large',
  BUDGET: 'budget',
};

/** @type {import('../../../i18n/constants.js').AppLocale} */
const DEFAULT_MSG_LOCALE = 'ko';

export const MOONI_RATE_LIMIT_SHORT_SEC = 120;
export const MOONI_RATE_LIMIT_LONG_SEC = 1800;

const USER_MESSAGES = {
  [GEMINI_PROXY_ERROR_KIND.CONFIG]: '설정 오류 — 관리자에게 문의',
  [GEMINI_PROXY_ERROR_KIND.QUOTA]: 'AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',
  [GEMINI_PROXY_ERROR_KIND.BUSY]: 'AI 서버가 일시적으로 바쁩니다.',
  [GEMINI_PROXY_ERROR_KIND.GENERIC]:
    'AI 서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.',
  [GEMINI_PROXY_ERROR_KIND.TOO_LARGE]: '내용이 너무 길어요. 조금 줄여서 다시 보내 주세요.',
  [GEMINI_PROXY_ERROR_KIND.BUDGET]:
    '오늘은 MOONi와 나눌 수 있는 이야기가 잠시 쉬어가요. 내일 다시 물어봐 주세요.',
};

/** 리뷰·로그북·큐레이션·검색 교정. MOONi 대화 문구와 따로 둔다. */
export const AI_FEATURE_LIMIT_MESSAGE =
  '오늘 AI 사용 한도에 도달했어요. 잠시 후 다시 시도해 주세요.';

const FEATURE_LIMIT_KINDS = new Set([
  GEMINI_PROXY_ERROR_KIND.BUDGET,
  GEMINI_PROXY_ERROR_KIND.RATE_LIMITED,
  GEMINI_PROXY_ERROR_KIND.QUOTA,
]);

/**
 * @param {{ retryAfter?: unknown, headerRetryAfter?: string | null }} sources
 * @returns {number | undefined}
 */
export function resolveGeminiProxyRetryAfterSeconds({ retryAfter, headerRetryAfter } = {}) {
  const body = Number(retryAfter);
  if (Number.isFinite(body) && body > 0) return Math.ceil(body);
  if (headerRetryAfter != null && headerRetryAfter !== '') {
    const header = Number(headerRetryAfter);
    if (Number.isFinite(header) && header > 0) return Math.ceil(header);
  }
  return undefined;
}

/**
 * @param {number} retryAfterSec
 * @param {string | undefined} locale
 * @param {number} [nowMs]
 */
export function formatRateLimitResumeLocalTime(retryAfterSec, locale, nowMs = Date.now()) {
  const at = new Date(nowMs + retryAfterSec * 1000);
  const lng = normalizeAppLocale(locale);
  const minute = at.getMinutes();
  return new Intl.DateTimeFormat(lng === 'ko' ? 'ko-KR' : 'en-US', {
    hour: 'numeric',
    ...(minute !== 0 ? { minute: 'numeric' } : {}),
    hour12: true,
  }).format(at);
}

/**
 * @param {number | undefined} retryAfter
 * @param {string | undefined} locale
 * @param {number} [nowMs]
 */
export function formatMooniRateLimitedMessage(retryAfter, locale, nowMs = Date.now()) {
  const t = ensureI18n(locale).t;
  const n = Number(retryAfter);
  if (!Number.isFinite(n) || n <= 0) {
    return t('mooni.proxyError.rateLimitedSoon');
  }
  if (n >= MOONI_RATE_LIMIT_LONG_SEC) {
    const time = formatRateLimitResumeLocalTime(n, locale, nowMs);
    return t('mooni.proxyError.rateLimitedDaily', { time });
  }
  if (n <= MOONI_RATE_LIMIT_SHORT_SEC && n <= 60) {
    return t('mooni.proxyError.rateLimitedSeconds', { seconds: Math.ceil(n) });
  }
  return t('mooni.proxyError.rateLimitedSoon');
}

/**
 * @param {GeminiProxyErrorKind} kind
 * @param {string | undefined} devDetail
 * @param {number | undefined} retryAfter
 * @param {string | undefined} [locale]
 * @param {number} [nowMs]
 */
export function formatGeminiProxyUserMessage(kind, devDetail, retryAfter, locale, nowMs) {
  if (kind === GEMINI_PROXY_ERROR_KIND.RATE_LIMITED) {
    return formatMooniRateLimitedMessage(retryAfter, locale, nowMs);
  }
  const base = USER_MESSAGES[kind] ?? USER_MESSAGES[GEMINI_PROXY_ERROR_KIND.GENERIC];
  if (import.meta.env?.DEV && devDetail && kind === GEMINI_PROXY_ERROR_KIND.CONFIG) {
    return `${base} (${devDetail})`;
  }
  return base;
}

/**
 * @param {unknown} error
 * @returns {number | null}
 */
function resolveInvokeHttpStatus(error) {
  if (!error || typeof error !== 'object') return null;
  const ctx = /** @type {{ status?: number; json?: () => Promise<unknown> }} */ (error).context;
  if (typeof ctx?.status === 'number') return ctx.status;
  if (ctx instanceof Response) return ctx.status;
  return null;
}

/**
 * @param {{ error?: unknown; data?: { success?: boolean; error?: string; retryAfter?: number } | null; httpStatus?: number | null; headerRetryAfter?: string | null }} input
 * @returns {{ kind: GeminiProxyErrorKind; userMessage: string; devDetail?: string }}
 */
export function classifyGeminiProxyFailure({
  error = null,
  data = null,
  httpStatus = null,
  headerRetryAfter = null,
} = {}) {
  const snippets = [];
  const invokeStatus = resolveInvokeHttpStatus(error);
  const status = httpStatus ?? invokeStatus;
  const code = typeof data?.error === 'string' ? data.error : '';

  if (status != null) snippets.push(String(status));
  if (error && typeof error === 'object' && 'message' in error && error.message) {
    snippets.push(String(error.message));
  } else if (typeof error === 'string') {
    snippets.push(error);
  }
  if (code) snippets.push(code);

  const combined = snippets.join(' ');
  const retryAfter = resolveGeminiProxyRetryAfterSeconds({
    retryAfter: data?.retryAfter,
    headerRetryAfter,
  });

  /** @type {GeminiProxyErrorKind} */
  let kind = GEMINI_PROXY_ERROR_KIND.GENERIC;

  if (code === 'budget') {
    kind = GEMINI_PROXY_ERROR_KIND.BUDGET;
  } else if (code === 'rate_limited') {
    kind = GEMINI_PROXY_ERROR_KIND.RATE_LIMITED;
  } else if (code === 'too_large' || status === 413) {
    kind = GEMINI_PROXY_ERROR_KIND.TOO_LARGE;
  } else if (status === 401 || /401|UNAUTHORIZED|Invalid JWT/i.test(combined)) {
    kind = GEMINI_PROXY_ERROR_KIND.CONFIG;
  } else if (
    code === 'quota' ||
    status === 429 ||
    /429|RESOURCE_EXHAUSTED|prepayment credits are depleted/i.test(combined)
  ) {
    kind = GEMINI_PROXY_ERROR_KIND.QUOTA;
  } else if (
    code === 'busy' ||
    status === 503 ||
    /503|timeout|AbortError|DEADLINE_EXCEEDED|UNAVAILABLE/i.test(combined) ||
    (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
  ) {
    kind = GEMINI_PROXY_ERROR_KIND.BUSY;
  }

  const devDetail =
    code ||
    (error && typeof error === 'object' && 'message' in error && String(error.message)) ||
    combined ||
    undefined;

  return {
    kind,
    userMessage: formatGeminiProxyUserMessage(kind, devDetail, retryAfter, DEFAULT_MSG_LOCALE),
    devDetail,
    retryAfter,
    httpStatus: status ?? undefined,
    errorCode: code || undefined,
  };
}

export class GeminiProxyError extends Error {
  /** @param {{ kind: GeminiProxyErrorKind; userMessage: string; devDetail?: string; retryAfter?: number; httpStatus?: number; errorCode?: string }} payload */
  constructor({ kind, userMessage, devDetail, retryAfter, httpStatus, errorCode }) {
    super(userMessage);
    this.name = 'GeminiProxyError';
    this.kind = kind;
    this.userMessage = userMessage;
    this.devDetail = devDetail;
    this.retryAfter = retryAfter;
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
  }
}

/**
 * @param {unknown} err
 * @returns {string}
 */
export function isGeminiFeatureLimitError(err) {
  return err instanceof GeminiProxyError && FEATURE_LIMIT_KINDS.has(err.kind);
}

/**
 * @param {unknown} err
 * @param {string | undefined} [locale]
 * @returns {string}
 */
export function getGeminiProxyErrorMessage(err, locale) {
  if (err instanceof GeminiProxyError) {
    if (err.kind === GEMINI_PROXY_ERROR_KIND.RATE_LIMITED) {
      return formatGeminiProxyUserMessage(err.kind, err.devDetail, err.retryAfter, locale);
    }
    return err.userMessage;
  }
  if (err instanceof Error && err.message) return err.message;
  return USER_MESSAGES[GEMINI_PROXY_ERROR_KIND.GENERIC];
}
