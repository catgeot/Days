import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyChatIntent,
  shouldUseQuietCtaForItinerary,
} from '../../src/utils/chatIntentClassifier.js';
import { parseGeminiProxySuccess } from '../../src/pages/Home/lib/geminiProxyResult.js';
import {
  canShowMooniContinueButton,
  mergeMooniContinuation,
  MOONI_CONTINUE_MAX_ATTEMPTS,
} from '../../src/utils/mooniTruncatedContinue.js';

test('plan_itinerary CTA — none_quiet (no transport_flight prompt)', () => {
  const intent = classifyChatIntent('미야코지마 3박 4일 일정 짜줘', [], 'miyakojima');
  assert.equal(shouldUseQuietCtaForItinerary(intent), true);
});

test('parseGeminiProxySuccess — truncated and finishReason', () => {
  const r = parseGeminiProxySuccess({
    success: true,
    text: 'partial',
    truncated: true,
    finishReason: 'MAX_TOKENS',
  });
  assert.equal(r.text, 'partial');
  assert.equal(r.truncated, true);
  assert.equal(r.finishReason, 'MAX_TOKENS');
});

test('canShowMooniContinueButton — truncated shows, STOP hides', () => {
  assert.equal(canShowMooniContinueButton({ truncated: true, continueAttempts: 0 }), true);
  assert.equal(canShowMooniContinueButton({ truncated: false, finishReason: 'STOP' }), false);
  assert.equal(
    canShowMooniContinueButton({ truncated: true, continueAttempts: MOONI_CONTINUE_MAX_ATTEMPTS }),
    false,
  );
});

test('mergeMooniContinuation — strips duplicate day heading', () => {
  const prior = '**1일차** 아침\n**2일차** 오전 일정';
  const cont = '**2일차** 오후 해변\n**3일차** 종료';
  const merged = mergeMooniContinuation(prior, cont);
  assert.ok(merged.includes('오후 해변'));
  assert.ok(merged.includes('오전 일정'));
  assert.ok(merged.includes('**3일차**'));
});
