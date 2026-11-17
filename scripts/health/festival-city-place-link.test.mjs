import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolveFestivalThemeCrossLinks } from '../../src/pages/Home/lib/koreaThemeCrossLinks.js';
import { resolveCityAttractionHub } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  festivalCityPlaceHref,
  festivalCityPlaceHubGate,
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

  let violations = 0;
  for (const row of rows) {
    const place = resolveFestivalCityPlaceLink(row);
    if (!place) continue;
    const hub = resolveCityAttractionHub(place.slug);
    const gate = festivalCityPlaceHubGate(row, hub);
    if (!gate.ok) violations += 1;
  }
  console.log(
    `festival-city-place local linked=${linked.length} hidden=${rows.length - linked.length} violations=${violations} uniquePlaces=${places.size} ${[...places.entries()].map(([slug, n]) => `${slug}:${n}`).join(' ')}`,
  );
  assert.equal(violations, 0);
  console.log(
    `festival-city-place scan-hub ${scanLinked}/${scanLines.length} uniquePlaces=${scanPlaces.size}`,
  );
  assert.equal(scanLines.length, 299);
  assert.equal(scanLinked, scanLines.length);
});

test('homonym and metro fallback hubs stay hidden unless sido, sigungu, and distance all match', () => {
  const cases = [
    {
      contentId: '141105',
      title: '경남고성공룡세계엑스포',
      addr1: '경상남도 고성군 당항만로 1116',
      mapx: '128.3915143393',
      mapy: '35.0533072967',
      ungated: 'goseong',
      expect: null,
    },
    {
      contentId: '3501104',
      title: '성남동 커피페스티벌',
      addr1: '울산광역시 중구 북정동',
      mapx: '129.3214690000',
      mapy: '35.5572230000',
      ungated: 'junggu',
      expect: null,
    },
    {
      contentId: '3522322',
      title: '오슬로우 빈티지 마켓',
      addr1: '인천광역시 제물포구 월미로 33 (북성동1가)',
      mapx: '126.6144291728',
      mapy: '37.4765685240',
      ungated: 'seoul',
      expect: null,
    },
    {
      contentId: '2433596',
      title: '왕가의 산책',
      addr1: '인천광역시 영종구 공항로 272 (운서동)',
      mapx: '126.427699293474',
      mapy: '37.458350712273',
      ungated: 'seoul',
      expect: null,
    },
    {
      contentId: '3492276',
      title: '2026 문화가 있는 날',
      addr1: '인천광역시 제물포구 송현동',
      mapx: '126.632619',
      mapy: '37.476334',
      ungated: 'seoul',
      expect: null,
    },
    {
      contentId: '3578130',
      title: '울산 남구 축제',
      addr1: '울산광역시 남구 대공원로 94 (옥동)',
      mapx: '129.2935190325',
      mapy: '35.5316566254',
      ungated: 'gyeongju',
      expect: null,
    },
    {
      contentId: '4137577',
      title: '세종 축제',
      addr1: '세종특별자치시 중앙공원로 60 (세종동)',
      mapx: '127.2717369032',
      mapy: '36.4917742203',
      ungated: 'jeonju',
      expect: null,
    },
    {
      contentId: '4115201',
      title: '대전 걷기 행사',
      addr1: '대전광역시 서구 둔산대로 169 (만년동)',
      mapx: '127.3880172850',
      mapy: '36.3664690154',
      ungated: 'jeonju',
      expect: null,
    },
    {
      contentId: '386053',
      title: '평창 축제',
      addr1: '강원특별자치도 평창군 진부면 경강로 3562',
      mapx: '128.5569912325',
      mapy: '37.6331795130',
      ungated: 'pyeongchang',
      expect: 'pyeongchang',
    },
  ];

  for (const row of cases) {
    const cross = resolveFestivalThemeCrossLinks(row, { areaCode: row.areaCode });
    assert.equal(cross.nearbyHubs?.[0]?.hubId, row.ungated, row.contentId);
    const place = resolveFestivalCityPlaceLink(row);
    assert.equal(place?.slug ?? null, row.expect, row.contentId);
    if (row.expect) {
      const gate = festivalCityPlaceHubGate(row, resolveCityAttractionHub(row.expect));
      assert.equal(gate.ok, true, row.contentId);
      assert.ok(gate.km > 30 && gate.km <= 50, `${row.contentId} ${gate.km}`);
    }
  }

  const yeonsu = resolveFestivalCityPlaceLink({
    contentId: '2433596-district',
    addr1: '인천광역시 연수구 송도동',
    mapx: '126.650',
    mapy: '37.390',
  });
  assert.equal(yeonsu?.slug, 'yeonsu');
});
