import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  collectUniqueEditorialReviewImageCredits,
  isUnsplashReviewImage,
  resolveEditorialReviewImageCredit,
  resolveReviewThumbnailUnsplashCredit,
} from '../../src/utils/editorialReviewImageCredit.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const samples = JSON.parse(
  readFileSync(join(root, 'e2e/fixtures/editorial-review-image-credit-samples.json'), 'utf8'),
);
const detailReviews = JSON.parse(
  readFileSync(join(root, 'e2e/fixtures/logbook-review-detail-photo-reviews.json'), 'utf8'),
);

const HWASEONG_CREDIT = 'ⓒ한국관광공사-송재근 / 포토코리아 · 공공누리 제1유형';

function assertStoredCredit(image) {
  const resolved = resolveEditorialReviewImageCredit(image);
  assert.equal(isUnsplashReviewImage(image), false);
  assert.equal(resolved?.type, 'plain');
  assert.equal(resolved.text, image.credit);
  assert.equal(resolveReviewThumbnailUnsplashCredit(image), null);
  assert.equal(resolved.text.includes('on Unsplash'), false);
}

test('KTO / VisitKorea credits stay the stored line', () => {
  assert.equal(samples.ktoVisitKorea.length, 3);
  for (const sample of samples.ktoVisitKorea) {
    assertStoredCredit(sample.image);
  }
  const hwaseong = samples.ktoVisitKorea[0];
  assert.equal(hwaseong.id, 'a9e7d546-7b70-47ce-bea1-362f36d12156');
  assert.equal(resolveEditorialReviewImageCredit(hwaseong.image).text, HWASEONG_CREDIT);
  const detail = detailReviews.find((row) => row.id === hwaseong.id);
  assert.deepEqual(detail.images[0], hwaseong.image);
});

test('KOGL / 문화재청 credits stay the stored line', () => {
  const gochang = samples.koglHeritage.filter((sample) => sample.place_slug === 'gochang-tidal-flat');
  assert.equal(gochang.length, 2);
  for (const sample of samples.koglHeritage) {
    assertStoredCredit(sample.image);
    assert.match(sample.image.credit, /공공누리/);
    assert.match(sample.image.credit, new RegExp(sample.image.photographer));
  }
  const unique = collectUniqueEditorialReviewImageCredits(gochang.map((sample) => sample.image));
  assert.equal(unique.length, 1);
  assert.equal(unique[0].text, '문화재청 / 공공누리 제1유형 · Wikimedia Commons');

  const suncheonSecond = samples.koglHeritage.find((sample) => sample.imageIndex === 1 && sample.place_slug === 'suncheon-bay-wetland');
  assert.equal(suncheonSecond.image.photographer, '문화재청');
  assert.equal(
    resolveEditorialReviewImageCredit(suncheonSecond.image).text,
    '문화재청 / 공공누리 제1유형 · Wikimedia Commons',
  );
});

test('Wikimedia CC stock rows resolve linked credits; heritage lines stay plain', () => {
  assert.ok(samples.wikimedia.length >= 3);
  for (const sample of samples.wikimedia) {
    const resolved = resolveEditorialReviewImageCredit(sample.image);
    assert.equal(resolved?.type, 'wikimedia');
    assert.equal(resolved.photographerName, sample.image.photographer);
    if (sample.image.license) {
      assert.equal(resolved.licenseName, sample.image.license);
    }
    if (sample.image.license_url) {
      assert.equal(resolved.licenseHref, sample.image.license_url);
    }
  }
  const suncheonWiki = samples.wikimedia.find((sample) => sample.place_slug === 'suncheon-bay-wetland').image;
  const heritage = samples.koglHeritage.find((sample) => sample.place_slug === 'suncheon-bay-wetland').image;
  const lines = collectUniqueEditorialReviewImageCredits([suncheonWiki, heritage]);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].type, 'wikimedia');
  assert.equal(lines[1].type, 'plain');
  assert.equal(lines[1].text, heritage.credit);
});

