import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchSocialTargetPhotoUrl,
  resolveSocialCardPhotoUrl,
  syncSocialTargetPhotoUrl,
  tourContentIdFromPlaceSlug,
} from '../../src/pages/Social/socialLinksTargetPhoto.js';

test('tour slug parses to content id', () => {
  assert.equal(tourContentIdFromPlaceSlug('tour-126369'), '126369');
  assert.equal(tourContentIdFromPlaceSlug('hwaseong-fortress'), '');
});

test('resolveSocialCardPhotoUrl keeps committed repo photo', () => {
  const card = {
    photoUrl: 'https://example.com/repo.jpg',
    targets: [{ type: 'place', slug: 'tour-126369' }],
  };
  assert.equal(resolveSocialCardPhotoUrl(card), 'https://example.com/repo.jpg');
});

test('sync place photo uses scenic gallery first image', () => {
  const url = syncSocialTargetPhotoUrl({ type: 'place', slug: 'seongsan-ilchulbong' });
  assert.match(url, /visitkorea\.or\.kr/);
});

test('fetchSocialTargetPhotoUrl uses injectable tour api for place targets', async () => {
  const calls = [];
  const url = await fetchSocialTargetPhotoUrl(
    { type: 'place', slug: 'tour-126369' },
    {
      fetchKoreaTourAttractionFirstImagesByIds: async (ids) => {
        calls.push(['db', ids]);
        return new Map();
      },
      fetchTourApiFirstImage: async (id) => {
        calls.push(['live', id]);
        return 'https://tong.visitkorea.or.kr/cms/resource/99/9999999_image2_1.jpg';
      },
      fetchTourApiFestivalDetail: async () => null,
      festivalItemFromDetail: () => null,
    },
  );
  assert.match(url, /9999999_image2_1/);
  assert.deepEqual(calls, [['db', ['126369']], ['live', '126369']]);
});

test('fetchSocialTargetPhotoUrl uses festival detail hero before tour first image', async () => {
  const url = await fetchSocialTargetPhotoUrl(
    { type: 'festival', id: '2048902' },
    {
      fetchKoreaTourAttractionFirstImagesByIds: async () => new Map(),
      fetchTourApiFirstImage: async () => 'https://example.com/attraction-fallback.jpg',
      fetchTourApiFestivalDetail: async ({ contentId }) => ({
        ok: true,
        contentId,
        common: { firstimage: 'https://example.com/festival-hero.jpg' },
      }),
      festivalItemFromDetail: (detail) =>
        detail?.common?.firstimage
          ? { firstimage: detail.common.firstimage, imageUrl: detail.common.firstimage }
          : null,
    },
  );
  assert.equal(url, 'https://example.com/festival-hero.jpg');
});

test('fetchSocialTargetPhotoUrl returns empty when every source fails', async () => {
  const url = await fetchSocialTargetPhotoUrl(
    { type: 'place', slug: 'tour-000001' },
    {
      fetchKoreaTourAttractionFirstImagesByIds: async () => new Map(),
      fetchTourApiFirstImage: async () => null,
      fetchTourApiFestivalDetail: async () => null,
      festivalItemFromDetail: () => null,
    },
  );
  assert.equal(url, '');
});

test('syncSocialTargetPhotoUrl returns scenic url for a known place slug', () => {
  const url = syncSocialTargetPhotoUrl({ type: 'place', slug: 'seongsan-ilchulbong' });
  assert.match(url, /visitkorea\.or\.kr/);
});