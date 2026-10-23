import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { logbookHeroImageUrl } from '../../src/utils/logbookImageSrc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('logbookHeroImageUrl upgrades http visitkorea thumbs to https', () => {
  const url = logbookHeroImageUrl(
    [{ url: 'http://tong.visitkorea.or.kr/cms/resource/08/3585608_image2_1.jpg' }],
    { role: 'thumb' },
  );
  assert.ok(url);
  assert.match(url, /^https:\/\//);
  assert.equal(url.includes('http://'), false);
});

test('PlaceMobileSecondaryNav exposes reviews tab as Link href', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceMobileSecondaryNav.jsx'),
    'utf8',
  );
  assert.match(src, /to=\{reviewsHref\}/);
  assert.match(src, /\/reviews/);
});

test('Related blog cards use thumbnail onError fallback', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'),
    'utf8',
  );
  assert.match(src, /RelatedBlogCardThumbnail/);
  assert.match(src, /onError=\{\(\) => setFailed\(true\)\}/);
});
