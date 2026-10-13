import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  buildFestivalDetailSummary,
  FESTIVAL_DETAIL_SUMMARY_FIXTURE,
} from '../../src/pages/Korea/lib/festivalDetailSummary.js';
import {
  getManualFestivalEntry,
  manualFestivalTourDetail,
} from '../../src/pages/Korea/manualFestivalEntries.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('638576 EN summary — venue and fee without manual *En fields', () => {
  const entry = getManualFestivalEntry('638576');
  const detail = manualFestivalTourDetail(entry);
  const summary = buildFestivalDetailSummary({
    item: detail.common,
    intro: detail.intro,
    freeLabel: 'Free',
    locale: 'en',
  });
  assert.match(summary.placeText, /Hampyeong Expo Park/);
  assert.match(summary.fee?.text || '', /7,000 won/i);
  assert.match(summary.fee?.text || '', /Advance booking/i);
  const outsideParen = String(summary.fee?.text || '').replace(/\([^)]*\)/g, '');
  assert.doesNotMatch(outsideParen, /[가-힣]/);
});

test('yangyang fixture (506708) EN — free fee and venue label', () => {
  const summary = buildFestivalDetailSummary({
    ...FESTIVAL_DETAIL_SUMMARY_FIXTURE,
    freeLabel: 'Free',
    locale: 'en',
  });
  assert.equal(summary.fee?.text, 'Free');
  assert.match(summary.placeText, /Yangyang|Song|양양/);
});

test('palace fixture (1998564) EN — paid fee and multi-venue place', () => {
  const summary = buildFestivalDetailSummary({
    item: {
      addr1: '서울특별시 종로구 사직로 161',
    },
    intro: {
      eventplace: '경복궁,창덕궁,덕수궁,창경궁,종묘',
      usetimefestival: '유료(궁궐 별 입장료 상이)',
    },
    freeLabel: 'Free',
    locale: 'en',
  });
  assert.match(summary.fee?.text || '', /Paid|admission varies/i);
  assert.match(summary.placeText, /Gyeongbokgung|경복궁/);
});

test('FestivalDetailSheet hides expand badge until hero photo decodes', () => {
  const sheet = readFileSync(
    join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
    'utf8',
  );
  assert.match(sheet, /heroPhotoDecoded \? \(/);
  assert.match(sheet, /isFestivalPhotoDecoded/);
  assert.doesNotMatch(sheet, /key=\{`\$\{hero\}-\$\{locale\}`\}/);
});
