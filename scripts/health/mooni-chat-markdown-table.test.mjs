import assert from 'node:assert/strict';
import { test } from 'node:test';
import { micromark } from 'micromark';
import mooniRemarkGfm, { mooniRemarkGfmHtml } from '../../src/components/chat/mooniRemarkGfm.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';
import {
  isMooniGfmTableLine,
  isMooniGfmTableSeparatorLine,
} from '../../src/utils/mooniGfmTableLine.js';

const COMPARE_TABLE = `괌·오키나와·팔라우·보홀 비교입니다.

| 항목 | 괌 | 오키나와 | 팔라우 | 보홀 |
| --- | --- | --- | --- | --- |
| 비자 | 미국령 | 일본 | 무비자 | 필리핀 |
| **13:30 ** 출발 | 직항 | 직항 | 경유 | 경유 |`;

function renderMooniGfm(markdown) {
  const store = {};
  mooniRemarkGfm.call({ data: () => store });
  return micromark(markdown, {
    extensions: store.micromarkExtensions,
    htmlExtensions: [mooniRemarkGfmHtml({ singleTilde: false })],
  });
}

test('isMooniGfmTableLine — header, separator, body', () => {
  assert.ok(isMooniGfmTableLine('| 항목 | 괌 |'));
  assert.ok(isMooniGfmTableLine('| --- | --- |'));
  assert.ok(!isMooniGfmTableLine('교통 · 티켓 |'));
});

test('isMooniGfmTableLine — no outer pipes', () => {
  assert.ok(isMooniGfmTableLine('구분 | 괌 | 오키나와 | 팔라우 | 보홀'));
  assert.ok(isMooniGfmTableSeparatorLine(':--- | :--- | :--- | :--- | :---'));
  assert.ok(isMooniGfmTableSeparatorLine('|:---:|:---:|:---:|:---:|:---:|'));
  assert.ok(isMooniGfmTableLine('**주요 특징** | 쇼핑 | 문화 | 다이빙 | 자연'));
  assert.ok(!isMooniGfmTableLine('---'));
  assert.ok(!isMooniGfmTableLine('KTX 05:03~12:00 서울 출발 |'));
});

const NO_OUTER_PIPE_TABLE = `문의하신 비교입니다.

구분 | 괌 | 오키나와 | 팔라우 | 보홀
:--- | :--- | :--- | :--- | :---
**주요 특징** | 쇼핑과 휴양 | 일본식 문화 | 다이빙 | 자연 친화적`;

