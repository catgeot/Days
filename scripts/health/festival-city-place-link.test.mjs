import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveCityAttractionHub } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  festivalCityPlaceHref,
  resolveFestivalCityPlaceLink,
} from '../../src/pages/Korea/lib/festivalCityPlaceLink.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

function rowsFromCatalogs() {
  const byId = new Map();
  const add = (row) => {
    const id = String(row?.contentId || '').trim();
    if (!id || byId.has(id)) return;
    byId.set(id, row);
  };
  for (const row of readJson('src/pages/Home/data/placeCrosslinkFestivalSeed.json').items || []) {
    add(row);
  }
  for (const row of Object.values(readJson('src/pages/Korea/data/manualFestivalEntries.json'))) {
    add(row);
  }
  for (const row of readJson('scripts/data/mooni-scoped-festival-week-fixture.json').items || []) {
    add(row);
  }
  const detail = readJson('e2e/fixtures/festival-2989642-detail.json');
  add({
    contentId: detail.contentId,
    title: detail.common?.title,
    addr1: detail.common?.addr1,
    mapx: detail.common?.mapx,
    mapy: detail.common?.mapy,
    eventStartDate: detail.intro?.eventStartDate,
    eventEndDate: detail.intro?.eventEndDate,
  });
  return [...byId.values()];
}

test('festival city place link reuses the primary hub and hides when none resolves', () => {
  const seoul = resolveFestivalCityPlaceLink({
    contentId: '3571001',
    title: '서울 축제',
    addr1: '서울특별시 종로구',
    mapx: '126.978',
    mapy: '37.566',
  });
  assert.equal(seoul?.slug, 'jongno');
  assert.equal(festivalCityPlaceHref(seoul.slug, false), '/place/jongno');
  assert.equal(festivalCityPlaceHref(seoul.slug, true), '/place/jongno?lang=en');

  const seogwipo = resolveFestivalCityPlaceLink(
    readJson('src/pages/Home/data/placeCrosslinkFestivalSeed.json').items.find(
      (row) => row.contentId === '506616',
    ),
  );
  assert.equal(seogwipo?.slug, 'seogwipo');
  const ko = readJson('src/i18n/locales/ko.json');
  const en = readJson('src/i18n/locales/en.json');
  assert.equal(ko.korea.festival.detail.cityPlace, '이 도시 여행지 보기');
  assert.equal(en.korea.festival.detail.cityPlace, "See this city's destination");

  assert.equal(resolveFestivalCityPlaceLink(null), null);
  assert.equal(
    resolveFestivalCityPlaceLink({ contentId: '9', title: '위치 없음' }),
    null,
  );
  assert.equal(
    resolveFestivalCityPlaceLink({
      contentId: '8',
      title: '바다 한가운데',
      mapx: '0',
      mapy: '0',
    }),
    null,
  );
});

test('current festival records resolve to one city place or none', () => {
  const rows = rowsFromCatalogs();
  const linked = [];
  const places = new Map();
  for (const row of rows) {
    const place = resolveFestivalCityPlaceLink(row);
    if (!place) continue;
    linked.push({ id: String(row.contentId), slug: place.slug, title: row.title });
    places.set(place.slug, (places.get(place.slug) || 0) + 1);
  }
  assert.ok(rows.length >= 10, `expected local festival rows, got ${rows.length}`);
  assert.ok(linked.length > 0);
  assert.ok(linked.length <= rows.length);
  for (const row of linked) {
    assert.ok(resolveCityAttractionHub(row.slug), row.slug);
  }

  const scanLines = readFileSync(
    join(root, 'artifacts/festival-section-scan/scan.csv'),
    'utf8',
  )
    .trim()
    .split('\n')
    .slice(1);
  let scanLinked = 0;
  const scanPlaces = new Set();
  for (const line of scanLines) {
    const cols = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        quoted = !quoted;
        continue;
      }
      if (ch === ',' && !quoted) {
        cols.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    cols.push(cur);
    const hubId = String(cols[2] || '').trim().toLowerCase();
    if (!hubId || !resolveCityAttractionHub(hubId)) continue;
    scanLinked += 1;
    scanPlaces.add(hubId);
  }

  console.log(
    `festival-city-place local ${linked.length}/${rows.length} uniquePlaces=${places.size} ${[...places.entries()].map(([slug, n]) => `${slug}:${n}`).join(' ')}`,
  );
  console.log(
    `festival-city-place scan-hub ${scanLinked}/${scanLines.length} uniquePlaces=${scanPlaces.size}`,
  );
  assert.equal(scanLines.length, 299);
  assert.equal(scanLinked, scanLines.length);
});
