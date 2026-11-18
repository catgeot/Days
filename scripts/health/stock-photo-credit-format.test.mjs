import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGalleryPhotoCredit } from '../../src/components/PlaceCard/common/buildGalleryPhotoCredit.js';
import { resolveEditorialReviewImageCredit } from '../../src/utils/editorialReviewImageCredit.js';
import {
  formatStockPhotoCreditPlainText,
  normalizeEditorialReviewCredit,
  normalizeGalleryPhotoCredit,
} from '../../src/utils/stockPhotoCreditFormat.js';

test('unsplash editorial and gallery share the same plain summary', () => {
  const editorial = resolveEditorialReviewImageCredit({
    url: 'https://images.unsplash.com/photo-1',
    photographer: 'Jane',
    photographer_url: 'https://unsplash.com/@jane',
    unsplash_url: 'https://unsplash.com/photos/abc',
  });
  const gallery = buildGalleryPhotoCredit(
    {
      id: 'u1',
      user: { name: 'Jane', links: { html: 'https://unsplash.com/@jane' } },
      links: { html: 'https://unsplash.com/photos/abc' },
    },
    'en',
  );
  const editorialLine = formatStockPhotoCreditPlainText(
    normalizeEditorialReviewCredit(editorial),
    'en',
  );
  const galleryLine = formatStockPhotoCreditPlainText(normalizeGalleryPhotoCredit(gallery), 'en');
  assert.equal(editorialLine, galleryLine);
  assert.equal(editorialLine, 'Photo by Jane on Unsplash');
});

test('pexels editorial resolves linked provider href', () => {
  const credit = resolveEditorialReviewImageCredit({
    source: 'pexels',
    photographer: 'Pexels Author',
    photographer_url: 'https://www.pexels.com/@author/',
    html_link: 'https://www.pexels.com/photo/123/',
  });
  assert.equal(credit?.type, 'pexels');
  const line = formatStockPhotoCreditPlainText(normalizeEditorialReviewCredit(credit), 'en');
  assert.equal(line, 'Photo by Pexels Author on Pexels');
  assert.match(credit.providerHref, /pexels\.com\/photo\/123/);
});

test('wikimedia editorial with and without license fields', () => {
  const withLicense = resolveEditorialReviewImageCredit({
    source: 'Wikimedia Commons',
    photographer: 'Wilfredor',
    photographer_url: 'https://www.wikidata.org/wiki/Q1',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source_page: 'https://commons.wikimedia.org/wiki/File:Sample.jpg',
  });
  assert.equal(withLicense?.type, 'wikimedia');
  assert.equal(
    formatStockPhotoCreditPlainText(normalizeEditorialReviewCredit(withLicense), 'en'),
    'Photo by Wilfredor · CC BY-SA 4.0',
  );

  const missingLicense = resolveEditorialReviewImageCredit({
    source: 'Wikimedia Commons',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Sample.jpg',
    photographer: 'Example',
  });
  assert.equal(missingLicense?.type, 'wikimedia');
  assert.equal(
    formatStockPhotoCreditPlainText(normalizeEditorialReviewCredit(missingLicense), 'ko'),
    '사진 Example',
  );
});