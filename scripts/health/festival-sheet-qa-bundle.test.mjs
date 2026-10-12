import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { buildFestivalPanelListMetaSegments } from '../../src/pages/Korea/festivalPanelListMeta.js';
import { festivalIndexTimePhrase } from '../../src/pages/Korea/festivalIndexHeadline.js';
import { festivalListDisplayTitle } from '../../src/pages/Korea/festivalDisplayTitle.js';
import { normalizeFestivalItemImages } from '../../src/pages/Korea/socialPromoFestivalsLogic.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function tMock(key, opts = {}) {
  const map = {
    'korea.common.nationwide': 'Nationwide',
    'korea.common.countUnit': `${opts.count}`,
    'korea.common.regionGroup': 'By region',
    'korea.festival.panelNationwideScope': 'Nationwide',
    'korea.festival.panelNationwideGroup': 'By province',
    'korea.festival.timeTab.now': 'Now',
  };
  return map[key] || opts.defaultValue || key;
}

test('EN nationwide panel meta avoids raw all and city/county grouping', () => {
  const segments = buildFestivalPanelListMetaSegments({
    areaCode: 'all',
    cityName: 'all',
    count: 182,
    t: tMock,
    locale: 'en',
  });
  const text = segments.map((s) => s.text).join(' · ');
  assert.equal(text.includes('all'), false);
  assert.equal(text, 'Nationwide · 182 · By province');
});

test('KO nationwide panel meta uses 시·도별 grouping label', () => {
  const segments = buildFestivalPanelListMetaSegments({
    areaCode: 'all',
    cityName: 'all',
    count: 182,
    t: (key, opts = {}) =>
      ({
        'korea.common.nationwide': '전국',
        'korea.common.countUnit': String(opts.count ?? ''),
        'korea.festival.panelNationwideScope': '전국',
        'korea.festival.panelNationwideGroup': '시·도별',
      })[key] || key,
    locale: 'ko',
  });
  const text = segments.map((s) => s.text).join(' · ');
  assert.match(text, /시·도별/);
  assert.equal(text.includes('시·군'), false);
});

test('EN nationwide time headline uses natural month phrase', () => {
  const time = festivalIndexTimePhrase('en', 'thisMonth', [], tMock);
  assert.equal(time, "This month's festivals");
});

test('social promo EN title uses English (한글) and normalizes thumb fields', () => {
  const title = festivalListDisplayTitle(
    { title: '대한민국 국향대전', titleEn: 'Korea Chrysanthemum Festival' },
    'en',
  );
  assert.equal(title, 'Korea Chrysanthemum Festival (대한민국 국향대전)');
  const normalized = normalizeFestivalItemImages({
    contentId: '1',
    firstimage: '//cdn.example/a.jpg',
  });
  assert.equal(normalized.firstimage, 'https://cdn.example/a.jpg');
});

test('festival sheet folds TNA/stay inline loaders into nearSectionsLoading', () => {
  const sheet = readFileSync(
    join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
    'utf8',
  );
  assert.match(sheet, /tnaStripStatus === 'loading'/);
  assert.match(sheet, /suppressInlineLoading=\{belowSectionsLoading\}/);
  assert.match(sheet, /suppressInlineStayLoading=\{belowSectionsLoading\}/);
  assert.match(sheet, /data-festival-below-loading/);
  assert.match(sheet, /stayStripStatus === 'loading'/);
  assert.match(sheet, /data-festival-lodging-reserve/);
  assert.match(sheet, /NEARBY_ATTRACTION_ROW_CLICKABLE/);
  assert.match(sheet, /event\.currentTarget\.blur\(\)/);
});

test('EventTnaStrip can suppress inline loading spinner', () => {
  const tna = readFileSync(join(root, 'src/pages/WorldEvents/EventTnaStrip.jsx'), 'utf8');
  assert.match(tna, /suppressInlineLoading/);
  assert.match(tna, /status === 'loading' && !suppressInlineLoading/);
});
