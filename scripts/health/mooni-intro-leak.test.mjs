import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectMooniReplyLeak, sanitizeGeminiUserText } from '../../supabase/functions/_shared/gemini/answerSanitize.mjs';
import {
  placeChatIntroStoredProbeReason,
  probePlaceChatIntroSummariesForLeaks,
} from '../lib/probe-place-chat-intro-leak.mjs';

const COMPLETE_INTRO =
  '보로부두르는 자바 중부의 불교 사원으로, 이른 아침 일출을 보며 올라가는 코스가 잘 알려져 있습니다.';

test('sanitize removes Stick to / Draft prefix before Korean', () => {
  const raw =
    'Stick to historical/visual facts.\n\n**Draft\n\n제주도는 한국 최남단의 섬으로, 해안 드라이브가 인기 있습니다.';
  const out = sanitizeGeminiUserText(raw);
  assert.match(out, /^제주도/);
  assert.equal(detectMooniReplyLeak(out), null);
});

test('probe aggregates leak rows', async () => {
  const rows = [
    { destination_key: 'ok', summary: COMPLETE_INTRO },
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

test('probe fails mid-sentence cuts and too-short intros', async () => {
  const midShort = '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수';
  const midLong =
    '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수타사는 오래전부터 수행의 장소로 알려져 왔습니다';
  const tooShort = '짧은 문장입니다.';
  assert.equal(placeChatIntroStoredProbeReason(midShort), 'mid_sentence_end');
  assert.equal(placeChatIntroStoredProbeReason(midLong), 'mid_sentence_end');
  assert.equal(placeChatIntroStoredProbeReason(tooShort), 'too_short');
  assert.equal(placeChatIntroStoredProbeReason(COMPLETE_INTRO), null);

  const rows = [
    { destination_key: 'ok', summary: COMPLETE_INTRO },
    { destination_key: 'suta', summary: midShort },
    { destination_key: 'cut', summary: midLong },
    { destination_key: 'tiny', summary: tooShort },
  ];
  let call = 0;
  const result = await probePlaceChatIntroSummariesForLeaks({
    supabaseUrl: 'https://example.supabase.co',
    anonKey: 'eyJ'.padEnd(120, 'x'),
    fetch: async () => {
      call += 1;
      if (call === 1) return new Response(JSON.stringify(rows), { status: 200 });
      return new Response(JSON.stringify([]), { status: 200 });
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.scanned, 4);
  assert.deepEqual(
    result.leaks.map((row) => [row.destination_key, row.reason]),
    [
      ['suta', 'mid_sentence_end'],
      ['cut', 'mid_sentence_end'],
      ['tiny', 'too_short'],
    ],
  );
});
