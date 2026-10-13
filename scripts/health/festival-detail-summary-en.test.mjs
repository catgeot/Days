import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { buildFestivalDetailSummary } from '../../src/pages/Korea/lib/festivalDetailSummary.js';
import {
  getManualFestivalEntry,
  manualFestivalTourDetail,
} from '../../src/pages/Korea/manualFestivalEntries.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('638576 EN summary — venue and fee show English with Korean in parentheses', () => {
  const entry = getManualFestivalEntry('638576');
  const detail = manualFestivalTourDetail(entry);
  const summary = buildFestivalDetailSummary({
    item: detail.common,
    intro: detail.intro,
    freeLabel: 'Free',
    locale: 'en',
  });
  assert.match(summary.placeText, /Hampyeong Expo Park area/);
  assert.match(summary.fee?.text || '', /7,000 KRW/);
  assert.match(summary.fee?.text || '', /Advance booking/);
  assert.doesNotMatch(summary.fee?.text || '', /[가-힣]/);
});

test('FestivalDetailSheet hides expand badge until hero photo decodes', () => {
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(sheet, /heroPhotoDecoded \? \(/);
  assert.match(sheet, /expandView/);
});
