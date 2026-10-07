import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyChatIntent,
  shouldUseQuietCtaForItinerary,
} from '../../src/utils/chatIntentClassifier.js';
import { parseGeminiProxySuccess } from '../../src/pages/Home/lib/geminiProxyResult.js';
import {
  assertItineraryDaysOneThroughFour,
  bookingActionsFingerprint,
  buildMooniContinueUserText,
  canShowMooniContinueButton,
  listItineraryDayHeadingNumbers,
  mergeMooniContinuation,
  MOONI_CONTINUE_MAX_ATTEMPTS,
} from '../../src/utils/mooniTruncatedContinue.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';

const MIYAKO_INTRO = '미야코지마 3박 4일 일정 (mock)';

const truncatedPrior = `${MIYAKO_INTRO}

**1일차** 시모지 공항 → 히라라
히라라 시내 저녁

**2일차** 요시노 해변 오전 · 오후 스노클`;

const continueMidSentence = `링과 일몰 맛집

**3일차** 이리부 다리 · 드라이브
**4일차** 공항 이동 · 출발`;

const continueRestartDay2 = `**2일차** 오후 스노클링과 일몰
**3일차** 이리부 다리 · 드라이브
**4일차** 공항 이동 · 출발`;

const continueWithGreeting = `${MIYAKO_INTRO}

**1일차** 시모지 공항 → 히라라
히라라 시내 저녁

**2일차** 오후 스노클링과 일몰
**3일차** 이리부 다리 · 드라이브
**4일차** 공항 이동 · 출발`;

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

test('truncated prior — markdown render path keeps day headings (no raw ** leak)', () => {
  const rendered = getMooniModelMarkdownForRender(truncatedPrior, { stripPhantomTicketMention: true });
  assert.match(rendered, /\*\*1일차\*\*/);
  assert.ok(rendered.includes('\n'), 'line breaks preserved for markdown');
});

test('mergeMooniContinuation — mid-sentence continue, line breaks, days 1–4 once', () => {
  const merged = mergeMooniContinuation(truncatedPrior, continueMidSentence);
  assert.ok(/스노클\s*링/.test(merged), 'mid-sentence join without paragraph break');
  assert.ok(!merged.includes('스노클\n\n링'), 'no spurious paragraph break mid-word');
  assert.ok(merged.split('\n').filter((l) => l.includes('**1일차**')).length === 1);
  assertItineraryDaysOneThroughFour(merged);
  const dayLines = merged.split('\n').filter((l) => /일차/.test(l));
  assert.ok(dayLines.length >= 4, 'day headings on separate lines');
});

test('mergeMooniContinuation — restart at 2일차 heading', () => {
  const merged = mergeMooniContinuation(truncatedPrior, continueRestartDay2);
  assertItineraryDaysOneThroughFour(merged);
  assert.equal(listItineraryDayHeadingNumbers(merged).filter((d) => d === 2).length, 1);
  assert.ok(merged.includes('스노클링'));
});

test('mergeMooniContinuation — greeting repeat stripped', () => {
  const merged = mergeMooniContinuation(truncatedPrior, continueWithGreeting);
  assertItineraryDaysOneThroughFour(merged);
  assert.equal((merged.match(/\(mock\)/g) || []).length, 1);
});

test('mergeMooniContinuation — strips duplicate day heading line', () => {
  const prior = '**1일차** 아침\n**2일차** 오전 일정';
  const cont = '**2일차** 오후 해변\n**3일차** 종료';
  const merged = mergeMooniContinuation(prior, cont);
  assert.ok(merged.includes('오후 해변'));
  assert.ok(merged.includes('오전 일정'));
  assert.ok(merged.includes('**3일차**'));
});

test('이어쓰기 후 booking 카드 묶음 — frozen fingerprint unchanged', () => {
  const initialActions = [
    { provider: 'mrt', type: 'stay' },
    { provider: 'klook', type: 'tour' },
    { provider: 'klook', type: 'pickup' },
  ];
  const before = bookingActionsFingerprint(initialActions);
  const modelMsg = {
    frozenBookingActions: initialActions,
    bookingActions: initialActions,
    mooniRawReply: truncatedPrior,
  };
  const merged = mergeMooniContinuation(truncatedPrior, continueMidSentence);
  const afterMsg = {
    ...modelMsg,
    mooniRawReply: merged,
    text: merged,
  };
  const cardActions = afterMsg.frozenBookingActions ?? afterMsg.bookingActions;
  assert.equal(bookingActionsFingerprint(cardActions), before);
  assert.equal(cardActions.length, 3);
});

test('buildMooniContinueUserText — ko hint', () => {
  assert.ok(buildMooniContinueUserText('ko').includes('끊긴'));
});

/** 라이브: 도입부 ~130자에서 끊김(1일차 제목 전) */
const truncatedEarlyIntro = `미야코지마 3박 4일 일정 (mock)

오키나와 남부 미야코지마는 푸른 바다와 산책로, 드라이브 코스, 스노클링 포인트가 잘 갖춰진 섬입니다. 이번 여행은 시모지 공항 도착 후 히라라 시내 숙소로 이동한 뒤 가볍게`;

const continueAfterEarlyIntro = ` 시내로 이동해 체크인합니다.

**1일차** 시모지 공항 → 히라라 · 체크인
히라라 시내 저녁

**2일차** 요시노 해변
**3일차** 이리부 다리
**4일차** 공항 · 출발`;

test('mergeMooniContinuation — 단어 경계 공백 보존 (걸어서 + 이동해)', () => {
  const merged = mergeMooniContinuation('오후에는 걸어서', '이동해 보세요.');
  assert.ok(merged.includes('걸어서 이동해'));
  assert.ok(!merged.includes('걸어서이동해'));
});

test('mergeMooniContinuation — 도입부 130자 끊김 후 이어쓰기, intro 1회·1~4일차', () => {
  assert.ok(
    truncatedEarlyIntro.length >= 120 && truncatedEarlyIntro.length <= 140,
    `intro len ${truncatedEarlyIntro.length}`,
  );
  assert.ok(!truncatedEarlyIntro.includes('**1일차**'));
  const merged = mergeMooniContinuation(truncatedEarlyIntro, continueAfterEarlyIntro);
  assert.equal((merged.match(/미야코지마\s*3박\s*4일\s*일정\s*\(mock\)/gi) || []).length, 1);
  assertItineraryDaysOneThroughFour(merged);
  assert.ok(merged.includes('히라라 시내'));
});
