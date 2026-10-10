import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveCityAttractionHub } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  inferPlaceMatchCategory,
  inferPlaceMatchCategoryFromNameOnly,
  PLACE_MATCH_CATEGORY,
} from '../../src/pages/Home/lib/placeMatchCategory.js';
import { resolveFestivalThemeCrossLinks } from '../../src/pages/Home/lib/koreaThemeCrossLinks.js';
import {
  canShowMrtStayStrip,
  resolveMrtStayQuery,
} from '../../src/utils/mrtStayQuery.js';
import { scanPlaceMatchCategoryFalsePositivesAsync } from './place-match-category-scan.mjs';

function hubStayLocation(hubId) {
  const hub = resolveCityAttractionHub(hubId);
  assert.ok(hub, `${hubId} hub`);
  return {
    slug: hubId,
    hubId,
    name: hub.name,
    name_en: hub.name_en,
    name_ko: hub.name,
    country: '대한민국',
    country_en: 'South Korea',
    parentCity: hub.name,
  };
}

test('gangneung hub and festivals — MRT stay strip eligible', () => {
  const gangneung = hubStayLocation('gangneung');
  assert.equal(inferPlaceMatchCategory(gangneung), '');
  assert.equal(resolveMrtStayQuery(gangneung).keyword, '강릉');
  assert.equal(canShowMrtStayStrip(gangneung), true);

  const festivals = [
    { contentId: '2930716', title: '강릉 국수 축제' },
    { contentId: '825295', title: '강릉커피축제' },
    { contentId: '4116994', title: 'K-Drone Festival' },
  ];
  for (const f of festivals) {
    const cross = resolveFestivalThemeCrossLinks(
      {
        ...f,
        addr1: '강원특별자치도 강릉시',
        mapx: '128.876',
        mapy: '37.751',
      },
      { areaCode: '32' },
    );
    const loc = cross.stay?.location;
    assert.ok(loc, `${f.contentId} stay location`);
    assert.ok(resolveMrtStayQuery(loc).keyword, `${f.contentId} keyword`);
    assert.equal(canShowMrtStayStrip(loc), true, `${f.contentId} canShow`);
  }
});

test('hongcheon hub stay strip stays eligible', () => {
  const loc = hubStayLocation('hongcheon');
  assert.ok(resolveMrtStayQuery(loc).keyword);
  assert.equal(canShowMrtStayStrip(loc), true);
});

test('heritage tomb names remain HISTORY', () => {
  assert.equal(
    inferPlaceMatchCategoryFromNameOnly('선정릉'),
    PLACE_MATCH_CATEGORY.HISTORY,
  );
  assert.equal(
    inferPlaceMatchCategoryFromNameOnly('동구릉'),
    PLACE_MATCH_CATEGORY.HISTORY,
  );
});

test('legacy 릉 false positives cleared for 강릉·울릉 localities', () => {
  assert.equal(inferPlaceMatchCategoryFromNameOnly('강릉', { legacy: true }), PLACE_MATCH_CATEGORY.HISTORY);
  assert.equal(inferPlaceMatchCategoryFromNameOnly('강릉'), '');
  assert.equal(inferPlaceMatchCategoryFromNameOnly('울릉', { legacy: true }), PLACE_MATCH_CATEGORY.HISTORY);
  assert.equal(inferPlaceMatchCategoryFromNameOnly('울릉'), '');
});

test('place-match-category scan — no locality false positives after fix', async () => {
  const report = await scanPlaceMatchCategoryFalsePositivesAsync();
  assert.ok(report.localityCount >= 150, `locality set size ${report.localityCount}`);
  assert.deepEqual(
    report.localityAfter,
    [],
    `unexpected locality categories: ${JSON.stringify(report.localityAfter)}`,
  );
  const festBad = report.festivalAfter.filter((r) => r.category || !r.canShowMrtStayStrip);
  assert.deepEqual(
    festBad,
    [],
    `festival stay regressions: ${JSON.stringify(festBad)}`,
  );
});
