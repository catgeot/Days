import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePlaceCardHref } from '../../src/pages/Home/lib/placeCardHref.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('explicit tab without preserveRoute does not keep the current query', () => {
  assert.equal(
    resolvePlaceCardHref({
      param: 'osaka',
      tab: 'reviews',
      pathname: '/place/osaka/planner',
      search: '?open=tour',
    }),
    '/place/osaka/reviews',
  );
});

test('async hydration keeps reviews, planner, gallery, and the live query', () => {
  assert.equal(
    resolvePlaceCardHref({
      param: 'tour-588175',
      preserveRoute: true,
      pathname: '/place/tour-588175/reviews',
      search: '?lang=ko',
    }),
    '/place/tour-588175/reviews?lang=ko',
  );
  assert.equal(
    resolvePlaceCardHref({
      param: 'tour-588175',
      preserveRoute: true,
      pathname: '/place/tour-588175/planner',
      search: '',
    }),
    '/place/tour-588175/planner',
  );
  assert.equal(
    resolvePlaceCardHref({
      param: 'tour-127937',
      preserveRoute: true,
      pathname: '/place/tour-127937/reviews',
      search: '?open=tour&from=review',
    }),
    '/place/tour-127937/reviews?open=tour&from=review',
  );
  assert.equal(
    resolvePlaceCardHref({
      param: 'tour-588175',
      preserveRoute: true,
      pathname: '/place/tour-588175/gallery',
      search: '?lang=ko',
    }),
    '/place/tour-588175/gallery?lang=ko',
  );
  assert.equal(
    resolvePlaceCardHref({
      param: 'osaka',
      preserveRoute: true,
      pathname: '/place/osaka',
      search: '?open=tour',
    }),
    '/place/osaka?open=tour',
  );
});

test('reviews footer reuses the gallery chip-bar clearance without changing gallery classes', () => {
  const inset = readFileSync(
    join(root, 'src/components/PlaceCard/common/mobilePlaceHeaderInset.js'),
    'utf8',
  );
  const clearance = 'max(9.5rem,calc(6rem+env(safe-area-inset-bottom,0px)+3.5rem))';
  assert.match(inset, new RegExp(`mobilePlaceChipBarClearance =\\s*'${clearance.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  assert.match(
    inset,
    /mobilePlaceGalleryFooterScrollPadding =\s*'pb-\[max\(9\.5rem,calc\(6rem\+env\(safe-area-inset-bottom,0px\)\+3\.5rem\)\)\] landscape-phone:pb-\[env\(safe-area-inset-bottom,0px\)\]'/,
  );
  assert.match(inset, /mobilePlaceReviewsFooterScrollPadding =\s*'pb-\[max\(10rem,/);
  assert.match(inset, /scroll-pb-\[max\(10rem,/);
  assert.match(inset, new RegExp(clearance.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
