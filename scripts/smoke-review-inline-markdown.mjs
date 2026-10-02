import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReviewInlineMarkdown, {
  ReviewInlineMarkdownBoundary,
} from '../src/components/PlaceCard/tabs/ReviewInlineMarkdown.jsx';
import { ReviewLinkChips } from '../src/components/PlaceCard/tabs/ReviewLinkChips.jsx';
import { ReviewPlainFallbackBoundary } from '../src/components/PlaceCard/tabs/ReviewPlainFallbackBoundary.jsx';
import {
  reviewInlineLinkProps,
  reviewInlineUrlTransform,
  stripReviewInlineMarkdown,
} from '../src/utils/reviewInlineMarkdown.js';

function renderMd(text, props = {}) {
  return renderToStaticMarkup(
    React.createElement(ReviewInlineMarkdown, { text, ...props }),
  );
}

function assertNoActiveHtml(html) {
  assert.equal(/<script/i.test(html), false);
  assert.equal(/<\s*img\b/i.test(html), false);
  assert.equal(/<[a-z][^>]*\son[a-z]+=/i.test(html), false);
  assert.equal(/href="javascript:/i.test(html), false);
}

const bold = renderMd('**미즈노**에서 점심');
assert.match(bold, /<strong class="font-bold">미즈노<\/strong>에서 점심/);

for (const sample of ['**로칼 들로우하(Lokál)**에서', '**「미즈노」**를']) {
  const html = renderMd(sample);
  assert.match(html, /<strong /, sample);
  assert.equal(html.includes('**'), false, sample);
}

const boldLink = renderMd('**[굵은 링크](https://www.gateo.kr/)**');
assert.equal((boldLink.match(/<a /g) || []).length, 1);
assert.match(boldLink, /<strong[^>]*>\s*<a |<a[^>]*>\s*<strong/);
assert.equal(boldLink.includes('target='), false);

const boldInside = renderMd('[**링크 속 굵게**](https://www.gateo.kr/)');
assert.equal((boldInside.match(/<a /g) || []).length, 1);
assert.match(boldInside, /<strong/);
assert.equal(boldInside.includes('target='), false);

const ticket = renderMd('[티켓 예매](https://www.ticketlink.co.kr/product/65330)');
assert.match(ticket, /<a href="https:\/\/www\.ticketlink\.co\.kr\/product\/65330"/);
assert.match(ticket, /target="_blank"/);
assert.match(ticket, /rel="noopener noreferrer nofollow"/);
assert.match(ticket, />티켓 예매</);
assert.match(ticket, /class="text-blue-600 hover:text-blue-700 underline underline-offset-2 break-words"/);
assert.equal(ticket.includes('utm_'), false);

const tel = renderMd('[전화](tel:+66-2-123-4567)');
assert.match(tel, /href="tel:\+6621234567"/);
assert.match(tel, /underline underline-offset-2/);
assert.equal(tel.includes('target='), false);

for (const sample of [
  '[x](javascript:alert(1))',
  '[x](JaVaScRiPt:alert(1))',
  '[x](  javascript:alert(1))',
  '[x](java&#x73;cript:alert(1))',
  '[x](data:text/html;base64,PHNjcmlwdD4=)',
  '[x](vbscript:msgbox)',
  '[x](//evil.com)',
  '[x](http://evil.com)',
]) {
  const html = renderMd(sample);
  assert.equal(html.includes('<a'), false, sample);
  assert.match(html, />x</);
  assert.equal(html.includes('javascript:'), false, sample);
  assert.equal(html.includes('http://evil.com'), false, sample);
}

const scriptHtml = renderMd('<script>alert(1)</script>');
assert.match(scriptHtml, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assertNoActiveHtml(scriptHtml);

const imgHtml = renderMd('<img src=x onerror=alert(1)>');
assert.match(imgHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
assertNoActiveHtml(imgHtml);

const anchorHtml = renderMd('<a href="javascript:alert(1)">a</a>');
assert.match(anchorHtml, /&lt;a href=&quot;javascript:alert\(1\)&quot;&gt;a&lt;\/a&gt;/);
assertNoActiveHtml(anchorHtml);

const imageMd = renderMd('![x](https://evil.com/a.png)');
assert.equal(imageMd.includes('<img'), false);

const nested = renderMd('[[a](https://a.com)](https://b.com)');
assert.ok((nested.match(/<a /g) || []).length <= 1, nested);

const unclosed = renderMd('**닫히지 않은 굵게');
assert.match(unclosed, /닫히지 않은 굵게/);
assert.equal(unclosed.includes('<strong'), false);

const bare = renderMd('https://www.gateo.kr/place/bangkok');
assert.equal(bare.includes('<a'), false);
assert.match(bare, /https:\/\/www\.gateo\.kr\/place\/bangkok/);

for (const literal of ['# 제목', '- 목록', '> 인용', '`코드`', '---']) {
  const html = renderMd(literal);
  assert.equal(html.includes('<h'), false, literal);
  assert.equal(html.includes('<ul'), false, literal);
  assert.equal(html.includes('<blockquote'), false, literal);
  assert.equal(html.includes('<code'), false, literal);
  assert.equal(html.includes('<hr'), false, literal);
  const visible = literal.replace(/[<>]/g, (ch) => (ch === '<' ? '&lt;' : '&gt;'));
  assert.ok(html.includes(literal) || html.includes(visible), `${literal} -> ${html}`);
}

const lines = renderMd('첫 줄\n둘째 줄');
assert.equal(lines.includes('<br'), false);
assert.match(lines, /whitespace-pre-wrap/);
assert.match(lines, /첫 줄\n둘째 줄/);

const paragraphs = renderMd('문단1\n\n문단2');
assert.equal(paragraphs.includes('<br'), false);
assert.equal((paragraphs.match(/<p /g) || []).length, 1);
assert.match(paragraphs, /문단1\n(?:\u00a0|&nbsp;)?\n문단2|문단1\n\u00a0\n문단2/);

const inlineParagraphs = renderMd('문단1\n\n문단2', { inline: true });
assert.equal(inlineParagraphs.includes('<p'), false);
assert.equal((inlineParagraphs.match(/<span /g) || []).length, 1);
assert.match(inlineParagraphs, /문단1\n\u00a0\n문단2|문단1\n&nbsp;\n문단2/);

const preview = renderMd('[티켓 예매](https://www.ticketlink.co.kr/product/65330)', { inline: true });
assert.equal(preview.includes('<p'), false);
assert.match(preview, /<span/);
assert.match(preview, /text-blue-600/);
assert.match(preview, /underline underline-offset-2/);
assert.match(preview, /stopPropagation|target="_blank"/);

assert.equal(reviewInlineUrlTransform('https://www.gateo.kr/').includes('utm_'), false);
assert.equal(reviewInlineLinkProps('tel:+6621234567').target, undefined);
assert.equal(reviewInlineLinkProps('https://www.gateo.kr/').target, undefined);
assert.equal(
  reviewInlineLinkProps('https://www.ticketlink.co.kr/product/65330').rel,
  'noopener noreferrer nofollow',
);

const userPlain = renderToStaticMarkup(
  React.createElement('div', { className: 'whitespace-pre-wrap' }, '**굵게** [링크](https://www.gateo.kr/)'),
);
assert.match(userPlain, /\*\*굵게\*\*/);
assert.match(userPlain, /\[링크\]/);

assert.deepEqual(ReviewInlineMarkdownBoundary.getDerivedStateFromError(new Error('forced')), {
  failed: true,
});
assert.deepEqual(ReviewPlainFallbackBoundary.getDerivedStateFromError(new Error('forced')), {
  failed: true,
});
const inlineBoundary = new ReviewInlineMarkdownBoundary({ text: '평문 폴백 **그대로**' });
inlineBoundary.state = { failed: true };
const fallen = renderToStaticMarkup(inlineBoundary.render());
assert.match(fallen, /평문 폴백 \*\*그대로\*\*/);
const plainBoundary = new ReviewPlainFallbackBoundary({
  text: '레이지 실패',
  className: 'whitespace-pre-wrap',
});
plainBoundary.state = { failed: true };
const lazyFallen = renderToStaticMarkup(plainBoundary.render());
assert.match(lazyFallen, /레이지 실패/);

assert.equal(
  stripReviewInlineMarkdown('**미즈노**([공식 사이트](https://www.mizuno-osaka.com/))'),
  '미즈노(공식 사이트)',
);

const live = renderMd(
  '도톤보리에서 아케이드로 들어서면 바로 나오는 미즈노(美津の, [공식 사이트](https://www.mizuno-osaka.com/))는 11:00~22:00',
);
assert.match(live, /href="https:\/\/www\.mizuno-osaka\.com\/"/);
assert.match(live, />공식 사이트</);
assert.match(live, /11:00~22:00/);
assert.equal(live.includes('utm_'), false);

const checked = renderMd('정보 확인일 2026-10-02 · 운영시간·메뉴는 현지 사정에 따라 바뀔 수 있어요');
assert.match(checked, /정보 확인일 2026-10-02 · 운영시간·메뉴는 현지 사정에 따라 바뀔 수 있어요/);

const longLabel = 'Octave Rooftop Lounge & Bar 지도';
const chipsHtml = renderToStaticMarkup(
  React.createElement(ReviewLinkChips, {
    items: [
      {
        label: longLabel,
        url: 'https://www.google.com/maps/search/?api=1&query=Octave',
        kind: 'map',
      },
    ],
  }),
);
assert.ok(chipsHtml.includes('title="Octave Rooftop Lounge &amp; Bar 지도"'));
assert.match(chipsHtml, /class="[^"]*truncate/);
assert.match(chipsHtml, /target="_blank"/);
assert.match(chipsHtml, /rel="noopener noreferrer nofollow"/);
assert.equal(chipsHtml.includes('utm_'), false);
assert.equal(renderToStaticMarkup(React.createElement(ReviewLinkChips, { items: [] })), '');

const editorialSrc = readFileSync(
  new URL('../src/components/PlaceCard/tabs/EditorialReviewText.jsx', import.meta.url),
  'utf8',
);
assert.match(editorialSrc, /const plain = <div className=\{plainClass\}>/);
assert.match(editorialSrc, /<Suspense fallback=\{plain\}>\s*<div className=\{plainClass\}>/);

const collapsed = renderToStaticMarkup(
  React.createElement(
    'div',
    { className: 'whitespace-pre-wrap line-clamp-3' },
    React.createElement(ReviewInlineMarkdown, {
      text: '**미즈노** 한 줄\n둘째 줄\n\n다음 문단',
      inline: true,
    }),
  ),
);
assert.match(collapsed, /class="whitespace-pre-wrap line-clamp-3"/);
assert.match(collapsed, /<strong class="font-bold">미즈노<\/strong>/);
assert.equal(collapsed.includes('<p'), false);
assert.match(collapsed, /둘째 줄\n\u00a0\n다음 문단|둘째 줄\n&nbsp;\n다음 문단/);

console.log('smoke-review-inline-markdown: OK');
