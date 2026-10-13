import assert from 'node:assert/strict';
import { test } from 'node:test';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import mooniRemarkGfm, { mooniRemarkGfmHtml } from '../../src/components/chat/mooniRemarkGfm.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';
import { mergeMooniContinuation } from '../../src/utils/mooniTruncatedContinue.js';

const MIYAKO_TRUNCATED = `미야코지마 3박 4일 일정 (mock)

**1일차** 시모지 공항 → 히라라
히라라 시내 저녁

**2일차** 요시노 해변 오전 · 오후 스노클`;

const MIYAKO_CONTINUE = `링과 일몰 맛집

**3일차** 이리부 다리 · 드라이브
**4일차** 공항 이동 · 출발`;

const NORMAL_STOP_REPLY = `미야코지마는 일본 오키나와 현 남부에 있는 섬입니다.
해변과 다이빙이 유명해요.`;

function renderMooniMarkdownHtml(markdown) {
  return micromark(markdown, {
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  });
}

function assertRenderedMarkdown(html, label, { expectDayHeadings = false } = {}) {
  assert.ok(!html.includes('**'), `${label}: literal ** in HTML`);
  if (expectDayHeadings) {
    assert.ok(html.includes('<strong>'), `${label}: expected <strong> for day headings`);
  }
}

test('markdown render — STOP / truncated / merged share path, no literal **', () => {
  const stopMd = getMooniModelMarkdownForRender(NORMAL_STOP_REPLY, {
    stripPhantomTicketMention: true,
  });
  const truncatedMd = getMooniModelMarkdownForRender(MIYAKO_TRUNCATED, {
    stripPhantomTicketMention: true,
  });
  const mergedRaw = mergeMooniContinuation(MIYAKO_TRUNCATED, MIYAKO_CONTINUE);
  const mergedMd = getMooniModelMarkdownForRender(mergedRaw, {
    stripPhantomTicketMention: true,
  });

  assertRenderedMarkdown(renderMooniMarkdownHtml(stopMd), 'STOP');
  assertRenderedMarkdown(renderMooniMarkdownHtml(truncatedMd), 'truncated', {
    expectDayHeadings: true,
  });
  assertRenderedMarkdown(renderMooniMarkdownHtml(mergedMd), 'merged', {
    expectDayHeadings: true,
  });
});

test('markdown render — day1 sub-lines keep soft breaks after continue', () => {
  const mergedRaw = mergeMooniContinuation(MIYAKO_TRUNCATED, MIYAKO_CONTINUE);
  const mergedMd = getMooniModelMarkdownForRender(mergedRaw, {
    stripPhantomTicketMention: true,
  });
  const html = renderMooniMarkdownHtml(mergedMd);
  const truncatedMd = getMooniModelMarkdownForRender(MIYAKO_TRUNCATED, {
    stripPhantomTicketMention: true,
  });
  const truncatedHtml = renderMooniMarkdownHtml(truncatedMd);
  assert.equal(
    html.includes('<br>'),
    truncatedHtml.includes('<br>'),
    'truncated vs merged should use same line-break rendering',
  );
  assert.ok(
    html.includes('히라라') && html.includes('시내 저녁'),
    'day1 evening line preserved',
  );
});

test('lodging markdown list renders bullets and bold', () => {
  const flat = '강릉역 근처 숙소예요. * **강릉역 인근**: 호텔 * **월화거리**: 게하';
  const md = getMooniModelMarkdownForRender(flat, { stripPhantomTicketMention: true });
  assert.match(md, /\n\* \*\*강릉역 인근\*\*: 호텔/);
  assert.match(md, /\n\* \*\*월화거리\*\*: 게하/);
  const html = renderMooniMarkdownHtml(md);
  assert.match(html, /<ul>/);
  assert.match(html, /<li>/);
  assert.match(html, /<strong>강릉역 인근<\/strong>/);
  assert.doesNotMatch(html, /\* \*\*/);
});

test('dash lists render like star lists', () => {
  const dash = [
    '여권 유효기간을 확인하세요.',
    '- 왕복 항공권이 필요해요.',
    '- 숙소 예약 확인서를 준비하세요.',
  ].join('\n');
  const star = dash.replace(/^- /gm, '* ');
  const dashMd = getMooniModelMarkdownForRender(dash, { stripPhantomTicketMention: true });
  const starMd = getMooniModelMarkdownForRender(star, { stripPhantomTicketMention: true });
  assert.equal(dashMd, starMd);
  const html = renderMooniMarkdownHtml(dashMd);
  assert.match(html, /<ul>/);
  assert.match(html, /<li>[^<]*왕복 항공권/);
  assert.match(html, /<li>[^<]*숙소 예약 확인서/);
  assert.doesNotMatch(html, /<p>[^<]*왕복 항공권[^<]*숙소 예약 확인서/);
});

test('paragraph after a bullet list stays out of the last bullet', () => {
  const src = '숙소예요.\n\n* **강릉역 인근**: 호텔\n* **월화거리**: 게하\n다음으로 숙소 카드에서 볼 수 있어요.';
  const md = getMooniModelMarkdownForRender(src, { stripPhantomTicketMention: true });
  assert.match(md, /숙소예요\.\n\n\* \*\*강릉역 인근\*\*/);
  assert.match(md, /게하\n\n다음으로 숙소 카드에서 볼 수 있어요/);
  const html = renderMooniMarkdownHtml(md);
  assert.match(html, /<\/ul>\s*<p>다음으로/);
  assert.doesNotMatch(html, /<li>[^<]*다음으로/);
});

function renderWithMooniGfm(markdown) {
  const store = {};
  mooniRemarkGfm.call({ data: () => store });
  return micromark(markdown, {
    extensions: store.micromarkExtensions,
    htmlExtensions: [mooniRemarkGfmHtml({ singleTilde: false })],
  });
}

test('train ranges keep single tildes and do not strikethrough', () => {
  const line = '서울에서 마산까지 KTX-산천, 05:03~20:38, 3시간 4분~3시간 12분, 48,100원, 6회예요.';
  const html = renderWithMooniGfm(line);
  assert.match(html, /05:03~20:38/);
  assert.match(html, /3시간 4분~3시간 12분/);
  assert.doesNotMatch(html, /<del/);
  assert.match(renderWithMooniGfm('~~취소~~'), /<del>취소<\/del>/);
});

test('ensureItineraryMarkdownLineBreaks — non-itinerary reply unchanged', () => {
  const md = getMooniModelMarkdownForRender(NORMAL_STOP_REPLY, {
    stripPhantomTicketMention: true,
  });
  assert.ok(!md.includes('  \n'), 'generic reply should not get hard-break padding');
});
