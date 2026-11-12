import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import travelSpotsList from '../../src/pages/Home/data/travelSpots-list.json' with { type: 'json' };
import { getPlaceStayLodgingGuidance } from '../../src/data/placeStayLodgingGuidance.js';
import { resolveMrtStayQuery } from '../../src/utils/mrtStayQuery.js';

test('khao-lak — travelSpots-list registry and MRT keyword', () => {
  const row = travelSpotsList.find((s) => s.slug === 'khao-lak');
  assert.ok(row, 'khao-lak in travelSpots-list.json');
  assert.equal(row.id, 396);
  assert.equal(row.name, '카오락');
  assert.ok(row.searchKeys.includes('카오락'));
  assert.ok(row.searchKeys.includes('카오 락'));
  assert.ok(!row.searchKeys.includes('phang-nga'));

  const q = resolveMrtStayQuery({
    slug: 'khao-lak',
    name: '카오락',
    name_en: 'Khao Lak',
    country: '태국',
  });
  assert.equal(q.keyword, '카오락');
  assert.ok(q.altKeywords.includes('Khao Lak'));
});

test('similan-islands — no Khao Lak stay keyword; lodging guidance to khao-lak', () => {
  const q = resolveMrtStayQuery({
    slug: 'similan-islands',
    name: '시미란 제도',
    name_en: 'Similan Islands',
    country: '태국',
  });
  assert.notEqual(q.keyword, '카오락');
  assert.ok(!q.altKeywords.includes('Khao Lak'));
  assert.ok(!q.altKeywords.includes('카오락'));

  const guidance = getPlaceStayLodgingGuidance('similan-islands');
  assert.ok(guidance);
  assert.equal(guidance.linkSlug, 'khao-lak');
});

test('travelSpots.js exports khao-lak with globe visibility', () => {
  const raw = readFileSync(new URL('../../src/pages/Home/data/travelSpots.js', import.meta.url), 'utf8');
  assert.match(raw, /"slug": "khao-lak"/);
  assert.match(raw, /"showOnGlobe": true/);
  assert.match(raw, /"lat": 8\.6475/);
});
