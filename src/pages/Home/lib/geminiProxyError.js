/** @typedef {'config' | 'quota' | 'busy' | 'generic'} GeminiProxyErrorKind */

export const GEMINI_PROXY_ERROR_KIND = {
  CONFIG: 'config',
  QUOTA: 'quota',
  BUSY: 'busy',
  GENERIC: 'generic',
};

const USER_MESSAGES = {
  [GEMINI_PROXY_ERROR_KIND.CONFIG]: '설정 오류 — 관리자에게 문의',
  [GEMINI_PROXY_ERROR_KIND.QUOTA]: 'AI 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',
  [GEMINI_PROXY_ERROR_KIND.BUSY]: 'AI 서버가 일시적으로 바쁩니다.',
  [GEMINI_PROXY_ERROR_KIND.GENERIC]:
    'AI 서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.',
};

/**
 * @param {GeminiProxyErrorKind} kind
 * @param {string | undefined} devDetail
 */
export function formatGeminiProxyUserMessage(kind, devDetail) {
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
 * @param {{ error?: unknown; data?: { success?: boolean; error?: string } | null; httpStatus?: number | null }} input
 * @returns {{ kind: GeminiProxyErrorKind; userMessage: string; devDetail?: string }}
 */
export function classifyGeminiProxyFailure({ error = null, data = null, httpStatus = null } = {}) {
  const snippets = [];
  const invokeStatus = resolveInvokeHttpStatus(error);
  const status = httpStatus ?? invokeStatus;

  if (status != null) snippets.push(String(status));
  if (error && typeof error === 'object' && 'message' in error && error.message) {
    snippets.push(String(error.message));
  } else if (typeof error === 'string') {
    snippets.push(error);
  }
  if (data?.error) snippets.push(String(data.error));

  const combined = snippets.join(' ');

  /** @type {GeminiProxyErrorKind} */
  let kind = GEMINI_PROXY_ERROR_KIND.GENERIC;

  if (status === 401 || /401|UNAUTHORIZED|Invalid JWT/i.test(combined)) {
    kind = GEMINI_PROXY_ERROR_KIND.CONFIG;
  } else if (
    status === 429 ||
    /429|RESOURCE_EXHAUSTED|prepayment credits are depleted/i.test(combined)
  ) {
    kind = GEMINI_PROXY_ERROR_KIND.QUOTA;
  } else if (
    status === 503 ||
    /503|timeout|AbortError|DEADLINE_EXCEEDED|UNAVAILABLE/i.test(combined) ||
    (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
  ) {
    kind = GEMINI_PROXY_ERROR_KIND.BUSY;
  }

  const devDetail =
    (typeof data?.error === 'string' && data.error) ||
    (error && typeof error === 'object' && 'message' in error && String(error.message)) ||
    combined ||
    undefined;

  return {
    kind,
    userMessage: formatGeminiProxyUserMessage(kind, devDetail),
    devDetail,
  };
}

export class GeminiProxyError extends Error {
  /** @param {{ kind: GeminiProxyErrorKind; userMessage: string; devDetail?: string }} payload */
  constructor({ kind, userMessage, devDetail }) {
    super(userMessage);
    this.name = 'GeminiProxyError';
    this.kind = kind;
    this.userMessage = userMessage;
    this.devDetail = devDetail;
  }
}

/**
 * @param {unknown} err
 * @returns {string}
 */
export function getGeminiProxyErrorMessage(err) {
  if (err instanceof GeminiProxyError) return err.userMessage;
  if (err instanceof Error && err.message) return err.message;
  return USER_MESSAGES[GEMINI_PROXY_ERROR_KIND.GENERIC];
}
