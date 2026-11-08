import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeMooniMarkdownBoldSpacing } from '../../src/utils/mooniMarkdownBoldSpacing.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';

test('normalizeMooniMarkdownBoldSpacing — trims space before closing **', () => {
  assert.equal(normalizeMooniMarkdownBoldSpacing('**13:30 ** 출발'), '**13:30** 출발');
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
