import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { tourRowTitleMatchesCompactQuery } from '../../src/pages/Home/lib/koreaTourAttractionTitleMatch.js';
import { collectKoreaTourTitleSearchCandidates } from '../../src/pages/Home/lib/exploreKoreaTourTitleCandidates.js';

test('LIVE searchKeyword fixture — 고산사(홍성)만 title exact, 코스 25 제외', async () => {
  const raw = await readFile(
    new URL('./fixtures/explore-gosansa-live-searchkeyword.json', import.meta.url),
    'utf8',
  );
  const fixture = JSON.parse(raw);
  const type12 = (fixture.items || []).filter(
    (item) => String(item.contentTypeId || '12').trim() === '12',
  );
  const mapped = type12.map((item) => ({
    title: item.title,
    name: item.title,
    contentId: item.contentId,
    lat: Number(item.mapy),
    lng: Number(item.mapx),
    addr1: item.addr1,
  }));

  const parenRows = mapped.filter((row) =>
    tourRowTitleMatchesCompactQuery(row, fixture.keyword),
  );
  assert.deepEqual(
    parenRows.map((r) => r.contentId),
    ['125901'],
  );

  const enterRows = await collectKoreaTourTitleSearchCandidates(fixture.keyword, {
    lookupRows: async () => mapped,
  });
  assert.equal(enterRows.length, 1);
  assert.equal(enterRows[0]?.contentId, '125901');
  assert.equal(enterRows[0]?.slug, 'tour-125901');
});
