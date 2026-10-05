#!/usr/bin/env node
/**
 * W41 안3 — MOONi 한국 축제 답: GATEO ?festival= 링크·기간 필터.
 *   npm run smoke:mooni-korea-festival
 */
import assert from 'node:assert/strict';
import {
  buildMooniKoreaFestivalSystemHint,
  gateoKoreaFestivalDetailUrl,
  isMooniKoreaFestivalQuery,
  mergeMooniKoreaFestivalReply,
  parseMooniFestivalTimeWindow,
  selectMooniKoreaFestivalCandidates,
} from '../src/shared/korea/mooniKoreaFestivalAssist.js';

const NOW = new Date(2026, 9, 5, 12, 0, 0);

const FIXTURE = [
  {
    contentId: '900001',
    title: '고성 통일명태축제',
    eventStartDate: '20261002',
    eventEndDate: '20261005',
    addr1: '강원특별자치도 고성군',
  },
  {
    contentId: '900002',
    title: '설악문화제',
    eventStartDate: '20261019',
    eventEndDate: '20261026',
    addr1: '강원특별자치도 속초시',
  },
  {
    contentId: '900003',
    title: '양양송이연어축제',
    eventStartDate: '20260906',
    eventEndDate: '20260914',
    addr1: '강원특별자치도 양양군',
  },
];

assert.equal(isMooniKoreaFestivalQuery('다다음 주 속초 근처 축제'), true);
assert.equal(isMooniKoreaFestivalQuery('파리 맛집'), false);

const window = parseMooniFestivalTimeWindow('다다음 주 속초 근처 축제', NOW);
assert.equal(window.label, '다다음 주');
assert.equal(window.startYmd, '20261019');
assert.equal(window.endYmd, '20261025');

const picked = selectMooniKoreaFestivalCandidates(FIXTURE, {
  userText: '다다음 주 속초 근처 축제',
  now: NOW,
});
assert.equal(
  picked.candidates.some((c) => c.contentId === '900001'),
  false,
  'ended / non-overlapping 통일명태 excluded',
);
assert.equal(
  picked.candidates.some((c) => c.contentId === '900002'),
  true,
  '설악문화제 in 다다음 주',
);
assert.equal(
  picked.candidates.some((c) => c.contentId === '900003'),
  false,
  'September festival excluded',
);

const hint = buildMooniKoreaFestivalSystemHint({
  userText: '다다음 주 속초 축제',
  items: FIXTURE,
  now: NOW,
});
assert.match(hint, /gateo\.kr\/korea\/\?festival=/);
assert.match(hint, /900002/);

const url = gateoKoreaFestivalDetailUrl('506708');
assert.equal(url, 'https://www.gateo.kr/korea/?festival=506708');

const merged = mergeMooniKoreaFestivalReply('속초 근처 행사를 알려드릴게요.', {
  candidates: picked.candidates,
});
assert.match(merged, /https:\/\/www\.gateo\.kr\/korea\/\?festival=900002/);
assert.match(merged, /10\.19/);

console.log('smoke-mooni-korea-festival: OK');