test('getMooniModelMarkdownForRender — table without outer pipes survives polish', () => {
  const md = getMooniModelMarkdownForRender(NO_OUTER_PIPE_TABLE, {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /^\| --- \| --- \|/m, md);
  assert.match(md, /^\| \*\*주요 특징\*\* \|/m, md);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(html.includes('>구분</th>'), html);
});

const OUTER_PIPE_TABLE = `| 구분 | 괌 | 오키나와 |
| :--- | :--- | :--- |
| **이동** | 직항 | 직항 |`;

test('getMooniModelMarkdownForRender — outer-pipe :--- table', () => {
  const md = getMooniModelMarkdownForRender(OUTER_PIPE_TABLE, { stripPhantomTicketMention: true });
  assert.match(md, /^\| --- \| --- \|/m);
  assert.match(md, /^\| \*\*이동\*\* \|/m);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
});

const LIVE_ONE_LINE_COMPARE =
  '| 구분 | 괌 | 사이판 | 세부 | 보홀 | : | : | : | : | : | **주요 매력** | 괌 | 사이판 | 세부 | 보홀 |';

const PROD_LIVE_Guam_COMPARE =
  '구분 | 괌 (Guam) | 오키나와 (Okinawa) | 팔라우 (Palau) | 보홀 (Bohol) : | : | : | : | : 주요 매력 | 쇼핑, 휴양, 가족 친화적 | 드라이브, 미식, 역사 탐방 | 최고의 다이빙 및 스노클링 | 자연 경관, 돌고래 투어 분위기 | 세련되고 편리한 휴양지 | 일본 감성의 여유로운 섬 | 원시 자연 그대로의 평화 | 자연과 어우러진 이동 편의 | 렌터카 선호, 교통 편리 | 렌터카 필수 | 투어 위주 이동 | 렌터카/툭툭 이동 추천 대상 | 쇼핑과 휴식을 중시하는 커플 | 먹거리와 문화 체험 선호 커플 | 바다 속 풍경을 사랑하는 커플 | 이색적인 자연 체험 선호 커플';

const PROD_LIVE_GUAM_2026_11 =
  '구분 | 괌 | 오키나와 | 팔라우 | 보홀 : | : | : | : | 주요 특징 | 쇼핑과 휴양의 조화 | 일본식 문화와 휴양 | 세계적인 다이빙 명소 | 자연 친화적, 돌고래 투어 이동 편의 | 직항 많고 접근성 좋음 | 직항 많고 교통 편리 | 직항 적음, 경유 필요 | 세부 경유 또는 직항 주요 활동 | 쇼핑, 해양 액티비티 | 역사 유적, 드라이브 | 스쿠버 다이빙, 스노클링 | 초콜릿 힐, 안경원숭이 추천 동행 | 가족 여행객 | 가족, 커플, 친구 | 다이빙 애호가 | 자연을 선호하는 커플';

test('getMooniModelMarkdownForRender — PROD 11/9 괌 한 줄 표 (5 header / 4 align)', () => {
  const md = getMooniModelMarkdownForRender(PROD_LIVE_GUAM_2026_11, {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /^\| 구분 \| 괌 \|/m, md);
  assert.match(md, /^\| --- \| --- \|/m, md);
  assert.match(md, /^\| 주요 특징 \|/m, md);
  assert.match(md, /^\| 이동 편의 \|/m, md);
  assert.match(md, /^\| 추천 동행 \|/m, md);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(!md.includes(': | : | :'), 'align row should normalize to ---');
  assert.ok(!html.includes('**'), html);
});

test('getMooniModelMarkdownForRender — PROD live 괌·오키나와 collapsed compare table', () => {
  const md = getMooniModelMarkdownForRender(PROD_LIVE_Guam_COMPARE, {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /^\| 구분 \| 괌 \(Guam\) \|/m, md);
  assert.match(md, /^\| --- \| --- \|/m, md);
  assert.match(md, /^\| 주요 매력 \|/m, md);
  assert.match(md, /^\| 분위기 \|/m, md);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(html.includes('<th>구분</th>'), html);
  assert.ok(!md.includes(': | : | :'), 'align row should normalize to ---');
});

test('getMooniModelMarkdownForRender — live one-line : separator table renders', () => {
  const md = getMooniModelMarkdownForRender(LIVE_ONE_LINE_COMPARE, {
    stripPhantomTicketMention: true,
  });
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(html.includes('>구분</th>'), html);
  assert.ok(html.includes('<strong>주요 매력</strong>'), html);
});

test('getMooniModelMarkdownForRender — single pipe in prose stays prose', () => {
  const md = getMooniModelMarkdownForRender('교통 · KTX 05:03 | 서울 출발 안내', {
    stripPhantomTicketMention: true,
  });
  assert.equal(md.includes('\n| '), false, md);
  const html = renderMooniGfm(md);
  assert.ok(!html.includes('<table'), html);
});

test('getMooniModelMarkdownForRender — comparison table survives chip strip', () => {
  const md = getMooniModelMarkdownForRender(COMPARE_TABLE, { stripPhantomTicketMention: true });
  assert.match(md, /^\| 항목 \| 괌 \|/m);
  assert.match(md, /^\| --- \| --- \| --- \| --- \| --- \|/m);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
  assert.ok(html.includes('<th>괌</th>'), html);
  assert.ok(html.includes('<strong>13:30</strong>'), html);
  assert.ok(!html.match(/\|[^<]*\|/), 'no raw pipe row left in HTML');
});

const COLLAPSED_TABLE =
  '| 구분 | 괌 | 오키나와 | 팔라우 | | --- | --- | --- | --- | | 비자 | 미국령 | 일본 | 무비자 |';
const TABLE_WITH_DAY_HEADING = `${COMPARE_TABLE}

**1일차** 오전 스노클링`;

test('getMooniModelMarkdownForRender — collapsed single-line table recover', () => {
  const md = getMooniModelMarkdownForRender(COLLAPSED_TABLE, { stripPhantomTicketMention: true });
  assert.match(md, /^\| 구분 \| 괌 \|/m);
  assert.match(md, /^\| --- \| --- \|/m);
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
});

test('getMooniModelMarkdownForRender — table + **N일차** keeps table rows', () => {
  const md = getMooniModelMarkdownForRender(TABLE_WITH_DAY_HEADING, {
    stripPhantomTicketMention: true,
  });
  assert.match(md, /^\| 항목 \| 괌 \|/m);
  assert.doesNotMatch(md, /\|\s{2}\n/, 'table row must not gain hard-break padding');
  const html = renderMooniGfm(md);
  assert.ok(html.includes('<table'), html);
});
