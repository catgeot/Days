import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGalleryPhotoCredit } from '../../src/components/PlaceCard/common/buildGalleryPhotoCredit.js';

const unsplashImg = {
  id: 'u-abc',
  user: { name: 'Jane Doe', links: { html: 'https://unsplash.com/@jane' } },
  links: { html: 'https://unsplash.com/photos/abc' },
};

const pexelsImg = {
  id: 'pexels-99',
  source: 'pexels',
  user: { name: 'Alex Kim' },
  links: { html: 'https://www.pexels.com/photo/99/' },
};

const tourImg = {
  id: 'tourapi-detail-1',
  source: 'tourapi',
  user: { name: '한국관광공사' },
  links: { html: 'https://korean.visitkorea.or.kr/detail/ms_detail.do?contentId=1' },
};

test('unsplash credit adds gateo referral utm params', () => {
  const credit = buildGalleryPhotoCredit(unsplashImg, 'en');
  assert.equal(credit?.kind, 'stock');
  assert.equal(credit?.provider, 'unsplash');
  assert.ok(credit.photographerHref.includes('utm_source=gateo'));
  assert.ok(credit.photographerHref.includes('utm_medium=referral'));
  assert.ok(credit.providerHref.includes('unsplash.com'));
  assert.ok(credit.providerHref.includes('utm_source=gateo'));
});

test('pexels credit links photographer and pexels.com', () => {
  const credit = buildGalleryPhotoCredit(pexelsImg, 'en');
  assert.equal(credit?.provider, 'pexels');
  assert.ok(credit.photographerHref.includes('pexels.com/photo'));
  assert.ok(credit.providerHref.includes('www.pexels.com'));
});

test('missing photographer name returns null for stock sources', () => {
  assert.equal(buildGalleryPhotoCredit({ id: 'u-1', user: {} }, 'en'), null);
  assert.equal(
    buildGalleryPhotoCredit({ id: 'pexels-1', source: 'pexels', user: {} }, 'en'),
    null,
  );
});

test('tourapi keeps kto provider label in ko and en', () => {
  const ko = buildGalleryPhotoCredit(tourImg, 'ko');
  const en = buildGalleryPhotoCredit(tourImg, 'en');
  assert.equal(ko?.kind, 'kto');
  assert.equal(ko?.providerLabel, '한국관광공사');
  assert.equal(en?.providerLabel, 'Korea Tourism Organization');
});
