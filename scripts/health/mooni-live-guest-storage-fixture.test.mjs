import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { micromark } from 'micromark';
import mooniRemarkGfm, { mooniRemarkGfmHtml } from '../../src/components/chat/mooniRemarkGfm.js';
import {
  getMooniModelMarkdownForRender,
  getMooniModelRawText,
} from '../../src/pages/Home/lib/mooniModelMessageText.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fixture = JSON.parse(
  readFileSync(join(root, 'src/fixtures/mooniGuestTripsLiveLocalStorageExtract.json'), 'utf8'),
);

test('mooniGuestTripsLiveLocalStorageExtract.json — live extract fingerprint', () => {
  assert.match(fixture.guam.mooniRawReply, /구분 \| 괌 \(Guam\) \| 오키나와 \(Okinawa\)/);
  assert.match(fixture.guam.mooniRawReply, /\n: \| : \| : \| : \| :\n\*\*주요 매력\*\*/);
  assert.match(fixture.udo.mooniRawReply, /우도에는 \*\*천진항\*\*과 \*\*하우목동항\*\* 두/);
});

function renderMooniHtml(markdown) {
  const store = {};
  mooniRemarkGfm.call({ data: () => store });
  return micromark(markdown, {
    extensions: store.micromarkExtensions,
    htmlExtensions: [mooniRemarkGfmHtml({ singleTilde: false })],
  });
}

function renderSavedMessage(stored) {
  const raw = getMooniModelRawText(stored);
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  const html = renderMooniHtml(md);
  return { raw, md, html };
}

function assertGuamHtml(html, label) {
  const tables = html.match(/<table/g) || [];
  assert.equal(tables.length, 1, `${label}: table count`);
  const thead = html.match(/<thead>[\s\S]*?<\/thead>/);
  assert.ok(thead, `${label}: thead`);
  const thCells = [...thead[0].matchAll(/<th>([^<]*)<\/th>/g)].map((m) => m[1]);
  assert.equal(thCells.length, 5, `${label}: header columns`);
  const tbodyRows = html.match(/<tbody>[\s\S]*?<\/tbody>/);
  assert.ok(tbodyRows, `${label}: tbody`);
  const bodyTr = (tbodyRows[0].match(/<tr/g) || []).length;
  assert.equal(bodyTr, 4, `${label}: body rows`);
  assert.ok(!html.includes('**'), `${label}: literal **`);
  assert.ok(!/:\s*\|\s*:/.test(html), `${label}: : | : residue`);
  assert.ok(html.includes('<strong>12Go (12go.asia)</strong>'), `${label}: 12Go strong`);
}

function assertUdoHtml(html, md, label) {
  assert.ok(html.includes('<strong>천진항</strong>'), `${label}: 천진항`);
  assert.ok(html.includes('<strong>하우목동항</strong>'), `${label}: 하우목동항`);
  assert.ok(!html.includes('**'), `${label}: literal **`);
  assert.match(md, /2\\\. 탑승 절차\n{1,2}1\. \*\*승선신고서/, `${label}: nested 1 after section 2`);
  assert.match(md, /\n2\. \*\*신분증/, `${label}: nested 2`);
  assert.match(md, /\n3\. \*\*선착장/, `${label}: nested 3`);
  assert.match(md, /3\. 소요 시간 및 도착 항구/, `${label}: section 3 title`);
  assert.match(md, /4\. 섬 내 이동 수단/, `${label}: section 4 title`);
  assert.doesNotMatch(md, /6\. 소요 시간/, `${label}: no 6. section renumber`);
}

for (const field of ['mooniRawReply', 'text']) {
  test(`live guest extract — guam ${field} → GFM table`, () => {
    const msg = {
      role: fixture.guam.role,
      finishReason: fixture.guam.finishReason,
      text: fixture.guam.text,
      ...(field === 'mooniRawReply' ? { mooniRawReply: fixture.guam.mooniRawReply } : {}),
    };
    const { html } = renderSavedMessage(msg);
    assertGuamHtml(html, `guam.${field}`);
  });

  test(`live guest extract — udo ${field} → bold + list numbering`, () => {
    const msg = {
      role: fixture.udo.role,
      finishReason: fixture.udo.finishReason,
      text: fixture.udo.text,
      ...(field === 'mooniRawReply' ? { mooniRawReply: fixture.udo.mooniRawReply } : {}),
    };
    const { html, md } = renderSavedMessage(msg);
    assertUdoHtml(html, md, `udo.${field}`);
  });
}

test('live guest extract — mooniRawReply preferred over broken text', () => {
  const msg = {
    role: fixture.udo.role,
    text: fixture.udo.text,
    mooniRawReply: fixture.udo.mooniRawReply,
    finishReason: fixture.udo.finishReason,
  };
  assert.equal(getMooniModelRawText(msg), fixture.udo.mooniRawReply);
});
