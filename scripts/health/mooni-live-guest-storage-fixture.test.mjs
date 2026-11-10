import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { micromark } from 'micromark';
import mooniRemarkGfm, { mooniRemarkGfmHtml } from '../../src/components/chat/mooniRemarkGfm.js';
import {
  getMooniModelMarkdownForRender,
  getMooniModelRawText,
} from '../../src/pages/Home/lib/mooniModelMessageText.js';

let MooniChatMarkdown;

function ensureMooniReactDom() {
  if (globalThis.__mooniLiveFixtureDom) return;
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://localhost/',
  });
  const { window } = dom;
  for (const [name, value] of Object.entries({
    window,
    document: window.document,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    Element: window.Element,
    Node: window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
  })) {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
  globalThis.__mooniLiveFixtureDom = true;
}

before(async () => {
  ensureMooniReactDom();
  MooniChatMarkdown = (await import('../../src/components/chat/MooniChatMarkdown.jsx')).default;
});

async function renderMooniReactDom(markdown) {
  const container = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(MooniChatMarkdown, { text: markdown, variant: 'dark' }));
    await new Promise((r) => setTimeout(r, 0));
  });
  return container;
}

function visibleOlItemNumbers(ol) {
  if (!ol) return [];
  const start = Number.parseInt(ol.getAttribute('start') || '1', 10);
  const items = [...ol.querySelectorAll(':scope > li')];
  return items.map((_, i) => start + i);
}

function assertUdoVisibleNumbering(root, label) {
  const sectionNums = [...root.querySelectorAll('p')]
    .map((p) => {
      const m = p.textContent.trim().match(/^(\d+)\.\s/);
      return m ? Number(m[1]) : null;
    })
    .filter((n) => n != null);
  assert.deepEqual(sectionNums, [1, 2, 3, 4], `${label}: section paragraphs 1–4`);

  const boardingP = [...root.querySelectorAll('p')].find((p) =>
    p.textContent.includes('탑승 절차'),
  );
  assert.ok(boardingP, `${label}: 탑승 절차 paragraph`);
  let sib = boardingP.nextElementSibling;
  while (sib && sib.tagName !== 'OL') sib = sib.nextElementSibling;
  assert.deepEqual(visibleOlItemNumbers(sib), [1, 2, 3], `${label}: boarding nested 1–3`);

  const departureInOl = [...root.querySelectorAll('ol > li')].some((li) =>
    li.textContent.includes('출발 항구'),
  );
  assert.equal(departureInOl, false, `${label}: section 1 not in <ol>`);
}

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

function assertUdoHtml(html, label) {
  assert.ok(html.includes('<strong>천진항</strong>'), `${label}: 천진항`);
  assert.ok(html.includes('<strong>하우목동항</strong>'), `${label}: 하우목동항`);
  assert.ok(!html.includes('**'), `${label}: literal **`);
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

  test(`live guest extract — udo ${field} → bold + list numbering`, async () => {
    const msg = {
      role: fixture.udo.role,
      finishReason: fixture.udo.finishReason,
      text: fixture.udo.text,
      ...(field === 'mooniRawReply' ? { mooniRawReply: fixture.udo.mooniRawReply } : {}),
    };
    const { html, md } = renderSavedMessage(msg);
    assertUdoHtml(html, `udo.${field}`);
    const reactRoot = await renderMooniReactDom(md);
    assertUdoVisibleNumbering(reactRoot, `udo.${field} react-dom`);
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
