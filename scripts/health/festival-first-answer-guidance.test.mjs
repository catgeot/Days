import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GEMINI_PROXY_ERROR_KIND,
  GeminiProxyError,
} from '../../src/pages/Home/lib/geminiProxyError.js';
import {
  festivalFirstAnswerFailureGuidance,
  requestFestivalFirstAnswer,
} from '../../src/pages/Korea/lib/festivalFirstAnswer.js';

const FESTIVAL = { title: '함평 국향대전', contentId: '638576' };

test('festival first answer rate_limited shows the limit message', async () => {
  const limit = '질문이 잠시 몰렸어요. 잠시 후에 다시 물어봐 주세요.';
  const result = await requestFestivalFirstAnswer(FESTIVAL, {
    locale: 'ko',
    invoke: async () => {
      throw new GeminiProxyError({
        kind: GEMINI_PROXY_ERROR_KIND.RATE_LIMITED,
        userMessage: limit,
      });
    },
  });
  assert.equal(result.text, '');
  assert.equal(result.guidance, limit);
  assert.equal(result.kind, 'rate_limited');
  assert.match(festivalFirstAnswerFailureGuidance(new Error('network')), /통신에 실패/);
});

test('festival first answer timeout shows guidance instead of an empty string', async () => {
  const result = await requestFestivalFirstAnswer(FESTIVAL, {
    locale: 'ko',
    timeoutMs: 20,
    invoke: () => new Promise(() => {}),
  });
  assert.equal(result.text, '');
  assert.match(result.guidance, /바쁩니다/);
  assert.equal(result.kind, 'busy');
});
