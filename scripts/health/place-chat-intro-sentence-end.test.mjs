import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  isPlaceChatIntroSentenceComplete,
  placeChatIntroSentenceEndRejectReason,
} from '../../src/pages/Home/lib/placeChatIntroSentenceEnd.js';

const MIGRATION_SQL = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../supabase/migrations/20261008120000_save_place_chat_intro_sentence_end.sql',
);

const OK_INTRO =
  '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수타사는 신라 시대에 처음 세워졌다고 전해지는 유서 깊은 산사입니다. ' +
  '사계절 숲길과 고즈넉한 법당이 어우러져, 잠시 발길을 멈추고 쉬어 가 보기 좋습니다.';

const SUTA_STUMP = '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수';

test('passes known good Korean intros (다./습니다./요.)', () => {
  assert.equal(isPlaceChatIntroSentenceComplete(OK_INTRO), true);
  assert.equal(
    isPlaceChatIntroSentenceComplete(
      '보로부두르는 자바 중부의 불교 사원으로, 이른 아침 일출을 보며 올라가는 코스가 잘 알려져 있습니다.',
    ),
    true,
  );
  assert.equal(
    isPlaceChatIntroSentenceComplete(
      '제주 올레길은 해안을 따라 걷기 좋은 코스가 많아, 가벼운 산책 여행에 잘 맞습니다.',
    ),
    true,
  );
});

test('passes terminal ? ! … 。 and optional closing quotes', () => {
  assert.equal(
    isPlaceChatIntroSentenceComplete(
      '이 지역은 비가 오면 안개가 내려와 산책 코스가 더 고요하게 느껴집니다?',
    ),
    true,
  );
  assert.equal(
    isPlaceChatIntroSentenceComplete('해안 절벽 위 전망대에서 바다를 내려다보면 일몰이 특히 아름답습니다!'),
    true,
  );
  assert.equal(
    isPlaceChatIntroSentenceComplete('고즈넉한 골목을 따라 걷다 보면 작은 카페가 나옵니다…'),
    true,
  );
  assert.equal(
    isPlaceChatIntroSentenceComplete('산책로 끝에서 바다가 펼쳐지는 장면이 인상적입니다。」'),
    true,
  );
  assert.equal(
    isPlaceChatIntroSentenceComplete('도심을 벗어나면 조용한 산책로가 이어지며, 저녁 노을이 특히 아름답습니다。」'),
    true,
  );
  assert.equal(
    isPlaceChatIntroSentenceComplete(
      '해안 산책로를 따라 걷다 보면 작은 전망대가 나오고, 바다 전경이 한눈에 들어옵니다）。',
    ),
    true,
  );
  assert.equal(
    isPlaceChatIntroSentenceComplete(
      '제주 올레길은 해안을 따라 걷기 좋은 코스가 많아, 가벼운 산책 여행에 잘 맞아요.”',
    ),
    true,
  );
  assert.equal(
    isPlaceChatIntroSentenceComplete(
      '해안 절벽 위 전망대에서 바다를 내려다보면 일몰이 특히 아름다워 사진 찍기 좋은 길입니다!”',
    ),
    true,
  );
});

test('migration sentence-end regex includes curly closers (JS parity)', () => {
  const sql = readFileSync(MIGRATION_SQL, 'utf8');
  assert.match(sql, /!\~\s*\(/, 'sentence-end match must parenthesize pattern concat');
  assert.ok(sql.includes("||'\\s*$')"), 'regex tail must be plain \\s*$ string, not E-string');
  assert.doesNotMatch(sql, /E'\\s/, 'E-string \\s is invalid for Postgres whitespace in regex');
  assert.match(sql, /\\u201d\\u2019\\u300d\\u300f\\uff09/);
  const curlyPeriod =
    '제주 올레길은 해안을 따라 걷기 좋은 코스가 많아, 가벼운 산책 여행에 잘 맞아요.”';
  const curlyExclaim =
    '해안 절벽 위 전망대에서 바다를 내려다보면 일몰이 특히 아름다워 사진 찍기 좋은 길입니다!”';
  assert.equal(isPlaceChatIntroSentenceComplete(curlyPeriod), true);
  assert.equal(isPlaceChatIntroSentenceComplete(curlyExclaim), true);
});

test('migration replace() is Postgres 3-arg only (no fourth g flag)', () => {
  const sql = readFileSync(MIGRATION_SQL, 'utf8');
  const calls = sql.match(/replace\s*\([^)]*\)/gi) ?? [];
  assert.ok(calls.length >= 2, 'expected replace() calls in forward migration');
  for (const call of calls) {
    const inner = call.slice(call.indexOf('(') + 1, -1);
    const argCount = inner.split(',').length;
    assert.equal(argCount, 3, `replace must have exactly 3 arguments: ${call}`);
  }
});

test('rejects mid-sentence cuts and missing terminal punctuation', () => {
  assert.equal(placeChatIntroSentenceEndRejectReason(SUTA_STUMP), 'mid_sentence_end');
  assert.equal(
    placeChatIntroSentenceEndRejectReason(
      '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수타사는 오래전부터 수행의 장소로 알려져 왔습니다',
    ),
    'mid_sentence_end',
  );
});

test('rejects bogus letter after terminal punctuation (JS parity: .s)', () => {
  assert.equal(
    placeChatIntroSentenceEndRejectReason(
      '제주 올레길은 해안을 따라 걷기 좋은 코스가 많아, 가벼운 산책 여행에 잘 맞습니다.s',
    ),
    'mid_sentence_end',
  );
});

test('accepts optional trailing whitespace after valid ending (newline)', () => {
  assert.equal(
    isPlaceChatIntroSentenceComplete(
      '제주 올레길은 해안을 따라 걷기 좋은 코스가 많아, 가벼운 산책 여행에 잘 맞습니다.\n',
    ),
    true,
  );
});

test('rejects trailing comma/colon and unclosed markdown', () => {
  assert.equal(
    placeChatIntroSentenceEndRejectReason(
      '제주도는 한국 최남단의 섬으로, 해안 드라이브가 인기 있는 여행지입니다,',
    ),
    'trailing_punct',
  );
  assert.equal(
    placeChatIntroSentenceEndRejectReason(
      '부산 해운대는 넓은 백사장과 야경이 어우러진 대표 해변입니다:',
    ),
    'trailing_punct',
  );
  assert.equal(
    placeChatIntroSentenceEndRejectReason(
      '**미완성 볼드 마커가 닫히지 않은 인트로 문장입니다. 실제로는 이렇게 저장되면 안 됩니다.',
    ),
    'unclosed_markdown',
  );
});
