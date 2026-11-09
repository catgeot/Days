import assert from 'node:assert/strict';
import { test } from 'node:test';
import { micromark } from 'micromark';
import mooniRemarkGfm, { mooniRemarkGfmHtml } from '../../src/components/chat/mooniRemarkGfm.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';
import { isMooniGfmTableLine } from '../../src/utils/mooniGfmTableLine.js';

const COMPARE_TABLE = `괌·오키나와·팔라우·보홀 비교입니다.

| 항목 | 괌 | 오키나와 | 팔라우 | 보홀 |
| --- | --- | --- | --- | --- |
| 비자 | 미국령 | 일본 | 무비자 | 필리핀 |
| **13:30 ** 출발 | 직항 | 직항 | 경유 | 경유 |`;

function renderMooniGfm(markdown) {
  const store = {};
  mooniRemarkGfm.call({ data: () => store });
  return micromark(markdown, {
    extensions: store.micromarkExtensions,
    htmlExtensions: [mooniRemarkGfmHtml({ singleTilde: false })],
  });
}

test('isMooniGfmTableLine — header, separator, body', () => {
  assert.ok(isMooniGfmTableLine('| 항목 | 괌 |'));
  assert.ok(isMooniGfmTableLine('| --- | --- |'));
  assert.ok(!isMooniGfmTableLine('교통 · 티켓 |'));
});

test('getMooniModelMarkdownForRender — comparison table survives chip strip', () => {
  const md = getMooniModelMarkdownForRender(COMPARE_TABLE, { stripPhantomTicketMention: true });
  assert.match(md, /^\| 항목 \| 괌 \|/m);
  assert.match(md, /^\| --- \| --- \| --- \| --- \| --- \|/m);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(html.includes('<th>괌</th>'), html);
  assert.ok(html.includes('<strong>13:30</strong>'), html);
  assert.ok(!html.match(/\|[^<]*\|/), 'no raw pipe row left in HTML');
});

const COLLAPSED_TABLE =
  '| 구분 | 괌 | 오키나와 | 팔라우 | | --- | --- | --- | --- | | 비자 | 미국령 | 일본 | 무비자 |';
const TABLE_WITH_DAY_HEADING = `${COMPARE_TABLE}

**1일차** 오전 스노클링`;

test('getMooniModelMarkdownForRender — collapsed single-line table recover', () => {
  const md = getMooniModelMarkdownForRender(COLLAPSED_TABLE, { stripPhantomTicketMention: true });
  assert.match(md, /^\| 구분 \| 괌 \|/m);
  assert.match(md, /^\| --- \| --- \|/m);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
});

test('getMooniModelMarkdownForRender — table + **N일차** keeps table rows', () => {
  const md = getMooniModelMarkdownForRender(TABLE_WITH_DAY_HEADING, {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /^\| 항목 \| 괌 \|/m);
  assert.doesNotMatch(md, /\|\s{2}\n/, 'table row must not gain hard-break padding');
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
});
