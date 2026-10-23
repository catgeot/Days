import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { logbookHeroImageUrl } from '../../src/utils/logbookImageSrc.js';
import { stripReviewInlineMarkdown } from '../../src/utils/reviewInlineMarkdown.js';

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

test('stripReviewInlineMarkdown handles emphasis, paren URLs, unclosed bold', () => {
  assert.equal(stripReviewInlineMarkdown('*a*'), 'a');
  assert.equal(stripReviewInlineMarkdown('__b__'), 'b');
  assert.equal(stripReviewInlineMarkdown('_c_'), 'c');
  assert.equal(stripReviewInlineMarkdown('[L](https://x.com/p_(q))'), 'L');
  assert.equal(stripReviewInlineMarkdown('open **bold'), 'open bold');
});

test('stripReviewInlineMarkdown preserves intraword underscores and asterisks', () => {
  assert.equal(stripReviewInlineMarkdown('snake_case_word'), 'snake_case_word');
  assert.equal(
    stripReviewInlineMarkdown('https://ex.com/a_b_c/d'),
    'https://ex.com/a_b_c/d',
  );
  assert.equal(stripReviewInlineMarkdown('2*3*4'), '2*3*4');
  assert.equal(stripReviewInlineMarkdown('한글_단어'), '한글_단어');
  assert.equal(stripReviewInlineMarkdown('**사려니숲길**은'), '사려니숲길은');
  assert.equal(stripReviewInlineMarkdown('a * b * c'), 'a * b * c');
});

test('PlaceMobileSecondaryNav allows modifier clicks through', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/common/PlaceMobileSecondaryNav.jsx'),
    'utf8',
  );
  assert.match(src, /shouldHandlePlaceSpaNavClick/);
});

test('Related blog cards use thumbnail onError fallback', () => {
  const src = readFileSync(
    join(root, 'src/components/PlaceCard/tabs/ReviewsTab.jsx'),
    'utf8',
  );
  assert.match(src, /RelatedBlogCardThumbnail/);
  assert.match(src, /onError=\{\(\) => setFailed\(true\)\}/);
});
