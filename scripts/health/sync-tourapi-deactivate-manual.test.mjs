import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  TOUR_ATTRACTION_SOURCE_MANUAL,
  TOUR_ATTRACTION_SOURCE_TOURAPI,
  contentIdsToDeactivateMissing,
  filterTourapiUpsertChunkSkippingManual,
  isTourapiSyncManagedSource,
} from '../lib/tourapi-attraction-source.mjs';

test('isTourapiSyncManagedSource — gateo_manual은 sync 비대상', () => {
  assert.equal(isTourapiSyncManagedSource(TOUR_ATTRACTION_SOURCE_TOURAPI), true);
  assert.equal(isTourapiSyncManagedSource(undefined), true);
  assert.equal(isTourapiSyncManagedSource(TOUR_ATTRACTION_SOURCE_MANUAL), false);
});

test('contentIdsToDeactivateMissing — manual 행은 keep에 없어도 제외', () => {
  const activeRows = [
    { content_id: '125901', source: TOUR_ATTRACTION_SOURCE_TOURAPI },
    { content_id: '990000000001', source: TOUR_ATTRACTION_SOURCE_MANUAL },
    { content_id: '999999', source: TOUR_ATTRACTION_SOURCE_TOURAPI },
  ];
  const off = contentIdsToDeactivateMissing(activeRows, ['125901']);
  assert.deepEqual(off, ['999999']);
});

test('filterTourapiUpsertChunkSkippingManual — manual PK는 upsert chunk에서 제거', () => {
  const chunk = [
    { content_id: '125901', title: 'A' },
    { content_id: '990000000001', title: '한남숲길' },
  ];
  const filtered = filterTourapiUpsertChunkSkippingManual(chunk, ['990000000001']);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].content_id, '125901');
});

test('sync script — deactivateMissing·upsert가 source=tourapi 가드 사용', () => {
  const src = readFileSync(new URL('../sync-tourapi-attractions.mjs', import.meta.url), 'utf8');
  assert.match(src, /\.eq\('source', TOUR_ATTRACTION_SOURCE_TOURAPI\)/);
  assert.match(src, /\.eq\('source', TOUR_ATTRACTION_SOURCE_MANUAL\)/);
});

test('koreaTourAttractions — GATEO 예약 id(99…)는 LIVE detailCommon 폴백 금지', () => {
  const src = readFileSync(
    new URL('../../src/pages/Home/lib/koreaTourAttractions.js', import.meta.url),
    'utf8',
  );
  assert.match(src, /\^99\\d\{8,30\}\$/);
});

test('DB CHECK — content_id는 숫자만(문자 slug는 별도 마이그레이션 필요)', () => {
  const sql = readFileSync(
    new URL('../../supabase/migrations/20260805120000_tourapi_attraction.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /content_id ~ '\^\\d\{1,32\}\$'/);
});
