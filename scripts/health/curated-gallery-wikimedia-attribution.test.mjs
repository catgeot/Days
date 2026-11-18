import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildGalleryPhotoCredit } from '../../src/components/PlaceCard/common/buildGalleryPhotoCredit.js';
import {
  curatedPlaceGallery,
  listCuratedPlaceGallerySlugs,
} from '../../src/data/curatedPlaceGalleries.js';

test('every curated wikimedia photo has author, license, and source', () => {
  const slugs = listCuratedPlaceGallerySlugs();
  assert.ok(slugs.length > 0);
  let wikimediaCount = 0;

  for (const slug of slugs) {
    const images = curatedPlaceGallery(slug);
    assert.ok(Array.isArray(images), slug);
    for (const image of images) {
      const src = String(image?.urls?.regular || '');
      const isWikimedia = image?.source === 'wikimedia' || src.includes('upload.wikimedia.org');
      if (!isWikimedia) continue;
      wikimediaCount += 1;

      const author = String(image.author || image.user?.name || '').trim();
      const license = String(image.license || '').trim();
      const sourceUrl = String(image.sourceUrl || image.links?.html || '').trim();
      assert.ok(author, `${slug} ${image.id} author`);
      assert.ok(license, `${slug} ${image.id} license`);
      assert.match(sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/, `${slug} ${image.id} source`);
      assert.match(
        String(image.licenseUrl || ''),
        /^https:\/\/creativecommons\.org\/licenses\//,
        `${slug} ${image.id} license url`,
      );

      for (const locale of ['ko', 'en']) {
        const credit = buildGalleryPhotoCredit(image, locale);
        assert.equal(credit?.kind, 'wikimedia', `${slug} ${image.id} ${locale}`);
        assert.equal(credit.authorName, author);
        assert.equal(credit.licenseName, license);
        assert.equal(credit.licenseHref, image.licenseUrl);
        assert.equal(credit.filePageHref, sourceUrl);
      }
    }
  }

  assert.equal(wikimediaCount, 4);
});
