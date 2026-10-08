import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GEMINI_ALLOWED_MODELS,
  GEMINI_MODELS,
  resolveGeminiModelId,
} from '../../src/utils/geminiModels.js';
import {
  GEMINI_FAST,
  GEMINI_PROXY_MODELS,
  GEMINI_QUALITY,
  GEMINI_WRITE,
  GEMINI_WRITE_FALLBACK,
  GEMINI_WRITE_TRY_ORDER,
  isGeminiProxyModelAllowed,
  resolveGeminiModelId as resolveEdgeModelId,
} from '../../supabase/functions/_shared/geminiModelPolicy.js';
import {
  HISTORY_TURN_MAX,
  MODEL_TAIL_OMIT_PREFIX,
  trimHistoryTurnText,
} from '../../supabase/functions/_shared/gemini/historyNormalize.js';
import { thinkingConfigForBodyText } from '../../supabase/functions/_shared/gemini/thinkingConfig.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('old model ids resolve to 3.8-flash and new ids stay on the allowlist', () => {
  assert.equal(GEMINI_MODELS.FAST, 'gemini-3.1-flash-lite');
  assert.equal(GEMINI_MODELS.QUALITY, 'gemini-3.8-flash');
  assert.equal(GEMINI_MODELS.WRITE, 'gemini-3.8-flash');
  assert.equal(resolveGeminiModelId('gemini-3.5-flash'), GEMINI_MODELS.QUALITY);
  assert.equal(resolveGeminiModelId('gemini-3.1-pro-preview'), GEMINI_MODELS.WRITE);
  assert.equal(resolveGeminiModelId('gemini-3.8-flash'), 'gemini-3.8-flash');
  assert.equal(GEMINI_QUALITY, GEMINI_MODELS.QUALITY);
  assert.equal(GEMINI_WRITE, GEMINI_MODELS.WRITE);
  assert.equal(GEMINI_FAST, GEMINI_MODELS.FAST);
  assert.equal(GEMINI_WRITE_FALLBACK, 'gemini-3.7-flash');
  assert.deepEqual(GEMINI_WRITE_TRY_ORDER, ['gemini-3.8-flash', 'gemini-3.7-flash']);

  for (const id of ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro']) {
    const resolved = resolveEdgeModelId(id);
    assert.equal(isGeminiProxyModelAllowed(id), true, id);
    assert.equal(GEMINI_PROXY_MODELS.includes(resolved), true, resolved);
    assert.equal(resolved.includes('2.5'), false, id);
    assert.equal(resolved.includes('3.5-flash'), false, id);
    assert.equal(resolved.includes('pro-preview'), false, id);
  }
  assert.equal(GEMINI_ALLOWED_MODELS.includes('gemini-3.8-flash'), true);
  assert.equal(Object.values(GEMINI_MODELS).some((id) => String(id).includes('2.5')), false);
});

test('3.8 and 3.7 use thinkingLevel low, not thinkingBudget', () => {
  for (const id of ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite']) {
    const config = thinkingConfigForBodyText(id);
    assert.deepEqual(config, { thinkingLevel: 'low' });
    assert.equal('thinkingBudget' in config, false);
  }
  assert.deepEqual(thinkingConfigForBodyText('gemini-2.5-flash'), { thinkingBudget: 0 });
});

test('model history over 2000 chars keeps the tail and a omit prefix', () => {
  const tail = 'CUT_TAIL';
  const raw = `${'가'.repeat(2500)}${tail}`;
  const trimmed = trimHistoryTurnText('model', raw);
  assert.ok(trimmed.length <= HISTORY_TURN_MAX);
  assert.ok(trimmed.startsWith(MODEL_TAIL_OMIT_PREFIX));
  assert.ok(trimmed.endsWith(tail));
  const user = trimHistoryTurnText('user', `Q${'나'.repeat(2400)}`);
  assert.ok(user.length <= HISTORY_TURN_MAX);
  assert.ok(user.startsWith('…\n'));
});

test('edge mooni task uses trim, low thinking, and 4096 for itinerary or quality', () => {
  const tasks = readFileSync(join(root, 'supabase/functions/_shared/gemini/tasks.ts'), 'utf8');
  assert.match(tasks, /trimHistoryTurnText/);
  assert.doesNotMatch(tasks, /text\.length > 2000\) return null/);
  assert.match(tasks, /maxOutputTokens: longForm \? 4096 : 1536/);
  assert.match(tasks, /limitThinking: true/);
});
