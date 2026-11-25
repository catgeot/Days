import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  exploreRemoteSuggestionMatchesQuery,
  dropUnrelatedMapboxSuggestions,
} from '../../src/pages/Home/lib/exploreRemoteHitMatch.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('mapbox autocomplete junk does not match a nonsense query', () => {
  const q = 'zzqxnone999xyz';
  const junk = [
    { id: 'mapbox-y', source: 'mapbox', name: 'Y', name_en: 'Y' },
    { id: 'mapbox-sax', source: 'mapbox', name: 'Saxonne', name_en: 'Saxonne' },
  ];
  assert.equal(exploreRemoteSuggestionMatchesQuery(q, junk[0]), false);
  assert.equal(exploreRemoteSuggestionMatchesQuery(q, junk[1]), false);
  assert.deepEqual(dropUnrelatedMapboxSuggestions(q, junk), []);
});

test('a real prefix still matches a remote place', () => {
  assert.equal(
    exploreRemoteSuggestionMatchesQuery('seo', { source: 'mapbox', name: 'Seoul', name_ko: '서울' }),
    true,
  );
  assert.equal(
    exploreRemoteSuggestionMatchesQuery('서울', { source: 'mapbox', name: '서울특별시' }),
    true,
  );
  assert.equal(
    exploreRemoteSuggestionMatchesQuery('프라하', { source: 'mapbox', name: '프라하', name_en: 'Prague' }),
    true,
  );
});

test('curated rows stay when unrelated mapbox hits are dropped', () => {
  const kept = dropUnrelatedMapboxSuggestions('서울', [
    { id: 'hub-seoul', source: 'hub', name: '서울' },
    { id: 'mapbox-y', source: 'mapbox', name: 'Y' },
  ]);
  assert.deepEqual(kept.map((item) => item.id), ['hub-seoul']);
});

test('hybrid search drops mapbox hits that share no token with the query', () => {
  const src = readFileSync(join(root, 'src/pages/Home/lib/searchSuggestions.js'), 'utf8');
  assert.match(src, /dropUnrelatedMapboxSuggestions\(q, remote/);
  const parity = readFileSync(join(root, 'src/pages/Home/lib/exploreSearchSubmitParity.js'), 'utf8');
  assert.match(parity, /dropUnrelatedMapboxSuggestions/);
});
