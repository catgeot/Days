import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoFestivalGridEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import { festivalGridPlaceLabel } from '../../src/pages/Korea/festivalGridPlaceLabel.js';

test('festivalGridPlaceLabel — nationwide uses short sido + city', () => {
  const item = { addr1: '경상남도 진주시 중앙동' };
  assert.equal(festivalGridPlaceLabel(item, { areaCode: 'all', cityName: 'all' }), '경남 진주');
});

test('isGateoFestivalGridEnabled — query param default off', () => {
  const key = GATEO_ENV_FLAG_NAMES.FESTIVAL_GRID;
  const prev = globalThis.__VITE_ENV__?.[key];
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), [key]: '' };
  assert.equal(isGateoFestivalGridEnabled(new URLSearchParams('festivalGrid=1')), true);
  assert.equal(isGateoFestivalGridEnabled(new URLSearchParams()), false);
  globalThis.__VITE_ENV__[key] = prev;
});

test('festivalGridPlaceLabel — sido filter shows city only', () => {
  const item = { addr1: '경상남도 진주시 중앙동' };
  assert.equal(festivalGridPlaceLabel(item, { areaCode: '36', cityName: 'all' }), '진주');
});
