import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { shouldShowFestivalNearbyListSection } from '../../src/pages/Korea/lib/festivalDetailSectionGate.js';
import { resolveListImageUrl } from '../../src/utils/listImageUrl.js';
import { festivalItemThumbSrc } from '../../src/pages/Korea/festivalListThumb.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('shouldShowFestivalNearbyListSection hides empty food/leports blocks', () => {
  assert.equal(shouldShowFestivalNearbyListSection('idle', 0), false);
  assert.equal(shouldShowFestivalNearbyListSection('nocoords', 0), false);
  assert.equal(shouldShowFestivalNearbyListSection('loading', 0), false);
  assert.equal(shouldShowFestivalNearbyListSection('empty', 0), false);
  assert.equal(shouldShowFestivalNearbyListSection('empty', 2), true);
  assert.equal(shouldShowFestivalNearbyListSection('ok', 3), true);
  assert.equal(shouldShowFestivalNearbyListSection('error', 0), true);
  assert.equal(shouldShowFestivalNearbyListSection('error', 1), true);
});

test('festival nearby empty copy has no TourAPI and uses traveler-friendly Korean', () => {
  const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
  const detail = ko.korea?.festival?.detail ?? {};
  const keys = [
    'nearFoodEmpty',
    'nearLeportsEmpty',
    'nearCultureEmpty',
    'nearCoursesEmpty',
    'nearAttractionsEmpty',
    'nearbySightsEmpty',
  ];
  for (const key of keys) {
    const text = String(detail[key] || '');
    assert.ok(text.length > 0, `missing korea.festival.detail.${key}`);
    assert.doesNotMatch(text, /TourAPI/i, key);
    assert.match(text, /(없어요|없습니다)/, `${key} should read as empty-state Korean`);
  }
  assert.match(String(detail.nearCultureEmpty), /문화시설이 없어요/);
});

test('festival detail culture rows use NearbyRowThumb pin fallback', () => {
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(
    sheet,
    /shouldShowFestivalNearbyListSection\(nearbyCultureStatus, nearbyCulture\.length\)/,
  );
  const cultureBlock = sheet.slice(
    sheet.indexOf('data-festival-section="nearCulture"'),
    sheet.indexOf('data-festival-section="nearCourses"'),
  );
  assert.match(cultureBlock, /<NearbyRowThumb spot=\{spot\} \/>/);
  assert.doesNotMatch(cultureBlock, /Building2/);
});

test('list thumbnails upgrade http TourAPI URLs to https', () => {
  const viaThumb = festivalItemThumbSrc({
    contentId: '1',
    firstimage: 'http://tong.visitkorea.or.kr/cms/resource/06/4114406_image2_1.JPG',
  });
  assert.equal(
    viaThumb,
    'https://tong.visitkorea.or.kr/cms/resource/06/4114406_image2_1.JPG',
  );
  assert.equal(
    resolveListImageUrl('http://cdn.visitkorea.or.kr/foo.jpg'),
    'https://cdn.visitkorea.or.kr/foo.jpg',
  );
});
