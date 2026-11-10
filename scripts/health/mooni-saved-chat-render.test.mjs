import assert from 'node:assert/strict';
import { test } from 'node:test';
import { micromark } from 'micromark';
import mooniRemarkGfm, { mooniRemarkGfmHtml } from '../../src/components/chat/mooniRemarkGfm.js';
import {
  getMooniModelMarkdownForRender,
  getMooniModelRawText,
} from '../../src/pages/Home/lib/mooniModelMessageText.js';

const LIVE_GUAM_ONE_LINE =
  '구분 | 괌 | 오키나와 | 팔라우 | 보홀 : | : | : | : | 주요 특징 | 쇼핑과 휴양의 조화 | 일본식 문화와 휴양 | 세계적인 다이빙 명소 | 자연 친화적, 돌고래 투어 이동 편의 | 직항 많고 접근성 좋음 | 직항 많고 교통 편리 | 직항 적음, 경유 필요 | 세부 경유 또는 직항 주요 활동 | 쇼핑, 해양 액티비티 | 역사 유적, 드라이브 | 스쿠버 다이빙, 스노클링 | 초콜릿 힐, 안경원숭이 추천 동행 | 가족 여행객 | 가족, 커플, 친구 | 다이빙 애호가 | 자연을 선호하는 커플';

const LIVE_GUAM_MULTILINE = `구분 | 괌 | 오키나와 | 팔라우 | 보홀
: | : | : | : | :
**주요 특징** | 쇼핑과 휴양의 조화 | 일본식 문화와 휴양 | 세계적인 다이빙 명소 | 자연 친화적, 돌고래 투어
이동 편의 | 직항 많고 접근성 좋음 | 직항 많고 교통 편리 | 직항 적음, 경유 필요 | 세부 경유 또는 직항`;

const LIVE_GUAM_FIVE_COLON =
  '구분 | 괌 | 오키나와 | 팔라우 | 보홀 : | : | : | : | : **주요 특징** | 쇼핑과 휴양의 조화 | 일본식 문화와 휴양 | 세계적인 다이빙 명소 | 자연 친화적, 돌고래 투어';

const LIVE_UDO_BOLD =
  '우도에는 ** 천진항**과 ** 하우목동항** 두 곳이 있어요.\n\n**이동 시간**: 15분';

const LIVE_UDO_GLUED =
  '우도에는** 천진항**과 **하우목동항** 두 곳이 있어요.';

function renderMooniGfm(markdown) {
  const store = {};
  mooniRemarkGfm.call({ data: () => store });
  return micromark(markdown, {
    extensions: store.micromarkExtensions,
    htmlExtensions: [mooniRemarkGfmHtml({ singleTilde: false })],
  });
}

function savedMessage(text, withRaw = false) {
  const msg = { role: 'model', text };
  if (withRaw) msg.mooniRawReply = text;
  return msg;
}

test('saved chat reopen — text-only uses same markdown path as live', () => {
  const msg = savedMessage(LIVE_GUAM_ONE_LINE, false);
  const raw = getMooniModelRawText(msg);
  assert.equal(raw, LIVE_GUAM_ONE_LINE);
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  assert.match(md, /^\| 구분 \| 괌 \|/m, md);
  assert.match(md, /^\| --- \| --- \|/m, md);
  assert.match(md, /^\| 주요 특징 \|/m, md);
  assert.match(md, /^\| 추천 동행 \|/m, md);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(html.includes('<th>구분</th>'), html);
  assert.ok(!html.includes('**'), html);
});

test('saved chat reopen — mooniRawReply path matches text-only for collapsed table', () => {
  const textOnly = getMooniModelMarkdownForRender(
    getMooniModelRawText(savedMessage(LIVE_GUAM_ONE_LINE, false)),
    { stripPhantomTicketMention: true },
  );
  const withRaw = getMooniModelMarkdownForRender(
    getMooniModelRawText(savedMessage(LIVE_GUAM_ONE_LINE, true)),
    { stripPhantomTicketMention: true },
  );
  assert.equal(textOnly, withRaw);
});

test('saved chat reopen — multiline : separator table without outer pipes', () => {
  const md = getMooniModelMarkdownForRender(
    getMooniModelRawText(savedMessage(LIVE_GUAM_MULTILINE, false)),
    { stripPhantomTicketMention: true },
  );
  assert.match(md, /^\| 구분 \| 괌 \|/m, md);
  assert.match(md, /^\| --- \| --- \|/m, md);
  assert.match(md, /^\| \*\*주요 특징\*\* \|/m, md);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(!html.includes('**'), html);
});

test('saved chat reopen — five-colon one-line live compare', () => {
  const md = getMooniModelMarkdownForRender(
    getMooniModelRawText(savedMessage(LIVE_GUAM_FIVE_COLON, false)),
    { stripPhantomTicketMention: true },
  );
  assert.match(md, /^\| \*\*주요 특징\*\* \|/m, md);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(!html.includes('**'), html);
});

test('saved chat reopen — glued-prefix 우도 bold (PROD 10:28)', () => {
  const md = getMooniModelMarkdownForRender(
    getMooniModelRawText(savedMessage(LIVE_UDO_GLUED, false)),
    { stripPhantomTicketMention: true },
  );
  assert.match(md, /\*\*천진항\*\*과 \*\*하우목동항\*\*/, md);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<strong>천진항</strong>'), html);
  assert.ok(html.includes('<strong>하우목동항</strong>'), html);
  assert.ok(!html.includes('**'), html);
});

test('saved chat reopen — PROD live 우도 asymmetric bold', () => {
  const md = getMooniModelMarkdownForRender(
    getMooniModelRawText(savedMessage(LIVE_UDO_BOLD, false)),
    { stripPhantomTicketMention: true },
  );
  assert.match(md, /\*\*천진항\*\*과 \*\*하우목동항\*\*/, md);
  assert.match(md, /\*\*이동 시간\*\*:/, md);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<strong>천진항</strong>'), html);
  assert.ok(html.includes('<strong>하우목동항</strong>'), html);
  assert.ok(html.includes('<strong>이동 시간</strong>'), html);
  assert.ok(!html.includes('**'), html);
});
