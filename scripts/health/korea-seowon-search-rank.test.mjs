import assert from 'node:assert/strict';
import test from 'node:test';
import { collectKoreaPoiTypeSearchCandidates } from '../../src/pages/Home/lib/koreaPoiTypeSearch.js';

test('collectKoreaPoiTypeSearchCandidates — «서원» ranks real academies above 서원구', async () => {
  const rows = await collectKoreaPoiTypeSearchCandidates('서원', {
    lookupTourAttractions: async () => [
      {
        contentId: '9001',
        name: '대구광역시 서원구 보건소',
        addr1: '대구광역시 서원구',
        lat: 35.87,
        lng: 128.6,
      },
      {
        contentId: '9002',
        name: '옥산서원',
        addr1: '경상북도 영주시 풍기읍',
        lat: 36.72,
        lng: 128.72,
      },
      {
        contentId: '9003',
        name: '도동서원',
        addr1: '대구광역시 동구 도동',
        lat: 35.89,
        lng: 128.64,
      },
    ],
  });
  const top = rows.slice(0, 2).map((r) => String(r.name || ''));
  assert.equal(top[0], '옥산서원');
  assert.equal(top[1], '도동서원');
  assert.ok(!top.some((n) => n.includes('서원구')));
});