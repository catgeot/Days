import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MOONI_GEMINI_HISTORY_MAX_TOTAL_CHARS,
  MOONI_GEMINI_HISTORY_MAX_TURN_CHARS,
  prepareMooniGeminiHistory,
  truncateMooniHistoryTurnText,
} from '../../src/utils/mooniGeminiHistoryPayload.js';
import { buildMooniGeminiHistory } from '../../src/pages/Home/lib/mooniChatContinue.js';
import { buildMooniContinueUserText } from '../../src/utils/mooniTruncatedContinue.js';

function assertHistoryWithinEdgeLimits(history, label) {
  assert.ok(Array.isArray(history), label);
  assert.ok(history.length <= 12, `${label}: turn count`);
  let total = 0;
  for (const turn of history) {
    assert.ok(turn.text.length <= MOONI_GEMINI_HISTORY_MAX_TURN_CHARS, `${label}: turn len`);
    total += turn.text.length;
  }
  assert.ok(total <= MOONI_GEMINI_HISTORY_MAX_TOTAL_CHARS, `${label}: total len ${total}`);
}

test('truncateMooniHistoryTurnText — 2500 char model → ≤2000, keeps head + tail', () => {
  const intro = '미야코지마 3박 4일 일정 (mock)\n';
  const body = 'x'.repeat(2480);
  const raw = intro + body;
  const trimmed = truncateMooniHistoryTurnText(raw, 'model');
  assert.ok(trimmed.length <= MOONI_GEMINI_HISTORY_MAX_TURN_CHARS);
  assert.ok(trimmed.startsWith('미야코지마 3박 4일 일정 (mock)'));
  assert.ok(trimmed.endsWith('x'));
});

test('prepareMooniGeminiHistory — long model turn in payload', () => {
  const longModel = `제목 줄\n${'가'.repeat(2600)}`;
  const history = prepareMooniGeminiHistory([
    { role: 'user', text: '일정 짜줘' },
    { role: 'model', text: longModel },
  ]);
  assertHistoryWithinEdgeLimits(history, 'long model');
});

test('buildMooniGeminiHistory — 이어서 보기 payload within limits', () => {
  const longReply = `**1일차** 시작\n${'나'.repeat(2800)}`;
  const messages = [
    { role: 'user', text: '미야코지마 3박 일정' },
    {
      role: 'model',
      text: 'display',
      mooniRawReply: longReply,
      mooniTurnContext: { geminiParams: {} },
    },
  ];
  const history = buildMooniGeminiHistory(messages, 1);
  assertHistoryWithinEdgeLimits(history, 'continue');
  assert.equal(typeof buildMooniContinueUserText('ko'), 'string');
});

test('buildMooniGeminiHistory — 잘린 model 턴 포함, 끝 200자 보존', () => {
  const tailMarker = '끊긴지점_미야코_끝부분_표시';
  const longReply = `${'가'.repeat(2400)}${tailMarker}`;
  const messages = [
    { role: 'user', text: '17자짜리 사용자 질문입니다.' },
    {
      role: 'model',
      mooniRawReply: longReply,
      text: 'display',
    },
  ];
  const history = buildMooniGeminiHistory(messages, 1);
  assert.equal(history[history.length - 1].role, 'model');
  assert.ok(history[history.length - 1].text.includes(tailMarker.slice(-80)));
  assert.ok(history[history.length - 1].text.length <= MOONI_GEMINI_HISTORY_MAX_TURN_CHARS);
});

test('buildMooniGeminiHistory — 2000자 초과 잘린 답변은 끝부분·≤2000자', () => {
  const endOnly = 'Z'.repeat(120);
  const longReply = `${'Y'.repeat(2500)}${endOnly}`;
  const messages = [
    { role: 'user', text: '일정' },
    { role: 'model', mooniRawReply: longReply, text: 'x' },
  ];
  const history = buildMooniGeminiHistory(messages, 1);
  const modelTurn = history[history.length - 1];
  assert.equal(modelTurn.role, 'model');
  assert.ok(modelTurn.text.length <= MOONI_GEMINI_HISTORY_MAX_TURN_CHARS);
  assert.ok(modelTurn.text.endsWith(endOnly.slice(-40)));
  assert.ok(modelTurn.text.includes('앞부분 생략'));
});

test('buildMooniGeminiHistory — 2회차 이어쓰기에 1회 병합 답변 끝부분', () => {
  const firstPartial = `**1일차** 히라라\n${'a'.repeat(500)}CUT_TAIL_1`;
  const mergedAfterFirst = `${firstPartial}CONTINUE_PART_1`;
  const messages = [
    { role: 'user', text: '미야코 3박' },
    {
      role: 'model',
      mooniRawReply: mergedAfterFirst,
      text: mergedAfterFirst,
      truncated: false,
      continueAttempts: 1,
    },
  ];
  const history = buildMooniGeminiHistory(messages, 1);
  assert.ok(history[history.length - 1].text.includes('CONTINUE_PART_1'));
  assert.ok(history[history.length - 1].text.includes('CUT_TAIL_1'));
});

test('prepareMooniGeminiHistory — drops oldest when total > 12000', () => {
  const chunk = 'a'.repeat(1900);
  const turns = [];
  for (let i = 0; i < 8; i += 1) {
    turns.push({ role: 'user', text: `${i}-${chunk}` });
    turns.push({ role: 'model', text: `${i}-m-${chunk}` });
  }
  const history = prepareMooniGeminiHistory(turns);
  assertHistoryWithinEdgeLimits(history, 'many turns');
  assert.ok(history.length <= 12);
});
