import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';

test('stripMooniScheduleTrailingPipes — timetable line', () => {
  const md = getMooniModelMarkdownForRender('KTX 05:03~12:00 서울 출발 |', {
    stripPhantomTicketMention: true,
  });
  assert.equal(md.trimEnd().endsWith('|'), false);
  assert.match(md, /05:03~12:00/);
});

test('continueMooniOrderedListNumbers — heading does not restart at 1', () => {
  const raw = ['1. 첫째', '### 2일차', '1. 둘째', '2. 셋째'].join('\n');
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  assert.match(md, /^2\. 둘째/m);
  assert.match(md, /^3\. 셋째/m);
});

test('continueMooniOrderedListNumbers — section titles renumber after heading', () => {
  const raw = ['1. 첫째', '### 소제목', '3. 셋째'].join('\n');
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  assert.match(md, /^2\. 셋째/m);
});

test('continueMooniOrderedListNumbers — next section after blank renumbers', () => {
  const raw = ['1. 우도 출발', '', '중간 안내 문단', '', '1. 성산 일출봉'].join('\n');
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  assert.match(md, /^2\. 성산 일출봉/m);
});

const LIVE_MERGED_COMPARE =
  '| 구분 | 괌 | 사이판 | 세부 | 보홀 | : | : | : | : | : | **주요 매력** | 괌 비치 | 사이판 다이빙 | 세부 망고 | 보홀 고래';

test('recoverMooniCollapsedGfmTables — live merged compare row', () => {
  const md = getMooniModelMarkdownForRender(LIVE_MERGED_COMPARE, {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /^\| 구분 \| 괌 \|/m);
  assert.match(md, /^\| --- \| --- \|/m);
  assert.match(md, /^\| \*\*주요 매력\*\* \|/m);
});
