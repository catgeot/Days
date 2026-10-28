import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { filterByRegion, buildSidoTags, REGION_MIN_COUNT, LIST_SIDO_CHIP_MIN_COUNT } from '../../src/pages/Korea/festivalRegionTags.js';
import {
  auditNationwideSidoChipsMatchList,
  auditAllSidoCityChipSumsMatchList,
} from '../../src/pages/Korea/festivalListChipGroupSync.js';
import { filterByTimeTab, seasonRangeById } from '../../src/pages/Korea/festivalTimeFilter.js';
import { filterFestivalsByYmdRange } from '../../src/pages/Korea/festivalDateFilter.js';
import { festivalHubFlagOnRangeYmd } from '../../src/pages/Korea/festivalHubDefaultPeriod.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, '../data/korea-festival-region-addr-fixture.json');
const SEOUL_NOON = new Date('2026-10-28T03:00:00.000Z');

/** @type {object[]} */
const addrFixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')).items || [];

function winterLikePanel() {
  const range = seasonRangeById('winter', SEOUL_NOON);
  const start = range.eventStartDate;
  const end = range.eventEndDate;
  const mid = start.slice(0, 6) + '15';
  return [
    ...Array.from({ length: 15 }, (_, i) => ({
      contentId: `s-${i}`,
      addr1: `서울특별시 종로구 세종로 ${i}`,
      eventStartDate: mid,
      eventEndDate: end,
    })),
    { contentId: 'i1', addr1: '인천광역시 중구', eventStartDate: mid, eventEndDate: end },
    { contentId: 'i2', addr1: '인천광역시 남동구', eventStartDate: mid, eventEndDate: end },
    { contentId: 'b1', addr1: '부산광역시 해운대구', eventStartDate: mid, eventEndDate: end },
    { contentId: 'b2', addr1: '부산광역시 수영구', eventStartDate: mid, eventEndDate: end },
    { contentId: 'b3', addr1: '부산광역시 사하구', eventStartDate: mid, eventEndDate: end },
    { contentId: 'g1', addr1: '경기도 수원시', eventStartDate: mid, eventEndDate: end },
    { contentId: 'g2', addr1: '경기도 성남시', eventStartDate: mid, eventEndDate: end },
    { contentId: 'g3', addr1: '경기도 고양시', eventStartDate: mid, eventEndDate: end },
    { contentId: 'gw1', addr1: '강원특별자치도 화천군', eventStartDate: mid, eventEndDate: end },
    { contentId: 'jn1', addr1: '전라남도 여수시', eventStartDate: mid, eventEndDate: end },
    { contentId: 'cb1', addr1: '충청북도 괴산군', eventStartDate: mid, eventEndDate: end },
    { contentId: 'dj1', addr1: '대전광역시 유성구', eventStartDate: mid, eventEndDate: end },
    { contentId: 'gj1', addr1: '광주광역시 북구', eventStartDate: mid, eventEndDate: end },
  ];
}

test('legacy MIN_COUNT=2 hides single-sido rows — chip sum < list (regression guard)', () => {
  const panel = winterLikePanel();
  assert.equal(panel.length, 28);
  const legacy = auditNationwideSidoChipsMatchList(panel, { minCount: REGION_MIN_COUNT });
  assert.equal(legacy.ok, false);
  assert.equal(legacy.chipSum, 23);
  assert.equal(legacy.list, 28);
});

test('LIST_SIDO_CHIP_MIN_COUNT keeps every sido on the panel and chip sum === list', () => {
  const panel = winterLikePanel();
  const audit = auditNationwideSidoChipsMatchList(panel);
  assert.equal(audit.ok, true, JSON.stringify(audit));
  assert.equal(audit.chipSum, 28);
  const chips = buildSidoTags(panel, { minCount: LIST_SIDO_CHIP_MIN_COUNT });
  assert.equal(chips.reduce((a, c) => a + c.count, 0), 28);
  assert.ok(chips.some((c) => c.label.includes('강원')));
  assert.ok(chips.some((c) => c.label.includes('전남') || c.label.includes('전라남')));
});

test('nationwide filter leaves chip/list sync for winter-like panel', () => {
  const panel = filterByRegion(winterLikePanel(), { areaCode: 'all', cityName: 'all' });
  assert.equal(auditNationwideSidoChipsMatchList(panel).ok, true);
});

const SEASON_IDS = ['spring', 'summer', 'autumn', 'winter'];

function datedFixtureItems(now) {
  return addrFixture.map((row, i) => {
    const season = SEASON_IDS[i % SEASON_IDS.length];
    const range = seasonRangeById(season, now);
    const start = range.eventStartDate;
    const end = range.eventEndDate;
    return {
      ...row,
      contentId: String(10000 + i),
      eventStartDate: start,
      eventEndDate: end,
    };
  });
}

test('season tabs — nationwide chip sum matches filtered list for each season', () => {
  const items = datedFixtureItems(SEOUL_NOON);
  for (const seasonId of SEASON_IDS) {
    const filtered = filterByTimeTab(seasonId, items, SEOUL_NOON);
    const audit = auditNationwideSidoChipsMatchList(filtered);
    assert.equal(
      audit.ok,
      true,
      `${seasonId}: ${JSON.stringify(audit)} list=${filtered.length}`,
    );
  }
});

test('window30 date chip pool — nationwide chip sum matches list', () => {
  const range = festivalHubFlagOnRangeYmd('window30', SEOUL_NOON);
  const items = datedFixtureItems(SEOUL_NOON);
  const filtered = filterFestivalsByYmdRange(
    items,
    range.eventStartDate,
    range.eventEndDate,
  );
  const audit = auditNationwideSidoChipsMatchList(filtered);
  assert.equal(audit.ok, true, JSON.stringify(audit));
});

test('addr fixture — each sido city-chip sums still match list', () => {
  const audit = auditAllSidoCityChipSumsMatchList(addrFixture);
  assert.equal(audit.ok, true, JSON.stringify(audit));
});
