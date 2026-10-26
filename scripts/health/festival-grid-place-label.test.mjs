import assert from 'node:assert/strict';
import test from 'node:test';

import { festivalGridPlaceLabel } from '../../src/pages/Korea/festivalGridPlaceLabel.js';
import {
  readFestivalHubLegacyListFromSession,
  writeFestivalHubLegacyListToSession,
} from '../../src/pages/Korea/festivalListViewSession.js';

test('festivalGridPlaceLabel — nationwide uses short sido + city', () => {
  const item = { addr1: '경상남도 진주시 중앙동' };
  assert.equal(festivalGridPlaceLabel(item, { areaCode: 'all', cityName: 'all' }), '경남 진주');
});

test('festivalGridPlaceLabel — sido filter shows city only', () => {
  const item = { addr1: '경상남도 진주시 중앙동' };
  assert.equal(festivalGridPlaceLabel(item, { areaCode: '36', cityName: 'all' }), '진주');
});

test('festival hub list view session — grid default, legacy round-trip', () => {
  const store = new Map();
  const prev = globalThis.sessionStorage;
  globalThis.sessionStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
  };
  try {
    writeFestivalHubLegacyListToSession(false);
    assert.equal(readFestivalHubLegacyListFromSession(), false);
    writeFestivalHubLegacyListToSession(true);
    assert.equal(readFestivalHubLegacyListFromSession(), true);
    writeFestivalHubLegacyListToSession(false);
  } finally {
    globalThis.sessionStorage = prev;
  }
});
