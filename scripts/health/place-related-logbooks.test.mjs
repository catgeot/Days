import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterPlaceRelatedLogbookRows,
  relatedRowMatchesPlace,
} from '../../src/utils/placeRelatedLogbooks.js';

const row = (overrides) => ({
  id: 1,
  title: 't',
  location: '아이투타키',
  place_slug: 'aitutaki',
  is_editorial: true,
  status: 'published',
  ...overrides,
});

test('relatedRowMatchesPlace accepts primary place_slug', () => {
  assert.equal(relatedRowMatchesPlace(row(), '아이투타키', 'aitutaki'), true);
});

test('relatedRowMatchesPlace includes multi-destination editorial when location names the place', () => {
  const multi = row({
    id: 96,
    title: '라로통가를 거점으로, 두 섬의 느린 시간',
    slug: 'rarotonga-aitutaki-travelogue',
    place_slug: 'rarotonga',
    location: '라로통가·아이투타키',
  });
  assert.equal(relatedRowMatchesPlace(multi, '아이투타키', 'aitutaki'), true);
  assert.equal(relatedRowMatchesPlace(multi, '라로통가', 'rarotonga'), true);
});

test('relatedRowMatchesPlace rejects transfer mention without place token', () => {
  const transfer = row({
    id: 80,
    place_slug: 'osaka',
    location: '오사카, 제주 항공 환승',
  });
  assert.equal(relatedRowMatchesPlace(transfer, '제주', 'jeju'), false);
});

test('relatedRowMatchesPlace rejects unrelated primary slug', () => {
  const bangkok = row({ place_slug: 'bangkok', location: '방콕' });
  assert.equal(relatedRowMatchesPlace(bangkok, '서울', 'seoul'), false);
});

test('filterPlaceRelatedLogbookRows mirrors review-tab editorial set for Aitutaki shape', () => {
  const rows = [
    row({ id: 94, slug: 'aitutaki-travelogue', place_slug: 'aitutaki', location: '아이투타키' }),
    row({
      id: 96,
      slug: 'rarotonga-aitutaki-travelogue',
      place_slug: 'rarotonga',
      location: '라로통가·아이투타키',
    }),
    row({ id: 52, is_editorial: false, place_slug: null, location: '쿡 제도' }),
  ];
  const out = filterPlaceRelatedLogbookRows(rows, '아이투타키', 'aitutaki');
  assert.deepEqual(
    out.map((r) => r.id),
    [94, 96],
  );
});