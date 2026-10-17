import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldShowFestivalNearbyListSection } from '../../src/pages/Korea/lib/festivalDetailSectionGate.js';
import { resolveListImageUrl } from '../../src/utils/listImageUrl.js';
import { festivalItemThumbSrc } from '../../src/pages/Korea/festivalListThumb.js';

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
