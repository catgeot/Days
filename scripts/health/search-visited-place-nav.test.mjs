import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { visitedRowToSearchSpot } from '../../src/pages/Home/lib/visitedPlaceSearch.js';
import { ensureLatinPlaceSlug } from '../../src/pages/Home/lib/uiPlaceAssetQuery.js';
import { getPlaceUrlParam } from '../../src/pages/Home/lib/formatUrlName.js';
import { alignVisitedSpotsToRegionAnchors } from '../../src/pages/Home/lib/searchHomonymRegion.js';

// place_stats 실제 행 (anon SELECT, 2026-11).
const ROWS = {
  형제섬: { place_id: '형제섬', name_ko: '형제섬', name_en: null, lat: 33.2080147675, lng: 126.3092288523 },
  용눈이오름: { place_id: '용눈이오름', name_ko: '용눈이오름', name_en: null, lat: 33.459963, lng: 126.83147286 },
  안면암: { place_id: '안면암', name_ko: '안면암', name_en: null, lat: 36.5595288, lng: 126.3744362 },
};

test('visited place_stats rows open /place/<place_id>', () => {
  for (const [name, row] of Object.entries(ROWS)) {
    const decision = resolveSearchResultSelect(visitedRowToSearchSpot(row));
    assert.equal(decision?.type, 'place', name);
    assert.equal(decision?.param, name, name);
  }
});

test('tap-time latin slug (Seogwipo overlay) still opens the place_id page', () => {
  const overlaid = { ...visitedRowToSearchSpot(ROWS.형제섬), name_en: 'Seogwipo' };
  const tapped = ensureLatinPlaceSlug(overlaid);
  assert.equal(tapped.slug, 'seogwipo', 'fixture reproduces the browser slug rewrite');
  const decision = resolveSearchResultSelect(tapped);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, '형제섬');
  assert.equal(getPlaceUrlParam(decision.spot), '형제섬', 'navigateToPlace builds /place/형제섬');
});

test('visited rows that /place cannot restore stay on the home summary', () => {
  const latin = visitedRowToSearchSpot({
    place_id: 'jeongdang-ri',
    name_ko: '안면암',
    name_en: 'Jeongdang-ri',
    lat: 36.5595288,
    lng: 126.3744362,
  });
  assert.equal(resolveSearchResultSelect(latin)?.type, 'home', 'latin non-SSOT place_id');
});

test('mapbox rows with Hangul names still open the home summary', () => {
  const mapbox = resolveSearchResultSelect({
    id: 'mapbox-abc',
    name: '형제섬',
    slug: '형제섬',
    lat: 33.208,
    lng: 126.309,
    source: 'mapbox',
    uiPlace: true,
  });
  assert.equal(mapbox?.type, 'home');
});

test('row moved off its place_stats coords (추자도 → 포항 행) stays on the home summary', () => {
  const pohang = visitedRowToSearchSpot({
    place_id: '추자도',
    name_ko: '추자도',
    name_en: null,
    lat: 36.01184993,
    lng: 129.36822414,
  });
  const [aligned] = alignVisitedSpotsToRegionAnchors(
    [pohang],
    [{ name: '추자도', lat: 33.9518128033, lng: 126.3076233112, source: 'tourapi' }],
  );
  assert.ok(aligned.regionAlignedFrom, 'fixture is region-aligned');
  assert.equal(resolveSearchResultSelect(aligned)?.type, 'home', '/place reload would use Pohang coords');
});

test('/place/<한글> route restores place_stats rows by place_id', () => {
  const src = fs.readFileSync(new URL('../../src/pages/Home/index.jsx', import.meta.url), 'utf8');
  assert.match(src, /isHangulPlaceStatsSlug\(targetSlug\)/);
  assert.match(src, /fetchUiPlacePinFromPlaceStatsSlug\(targetSlug\)/);
});
