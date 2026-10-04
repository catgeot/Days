const REASON_KO = {
  timeout: '응답 시간 초과',
  http_5xx: '서버 오류(5xx)',
  http_4xx: '요청 거부(4xx)',
  missing_element: '화면 요소 없음',
  assert: '검증 실패',
  network: '네트워크 오류',
  unknown: '원인 미분류',
};

export function classifyReasonCode(detail) {
  const text = String(detail || '');
  if (/timeout|AbortError|Timeout \d+ms/i.test(text)) return 'timeout';
  if (/HTTP 5\d\d/i.test(text)) return 'http_5xx';
  if (/HTTP 4\d\d|401|403/i.test(text)) return 'http_4xx';
  if (/toBeVisible|toHaveCount|not found|locator/i.test(text)) return 'missing_element';
  if (/expect\(/i.test(text)) return 'assert';
  if (/fetch failed|ENOTFOUND|ECONNRESET/i.test(text)) return 'network';
  return 'unknown';
}

export function koreanReason(reasonCode, detail) {
  const base = REASON_KO[reasonCode] || REASON_KO.unknown;
  const trimmed = String(detail || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  if (!trimmed) return base;
  return `${base} (${trimmed})`;
}

export function buildCauseKey(layer, id, reasonCode) {
  return `${layer}:${id}:${reasonCode}`;
}
