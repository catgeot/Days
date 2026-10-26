import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  festivalListDisplayTitleLines,
} from '../../src/pages/Korea/festivalDisplayTitle.js';
import {
  mergeFestivalTitleEn,
  normalizeFestivalKoTitleForEnMatch,
  resolveFestivalTitleEn,
  buildFestivalEnTitleIndex,
} from '../../src/pages/Korea/festivalTitleEnMerge.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const EN_WINDOW = [
  {
    contentId: 'en-3370452',
    title: 'Suseong International Biennale (수성국제비엔날레)',
    eventStartDate: '20260401',
  },
  {
    contentId: 'en-1074568',
    title: 'Jeju Olle Walking Festival (제주올레걷기축제)',
    eventStartDate: '20260410',
  },
];

test('normalizeFestivalKoTitleForEnMatch strips leading year and collapses spaces', () => {
  assert.equal(
    normalizeFestivalKoTitleForEnMatch('  2026   수성국제비엔날레  '),
    '수성국제비엔날레',
  );
  assert.equal(normalizeFestivalKoTitleForEnMatch('가든 나이트 마켓'), '가든 나이트 마켓');
});

test('mergeFestivalTitleEn matches KO titles with leading year via parenthetical hint', () => {
  const koItems = [
    {
      contentId: '3370452',
      title: '2026 수성국제비엔날레',
      eventStartDate: '20260401',
    },
    {
      contentId: '1074568',
      title: '2026 제주올레걷기축제',
      eventStartDate: '20260410',
    },
    {
      contentId: '4128786',
      title: '2026 대한민국 제주정원문화박람회',
      eventStartDate: '20260401',
    },
    {
      contentId: '4114621',
      title: '2026 대한민국 제주정원문화박람회',
      eventStartDate: '20260401',
    },
  ];

  const merged = mergeFestivalTitleEn(koItems, EN_WINDOW);
  assert.equal(merged[0]?.titleEn, 'Suseong International Biennale');
  assert.equal(merged[1]?.titleEn, 'Jeju Olle Walking Festival');
  assert.equal(merged[2]?.titleEn, undefined);
  assert.equal(merged[3]?.titleEn, undefined);
});

test('resolveFestivalTitleEn uses normalized keys on date index', () => {
  const index = buildFestivalEnTitleIndex(EN_WINDOW);
  const en = resolveFestivalTitleEn(
    { contentId: 'x', title: '2026 제주올레걷기축제', eventStartDate: '20260410' },
    index,
  );
  assert.equal(en, 'Jeju Olle Walking Festival');
});

test('festival grid card uses festivalListDisplayTitleLines for EN titles', () => {
  const grid = readFileSync(
    join(root, 'src/pages/Korea/components/FestivalGridPhotoCard.jsx'),
    'utf8',
  );
  assert.match(grid, /festivalListDisplayTitleLines/);
  assert.doesNotMatch(grid, /\{item\.title\}/);

  const lines = festivalListDisplayTitleLines(
    {
      title: '2026 수성국제비엔날레',
      titleEn: 'Suseong International Biennale',
    },
    'en',
  );
  assert.deepEqual(lines, {
    primary: 'Suseong International Biennale',
    secondary: '2026 수성국제비엔날레',
  });
});
