import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GEMINI_PROXY_ERROR_KIND,
  MOONI_RATE_LIMIT_LONG_SEC,
  classifyGeminiProxyFailure,
  formatGeminiProxyUserMessage,
  formatMooniRateLimitedMessage,
  formatRateLimitResumeLocalTime,
  getGeminiProxyErrorMessage,
  GeminiProxyError,
  resolveGeminiProxyRetryAfterSeconds,
} from '../../src/pages/Home/lib/geminiProxyError.js';

const FIXED_NOW = Date.parse('2026-11-09T12:00:00+09:00');

test('resolveGeminiProxyRetryAfterSeconds prefers body over header', () => {
  assert.equal(
    resolveGeminiProxyRetryAfterSeconds({ retryAfter: 12, headerRetryAfter: '9000' }),
    12,
  );
});

test('resolveGeminiProxyRetryAfterSeconds falls back to Retry-After header', () => {
  assert.equal(
    resolveGeminiProxyRetryAfterSeconds({ headerRetryAfter: '45' }),
    45,
  );
});

test('formatMooniRateLimitedMessage ko short seconds', () => {
  const msg = formatMooniRateLimitedMessage(12, 'ko', FIXED_NOW);
  assert.match(msg, /12초 뒤/);
});

test('formatMooniRateLimitedMessage ko short soon without retryAfter', () => {
  const msg = formatMooniRateLimitedMessage(undefined, 'ko', FIXED_NOW);
  assert.match(msg, /잠시 후에/);
});

test('formatMooniRateLimitedMessage ko long includes local time', () => {
  const sec = MOONI_RATE_LIMIT_LONG_SEC;
  const time = formatRateLimitResumeLocalTime(sec, 'ko', FIXED_NOW);
  const msg = formatMooniRateLimitedMessage(sec, 'ko', FIXED_NOW);
  assert.match(msg, /오늘 사용량이 다 찼어요/);
  assert.ok(msg.includes(time), `expected time token ${time} in ${msg}`);
});

test('formatMooniRateLimitedMessage en variants', () => {
  assert.match(
    formatMooniRateLimitedMessage(30, 'en', FIXED_NOW),
    /30 seconds/,
  );
  assert.match(
    formatMooniRateLimitedMessage(90, 'en', FIXED_NOW),
    /in a bit/,
  );
  assert.match(
    formatMooniRateLimitedMessage(7200, 'en', FIXED_NOW),
    /today's quota/i,
  );
});

test('classifyGeminiProxyFailure merges Retry-After header', () => {
  const result = classifyGeminiProxyFailure({
    data: { success: false, error: 'rate_limited' },
    httpStatus: 429,
    headerRetryAfter: '9000',
  });
  assert.equal(result.kind, GEMINI_PROXY_ERROR_KIND.RATE_LIMITED);
  assert.equal(result.retryAfter, 9000);
  assert.match(result.userMessage, /오늘 사용량이 다 찼어요/);
});

test('getGeminiProxyErrorMessage localizes rate_limited at display time', () => {
  const err = new GeminiProxyError(
    classifyGeminiProxyFailure({
      data: { success: false, error: 'rate_limited', retryAfter: 9000 },
      httpStatus: 429,
    }),
  );
  assert.match(getGeminiProxyErrorMessage(err, 'en'), /today's quota/i);
  assert.match(getGeminiProxyErrorMessage(err, 'ko'), /오늘 사용량/);
});

test('formatGeminiProxyUserMessage keeps soon message between short and long windows', () => {
  const msg = formatGeminiProxyUserMessage(
    GEMINI_PROXY_ERROR_KIND.RATE_LIMITED,
    '',
    90,
    'ko',
    FIXED_NOW,
  );
  assert.equal(msg, formatMooniRateLimitedMessage(90, 'ko', FIXED_NOW));
  assert.match(msg, /잠시 후에/);
});
