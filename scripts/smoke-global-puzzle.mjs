/**
 * 범지구적 퍼즐 — 별 규칙·시드·세션 스모크
 * npm run smoke:global-puzzle
 */
import assert from 'node:assert/strict';
import {
  GLOBAL_PUZZLE_CAPITALS,
  buildCapitalChoices,
  getPuzzleCapitalSeed,
  isPuzzleCountryPlayable,
} from '../src/pages/PlayGeo/lib/globalPuzzle/capitalsSeed.js';
import { computePuzzleStars, mergeBestStars } from '../src/pages/PlayGeo/lib/globalPuzzle/rules.js';
import {
  PUZZLE_PHASE,
  applyCapitalAnswer,
  applyFindTap,
  createIdleSession,
  markHintUsed,
  restartFindSession,
  startFindSession,
} from '../src/pages/PlayGeo/lib/globalPuzzle/session.js';
import {
  defaultPuzzleProgress,
  recordPuzzleClear,
} from '../src/pages/PlayGeo/lib/globalPuzzle/progressStorage.js';
import {
  getCampaignContinents,
  listContinentCountryIds,
} from '../src/pages/PlayGeo/data/geoPuzzleTree.js';
import { GLOBE_COUNTRY_CATALOG } from '../src/pages/Home/lib/globeCountryCatalog.js';
import {
  isCorrectFindTap,
  pointInBbox,
  resolveGlobeFilledIds,
} from '../src/pages/PlayGeo/lib/findCountryTap.js';

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(`  ${err.message}`);
  }
}

check('seed size in MVP band', () => {
  assert.ok(GLOBAL_PUZZLE_CAPITALS.length >= 20);
  assert.ok(GLOBAL_PUZZLE_CAPITALS.length <= 50);
});

check('every seed id exists in catalog', () => {
  for (const row of GLOBAL_PUZZLE_CAPITALS) {
    assert.ok(GLOBE_COUNTRY_CATALOG[row.id], `missing catalog ${row.id}`);
    assert.ok(row.capitalKo);
  }
});

check('campaign continents have playable seeds', () => {
  for (const continent of getCampaignContinents()) {
    const ids = listContinentCountryIds(continent).filter((id) => isPuzzleCountryPlayable(id));
    assert.ok(ids.length >= 3, `${continent.id} playable ${ids.length}`);
  }
});

check('stars: perfect / hint / wrong / both floor at 1', () => {
  assert.equal(computePuzzleStars({}), 3);
  assert.equal(computePuzzleStars({ hintUsed: true }), 2);
  assert.equal(computePuzzleStars({ hadWrong: true }), 2);
  assert.equal(computePuzzleStars({ hintUsed: true, hadWrong: true }), 1);
});

check('mergeBestStars keeps higher', () => {
  assert.equal(mergeBestStars(2, 3), 3);
  assert.equal(mergeBestStars(3, 1), 3);
});

check('session find → capital → result', () => {
  let s = startFindSession('kr', ['서울', '도쿄', '베이징', '방콕']);
  assert.equal(s.phase, PUZZLE_PHASE.FIND);
  s = applyFindTap(s, false);
  assert.equal(s.hadWrong, true);
  assert.equal(s.phase, PUZZLE_PHASE.FIND);
  s = applyFindTap(s, true);
  assert.equal(s.phase, PUZZLE_PHASE.CAPITAL);
  s = applyCapitalAnswer(s, false, computePuzzleStars);
  assert.equal(s.phase, PUZZLE_PHASE.CAPITAL);
  s = applyCapitalAnswer(s, true, computePuzzleStars);
  assert.equal(s.phase, PUZZLE_PHASE.RESULT);
  assert.equal(s.stars, 2);
});

check('hint then clear → stars 2', () => {
  let s = startFindSession('jp', buildCapitalChoices('jp', ['kr', 'cn'], 4, () => 0.1));
  s = markHintUsed(s);
  assert.equal(s.hintUsed, true);
  s = applyFindTap(s, true);
  s = applyCapitalAnswer(s, true, computePuzzleStars);
  assert.equal(s.stars, 2);
});

check('restart resets find flags', () => {
  let s = startFindSession('br', ['브라질리아', '리마', '산티아고', '보고타']);
  s = applyFindTap(s, false);
  s = markHintUsed(s);
  s = restartFindSession(s, ['브라질리아', '리마', '산티아고', '보고타']);
  assert.equal(s.phase, PUZZLE_PHASE.FIND);
  assert.equal(s.hintUsed, false);
  assert.equal(s.hadWrong, false);
});

