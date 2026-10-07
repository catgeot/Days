import assert from 'node:assert/strict';
import { test } from 'node:test';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
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

test('ensureItineraryMarkdownLineBreaks — non-itinerary reply unchanged', () => {
  const md = getMooniModelMarkdownForRender(NORMAL_STOP_REPLY, {
    stripPhantomTicketMention: true,
  });
  assert.ok(!md.includes('  \n'), 'generic reply should not get hard-break padding');
});
