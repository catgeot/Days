import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { micromark } from 'micromark';
import mooniRemarkGfm, { mooniRemarkGfmHtml } from '../../src/components/chat/mooniRemarkGfm.js';
import { mooniChatMarkdownSanitizeSchema } from '../../src/components/chat/mooniChatMarkdownSchema.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const COMPOSER_FIXTURE_RAW = [
  'Here **A** and **B** in one line.',
  '**1일차** 오전 **Bohol** · **Okinawa** — travel **experience**.',
  '| 항목 | 괌 | 링크 |\n| --- | --- | --- |\n| **13:30 ** 출발 | 직항 | [GATEO](https://www.gateo.kr/) |',
  '* bullet one\n* bullet two',
  '\nParagraph after list.',
  '<script>alert(1)</script><img src=x onerror=alert(1)>',
  '[loopback](http://127.0.0.1/x)',
].join('\n');

function renderMooniGfmHtml(markdown) {
  const store = {};
  mooniRemarkGfm.call({ data: () => store });
  return micromark(markdown, {
    extensions: store.micromarkExtensions,
    htmlExtensions: [mooniRemarkGfmHtml({ singleTilde: false })],
  });
}

test('Composer mock — bold glue, day line, table cell link/time (fixture path only)', () => {
  const md = getMooniModelMarkdownForRender(COMPOSER_FIXTURE_RAW, {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /\*\*A\*\* and \*\*B\*\*/);
  assert.match(md, /\*\*1일차\*\* 오전 \*\*Bohol\*\*/);
  assert.match(md, /\*\*experience\*\*/);
  assert.match(md, /^\| 항목 \| 괌 \| 링크 \|/m);
  const html = renderMooniGfmHtml(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(html.includes('<strong>13:30</strong>'), html);
  assert.ok(html.includes('<strong>Bohol</strong>'), html);
  assert.match(md, /\n\* bullet one/);
  assert.match(md, /Paragraph after list/);
});

test('Composer mock — unsafe raw HTML / loopback link stripped at preprocess', () => {
  const md = getMooniModelMarkdownForRender(COMPOSER_FIXTURE_RAW, {
    stripPhantomTicketMention: true,
  });
  const html = renderMooniGfmHtml(md);
  assert.ok(!/<script[\s>]/i.test(html), 'raw script tag');
  assert.ok(!/<img[\s>]/i.test(html), 'raw img tag');
  assert.ok(html.includes('&lt;script&gt;') || !html.includes('alert(1)'), 'inline HTML escaped or dropped');
  assert.ok(!html.includes('http://127.0.0.1'), 'loopback href stripped at preprocess');
  assert.ok(!html.includes('127.0.0.1'), html);
  assert.ok(html.includes('loopback'));
});

test('mooniChatMarkdownSanitizeSchema — no img tag (HTML injection guard)', () => {
  assert.ok(!mooniChatMarkdownSanitizeSchema.tagNames.includes('img'));
});

test('PROD build — QA mooni-markdown fixture route gated off', () => {
  const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
  const gateSrc = readFileSync(
    join(root, 'src/shared/cloudPreview/isQaMooniMarkdownFixtureEnabled.js'),
    'utf8',
  );
  assert.match(appSrc, /isQaMooniMarkdownFixtureEnabled/);
  assert.match(appSrc, /\/qa\/mooni-markdown-composer/);
  assert.match(gateSrc, /import\.meta\.env\.DEV/);
  assert.match(gateSrc, /VITE_GATEO_QA_MOONI_MD_FIXTURE/);
  assert.match(
    readFileSync(join(root, 'vite.config.js'), 'utf8'),
    /VERCEL_ENV === 'preview'/,
  );
});