check('recordPuzzleClear keeps best', () => {
  let p = defaultPuzzleProgress();
  p = recordPuzzleClear(p, 'kr', { stars: 2, hintUsed: true });
  p = recordPuzzleClear(p, 'kr', { stars: 1, hintUsed: true });
  assert.equal(p.countries.kr.bestStars, 2);
  assert.equal(p.countries.kr.cleared, true);
});

check('buildCapitalChoices includes correct capital', () => {
  const seed = getPuzzleCapitalSeed('kr');
  const choices = buildCapitalChoices('kr', ['jp', 'cn', 'tw'], 4, () => 0.2);
  assert.equal(choices.length, 4);
  assert.ok(choices.includes(seed.capitalKo));
});

check('idle session factory', () => {
  const s = createIdleSession();
  assert.equal(s.phase, PUZZLE_PHASE.IDLE);
  assert.equal(s.countryId, null);
});

check('find tap: ISO / bbox hit for Korea', () => {
  const kr = GLOBE_COUNTRY_CATALOG.kr;
  assert.ok(kr?.bbox);
  assert.equal(
    isCorrectFindTap({
      iso: 'KR',
      targetId: 'kr',
      candidateIds: ['kr', 'jp', 'cn'],
    }),
    true,
  );
  assert.equal(
    isCorrectFindTap({
      lngLat: { lng: kr.lng, lat: kr.lat },
      targetId: 'kr',
      candidateIds: ['kr', 'jp', 'cn'],
    }),
    true,
  );
  assert.equal(
    isCorrectFindTap({
      iso: 'JP',
      lngLat: { lng: 139.7, lat: 35.7 },
      targetId: 'kr',
      candidateIds: ['kr', 'jp', 'cn'],
    }),
    false,
  );
  assert.ok(pointInBbox(kr.lng, kr.lat, kr.bbox));
});

check('globe fill includes country right after find (before capital clear)', () => {
  const cleared = ['jp'];
  assert.deepEqual(
    resolveGlobeFilledIds(cleared, { phase: PUZZLE_PHASE.FIND, countryId: 'kr' }).sort(),
    ['jp'],
  );
  assert.deepEqual(
    resolveGlobeFilledIds(cleared, { phase: PUZZLE_PHASE.CAPITAL, countryId: 'kr' }).sort(),
    ['jp', 'kr'],
  );
  assert.deepEqual(
    resolveGlobeFilledIds(['jp', 'kr'], { phase: PUZZLE_PHASE.RESULT, countryId: 'kr' }).sort(),
    ['jp', 'kr'],
  );
});

check('placed fill color constant is wired (not dead)', async () => {
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(new URL('../src/pages/PlayGeo/GeoPuzzleGlobe.jsx', import.meta.url), 'utf8');
  assert.match(src, /const PLACED_FILL_COLOR = '#5b21b6'/);
  assert.match(src, /'fill-color': PLACED_FILL_COLOR/);
  assert.match(src, /safeSetPaint\(map, PLACED_FILL, 'fill-color', PLACED_FILL_COLOR\)/);
  assert.match(src, /const PUZZLE_PROJECTION = 'mercator'/);
  assert.match(src, /PLACED_GEOJSON_SOURCE/);
  assert.match(src, /PLACED_OUTLINE_SOURCE/);
  assert.match(src, /dissolvePlacedOutline/);
  assert.doesNotMatch(src, /fill-color': '#22d3ee'/);
});

check('dissolve outline merges adjacent pieces (no per-country stroke)', async () => {
  const { dissolvePlacedOutline } = await import('../src/pages/PlayGeo/lib/dissolvePlacedOutline.js');
  const a = {
    type: 'Feature',
    properties: { id: 'a' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
    },
  };
  const b = {
    type: 'Feature',
    properties: { id: 'b' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[2, 0], [4, 0], [4, 2], [2, 2], [2, 0]]],
    },
  };
  const out = dissolvePlacedOutline([a, b]);
  assert.ok(out?.geometry);
  assert.ok(out.geometry.type === 'Polygon' || out.geometry.type === 'MultiPolygon');
  assert.equal(out.properties?.role, 'placed-outline');
});

check('deploy log has latest entry for on-screen QA', async () => {
  const { GEO_PUZZLE_DEPLOY_LOG, getLatestDeployEntry } = await import(
    '../src/pages/PlayGeo/data/geoPuzzleDeployLog.js'
  );
  assert.ok(GEO_PUZZLE_DEPLOY_LOG.length >= 1);
  const latest = getLatestDeployEntry();
  assert.ok(latest?.at);
  assert.ok(latest?.summary);
});

if (failed) {
  console.error(`\nsmoke:global-puzzle FAIL (${failed})`);
  process.exit(1);
}
console.log('\nsmoke:global-puzzle PASS');
