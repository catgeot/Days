import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildGalleryPhotoCredit } from '../../src/components/PlaceCard/common/buildGalleryPhotoCredit.js';
import {
  formatStockPhotoCreditPlainText,
  normalizeGalleryPhotoCredit,
} from '../../src/utils/stockPhotoCreditFormat.js';

const unsplashImg = {
  id: 'u-abc',
  user: { name: 'Jane Doe', links: { html: 'https://unsplash.com/@jane' } },
  links: { html: 'https://unsplash.com/photos/abc' },
};

const pexelsImg = {
  id: 'pexels-99',
  source: 'pexels',
  user: { name: 'Alex Kim', links: { html: 'https://www.pexels.com/@alex-kim/' } },
  links: { html: 'https://www.pexels.com/photo/99/' },
};

const wikimediaFull = {
  id: 'commons-beacon',
  source: 'wikimedia',
  user: { name: 'Design4business Media', links: { html: 'https://www.wikidata.org/wiki/Q-example' } },
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Beacon.JPG',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
};

const wikimediaLicenseOnly = {
  id: 'commons-min',
  source: 'wikimedia',
  user: { name: 'Ada' },
  license: 'CC0 1.0',
};

const longAuthorUnsplash = {
  id: 'u-long',
  user: {
    name: 'Design4business Media Studio Collective',
    links: { html: 'https://unsplash.com/@design4business' },
  },
  links: { html: 'https://unsplash.com/photos/long-name-sample' },
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

test('pexels credit links photographer profile and photo page', () => {
  const credit = buildGalleryPhotoCredit(pexelsImg, 'en');
  assert.equal(credit?.provider, 'pexels');
  assert.ok(credit.photographerHref.includes('pexels.com/@alex-kim'));
  assert.ok(credit.providerHref.includes('pexels.com/photo/99'));
  assert.ok(credit.providerHref.includes('utm_source=gateo'));
});

test('wikimedia credit shows license when present and tolerates missing file page', () => {
  const full = buildGalleryPhotoCredit(wikimediaFull, 'ko');
  assert.equal(full?.kind, 'wikimedia');
  assert.equal(full.licenseName, 'CC BY-SA 4.0');
  assert.match(full.licenseHref, /creativecommons\.org/);
  assert.match(full.photographerHref, /wikidata\.org/);
  assert.match(full.filePageHref, /commons\.wikimedia\.org/);

  const partial = buildGalleryPhotoCredit(wikimediaLicenseOnly, 'en');
  assert.equal(partial?.kind, 'wikimedia');
  assert.equal(partial.licenseName, 'CC0 1.0');
  assert.equal(partial.filePageHref, null);
});

test('shared format line matches gallery stock credits (en/ko)', () => {
  const unsplashLine = formatStockPhotoCreditPlainText(
    normalizeGalleryPhotoCredit(buildGalleryPhotoCredit(unsplashImg, 'en')),
    'en',
  );
  assert.equal(unsplashLine, 'Photo by Jane Doe on Unsplash');
  const koPexels = formatStockPhotoCreditPlainText(
    normalizeGalleryPhotoCredit(buildGalleryPhotoCredit(pexelsImg, 'ko')),
    'ko',
  );
  assert.equal(koPexels, '사진 Alex Kim · Pexels');
  const longName = formatStockPhotoCreditPlainText(
    normalizeGalleryPhotoCredit(buildGalleryPhotoCredit(longAuthorUnsplash, 'en')),
    'en',
  );
  assert.equal(longName, 'Photo by Design4business Media Studio Collective on Unsplash');
});

test('missing photographer name returns null for stock sources', () => {
  assert.equal(buildGalleryPhotoCredit({ id: 'u-1', user: {} }, 'en'), null);
  assert.equal(
    buildGalleryPhotoCredit({ id: 'pexels-1', source: 'pexels', user: {} }, 'en'),
    null,
  );
});

test('gallery grid credit markup stays non-interactive (tile click safe)', () => {
  const source = readFileSync(
    new URL('../../src/components/PlaceCard/common/GalleryGridPhotoCredit.jsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /interactiveLinks=\{false\}/);
});

test('tourapi keeps kto provider label in ko and en', () => {
  const ko = buildGalleryPhotoCredit(tourImg, 'ko');
  const en = buildGalleryPhotoCredit(tourImg, 'en');
  assert.equal(ko?.kind, 'kto');
  assert.equal(ko?.providerLabel, '한국관광공사');
  assert.equal(en?.providerLabel, 'Korea Tourism Organization');
});
