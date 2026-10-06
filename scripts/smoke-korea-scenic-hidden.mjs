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
import {
  matchCityAttractionHubsPrefix,
  resolveHubAttraction,
} from '../src/pages/Home/lib/cityAttractionHubs.js';
import { resolveKoreaDestinationFirstPassSync } from '../src/pages/Home/lib/resolveKoreaDestinationFirstPass.js';
import { createServer } from 'vite';

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

const HIDDEN_SEARCH_NAMES = ['휘파람숲', '군위 휘파람숲'];
function suggestionNamesWhistle(items) {
  return (items || []).some((item) => {
    const name = String(item?.name || item?.name_ko || '').trim();
    const slug = String(item?.slug || item?.placeSlug || '').toLowerCase();
    return (
      name.includes('휘파람숲') ||
      slug === 'gunwi-whistle-forest' ||
      slug === 'gunwiwhistleforest'
    );
  });
}

for (const q of HIDDEN_SEARCH_NAMES) {
  assert.equal(resolveHubAttraction(q), null, `resolveHubAttraction hides: ${q}`);
  const { attractions } = matchCityAttractionHubsPrefix(q, { limit: 24 });
  assert.ok(
    !attractions.some(({ attraction }) =>
      String(attraction?.name || '').includes('휘파람숲'),
    ),
    `matchCityAttractionHubsPrefix hides: ${q}`,
  );
  const koreaHit = resolveKoreaDestinationFirstPassSync(q);
  assert.ok(
    !koreaHit || !String(koreaHit.name || '').includes('휘파람숲'),
    `resolveKoreaDestinationFirstPassSync hides: ${q}`,
  );
}

const viteRoot = join(__dirname, '..');
const viteServer = await createServer({
  configFile: join(viteRoot, 'vite.config.js'),
  logLevel: 'error',
});
const { buildLocalSearchSuggestions } = await viteServer.ssrLoadModule(
  '/src/pages/Home/lib/searchSuggestions.js',
);
for (const q of HIDDEN_SEARCH_NAMES) {
  const local = buildLocalSearchSuggestions(q);
  assert.ok(
    !suggestionNamesWhistle(local),
    `buildLocalSearchSuggestions hides: ${q}`,
  );
}
await viteServer.close();

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
  scenicPageSrc.includes('replaceScenicHomeWithoutSpot'),
  'ScenicPage strips spot param on hidden/invalid deep-link',
);
assert.ok(
  scenicPageSrc.includes("next.delete('spot')"),
  'ScenicPage removes spot query on redirect',
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
