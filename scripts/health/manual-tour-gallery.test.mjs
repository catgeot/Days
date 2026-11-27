import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  isGateoManualTourContentId,
  resolveTourGalleryContentId,
} from '../../src/utils/gateoManualTourContentId.js';
import { resolveTourApiPlace } from '../../src/utils/tourApiMatch.js';
import { galleryLoadFailedAfterEmptyFetch } from '../../src/utils/galleryFetchEmptyOutcome.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('gateo manual tour content ids', () => {
  assert.equal(isGateoManualTourContentId('990000000001'), true);
  assert.equal(isGateoManualTourContentId('990000000002'), true);
  assert.equal(isGateoManualTourContentId('128113'), false);
  assert.equal(isGateoManualTourContentId('9026112001'), false);
  assert.equal(resolveTourGalleryContentId('990000000002'), null);
  assert.equal(resolveTourGalleryContentId('128113'), '128113');
});

test('resolveTourApiPlace — manual contentId is not an official Tour gallery id', () => {
  const pin = {
    slug: 'tour-990000000002',
    name: '예산 동학농민혁명 기념공원',
    contentId: '990000000002',
    country: '대한민국',
    lat: 36.715769,
    lng: 126.842387,
    parentCity: '예산',
  };
  const mapped = resolveTourApiPlace(pin);
  assert.ok(mapped?.photoKeyword);
  assert.equal(mapped?.contentId, null);
});

test('(a) manual-style fetch — all sources ok with 0 items → empty copy (loadFailed false)', () => {
  assert.equal(resolveTourGalleryContentId('990000000002'), null);
  assert.equal(
    galleryLoadFailedAfterEmptyFetch({ sourceHadError: false, imageCount: 0 }),
    false,
  );
});

test('(b) any source rejects with 0 photos → loadFailed true', () => {
  assert.equal(
    galleryLoadFailedAfterEmptyFetch({ sourceHadError: true, imageCount: 0 }),
    true,
  );
});

test('(c) source rejects but another returns photos → show photos (loadFailed false)', () => {
  assert.equal(
    galleryLoadFailedAfterEmptyFetch({ sourceHadError: true, imageCount: 3 }),
    false,
  );
});

test('usePlaceGallery wires error tracking and empty vs network outcome', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
    'utf8',
  );
  assert.match(src, /resolveTourGalleryContentId/);
  assert.match(src, /hasOfficialTourContentId = Boolean\(galleryTourContentId\)/);
  assert.match(src, /noteGallerySourceError/);
  assert.match(src, /galleryLoadFailedAfterEmptyFetch/);
  assert.match(src, /fetchUnsplashStockForGallery/);
});

test('fetchTourApiGallery skips manual id detailImage', () => {
  const src = readFileSync(join(root, 'src/utils/fetchTourApiGallery.js'), 'utf8');
  assert.match(src, /resolveTourGalleryContentId\(opts\?\.contentId\)/);
  assert.match(src, /sourceHadError/);
  assert.match(src, /galleryFetchOutcome/);
});