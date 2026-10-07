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
