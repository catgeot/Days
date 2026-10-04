const REASON_KO = {
  timeout: '응답 시간 초과',
  http_5xx: '서버 오류(5xx)',
  http_4xx: '요청 거부(4xx)',
  missing_element: '화면 요소 없음',
  assert: '검증 실패',
  network: '네트워크 오류',
  unknown: '원인 미분류',
  missing_result: '결과 파일 없음',
};

export function publicReason(reasonCode) {
  return REASON_KO[reasonCode] || REASON_KO.unknown;
}

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

/** 공개 경로(이슈·Summary)용 — raw detail 절대 포함 금지 */
export function koreanReason(reasonCode) {
  return publicReason(reasonCode);
}

export function buildCauseKey(layer, id, reasonCode) {
  return `${layer}:${id}:${reasonCode}`;
}

export function logPrivateDetail(scope, detail) {
  const raw = String(detail || '').replace(/\u001b\[[0-9;]*m/g, '');
  if (!raw.trim()) return;
  console.error(`[health-private][${scope}] ${raw.slice(0, 2000)}`);
}
