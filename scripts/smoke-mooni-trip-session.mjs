#!/usr/bin/env node
/**
 * MOONi 여행지 세션 — 체류·공항·항공시각·동선 추출·머지·프롬프트 주입
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractMooniTripFacts,
  extractMooniTripSessionFromMessages,
  formatMooniTripSessionHint,
  hasMooniTripSessionFacts,
  mergeMooniTripSession,
} from '../src/pages/Home/lib/mooniTripSession.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const KO_BUNDLE = {
  tripSession: {
    header: '[이번 여행 세션 — 사용자가 알려준 사실, 바꾸기 전까지 유지]',
    priority: '- 아래 사실은 이 여행지 대화의 전제다.',
    stay: '- 체류: {{label}}',
    arrivalAirport: '- 사용자 도착 공항: {{label}}',
    departureAirport: '- 사용자 출발 공항: {{label}}',
    arrivalTime: '- 도착 시각: {{label}}',
    flightNumber: '- 항공편: {{label}}',
    condition: '- 컨디션·페이스: {{label}}',
    companions: '- 동행: {{label}}',
    currentArea: '- 지금 위치·권역: {{label}}',
    notes: '- 지금까지 동선·계획:\n{{notes}}',
  },
};

const parisStay = extractMooniTripFacts('오를리 공항 도착 3박 4일 일정', {
  destinationName: '파리',
  slug: 'paris',
});
assert.equal(parisStay.nights, 3, '3박 추출');
assert.equal(parisStay.days, 4, '4일 추출');
assert.equal(parisStay.arrivalIata, 'ORY', '오를리 → ORY');
assert.equal(parisStay.stayLabel.includes('3박'), true, '체류 라벨');

const parisOnly = extractMooniTripFacts('파리 일정 추천해줘', {
  destinationName: '파리',
  slug: 'paris',
});
assert.equal(parisOnly.arrivalIata, '', '도시명 파리만으로는 CDG로 두지 않음');

const flightTurn = extractMooniTripFacts('KE901 내일 오후 2시 CDG 도착이야', {
  destinationName: '파리',
  slug: 'paris',
});
assert.equal(flightTurn.flightNumber, 'KE901', '항공편 번호');
assert.equal(flightTurn.arrivalIata, 'CDG', 'CDG 도착');
assert.equal(flightTurn.arrivalTime, '14:00', '오후 2시 → 14:00');

const firstDay = extractMooniTripFacts('첫날은 가볍게 일정 짜줘', {
  destinationName: '파리',
  slug: 'paris',
});
assert.equal(firstDay.condition, '첫날 가볍게', '컨디션');

const hereNow = extractMooniTripFacts('지금은 마레에 있어. 루브르는 다녀왔어', {
  destinationName: '파리',
  slug: 'paris',
});
assert.equal(hereNow.currentArea, '마레', '현재 권역');
assert.equal(hereNow.notes.length > 0, true, '동선 노트');

const fromSeoul = extractMooniTripFacts('인천에서 가는 방법 알려줘', {
  destinationName: '파리',
  slug: 'paris',
});
assert.equal(fromSeoul.departureIata, 'ICN', '출발 인천');
assert.notEqual(fromSeoul.arrivalIata, 'ICN', '도착을 인천으로 뒤집지 않음');

let session = mergeMooniTripSession(parisStay, flightTurn);
session = mergeMooniTripSession(session, firstDay);
session = mergeMooniTripSession(session, hereNow);
assert.equal(session.arrivalIata, 'CDG', '나중 턴 공항이 덮어씀');
assert.equal(session.nights, 3, '체류는 유지');
assert.equal(session.condition, '첫날 가볍게', '컨디션 유지');
assert.equal(session.flightNumber, 'KE901', '항공편 유지');

const replayed = extractMooniTripSessionFromMessages(
  [
    { role: 'user', text: '오를리 공항 도착 3박 4일 일정' },
    { role: 'model', text: '알겠어요' },
    { role: 'user', text: 'KE901 내일 오후 2시 CDG 도착이야' },
    { role: 'user', text: '그럼 둘째 날은?' },
  ],
  { destinationName: '파리', slug: 'paris' },
);
assert.equal(replayed.nights, 3, '히스토리 재생 체류');
assert.equal(replayed.arrivalIata, 'CDG', '히스토리 재생 공항');
assert.equal(replayed.flightNumber, 'KE901', '히스토리 재생 항공편');
assert.equal(hasMooniTripSessionFacts(replayed), true, '세션 사실 있음');

const hint = formatMooniTripSessionHint(session, KO_BUNDLE);
assert.match(hint, /이번 여행 세션/, '세션 헤더');
assert.match(hint, /ORY|오를리|CDG|샤를/, '공항이 프롬프트에 들어감');
assert.match(hint, /KE901/, '항공편이 프롬프트에 들어감');
assert.match(hint, /첫날 가볍게/, '컨디션이 프롬프트에 들어감');

const promptSrc = read('src/pages/Home/lib/prompts.js');
assert.ok(promptSrc.includes('tripSessionHint'), 'getSystemPrompt가 세션 힌트를 붙임');
assert.match(read('src/i18n/mooniPromptBundles.js'), /이 여행지 세션에 유지/, '세션 유지 규칙');
assert.match(read('src/i18n/mooniPromptBundles.js'), /그 값을 최우선/, '일정 칩 세션 우선');

const chipSrc = read('src/pages/Home/lib/mooniChipPrompts.js');
assert.ok(chipSrc.includes('tripSession = null'), '항공/일정 칩이 세션 도착 공항을 받음');
assert.ok(chipSrc.includes('sessionArrival'), '사용자 도착 공항이 카탈로그보다 우선');

const chatSrc = read('src/pages/Home/components/ChatModal.jsx');
assert.ok(chatSrc.includes('hydrateMooniTripSession'), 'ChatModal이 여행지 세션을 복원');
assert.ok(chatSrc.includes('tripSessionHint'), 'ChatModal이 세션을 프롬프트에 넣음');
assert.ok(chatSrc.includes('mooniSession'), 'ChatModal이 세션을 트립에 저장');

const dataSrc = read('src/pages/Home/hooks/useTravelData.js');
assert.ok(dataSrc.includes('mooniSession'), 'saved_trips curation_data에 세션 저장');

console.log('smoke-mooni-trip-session: PASS');
