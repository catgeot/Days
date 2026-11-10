import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeMooniMarkdownBoldSpacing } from '../../src/utils/mooniMarkdownBoldSpacing.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';

test('normalizeMooniMarkdownBoldSpacing — trims space before closing **', () => {
  assert.equal(normalizeMooniMarkdownBoldSpacing('**13:30 ** 출발'), '**13:30** 출발');
});

test('normalizeMooniMarkdownBoldSpacing — trims space after opening **', () => {
  assert.equal(normalizeMooniMarkdownBoldSpacing('** 리조트 체크인**'), '**리조트 체크인**');
  assert.equal(normalizeMooniMarkdownBoldSpacing('** 천진항과 **'), '**천진항과**');
});

test('getMooniModelMarkdownForRender — AI time bold renders', () => {
  const md = getMooniModelMarkdownForRender('**13:30 ** 출발편', { stripPhantomTicketMention: true });
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(html.includes('<strong>13:30</strong>'), html);
  assert.ok(!html.includes('**'), html);
});

test('normalizeMooniMarkdownBoldSpacing — adjacent bold islands keep glue words', () => {
  const md = getMooniModelMarkdownForRender(
    'Here **Bohol** and **Okinawa** for travel **experience**.',
    { stripPhantomTicketMention: true },
  );
  assert.match(md, /\*\*Bohol\*\* and \*\*Okinawa\*\*/);
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(html.includes('<strong>Bohol</strong>'), html);
  assert.ok(html.includes('<strong>Okinawa</strong>'), html);
  assert.ok(html.includes(' and '), html);
});

test('normalizeMooniMarkdownBoldSpacing — **N일차** 뒤 오전·지명 bold 유지', () => {
  const md = getMooniModelMarkdownForRender('**1일차** 오전 **Bohol** 투어', {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /\*\*1일차\*\* 오전 \*\*Bohol\*\*/);
});

test('normalizeMooniMarkdownBoldSpacing — well-formed bold+hangul glue is not split', () => {
  const md = getMooniModelMarkdownForRender('**미야코지마**시기라미라지', {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /\*\*미야코지마\*\*시기라미라지/);
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(html.includes('<strong>미야코지마</strong>'), html);
  assert.ok(html.includes('시기라미라지'), html);
});

test('normalizeMooniMarkdownBoldSpacing — glued 우도에는** 천진항**과 (PROD 10:28)', () => {
  const md = getMooniModelMarkdownForRender(
    '우도에는** 천진항**과 **하우목동항** 두 곳이 있어요.',
    { stripPhantomTicketMention: true },
  );
  assert.match(md, /\*\*천진항\*\*과 \*\*하우목동항\*\*/, md);
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(html.includes('<strong>천진항</strong>'), html);
  assert.ok(!html.includes('**'), html);
});

test('normalizeMooniMarkdownBoldSpacing — PROD 11/9 우도 open-space tight-close bold', () => {
  const raw = '우도에는 ** 천진항**과 ** 하우목동항** 두 곳이 있어요.\n\n**이동 시간**: 15분';
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  assert.match(md, /\*\*천진항\*\*과 \*\*하우목동항\*\*/, md);
  assert.match(md, /\*\*이동 시간\*\*:/, md);
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(html.includes('<strong>천진항</strong>'), html);
  assert.ok(html.includes('<strong>하우목동항</strong>'), html);
  assert.ok(!html.includes('**'), html);
});

test('normalizeMooniMarkdownBoldSpacing — PROD 우도 spaced back-to-back bold', () => {
  const raw = '우도에는 ** 천진항과 ** 하우목동항 ** 이 있어요';
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  assert.match(md, /\*\*천진항과\*\* \*\*하우목동항\*\*/);
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(html.includes('<strong>천진항과</strong>'), html);
  assert.ok(html.includes('<strong>하우목동항</strong>'), html);
  assert.ok(!html.includes('**'), html);
});

test('normalizeMooniMarkdownBoldSpacing — two bold pairs on one line', () => {
  const md = getMooniModelMarkdownForRender(
    '우도에는 **천진항과** 하우목동항이 있어요. ** 리조트 체크인**',
    { stripPhantomTicketMention: true },
  );
  assert.match(md, /\*\*천진항과\*\* 하우목동항이 있어요\. \*\*리조트 체크인\*\*/);
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(html.includes('<strong>천진항과</strong>'), html);
  assert.ok(html.includes('<strong>리조트 체크인</strong>'), html);
  assert.ok(!html.includes('**'), html);
});

const BOLD_AND_OUTER_TABLE = `**1일차** 요약

| 항목 | 괌 | 오키나와 |
| :--- | :--- | :--- |
| **이동** | 직항 | 직항 |`;

test('getMooniModelMarkdownForRender — bold + outer-pipe table', () => {
  const md = getMooniModelMarkdownForRender(BOLD_AND_OUTER_TABLE, {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /\*\*1일차\*\* 요약/);
  assert.match(md, /^\| --- \|/m);
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(html.includes('<strong>1일차</strong>'), html);
  assert.ok(html.includes('<table'), html);
});
