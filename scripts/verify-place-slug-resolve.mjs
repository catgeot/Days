/**
 * slug-first resolver smoke test (앙코르·교토 변형)
 *
 *   node scripts/verify-place-slug-resolve.mjs
 */
import assert from 'assert';
import { buildStaticAliasToSlugMap, resolveCanonicalSlug } from './lib/resolve-canonical-slug.mjs';
import { getPlaceStatsId, buildPlaceDbIdCandidates, getPlaceStableKey } from '../src/utils/travelSpotResolve.js';

const aliasMap = buildStaticAliasToSlugMap();

const cases = [
  ['앙코르 와트', 'angkor-wat'],
  ['시엠립', 'angkor-wat'],
  ['Siem Reap', 'angkor-wat'],
  ['Angkor Wat', 'angkor-wat'],
  ['교토', 'kyoto'],
  ['Kyoto', 'kyoto'],
  ['쿄토', 'kyoto'],
  ['angkor-wat', 'angkor-wat'],
];

let failed = 0;
for (const [input, expected] of cases) {
  const { slug } = resolveCanonicalSlug(input, { aliasMap });
  if (slug !== expected) {
    console.error(`FAIL resolveCanonicalSlug("${input}") → ${slug} (expected ${expected})`);
    failed += 1;
  } else {
    console.log(`OK  "${input}" → ${slug}`);
  }
}

const loc = {
  name: '시엠립',
  slug: 'angkor-wat',
  canonical_slug: 'angkor-wat',
};
assert.strictEqual(getPlaceStableKey(loc), 'angkor-wat');
assert.strictEqual(getPlaceStatsId(loc), 'angkor-wat');
const candidates = buildPlaceDbIdCandidates(loc);
assert.ok(candidates.includes('angkor-wat'));
assert.ok(candidates.includes('시엠립'));
console.log('OK  getPlaceStatsId / buildPlaceDbIdCandidates (angkor)');

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nAll slug resolve checks passed.');
