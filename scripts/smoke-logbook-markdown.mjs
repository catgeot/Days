import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { logbookRemarkPlugins } from '../src/pages/DailyReport/utils/logbookMarkdownRemark.js';
import {
  stripLogbookMarkdownSnippet,
  splitLogbookPhotoPlaceholders,
  parseLogbookPhotoIndex,
  normalizeLogbookPhotoPlaceholders,
} from '../src/pages/DailyReport/utils/logbookMarkdownSnippet.js';

function renderLogbookMd(markdown) {
  return renderToStaticMarkup(
    React.createElement(ReactMarkdown, { remarkPlugins: logbookRemarkPlugins }, markdown),
  );
}

function parseLogbookMarkdown(source) {
  let processor = unified().use(remarkParse);
  for (const plugin of logbookRemarkPlugins) {
    if (Array.isArray(plugin)) {
      processor = processor.use(plugin[0], plugin[1]);
    } else {
      processor = processor.use(plugin);
    }
  }
  return processor.parse(source);
}

function paragraphChildren(tree) {
  const para = tree.children.find((n) => n.type === 'paragraph');
  return para?.children ?? [];
}

const cjkBoldSamples = [
  '**나플라프카 파머스 마켓(Náplavka)**을',
  '**시그널 페스티벌(Signal Festival)**이',
  '**대이집트박물관(GEM)**은',
  '**코샤리 아부 타렉(Koshary Abou Tarek)**은',
  '**주바(Zööba)**처',
];

for (const sample of cjkBoldSamples) {
  const html = renderLogbookMd(sample);
  assert.match(html, /<strong[^>]*>/, sample);
  assert.equal(html.includes('**'), false, sample);

  const kids = paragraphChildren(parseLogbookMarkdown(sample));
  assert.equal(kids[0]?.type, 'strong', sample);
  assert.ok(typeof kids[1]?.value === 'string' && kids[1].value.length > 0, `${sample} suffix outside bold`);
}

const linkMd = renderLogbookMd('[공식](https://www.gateo.kr/) 안내');
assert.match(linkMd, /<a href="https:\/\/www\.gateo\.kr\/">공식<\/a>/);
assert.equal(linkMd.includes('**'), false, 'link line has no raw bold');

const listMd = renderLogbookMd('- 첫째\n- 둘째');
assert.match(listMd, /<ul/);
assert.match(listMd, /<li/);

const hoursMd = renderLogbookMd('운영 06:00~22:00, 휴관일 09:00~17:00.');
assert.equal(hoursMd.includes('<del>'), false, 'single tilde must not strike through hours');
assert.match(hoursMd, /06:00~22:00/);
assert.match(hoursMd, /09:00~17:00/);

const sample = `## 파리\n\n**루브르** — [공식](https://example.com)\n\n---\n\n[사진 1]\n\nplain line`;

const stripped = stripLogbookMarkdownSnippet(sample);
assert.ok(!stripped.includes('##'), 'headers stripped');
assert.ok(!stripped.includes('**'), 'bold markers stripped');
assert.ok(stripped.includes('루브르'), 'text preserved');
assert.ok(!stripped.includes('[사진'), 'photo placeholder stripped');

const parts = splitLogbookPhotoPlaceholders(sample);
assert.ok(parts.some((p) => parseLogbookPhotoIndex(p) === 0), 'photo placeholder parsed');

const legacy = normalizeLogbookPhotoPlaceholders('x [LOGBOOK_PHOTO:2] y');
assert.ok(legacy.includes('[사진 3]'), 'legacy LOGBOOK_PHOTO alias maps to 1-based [사진 N]');

console.log('smoke-logbook-markdown: OK');
