#!/usr/bin/env node
/**
 * 숨김 GATEO 선정 명소 — 목록·검색·인근·게이트웨이·허브 노출 제외.
 *
 *   npm run smoke:korea-scenic-hidden
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  filterVisibleKoreaScenicSpots,
  getKoreaScenicSpotRecordById,
  isHiddenHubScenicAttraction,
  isHiddenKoreaScenicPlaceSlug,
  isHiddenKoreaScenicSpotId,
  isScenicSpotHidden,
  listKoreaScenicSpots,
} from '../src/pages/Home/lib/koreaScenicSpots.js';
import { filterScenicSpotsByQuery } from '../src/pages/Home/lib/scenicSearch.js';
import { resolveScenicSpotForPlace } from '../src/pages/Home/lib/placeScenicGateway.js';
import {
  listKoreaThemeRegionAttractions,
  listKoreaThemeAreas,
} from '../src/pages/Home/lib/koreaThemeRegions.js';
import {
  rankNearbyScenicSpots,
  scenicSpotLngLat,
} from '../src/pages/KoreaTheme/nearbyScenicRank.js';
import { listKoreaHeritageScenic } from '../src/pages/Home/lib/koreaHeritageScenic.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HIDDEN_ID = 'gunwi-whistle-forest';
const SCENIC_PAGE = join(__dirname, '../src/pages/KoreaTheme/ScenicPage.jsx');
const scenicPageSrc = readFileSync(SCENIC_PAGE, 'utf8');

const raw = getKoreaScenicSpotRecordById(HIDDEN_ID);
assert.ok(raw, 'gunwi-whistle-forest remains in SSOT JSON');
assert.equal(raw.hidden, true);
assert.equal(raw.hiddenReason, 'unverified');
assert.equal(raw.contentId, null);
assert.ok(isHiddenKoreaScenicSpotId(HIDDEN_ID));
assert.ok(isHiddenKoreaScenicPlaceSlug('gunwi-whistle-forest'));
assert.ok(isHiddenHubScenicAttraction('gunwi', '군위 휘파람숲'));

const visible = listKoreaScenicSpots();
assert.ok(!visible.some((s) => s.id === HIDDEN_ID), 'hidden spot excluded from listKoreaScenicSpots');

const curated = filterScenicSpotsByQuery(visible, '휘파람');
assert.ok(!curated.some((s) => s.id === HIDDEN_ID), 'search excludes hidden');

const nearGunwi = rankNearbyScenicSpots(
  [...visible, ...listKoreaHeritageScenic()],
  36.2255,
  128.5855,
);
assert.ok(
  !nearGunwi.some((s) => String(s.id) === HIDDEN_ID),
  'nearby rank excludes hidden',
);

const gateway = resolveScenicSpotForPlace({
  name: '군위 휘파람숲',
  slug: 'gunwi-whistle-forest',
  hubId: 'gunwi',
  country: '대한민국',
});
assert.equal(gateway, null, 'placeScenicGateway skips hidden');

const areas = listKoreaThemeAreas();
const gyeongbuk = areas.find((a) => a.code === '35' || String(a.name || '').includes('경북'));
if (gyeongbuk) {
  const regionAttrs = listKoreaThemeRegionAttractions(gyeongbuk.code);
  assert.ok(
    !regionAttrs.some((a) => a.placeSlug === 'gunwi-whistle-forest'),
    'theme region attractions skip hidden hub scenic',
  );
}

assert.ok(
  scenicPageSrc.includes("navigate('/korea/theme/scenic'"),
  'ScenicPage redirects invalid/hidden spot to scenic home',
);
assert.ok(scenicPageSrc.includes('isScenicSpotHidden'), 'ScenicPage uses hidden helper');

const allSpots = JSON.parse(
  readFileSync(join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json'), 'utf8'),
).spots;
const hiddenCount = allSpots.filter((s) => isScenicSpotHidden(s)).length;
assert.equal(filterVisibleKoreaScenicSpots(allSpots).length, visible.length);
assert.ok(hiddenCount >= 1, 'at least one hidden scenic row retained in JSON');

for (const s of visible) {
  assert.ok(scenicSpotLngLat(s), `visible spot has coords: ${s.id}`);
}

console.log('smoke:korea-scenic-hidden PASS');
