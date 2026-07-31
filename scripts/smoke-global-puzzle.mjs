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
} from '../src/pages/Home/lib/globalPuzzle/capitalsSeed.js';
import { computePuzzleStars, mergeBestStars } from '../src/pages/Home/lib/globalPuzzle/rules.js';
import {
  PUZZLE_PHASE,
  applyCapitalAnswer,
  applyFindTap,
  createIdleSession,
  markHintUsed,
  restartFindSession,
  startFindSession,
} from '../src/pages/Home/lib/globalPuzzle/session.js';
import {
  defaultPuzzleProgress,
  recordPuzzleClear,
} from '../src/pages/Home/lib/globalPuzzle/progressStorage.js';
import { GLOBE_COUNTRY_CATALOG } from '../src/pages/Home/lib/globeCountryCatalog.js';

function pointInBbox(lng, lat, bbox, padRatio = 0.08) {
  if (!Array.isArray(bbox) || bbox.length < 4) return false;
  const [w0, s0, e0, n0] = bbox;
  const width = e0 >= w0 ? e0 - w0 : 360 - (w0 - e0);
  const padLng = Math.max(width * padRatio, 0.35);
  const padLat = Math.max((n0 - s0) * padRatio, 0.35);
  const w = w0 - padLng;
  const e = e0 + padLng;
  const s = s0 - padLat;
  const n = n0 + padLat;
  return lng >= w && lng <= e && lat >= s && lat <= n;
}

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
  assert.equal(s.stars, 2); // hadWrong once, no hint
});

check('hint then clear → stars 2', () => {
  let s = startFindSession('jp', buildCapitalChoices('jp', ['kr', 'cn', 'th'], 4, () => 0.2));
  s = markHintUsed(s);
  assert.equal(s.hintUsed, true);
  s = applyFindTap(s, true);
  s = applyCapitalAnswer(s, true, computePuzzleStars);
  assert.equal(s.stars, 2);
});

check('restart clears flags', () => {
  let s = startFindSession('fr', ['파리', '베를린', '로마', '마드리드']);
  s = markHintUsed(s);
  s = applyFindTap(s, false);
  s = restartFindSession(s, ['파리', '베를린', '로마', '마드리드']);
  assert.equal(s.phase, PUZZLE_PHASE.FIND);
  assert.equal(s.hintUsed, false);
  assert.equal(s.hadWrong, false);
});

check('capital choices include correct + unique', () => {
  const choices = buildCapitalChoices('kr', ['jp', 'cn', 'th', 'vn'], 4, () => 0.5);
  assert.equal(choices.length, 4);
  assert.ok(choices.includes(getPuzzleCapitalSeed('kr').capitalKo));
  assert.equal(new Set(choices).size, 4);
});

check('progress bestStars only increases', () => {
  let p = defaultPuzzleProgress();
  p = recordPuzzleClear(p, 'kr', { stars: 2, hintUsed: true });
  p = recordPuzzleClear(p, 'kr', { stars: 1, hintUsed: true });
  assert.equal(p.countries.kr.bestStars, 2);
  assert.equal(p.countries.kr.cleared, true);
});

check('bbox hit for Seoul-ish point → kr', () => {
  const kr = GLOBE_COUNTRY_CATALOG.kr;
  assert.ok(pointInBbox(126.98, 37.56, kr.bbox));
  assert.ok(isPuzzleCountryPlayable('kr'));
  assert.equal(createIdleSession().phase, PUZZLE_PHASE.IDLE);
});

if (failed > 0) {
  console.error(`\nsmoke-global-puzzle: ${failed} failed`);
  process.exit(1);
}
console.log(`\nsmoke-global-puzzle: all passed (${GLOBAL_PUZZLE_CAPITALS.length} seeds)`);
