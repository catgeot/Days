import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('MOONi open does not admit gemini-proxy before the user asks', () => {
  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.doesNotMatch(chat, /requestFestivalFirstAnswer/);
  assert.doesNotMatch(chat, /generatePlaceChatIntroWithAi/);
  assert.doesNotMatch(chat, /invokeGeminiTask\(\s*['"]festival_first_answer/);
  assert.doesNotMatch(chat, /invokeGeminiTask\(\s*['"]place_intro/);
  assert.match(chat, /buildFestivalMooniChatOpening/);
  assert.match(chat, /fetchPlaceChatIntroSummary/);
  assert.match(chat, /invokeGeminiTask\(\s*['"]mooni_chat/);
});

test('gemini-proxy keeps the IP minute cap and still returns 429', () => {
  const limits = readFileSync(join(root, 'supabase/functions/_shared/gemini/limits.ts'), 'utf8');
  assert.match(limits, /ip_minute:\s*4/);
  assert.match(limits, /ip_hour:\s*20/);
  assert.match(limits, /ip_day:\s*40/);
  assert.match(limits, /user_day:\s*40/);
  const router = readFileSync(join(root, 'supabase/functions/gemini-proxy/router.ts'), 'utf8');
  assert.match(router, /error,\s*retryAfter/);
  assert.match(router, /429/);
  assert.match(router, /rate_limited/);
});
