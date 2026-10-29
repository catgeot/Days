import assert from 'node:assert/strict';
import test from 'node:test';

import { matchKoreaAdminRegionFromAddr } from '../../src/pages/Home/lib/koreaAdminRegionMatch.js';
import { resolveCityAttractionHub, resolveHubPlaceFromSlug } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  preloadRegionKeyResolve,
  resolveRegionKeyFromAddr,
} from '../../src/pages/Home/lib/siteSearchAllAssets/regionKeyResolve.js';

/** Mirrors resolvePlaceCrossLinks resolveHubIdForPlace addr branch only. */
function resolveHubIdForPlaceFromAddr(loc) {
  if (!loc || typeof loc !== 'object') return '';
  const slug = String(loc.slug || loc.canonical_slug || '').trim().toLowerCase();
  const hubFromSlug = slug ? resolveHubPlaceFromSlug(slug) : null;
  if (hubFromSlug?.hubId) return String(hubFromSlug.hubId).toLowerCase();
  const explicit = String(loc.hubId || '').trim().toLowerCase();
  if (explicit && resolveCityAttractionHub(explicit)) return explicit;
  const byName = resolveCityAttractionHub(loc.name || loc.name_ko || loc.parentCity);
  if (byName?.hubId) return String(byName.hubId).toLowerCase();
  if (loc.addr1) {
    const region = matchKoreaAdminRegionFromAddr(loc.addr1);
    if (region?.hubId) return region.hubId;
  }
  return '';
}

const METRO_GU_PARITY_CASES = [
  { addr: '부산광역시 중구', regionKey: 'busan' },
  { addr: '대구 동구', regionKey: 'daegu' },
  { addr: '인천 중구', regionKey: 'incheon' },
  { addr: '대전 서구', regionKey: 'daejeon' },
  { addr: '울산 남구', regionKey: 'ulsan' },
  { addr: '광주 북구', regionKey: 'gwangju' },
  { addr: '서울 강서구', regionKey: 'seoul' },
  { addr: '서울 종로구', regionKey: 'seoul' },
  { addr: '서울 마포구', regionKey: 'seoul' },
  { addr: '부산 해운대구', regionKey: 'busan' },
  { addr: '부산 동구', regionKey: 'busan' },
  { addr: '서울특별시 강서구', regionKey: 'seoul' },
];

test.before(async () => {
  await preloadRegionKeyResolve();
});

test('shared koreaAdminRegionMatch + crosslink hub addr path unchanged (null) for metro gu fixtures', () => {
  for (const { addr } of METRO_GU_PARITY_CASES) {
    assert.equal(
      matchKoreaAdminRegionFromAddr(addr),
      null,
      `matchKoreaAdminRegionFromAddr ${addr}`,
    );
    assert.equal(
      resolveHubIdForPlaceFromAddr({ addr1: addr, country: '대한민국' }),
      '',
      `resolveHubIdForPlace ${addr}`,
    );
  }
});

test('regionKeyResolve still resolves metro gu fixtures when shared match is null', async () => {
  for (const { addr, regionKey } of METRO_GU_PARITY_CASES) {
    assert.equal(
      await resolveRegionKeyFromAddr(addr),
      regionKey,
      `resolveRegionKeyFromAddr ${addr}`,
    );
  }
});
