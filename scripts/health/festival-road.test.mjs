import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  GATEO_ENV_FLAG_NAMES,
  isGateoFestivalRoadEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  FESTIVAL_ROAD_MAP_MIN_POINTS,
  FESTIVAL_ROAD_MAP_SLOT_PX,
  beltForFestival,
  beltStopNearbyLabels,
  festivalRoadAllEmpty,
  festivalRoadFill,
  festivalRoadLineOrder,
  festivalRoadMapPoints,
  festivalRoadTakeDiscardedCoords,
  groupFestivalsForBelt,
} from '../../src/pages/Korea/lib/festivalRoad.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

test('flag off leaves the live festival detail unchanged', () => {
  const prev = globalThis.__VITE_ENV__;
  globalThis.__VITE_ENV__ = {
    ...(prev || {}),
    [GATEO_ENV_FLAG_NAMES.FESTIVAL_ROAD]: '',
  };
  assert.equal(isGateoFestivalRoadEnabled(), false);
  globalThis.__VITE_ENV__ = prev;

  const sheet = read('src/pages/Korea/FestivalDetailSheet.jsx');
  assert.match(sheet, /VITE_GATEO_FESTIVAL_ROAD === '1'/);
  assert.match(sheet, /FestivalRoadBlock/);
  assert.match(sheet, /import\('\.\/FestivalRoadBlock\.jsx'\)/);
  assert.doesNotMatch(sheet, /FestivalRoadPanel/);
  assert.doesNotMatch(sheet, /mooniSlot=\{[\s\S]*FestivalRoadPanel/);

  const block = read('src/pages/Korea/FestivalRoadBlock.jsx');
  assert.match(block, /data-festival-road-entry/);
  assert.match(block, /korea\.festival\.road\.viewFromThis/);
  assert.match(block, /useSeoulCalendarNow/);
  assert.doesNotMatch(block, /mooniSlot/);

  const summary = read('src/pages/Korea/FestivalDetailFirstSummary.jsx');
  assert.match(summary, /afterPlace \?/);
  assert.match(summary, /data-festival-road-slot/);
  assert.doesNotMatch(summary, /mapbox/i);

  const index = read('src/pages/Korea/index.jsx');
  assert.match(
    index,
    /festivalPool=\{isGateoFestivalRoadEnabled\(\) \? itemsWithSocialPromo : undefined\}/,
  );

  const app = read('src/App.jsx');
  assert.match(app, /isGateoFestivalRoadEnabled\(\) && FestivalRoadFixturePage/);
  assert.match(app, /path="\/qa\/festival-road"/);

  const panel = read('src/pages/Korea/FestivalRoadPanel.jsx');
  const logic = read('src/pages/Korea/lib/festivalRoad.js');
  for (const src of [panel, logic]) {
    assert.doesNotMatch(src, /mapbox|mapboxgl|KoreaFestivalMap|scrollIntoView/i);
  }
  assert.doesNotMatch(sheet, /from ['"][^'"]*mapbox|KoreaFestivalMap/i);
  assert.doesNotMatch(block, /scrollIntoView/);
  assert.match(panel, /FESTIVAL_ROAD_MAP_SLOT_PX/);
  assert.equal(FESTIVAL_ROAD_MAP_SLOT_PX, 160);
  assert.match(panel, /data-festival-road-map/);
  assert.match(panel, /mapPoints\.length >= FESTIVAL_ROAD_MAP_MIN_POINTS/);
  assert.match(panel, /import\('\.\/FestivalRoadMap\.jsx'\)/);
  assert.doesNotMatch(panel, /from ['"]\.\/FestivalRoadMap/);
  assert.doesNotMatch(sheet, /FestivalRoadMap/);
  assert.match(panel, /nearbySights/);
  assert.match(panel, /data-festival-road-in-period="1"/);
  assert.match(panel, /if \(!row\.inPeriod\) return null/);
  assert.doesNotMatch(panel, /mooniSlot/);
  const map = read('src/pages/Korea/FestivalRoadMap.jsx');
  assert.match(map, /react-map-gl\/mapbox/);
  assert.match(map, /LineString/);
  assert.match(map, /data-festival-road-pin/);
  assert.match(map, /data-festival-road-map-tiles-idle/);
  assert.match(map, /festivalRoadPinOffsets/);
  assert.match(panel, /data-week-shortcut/);
  assert.match(panel, /korea\.festival\.dateSheetWeekThis/);
  assert.match(panel, /korea\.festival\.dateSheetWeekNext/);
  assert.doesNotMatch(panel, /dateSheetWeekNext2/);
});

test('groupFestivalsForBelt keeps numbered stops and dims out-of-period festivals', () => {
  const sokcho = {
    contentId: 'sokcho-fest',
    title: '속초 해변 축제',
    addr1: '강원특별자치도 속초시 해오름로 186',
    areaCode: '32',
    eventStartDate: '20261022',
    eventEndDate: '20261025',
  };
  const gangneung = {
    contentId: 'gangneung-fest',
    title: '강릉 단풍 축제',
    addr1: '강원특별자치도 강릉시 강릉대로 33',
    areaCode: '32',
    eventStartDate: '20261110',
    eventEndDate: '20261112',
  };
  const belt = beltForFestival(sokcho);
  assert.equal(belt?.id, 'gw-east-coast');
  assert.equal(beltForFestival(gangneung)?.id, 'gw-east-coast');

  const thisWeek = { startYmd: '20261022', endYmd: '20261025' };
  const legs = groupFestivalsForBelt(belt, [sokcho, gangneung, sokcho], thisWeek);
  assert.deepEqual(legs.map((leg) => leg.hubId), [
    'goseong',
    'yangyang',
    'sokcho',
    'gangneung',
    'samcheok',
  ]);
  assert.deepEqual(legs.map((leg) => leg.stopIndex), [1, 2, 3, 4, 5]);
  assert.equal(legs[0].nextLabel, '양양');
  assert.equal(legs[4].nextLabel, null);
  assert.equal(legs[0].empty, true);
  assert.equal(legs[0].items.length, 0);
  assert.equal(legs[2].label, '속초');
  assert.equal(legs[2].empty, false);
  assert.equal(legs[2].items.length, 1);
  assert.equal(legs[2].items[0].inPeriod, true);
  assert.equal(legs[3].empty, true);
  assert.equal(legs[3].items[0].inPeriod, false);
  assert.equal(legs[3].items[0].item.title, '강릉 단풍 축제');

  const later = groupFestivalsForBelt(belt, [sokcho, gangneung], {
    startYmd: '20261110',
    endYmd: '20261112',
  });
  assert.deepEqual(later.map((leg) => [leg.stopIndex, leg.hubId]), legs.map((leg) => [leg.stopIndex, leg.hubId]));
  assert.equal(later[2].empty, true);
  assert.equal(later[2].items[0].inPeriod, false);
  assert.equal(later[3].empty, false);
  assert.equal(later[3].items[0].inPeriod, true);

  const none = groupFestivalsForBelt(belt, [sokcho, gangneung], {
    startYmd: '20260101',
    endYmd: '20260107',
  });
  assert.equal(festivalRoadAllEmpty(none), true);
  assert.equal(none[2].items.length, 1);
  assert.equal(none[3].items[0].inPeriod, false);
});

test('festival road ignores a same-name region outside the belt province', () => {
  const gyeongnam = beltForFestival({
    contentId: 'gn-goseong',
    title: '고성 공룡',
    addr1: '경상남도 고성군 고성읍',
    areaCode: '36',
    eventStartDate: '20261022',
    eventEndDate: '20261025',
  });
  assert.equal(gyeongnam, null);

  const seoul = beltForFestival({
    contentId: 'seoul-fest',
    title: '서울 축제',
    addr1: '서울특별시 종로구 세종대로',
    areaCode: '1',
  });
  assert.equal(seoul, null);

  const wonju = beltForFestival({
    contentId: 'wonju-fest',
    title: '원주 축제',
    addr1: '강원특별자치도 원주시 단구로',
    areaCode: '32',
  });
  assert.equal(wonju?.id, 'gw-central');

  const jecheon = beltForFestival({
    contentId: 'jecheon-fest',
    title: '제천 축제',
    addr1: '충청북도 제천시 청풍호로',
    areaCode: '33',
  });
  assert.equal(jecheon?.id, 'gw-west-jungbu');
});

test('gray stops show nearby sights only, and skip a blank slot', () => {
  const labels = beltStopNearbyLabels('goseong');
  assert.ok(labels.includes('건봉사'));
  assert.ok(labels.length <= 4);
  assert.deepEqual(beltStopNearbyLabels('not-a-hub'), []);

  const gray = { empty: true, items: [] };
  assert.deepEqual(festivalRoadFill(gray, labels), {
    showNearby: true,
    showAccess: false,
    accessItem: null,
    nearbyLabels: labels,
  });
  assert.deepEqual(festivalRoadFill(gray, []), {
    showNearby: false,
    showAccess: false,
    accessItem: null,
    nearbyLabels: [],
  });

  const dimmed = { contentId: 'late', title: '지난 축제', eventStartDate: '20261110' };
  const grayWithFestival = { empty: true, items: [{ item: dimmed, inPeriod: false }] };
  const accessOnly = festivalRoadFill(grayWithFestival, []);
  assert.equal(accessOnly.showNearby, false);
  assert.equal(accessOnly.showAccess, true);
  assert.equal(accessOnly.accessItem, dimmed);

  const deduped = festivalRoadFill(grayWithFestival, [], 'late');
  assert.equal(deduped.showAccess, false);
  assert.equal(deduped.accessItem, null);

  const current = { contentId: 'now', title: '이번 축제' };
  const colored = festivalRoadFill(
    { empty: false, items: [{ item: current, inPeriod: true }] },
    ['오죽헌'],
  );
  assert.equal(colored.showNearby, true);
  assert.equal(colored.showAccess, true);
  assert.equal(colored.accessItem, current);

  const originLeg = { empty: false, hubId: 'gangneung', items: [{ item: current, inPeriod: true }] };
  const originDup = festivalRoadFill(originLeg, ['오죽헌'], 'other-id', 'gangneung');
  assert.equal(originDup.showAccess, false);
});

test('map points follow stop order and stay hidden under two points', () => {
  assert.equal(FESTIVAL_ROAD_MAP_MIN_POINTS, 2);
  const sokcho = {
    contentId: 'sokcho-map',
    title: '속초 해변 축제',
    addr1: '강원특별자치도 속초시 해오름로 186',
    areaCode: '32',
    eventStartDate: '20261022',
    eventEndDate: '20261025',
    mapx: '128.5918',
    mapy: '38.207',
  };
  const gangneung = {
    contentId: 'gangneung-map',
    title: '강릉 단풍 축제',
    addr1: '강원특별자치도 강릉시 강릉대로 33',
    areaCode: '32',
    eventStartDate: '20261110',
    eventEndDate: '20261112',
    mapx: '128.876',
    mapy: '37.751',
  };
  const belt = beltForFestival(sokcho);
  const legs = groupFestivalsForBelt(belt, [sokcho, gangneung], {
    startYmd: '20261022',
    endYmd: '20261025',
  });
  const points = festivalRoadMapPoints(legs);
  assert.ok(points.length >= FESTIVAL_ROAD_MAP_MIN_POINTS);
  const indexes = points.map((point) => point.stopIndex);
  assert.deepEqual([...indexes].sort((a, b) => a - b), indexes);
  const sokchoPin = points.find((point) => point.hubId === 'sokcho');
  assert.equal(sokchoPin.kind, 'festival');
  assert.equal(sokchoPin.stopIndex, 3);
  assert.equal(sokchoPin.lng, 128.5918);
  assert.equal(sokchoPin.lat, 38.207);
  const goseongPin = points.find((point) => point.hubId === 'goseong');
  assert.equal(goseongPin.kind, 'sight');
  assert.equal(goseongPin.label, '건봉사');
  const gangneungPin = points.find((point) => point.hubId === 'gangneung');
  assert.ok(gangneungPin);
  assert.ok(gangneungPin.lng > 128.5);

  const one = festivalRoadMapPoints([
    {
      stopIndex: 1,
      hubId: 'not-a-hub',
      label: '하나',
      items: [{ item: { title: '하나', mapx: '128.5', mapy: '38.2' }, inPeriod: true }],
    },
  ]);
  assert.equal(one.length, 1);
  assert.ok(one.length < FESTIVAL_ROAD_MAP_MIN_POINTS);

  const none = festivalRoadMapPoints([
    { stopIndex: 1, hubId: 'not-a-hub', label: '없음', items: [] },
    {
      stopIndex: 2,
      hubId: '',
      label: '',
      items: [{ item: { title: '바다', mapx: '1', mapy: '1' }, inPeriod: true }],
    },
  ]);
  assert.equal(none.length, 0);

  const line = festivalRoadLineOrder(points);
  assert.deepEqual(line.map((point) => point.stopIndex), indexes);

  const central = beltForFestival({
    contentId: 'wonju-anchor',
    title: '원주 테스트',
    addr1: '강원특별자치도 원주시 단구로',
    areaCode: '32',
  });
  const stray = groupFestivalsForBelt(central, [
    {
      contentId: 'stray-wonju',
      title: '잘못된 좌표',
      addr1: '강원특별자치도 원주시 단구로',
      areaCode: '32',
      eventStartDate: '20261022',
      eventEndDate: '20261025',
      mapx: '126.45',
      mapy: '37.45',
    },
  ], { startYmd: '20261022', endYmd: '20261025' });
  const wonjuLeg = stray.find((leg) => leg.hubId === 'wonju');
  assert.equal(wonjuLeg?.empty, false);
  const strayPins = festivalRoadMapPoints(stray);
  const wonjuPin = strayPins.find((point) => point.hubId === 'wonju');
  assert.ok(wonjuPin);
  assert.equal(wonjuPin.kind, 'stop');
  assert.ok(wonjuPin.lng > 127);
  assert.ok(wonjuPin.lat > 37);
  const discards = festivalRoadTakeDiscardedCoords();
  assert.equal(discards.length, 1);
  assert.equal(discards[0].reason, 'festival_coord_too_far');
  assert.equal(discards[0].hubId, 'wonju');

  const centralBelt = beltForFestival({
    contentId: 'wonju-order',
    title: '원주',
    addr1: '강원특별자치도 원주시',
    areaCode: '32',
  });
  assert.deepEqual(centralBelt?.stops, ['wonju', 'pyeongchang', 'jeongseon']);
});

test('road copy matches the approved lines', () => {
  const ko = JSON.parse(read('src/i18n/locales/ko.json'));
  assert.equal(ko.korea.festival.road.viewFromThis, '이 축제로 동선 보기');
  assert.equal(ko.korea.festival.road.mapSlot, '지도');
  assert.equal(
    ko.korea.festival.road.emptyStop,
    '이 기간엔 축제가 없어요 · 주변 볼거리 보기',
  );
  assert.equal(
    ko.korea.festival.road.allEmpty,
    '고른 기간에 축제가 없어요. 날짜를 바꿔 보세요',
  );
  assert.equal(ko.korea.festival.dateSheetWeekThis, '이번주');
  assert.equal(ko.korea.festival.dateSheetWeekNext, '다음주');
  const en = JSON.parse(read('src/i18n/locales/en.json'));
  assert.equal(en.korea.festival.road.viewFromThis, 'See a route from this festival');
  assert.equal(en.korea.festival.road.mapSlot, 'Map');
});
