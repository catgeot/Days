#!/usr/bin/env node
import {
  GEMINI_PROXY_ERROR_KIND,
  classifyGeminiProxyFailure,
  formatGeminiProxyUserMessage,
} from '../src/pages/Home/lib/geminiProxyError.js';

let fail = 0;

function check(cond, msg) {
  if (!cond) {
    fail += 1;
    console.error(`FAIL  ${msg}`);
  }
}

const budget = classifyGeminiProxyFailure({
  data: { success: false, error: 'budget', retryAfter: 3600 },
  httpStatus: 429,
});
check(budget.kind === GEMINI_PROXY_ERROR_KIND.BUDGET, '429 budget is BUDGET');
check(
  budget.userMessage === '오늘은 MOONi와 나눌 수 있는 이야기가 잠시 쉬어가요. 내일 다시 물어봐 주세요.',
  'budget message is guidance',
);

const quota = classifyGeminiProxyFailure({
  data: { success: false, error: 'quota' },
  httpStatus: 429,
});
check(quota.kind === GEMINI_PROXY_ERROR_KIND.QUOTA, '429 quota stays QUOTA');

const rate = classifyGeminiProxyFailure({
  data: { success: false, error: 'rate_limited', retryAfter: 12 },
  httpStatus: 429,
});
check(rate.kind === GEMINI_PROXY_ERROR_KIND.RATE_LIMITED, 'rate_limited kind');
check(
  rate.userMessage === '질문이 잠시 몰렸어요. 12초 뒤에 다시 물어봐 주세요.',
  'rate message includes seconds',
);
check(
  formatGeminiProxyUserMessage(GEMINI_PROXY_ERROR_KIND.RATE_LIMITED, '', 90)
    === '질문이 잠시 몰렸어요. 잠시 후에 다시 물어봐 주세요.',
  'rate message drops seconds over 60',
);

const tooLarge = classifyGeminiProxyFailure({
  data: { success: false, error: 'too_large' },
  httpStatus: 413,
});
check(tooLarge.kind === GEMINI_PROXY_ERROR_KIND.TOO_LARGE, '413 too_large');
check(
  tooLarge.userMessage === '내용이 너무 길어요. 조금 줄여서 다시 보내 주세요.',
  'too_large message',
);

check(
  classifyGeminiProxyFailure({ httpStatus: 401 }).kind === GEMINI_PROXY_ERROR_KIND.CONFIG,
  '401 config',
);
check(
  classifyGeminiProxyFailure({ data: { error: 'busy' }, httpStatus: 503 }).kind
    === GEMINI_PROXY_ERROR_KIND.BUSY,
  '503 busy',
);
check(
  classifyGeminiProxyFailure({ data: { error: 'origin_not_allowed' }, httpStatus: 403 }).kind
    === GEMINI_PROXY_ERROR_KIND.GENERIC,
  '403 generic',
);
check(
  classifyGeminiProxyFailure({ data: { error: 'upstream_error' }, httpStatus: 502 }).kind
    === GEMINI_PROXY_ERROR_KIND.GENERIC,
  '502 generic',
);

if (fail) {
  console.error(`\ntest-gemini-proxy-error: ${fail} FAIL`);
  process.exit(1);
}
console.log('PASS  test-gemini-proxy-error');
