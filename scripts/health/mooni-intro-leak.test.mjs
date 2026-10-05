import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectMooniReplyLeak, sanitizeGeminiUserText } from '../../supabase/functions/_shared/gemini/answerSanitize.mjs';
import { probePlaceChatIntroSummariesForLeaks } from '../lib/probe-place-chat-intro-leak.mjs';

test('sanitize removes Stick to / Draft prefix before Korean', () => {
  const raw =
    'Stick to historical/visual facts.\n\n**Draft\n\n제주도는 한국 최남단의 섬으로, 해안 드라이브가 인기 있습니다.';
  const out = sanitizeGeminiUserText(raw);
  assert.match(out, /^제주도/);
  assert.equal(detectMooniReplyLeak(out), null);
});

test('probe aggregates leak rows', async () => {
  const rows = [
    { destination_key: 'ok', summary: '정상 한국어 소개문입니다.' },
    { destination_key: 'bad', summary: 'Stick to facts.\n\n**Draft\n\n정상 본문' },
  ];
  let call = 0;
  const result = await probePlaceChatIntroSummariesForLeaks({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'eyJ'.padEnd(120, 'x'),
    fetch: async () => {
      call += 1;
      if (call === 1) {
        return new Response(JSON.stringify(rows), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    },
  });
  assert.equal(result.scanned, 2);
  assert.equal(result.ok, false);
  assert.equal(result.leaks.length, 1);
  assert.equal(result.leaks[0].destination_key, 'bad');
});
