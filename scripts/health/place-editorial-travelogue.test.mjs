import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dedupeTraveloguesAgainstVisitStories,
  editorialLocationIlikePatterns,
  editorialRowMatchesLocationFallback,
  filterEditorialLocationFallback,
  locationTextMatchesPlaceName,
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

test('location ILIKE patterns are anchored, not a contains match', () => {
  const patterns = editorialLocationIlikePatterns('제주');
  assert.ok(patterns.includes('제주'));
  assert.ok(patterns.includes('제주도'));
  assert.equal(patterns.some((pattern) => pattern === '*제주*' || pattern === '*%제주%*'), false);
  assert.equal(patterns.some((pattern) => pattern.startsWith('*') && pattern.endsWith('*') && !pattern.includes(',')), false);
});

test('location text matches a place token, not a mention inside another article', () => {
  assert.equal(locationTextMatchesPlaceName('제주', '제주'), true);
  assert.equal(locationTextMatchesPlaceName('제주도', '제주'), true);
  assert.equal(locationTextMatchesPlaceName('제주시', '제주'), true);
  assert.equal(locationTextMatchesPlaceName('제주, 한국', '제주'), true);
  assert.equal(locationTextMatchesPlaceName('Jeju Island', 'Jeju'), true);
  assert.equal(locationTextMatchesPlaceName('신제주', '제주'), false);
  assert.equal(locationTextMatchesPlaceName('제주항공', '제주'), false);
  assert.equal(locationTextMatchesPlaceName('부산에서 제주를 그리워하다', '제주'), false);
  assert.equal(locationTextMatchesPlaceName('오사카, 제주 항공 환승', '제주'), false);
});

test('location-name fallback drops a non-Jeju article that contains 제주', () => {
  const jeju = publishedEditorial({
    id: 67,
    slug: 'jeju-travelogue',
    place_slug: 'jeju',
    location: '제주',
    title: '장날 아침, 사라봉 저녁',
  });
  const osakaMention = publishedEditorial({
    id: 80,
    slug: 'osaka-via-jeju',
    place_slug: 'osaka',
    location: '오사카, 제주 항공 환승',
    title: '오사카 기행',
  });
  const untaggedMention = publishedEditorial({
    id: 81,
    slug: 'busan-mentions-jeju',
    place_slug: '',
    location: '부산에서 제주를 그리워하다',
    title: '부산 기행',
  });
  assert.equal(
    editorialRowMatchesLocationFallback(osakaMention, { placeSlug: 'jeju', names: ['제주', 'Jeju'] }),
    false,
  );
  const filtered = filterEditorialLocationFallback([osakaMention, untaggedMention, jeju], {
    placeSlug: 'jeju',
    names: ['제주', 'Jeju'],
  });
  assert.deepEqual(filtered.map((row) => row.slug), ['jeju-travelogue']);
});

test('flag off: usePlaceEditorialTravelogues does not call useVisitStories', async () => {
  globalThis.__VITE_ENV__ = { ...(globalThis.__VITE_ENV__ || {}), VITE_GATEO_PLACE_TRAVELOGUE_CARD: '' };
  const { usePlaceEditorialTravelogues } = await import(
    '../../src/components/PlaceCard/hooks/usePlaceEditorialTravelogues.js'
  );
  const result = usePlaceEditorialTravelogues({ id: 'cairo', slug: 'cairo', name: '카이로' });
  assert.deepEqual(result, { enabled: false, items: [], isLoading: false });
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
