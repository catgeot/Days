import assert from 'node:assert/strict';
import { test } from 'node:test';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import {
  isMooniPlaceholderUrl,
  stripMooniPlaceholderMarkdownLinks,
} from '../../src/utils/mooniPlaceholderUrls.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';

test('isMooniPlaceholderUrl — example and reserved hosts', () => {
  assert.equal(isMooniPlaceholderUrl('https://planner.example.com/plan'), true);
  assert.equal(isMooniPlaceholderUrl('http://localhost:3000'), true);
  assert.equal(isMooniPlaceholderUrl('https://www.gateo.kr/'), false);
});

test('stripMooniPlaceholderMarkdownLinks — keeps label, drops href', () => {
  const raw =
    '맛집은 시내에 많아요. 자세한 일정은 [플래너 보기](https://planner.example.com/plan)에서 확인하세요.';
  const stripped = stripMooniPlaceholderMarkdownLinks(raw);
  assert.ok(!stripped.includes('planner.example.com'));
  assert.ok(stripped.includes('플래너 보기'));
});

test('render path — placeholder link is not an anchor in HTML', () => {
  const md = getMooniModelMarkdownForRender(
    '추천: [플래너 보기](https://planner.example.com/plan)',
    { stripPhantomTicketMention: true },
  );
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  assert.ok(!html.includes('<a'), 'placeholder must not render as link');
  assert.ok(html.includes('플래너 보기'));
  assert.ok(!html.includes('**'));
});