test('real Unsplash rows keep photographer links and are not rewritten', () => {
  const linked = samples.unsplash[0];
  assert.equal(linked.image.photographer, 'Himmel S');
  assert.equal(linked.image.source, 'Unsplash');
  const resolved = resolveEditorialReviewImageCredit(linked.image);
  assert.equal(resolved?.type, 'unsplash');
  assert.equal(resolved.photographerName, 'Himmel S');
  assert.match(resolved.photographerHref, /unsplash\.com\/@skyhung1228/);
  assert.match(resolved.photographerHref, /utm_source=gateo/);
  assert.match(resolved.unsplashHref, /unsplash\.com\/photos\//);
  assert.match(resolved.unsplashHref, /utm_source=gateo/);
  assert.equal(resolved.photographerHref, linked.image.photographer_url);
  assert.equal(resolved.unsplashHref, linked.image.unsplash_url);

  const urlOnly = samples.unsplash[1];
  assert.equal(urlOnly.image.source, null);
  const fromUrl = resolveEditorialReviewImageCredit(urlOnly.image);
  assert.equal(fromUrl?.type, 'unsplash');
  assert.equal(fromUrl.photographerName, 'Red Shuheart');
  assert.match(fromUrl.photographerHref, /unsplash\.com\/@mirrors_are_more_fun/);

  const byNameField = resolveEditorialReviewImageCredit({
    url: 'https://images.unsplash.com/photo-1',
    photographer_name: 'Ada Lovelace',
    photographer_url: 'https://unsplash.com/@ada',
    unsplash_url: 'https://unsplash.com/photos/abc',
  });
  assert.equal(byNameField?.type, 'unsplash');
  assert.equal(byNameField.photographerName, 'Ada Lovelace');
  assert.match(byNameField.photographerHref, /utm_source=gateo/);

  const detail = detailReviews.find((row) => row.id === 'e2e-hwaseong-unsplash');
  assert.deepEqual(detail.images[0], linked.image);
});

test('a photographer without an Unsplash URL is not labeled Unsplash', () => {
  const creditOnly = resolveEditorialReviewImageCredit({
    credit: 'Photo by Ada on Unsplash',
  });
  assert.deepEqual(creditOnly, { type: 'plain', text: 'Photo by Ada on Unsplash' });

  const namedOnly = resolveEditorialReviewImageCredit({
    photographer: '한국관광공사 송재근',
    photographer_url: 'https://phoko.visitkorea.or.kr/',
    credit: HWASEONG_CREDIT,
  });
  assert.equal(namedOnly?.type, 'plain');
  assert.equal(namedOnly.text, HWASEONG_CREDIT);

  const wikiImg = {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Northern_Lights_above_Iceland_%28Unsplash%29.jpg/1280px-Northern_Lights_above_Iceland_%28Unsplash%29.jpg',
    source: 'Wikimedia Commons',
    credit: 'Example / Wikimedia Commons · CC BY 4.0',
    photographer: 'Example',
    license: 'CC BY 4.0',
    license_url: 'https://creativecommons.org/licenses/by/4.0/',
  };
  assert.equal(isUnsplashReviewImage(wikiImg), false);
  const wikiFilename = resolveEditorialReviewImageCredit(wikiImg);
  assert.equal(wikiFilename?.type, 'wikimedia');
  assert.equal(wikiFilename.photographerName, 'Example');
  assert.equal(wikiFilename.licenseName, 'CC BY 4.0');
});

test('credit renderers use shared stock line helper', () => {
  const hero = readFileSync(join(root, 'src/logbookOfficialReviews/LogbookEditorialReviewDetailHero.jsx'), 'utf8');
  const logbook = readFileSync(join(root, 'src/pages/DailyReport/components/EditorialLogbookImageCredits.jsx'), 'utf8');
  const reviews = readFileSync(join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'), 'utf8');
  for (const source of [hero, logbook, reviews]) {
    assert.match(source, /EditorialStockPhotoCreditLine/);
    assert.match(source, /translate="no"/);
    assert.equal(source.includes('formatFestivalPhotoCreditLine'), false);
  }
  assert.match(reviews, /editorial-review-image-credit/);
  assert.match(hero, /logbook-editorial-review-detail-hero-credit/);
  assert.match(readFileSync(join(root, 'src/components/PlaceCard/common/GalleryGridPhotoCredit.jsx'), 'utf8'), /StockPhotoCreditLine/);
});

test('hub detail layout still renders per-image credits in ReviewsTab', () => {
  const reviews = readFileSync(join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'), 'utf8');
  assert.equal(reviews.includes('!hubDetailLayout ? <EditorialReviewImageCredits'), false);
  assert.equal(reviews.includes('!hubDetailLayout ? <ReviewPerImageCredit'), false);
  assert.match(reviews, /gateo-review-lightbox-credit/);
  assert.match(reviews, /resolveEditorialReviewHubHeroImageIndex/);
  assert.match(reviews, /hubHeroImageIndex === imageIndex/);
});
