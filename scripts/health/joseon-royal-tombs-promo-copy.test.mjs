import assert from 'node:assert/strict';
import test from 'node:test';

import { enrichJoseonRoyalTombsPromoPin } from '../../src/pages/Home/lib/joseonRoyalTombsPromoCopy.js';

test('관리소 Mapbox 핀 — 유네스코·관람 안내 desc', () => {
  const pin = enrichJoseonRoyalTombsPromoPin({
    name: '문화재청 궁능유적본부 조선왕릉중부지구관리소',
    lat: 37.4768,
    lng: 127.0045,
    uiPlace: true,
    hubId: 'seoul',
    slug: 'seoul',
  });
  assert.match(String(pin.desc), /유네스코/);
  assert.match(String(pin.desc), /관람/);
  assert.equal(pin.placeChatIntroApplied, true);
});

test('tour-125545 동구릉 — 관람 개요', () => {
  const pin = enrichJoseonRoyalTombsPromoPin({
    slug: 'tour-125545',
    contentId: '125545',
    name: '동구릉',
  });
  assert.match(String(pin.desc), /동구릉/);
  assert.match(String(pin.desc), /유네스코/);
});

test('검색어 조선왕릉 — 홈 핀 curationSummary', () => {
  const pin = enrichJoseonRoyalTombsPromoPin({
    name: '조선왕릉',
    originalQuery: '조선왕릉',
    lat: 37.5,
    lng: 127.0,
    uiPlace: true,
  });
  assert.match(String(pin.curationSummary || pin.desc), /40기|유네스코/);
});
