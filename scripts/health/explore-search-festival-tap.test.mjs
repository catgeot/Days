import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const {
  exploreFestivalSuggestionMatchesQuery,
  festivalItemToExploreSuggestion,
} = await import('../../src/pages/Home/lib/exploreFestivalSearchSuggestions.js');
const {
  pickEnterFestivalMatches,
  preferEnterFestivalSuggestion,
} = await import('../../src/pages/Home/lib/searchEnterMatch.js');

test('SearchSuggestionList uses pointerdown for touch-safe select', () => {
  const src = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx'),
    'utf8',
  );
  assert.match(src, /onPointerDown=\{.*activateSearchSuggestion/);
  assert.match(src, /function activateSearchSuggestion/);
  assert.match(src, /exploreSuggestionNavigateHref/);
  assert.match(src, /activateHrefSearchSuggestion/);
  assert.match(src, /window\.location\.assign\(href\)/);
});

test('exploreFestivalSuggestionMatchesQuery — 빛초롱 → 서울빛초롱축제', () => {
  const row = {
    contentId: '1095732',
    title: '서울빛초롱축제',
    eventStartDate: '20261211',
    eventEndDate: '20270131',
    addr1: '서울특별시 중구',
  };
  const suggestion = festivalItemToExploreSuggestion(row, 'ko');
  assert.equal(exploreFestivalSuggestionMatchesQuery('빛초롱', suggestion, 'ko'), true);
});

test('preferEnterFestivalSuggestion — single strong match', () => {
  const row = {
    contentId: '1095732',
    title: '서울빛초롱축제',
    eventStartDate: '20261211',
    eventEndDate: '20270131',
    addr1: '서울특별시 중구',
  };
  const suggestion = festivalItemToExploreSuggestion(row, 'ko');
  const hits = pickEnterFestivalMatches('빛초롱', [suggestion]);
  assert.equal(hits.length, 1);
  assert.equal(preferEnterFestivalSuggestion('빛초롱', [suggestion])?.festivalContentId, '1095732');
});