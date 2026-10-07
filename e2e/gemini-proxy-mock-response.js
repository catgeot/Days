/**
 * Playwright gemini-proxy route mocks — same JSON shape as Edge gemini-proxy success (router.ts).
 * parseGeminiProxyInvokeText must match src/pages/Home/lib/apiClient.js invokeGeminiTask.
 */

export function parseGeminiProxyInvokeText(data) {
  if (!data?.success) return null;
  const text = typeof data.text === 'string' && data.text.trim() ? data.text : '죄송합니다.';
  return text;
}

export function buildGeminiProxyMockBody(
  text,
  { modelUsed = 'mock-e2e', finishReason = 'STOP', truncated = false } = {},
) {
  return {
    success: true,
    text,
    modelUsed,
    finishReason,
    truncated,
  };
}
