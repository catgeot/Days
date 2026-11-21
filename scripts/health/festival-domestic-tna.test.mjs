import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveFestivalThemeCrossLinks } from '../../src/pages/Home/lib/koreaThemeCrossLinks.js';
import {
  GONGJU_PRINCESS_TNA_NOISE_RE,
  stripUnsafeMrtTnaItems,
} from '../../src/utils/mrtTnaRelevance.js';
import { applyFestivalDomesticTnaGuards } from '../../src/pages/Korea/lib/festivalDomesticTnaQuery.js';

const nonsanManualFestival = {
  contentId: '9026112001',
  title: '논산양촌곶감축제',
  addr1: '충청남도 논산시 양촌면 양촌리 454',
  mapx: '127.2472045',
  mapy: '36.1295106',
  eventStartDate: '20261211',
  eventEndDate: '20261213',
};

test('논산 수동 축제 — 투어 키워드는 논산·충남, 공주 인근 보강 제외', () => {
  const cross = resolveFestivalThemeCrossLinks(nonsanManualFestival);
  assert.equal(cross.tna?.keyword, '논산');
  assert.notEqual(cross.tna?.keyword, '공주');
  assert.ok(
    (cross.tna?.altKeywords || []).includes('충남'),
    `alt에 충남 포함 (got ${cross.tna?.altKeywords?.join(',')})`,
  );
  assert.ok(
    !(cross.tna?.nearbyKeywords || []).includes('공주'),
    `nearby에 공주 없음 (got ${cross.tna?.nearbyKeywords?.join(',')})`,
  );
  assert.ok(
    !(cross.tna?.altKeywords || []).includes('공주'),
    `alt에 공주 없음 (got ${cross.tna?.altKeywords?.join(',')})`,
  );
});

test('공주시 축제 — 공주 인근 키워드 유지', () => {
  const gongjuFestival = {
    contentId: '9990001',
    title: '공주세계유산축제',
    addr1: '충청남도 공주시 관광단지길 12',
    mapx: '127.119',
    mapy: '36.4465',
    eventStartDate: '20261001',
    eventEndDate: '20261003',
  };
  const cross = resolveFestivalThemeCrossLinks(gongjuFestival);
  assert.equal(cross.tna?.keyword, '공주');
  assert.ok(
    (cross.tna?.nearbyKeywords || []).includes('부여') ||
      (cross.tna?.nearbyKeywords || []).includes('논산'),
    '공주 hub 인근 시군 유지',
  );
});

test('공주(公主) 동형어·해외 체험 상품 목 데이터 필터', () => {
  const noise = [
    { itemName: '[서울] 당나라 공주 체험 · 한복 포함' },
    { itemName: '[영국] 켄싱턴 궁전 공주 특별전 입장권' },
    { itemName: '[충남/공주] 백제역사 체험 투어' },
  ];
  assert.ok(GONGJU_PRINCESS_TNA_NOISE_RE.test(noise[0].itemName));
  assert.ok(GONGJU_PRINCESS_TNA_NOISE_RE.test(noise[1].itemName));
  const kept = stripUnsafeMrtTnaItems(noise);
  assert.equal(kept.length, 1);
  assert.match(kept[0].itemName, /백제역사/);
});

test('applyFestivalDomesticTnaGuards — 주소 시군 parentCity 동기화', () => {
  const raw = resolveFestivalThemeCrossLinks({
    contentId: '1',
    title: '테스트',
    addr1: '충청남도 논산시',
    mapx: '127.2',
    mapy: '36.2',
  });
  const guarded = applyFestivalDomesticTnaGuards(
  { ...raw, tna: { ...raw.tna, nearbyKeywords: ['공주', '부여'] } },
    nonsanManualFestival,
  );
  assert.equal(guarded.tna?.location?.parentCity, '논산');
  assert.deepEqual(guarded.tna?.nearbyKeywords, ['부여']);
});