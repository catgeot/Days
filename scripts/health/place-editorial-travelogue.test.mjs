import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dedupeTraveloguesAgainstVisitStories,
  mergePlaceEditorialTravelogues,
  placeSlugFromLocation,
  selectPlaceEditorialTravelogueCards,
  travelogueRowKey,
} from '../../src/utils/placeEditorialTravelogue.js';

const publishedEditorial = (overrides = {}) => ({
  id: 1,
  title: '방콕 기행',
  slug: 'bangkok-travelogue',
  is_editorial: true,
  status: 'published',
  place_slug: 'bangkok',
  ...overrides,
});

const draftEditorial = {
  id: 2,
  title: 'draft',
  is_editorial: true,
  status: 'draft',
  slug: 'draft-slug',
};

test('placeSlugFromLocation prefers slug', () => {
  assert.equal(placeSlugFromLocation({ id: 'search-abc', slug: 'bangkok' }), 'search-abc');
  assert.equal(placeSlugFromLocation({ id: '42', slug: 'jeju' }), 'jeju');
  assert.equal(placeSlugFromLocation({ slug: 'rio-de-janeiro' }), 'rio-de-janeiro');
});

test('mergePlaceEditorialTravelogues prefers slug rows and caps at 2', () => {
  const slugRows = [
    publishedEditorial({ id: 10, slug: 'a' }),
    publishedEditorial({ id: 11, slug: 'b' }),
  ];
  const locationRows = [
    publishedEditorial({ id: 12, slug: 'c' }),
    draftEditorial,
    { id: 99, title: 'user', is_editorial: false, status: 'published' },
  ];
  const merged = mergePlaceEditorialTravelogues(slugRows, locationRows);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged.map((r) => r.id), [10, 11]);
});

test('merge dedupes same slug across slug and location lists', () => {
  const row = publishedEditorial({ id: 63, slug: 'rio-de-janeiro-travelogue' });
  const merged = mergePlaceEditorialTravelogues([row], [row]);
  assert.equal(merged.length, 1);
  assert.equal(travelogueRowKey(row), 'slug:rio-de-janeiro-travelogue');
});

test('dedupeTraveloguesAgainstVisitStories removes cairo visit story overlap', () => {
  const row = publishedEditorial({
    id: 66,
    slug: 'cairo-travelogue',
    title: '카이로 GATEO 기행문',
  });
  const visitStories = [
    {
      id: 66,
      kind: 'logbook',
      title: '카이로 GATEO 기행문',
      href: '/blog/e/cairo-travelogue',
    },
  ];
  const out = dedupeTraveloguesAgainstVisitStories([row], visitStories);
  assert.equal(out.length, 0);
});

test('selectPlaceEditorialTravelogueCards applies dedupe then max', () => {
  const items = [
    publishedEditorial({ id: 1, slug: 'one' }),
    publishedEditorial({ id: 2, slug: 'two' }),
    publishedEditorial({ id: 3, slug: 'three' }),
  ];
  const selected = selectPlaceEditorialTravelogueCards(items, [], 2);
  assert.equal(selected.length, 2);
  assert.equal(selected[0].slug, 'one');
  assert.equal(selected[1].slug, 'two');
});
