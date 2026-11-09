import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveDestinationFromChat } from '../../src/utils/resolveDestinationFromChat.js';

const MOONI = 'MOONi';

function slugs(resolution) {
  return (resolution.candidates || []).map((c) => c.slug);
}

test('4 named destinations — chips suppressed (empty low candidates)', () => {
  const text = '괌·오키나와·팔라우·보홀 4곳을 표로 비교해 주세요';
  const r = resolveDestinationFromChat(text, [], MOONI);
  assert.equal(r.confidence, 'low');
  assert.deepEqual(slugs(r), []);
});

test('괌이랑 오키나와 — exactly guam and okinawa, no keyword noise', () => {
  const r = resolveDestinationFromChat('괌이랑 오키나와 비교해 주세요', [], MOONI);
  assert.equal(r.confidence, 'low');
  assert.deepEqual(slugs(r), ['guam', 'okinawa']);
});

test('괌으로 스노클링 — guam wins, not gili-meno keyword spill', () => {
  const text = '괌으로 5박 6일 부부 스노클링 여행을 가려고 해요';
  const r = resolveDestinationFromChat(text, [], MOONI);
  assert.equal(r.confidence, 'high');
  assert.equal(r.slug, 'guam');
  assert.deepEqual(slugs(r), ['guam']);
  assert.ok(!slugs(r).includes('gili-meno'));
});

test('빈 시간 — no vienna false chip', () => {
  const r = resolveDestinationFromChat('빈 시간에 뭐 할까요', [], MOONI);
  assert.equal(r.confidence, 'none');
  assert.deepEqual(slugs(r), []);
});

test('follow-up duration only — no chips from prior theme turn', () => {
  const history = [
    {
      role: 'user',
      text: '조용한 섬에서 부부가 스노클링하기 좋은 여행지 10곳 추천해 주세요',
    },
  ];
  const r = resolveDestinationFromChat('5박 6일로 다녀올 예정입니다', history, MOONI);
  assert.equal(r.confidence, 'none');
  assert.deepEqual(slugs(r), []);
});

test('theme-only question — no keyword pick candidates', () => {
  const text = '조용한 섬에서 부부가 스노클링하기 좋은 여행지 10곳 추천해 주세요';
  const r = resolveDestinationFromChat(text, [], MOONI);
  assert.equal(r.confidence, 'none');
  assert.deepEqual(slugs(r), []);
});

test('카오락 시간별 세부 일정 — no cebu (generic 세부)', () => {
  const r = resolveDestinationFromChat('카오락 시간별 세부 일정 짜 줘', [], MOONI);
  assert.equal(r.confidence, 'none');
  assert.notEqual(r.slug, 'cebu');
  assert.ok(!slugs(r).includes('cebu'));
});

test('세부 여행 — cebu place name kept', () => {
  const r = resolveDestinationFromChat('세부 여행 3박 일정', [], MOONI);
  assert.equal(r.confidence, 'high');
  assert.equal(r.slug, 'cebu');
});

test('세부로 — cebu place name kept', () => {
  const r = resolveDestinationFromChat('세부로 갈게요', [], MOONI);
  assert.equal(r.confidence, 'high');
  assert.equal(r.slug, 'cebu');
});

test('세부 일정 — generic usage, no cebu', () => {
  const r = resolveDestinationFromChat('세부 일정만 정리해 줘', [], MOONI);
  assert.equal(r.confidence, 'none');
  assert.ok(!slugs(r).includes('cebu'));
});

test('session rebound — phuket after phu quoc trip destination', () => {
  const history = [
    {
      role: 'user',
      text: '카오락과 푸꾸옥이요',
      confirmedDestination: { slug: 'phu-quoc', name: '푸꾸옥' },
    },
  ];
  const r = resolveDestinationFromChat('푸켓으로 바꿀게요 3박 일정', history, '푸꾸옥');
  assert.equal(r.confidence, 'high');
  assert.equal(r.slug, 'phuket');
  assert.equal(r.source, 'lookup');
});

test('guam → jeju switch — departure hub not stuck on bound guam', () => {
  const history = [
    {
      role: 'user',
      text: 'CJU에서 GUM 직항 괌',
      confirmedDestination: { slug: 'guam', name: '괌' },
    },
  ];
  const r = resolveDestinationFromChat('이번엔 제주 갈게', history, '괌');
  assert.equal(r.confidence, 'high');
  assert.equal(r.slug, 'jeju');
  assert.equal(r.source, 'lookup');
});

test('guam → jeju 우도 topic — jeju replaces guam', () => {
  const history = [
    {
      role: 'user',
      text: '괌 항공',
      confirmedDestination: { slug: 'guam', name: '괌' },
    },
  ];
  const r = resolveDestinationFromChat('제주 우도 가볼만한 곳', history, '괌');
  assert.equal(r.confidence, 'high');
  assert.equal(r.slug, 'jeju');
  assert.equal(r.source, 'lookup');
});

test('same destination follow-up — guam flight detail keeps guam', () => {
  const history = [
    {
      role: 'user',
      text: '괌 5박',
      confirmedDestination: { slug: 'guam', name: '괌' },
    },
  ];
  const r = resolveDestinationFromChat('GUM 도착 후 투몬까지 어떻게 가?', history, '괌');
  assert.equal(r.confidence, 'high');
  assert.equal(r.slug, 'guam');
  assert.equal(r.source, 'bound');
});
