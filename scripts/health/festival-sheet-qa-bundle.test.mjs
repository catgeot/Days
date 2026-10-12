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
    'korea.festival.panelNationwideScope': 'All of Korea',
    'korea.festival.panelNationwideGroup': 'By region',
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
  assert.match(text, /All of Korea/);
  assert.match(text, /182/);
  assert.match(text, /By region/);
  assert.equal(text.includes('City/county'), false);
});

test('EN nationwide time headline uses natural month phrase', () => {
  const time = festivalIndexTimePhrase('en', 'thisMonth', [], tMock);
  assert.equal(time, "This month's festivals");
});

test('social promo EN title uses English (한글) and normalizes thumb fields', () => {
  const title = festivalListDisplayTitle(
    { title: '국향대전', titleEn: 'Korea Chrysanthemum Festival' },
    'en',
  );
  assert.equal(title, 'Korea Chrysanthemum Festival (국향대전)');
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
});

test('EventTnaStrip can suppress inline loading spinner', () => {
  const tna = readFileSync(join(root, 'src/pages/WorldEvents/EventTnaStrip.jsx'), 'utf8');
  assert.match(tna, /suppressInlineLoading/);
  assert.match(tna, /status === 'loading' && !suppressInlineLoading/);
});
