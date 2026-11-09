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

test('continueMooniOrderedListNumbers — preserves explicit start 3', () => {
  const raw = ['1. 첫째', '### 소제목', '3. 셋째'].join('\n');
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  assert.match(md, /^3\. 셋째/m);
});
