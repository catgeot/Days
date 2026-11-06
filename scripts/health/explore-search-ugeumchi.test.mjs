import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveExploreSearchAlias } from '../../src/pages/Home/lib/exploreSearchAliases.js';
import {
  firstPassHitToUiPlace,
  resolveKoreaDestinationFirstPass,
} from '../../src/pages/Home/lib/resolveKoreaDestinationFirstPass.js';
import { pickUniqueTourAttractionRowForTitle } from '../../src/pages/Home/lib/koreaTourAttractionTitleMatch.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { normalizeExploreSelectionPin } from '../../src/pages/Home/lib/explorePlaceNav.js';

const UGEUMCHI_ROW = {
  title: '공주 우금치 전적',
  name: '공주 우금치 전적',
  contentId: '128113',
  lat: 36.4533,
  lng: 127.1289,
  addr1: '충청남도 공주시 금학동',
};

test('우금치 — explore alias·First-Pass → tour-128113', async () => {
  assert.equal(resolveExploreSearchAlias('우금치')?.canonical, '공주 우금치 전적');
  assert.equal(resolveExploreSearchAlias('우금치')?.contentId, '128113');
  const hit = await resolveKoreaDestinationFirstPass('우금치', {
    lookupTourAttraction: async (q) => {
      assert.equal(q, '공주 우금치 전적');
      return pickUniqueTourAttractionRowForTitle([UGEUMCHI_ROW], q);
    },
  });
  assert.equal(hit?.contentId, '128113');
  assert.equal(hit?.source, 'tourapi');
  const pin = normalizeExploreSelectionPin(firstPassHitToUiPlace(hit, '우금치'));
  const decision = resolveSearchResultSelect(pin);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'tour-128113');
});

test('공주 우금치 — Tour title startsWith(minScore 88) 회귀', () => {
  const picked = pickUniqueTourAttractionRowForTitle([UGEUMCHI_ROW], '공주 우금치');
  assert.equal(picked?.contentId, '128113');
});
