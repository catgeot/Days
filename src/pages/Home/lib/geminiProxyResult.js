/**
 * gemini-proxy success body — client SSOT (Edge router.ts와 필드 동기).
 * @param {Record<string, unknown> | null | undefined} data
 */
export function parseGeminiProxySuccess(data) {
  const text =
    typeof data?.text === 'string' && data.text.trim() ? data.text : '죄송합니다.';
  return {
    text,
    truncated: Boolean(data?.truncated),
    finishReason:
      typeof data?.finishReason === 'string' ? data.finishReason : 'STOP',
    modelUsed: typeof data?.modelUsed === 'string' ? data.modelUsed : undefined,
  };
}
