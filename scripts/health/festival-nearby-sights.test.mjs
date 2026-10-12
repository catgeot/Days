import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  isFestivalOrEventSight,
  isFestivalVenueSight,
  mergeFestivalNearbySights,
  normalizeNearbySightName,
  rankMooniNearbySights,
  stripTrailingHubName,
} from '../../src/pages/Korea/lib/festivalNearbySights.js';
import { isNearbyTourAttractionTitle } from '../../src/pages/Home/lib/koreaTourAttractionNearbyFilter.js';
import {
  nearbyAttractionCacheKey,
  readNearbyAttractionCache,
  writeNearbyAttractionCache,
} from '../../src/pages/Korea/lib/nearbyAttractionCache.js';
import {
  readFestivalOpenDetail,
  slimFestivalOpenDetail,
  writeFestivalOpenDetail,
} from '../../src/pages/Korea/lib/festivalOpenDetailCache.js';
import {
  readTourApiProxyCache,
  tourApiProxyCacheKey,
  writeTourApiProxyCache,
} from '../../src/utils/tourApiProxyCache.js';

const origin = { lat: 35.06, lng: 126.52 };

test('normalize nearby sight names', () => {
  assert.equal(normalizeNearbySightName('돌머리 해수욕장'), normalizeNearbySightName('돌머리해수욕장'));
});

test('dedupe by contentId then normalized name', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '용천사 함평', contentId: '129246', lat: 35.183, lng: 126.545 },
    ],
    grouped: {
      groups: [],
      rest: [
        { name: '용천사 함평', contentId: '129246', lat: 35.183, lng: 126.545 },
        { name: '용천사함평', contentId: '888', lat: 35.19, lng: 126.55 },
      ],
    },
    origin,
  });
  assert.equal(merged.items.length, 1);
  assert.equal(merged.items[0].contentId, '129246');
});

test('exclude the festival venue', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '함평엑스포공원', contentId: '130864', lat: 35.0592, lng: 126.5222 },
      { name: '별관', contentId: '42', lat: 35.062, lng: 126.521 },
    ],
    grouped: { groups: [], rest: [] },
    origin: { lat: 35.0592, lng: 126.5222 },
    venue: {
      contentIds: ['130864'],
      eventPlace: '함평엑스포공원',
      addr: '전라남도 함평군 별관 일원',
    },
  });
  const names = merged.items.map((spot) => spot.name);
  assert.deepEqual(names, []);
  assert.equal(
    isFestivalVenueSight(
      { name: '함평엑스포공원', contentId: '1' },
      { ids: new Set(), eventPlace: '함평엑스포공원', addr: '' },
      3,
    ),
    true,
  );
});

test('a venue member excluded from a 팔경 group is noted beside the subheading', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [],
    grouped: {
      groups: [
        {
          title: '함평 팔경',
          listId: 'hampyeong-palgyeong',
          items: [
            {
              name: '함평엑스포공원',
              contentId: '130864',
              rankBlurb: '함평 2경',
              localScenicListId: 'hampyeong-palgyeong',
              lat: 35.0592,
              lng: 126.5222,
            },
            {
              name: '함평자연생태공원',
              rankBlurb: '함평 1경',
              localScenicListId: 'hampyeong-palgyeong',
              lat: 35.08,
              lng: 126.5,
            },
            {
              name: '돌머리해수욕장',
              rankBlurb: '함평 3경',
              localScenicListId: 'hampyeong-palgyeong',
              lat: 35.15,
              lng: 126.4,
            },
          ],
        },
      ],
      rest: [],
    },
    origin: { lat: 35.0592, lng: 126.5222 },
    venue: {
      contentIds: ['130864'],
      eventPlace: '함평엑스포공원',
      addr: '전라남도 함평군',
    },
  });
  assert.equal(merged.items.some((spot) => spot.name === '함평엑스포공원'), false);
  const heading = merged.blocks.find((block) => block.kind === 'heading');
  assert.equal(heading?.title, '함평 팔경');
  assert.equal(heading?.venueNote, '2경 함평엑스포공원은 축제장이에요');
  assert.equal(merged.groups[0].items.length, 2);
});

test('sort by distance and hide missing or fallback coordinates', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '먼곳', contentId: '2', lat: 35.2, lng: 126.6 },
      { name: '가까운곳', contentId: '3', lat: 35.07, lng: 126.53 },
      { name: '좌표없음', contentId: '4' },
    ],
    grouped: {
      groups: [],
      rest: [
        { name: '중심A', contentId: '5', lat: 35.0654, lng: 126.5166 },
        { name: '중심B', contentId: '6', lat: 35.0654, lng: 126.5166 },
      ],
    },
    origin,
    fallbackCenters: [{ lat: 35.0654, lng: 126.5166 }],
  });
  assert.deepEqual(
    merged.items.map((spot) => spot.name),
    ['가까운곳', '먼곳', '좌표없음', '중심A', '중심B'],
  );
  assert.ok(merged.items[0].distKm < merged.items[1].distKm);
  assert.equal(merged.items.find((spot) => spot.name === '좌표없음').distKm, null);
  assert.equal(merged.items.find((spot) => spot.name === '중심A').distKm, null);
  assert.equal(merged.items.find((spot) => spot.name === '중심B').distKm, null);
});

test('multi-member 팔경 sits under a subheading in number order', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [],
    grouped: {
      groups: [
        {
          title: '함평 팔경',
          listId: 'hampyeong-palgyeong',
          items: [
            { name: '청계산', rankBlurb: '함평 8경', lat: 35.1, lng: 126.48 },
            { name: '삼호천', rankBlurb: '함평 7경' },
            { name: '함평자연생태공원', rankBlurb: '함평 1경', lat: 35.08, lng: 126.5 },
          ],
        },
      ],
      rest: [{ name: '보광사', contentId: '77', lat: 35.09, lng: 126.5 }],
    },
    origin,
  });
  assert.equal(merged.groups.length, 1);
  assert.deepEqual(
    merged.rest.map((spot) => spot.name),
    ['보광사'],
  );
  assert.deepEqual(
    merged.groups[0].items.map((spot) => spot.rankBlurb),
    ['함평 1경', '함평 7경', '함평 8경'],
  );
  assert.deepEqual(
    merged.blocks.map((block) => (block.kind === 'heading' ? block.title : block.spot.name)),
    ['보광사', '함평 팔경', '함평자연생태공원', '삼호천', '청계산'],
  );
  assert.equal(merged.groups[0].items[1].distKm, null);
});

test('a single foreign 팔경 item stays in the general list', () => {
  const merged = mergeFestivalNearbySights({
    scenicSpots: [{ name: '마산항', contentId: '1', lat: 35.19, lng: 128.57 }],
    grouped: {
      groups: [
        {
          title: '함안 구경',
          listId: 'haman-gugyeong',
          items: [
            {
              name: '연꽃테마파크의 아라홍련',
              rankBlurb: '함안 5경',
              localScenicListId: 'haman-gugyeong',
              lat: 35.29,
              lng: 128.42,
            },
          ],
        },
      ],
      rest: [],
    },
    origin: { lat: 35.1867, lng: 128.5639 },
  });
  assert.equal(merged.groups.length, 0);
  assert.equal(merged.blocks.some((block) => block.kind === 'heading'), false);
  assert.deepEqual(
    merged.rest.map((spot) => spot.name),
    ['마산항', '연꽃테마파크의 아라홍련'],
  );
  assert.equal(merged.rest[1].rankBlurb, '함안 5경');
});

test('strip a trailing hub name from a display title', () => {
  assert.equal(stripTrailingHubName('용천사 함평', '함평'), '용천사');
  assert.equal(stripTrailingHubName('법천사 무안', '무안'), '법천사');
  assert.equal(stripTrailingHubName('함안 연꽃테마파크', '함안'), '함안 연꽃테마파크');
  assert.equal(stripTrailingHubName('돌머리해수욕장', '함평'), '돌머리해수욕장');
});

test('merge same place within 300m and borrow coords onto the 팔경 row', () => {
  const near = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '함안 연꽃테마파크', contentId: '2754745', lat: 35.29, lng: 128.42 },
    ],
    grouped: {
      groups: [
        {
          title: '함안 구경',
          listId: 'haman-gugyeong',
          items: [
            {
              name: '연꽃테마파크의 아라홍련',
              rankBlurb: '함안 5경',
              localScenicListId: 'haman-gugyeong',
              lat: 35.2902,
              lng: 128.4202,
            },
          ],
        },
      ],
      rest: [],
    },
    origin: { lat: 35.1867, lng: 128.5639 },
  });
  assert.equal(near.items.length, 1);
  assert.equal(near.items[0].rankBlurb, '함안 5경');
  assert.ok(near.items[0].distKm > 10);

  const borrowed = mergeFestivalNearbySights({
    scenicSpots: [
      { name: '함안 연꽃테마파크', contentId: '2754745', lat: 35.29, lng: 128.42 },
    ],
    grouped: {
      groups: [
        {
          title: '함안 구경',
          listId: 'haman-gugyeong',
          items: [
            {
              name: '연꽃테마파크의 아라홍련',
              rankBlurb: '함안 5경',
              localScenicListId: 'haman-gugyeong',
            },
          ],
        },
      ],
      rest: [],
    },
    origin: { lat: 35.1867, lng: 128.5639 },
  });
  assert.equal(borrowed.items.length, 1);
  assert.equal(borrowed.items[0].name, '연꽃테마파크의 아라홍련');
  assert.equal(borrowed.items[0].rankBlurb, '함안 5경');
  assert.equal(borrowed.items[0].contentId, '2754745');
  assert.ok(borrowed.items[0].distKm > 10);

  const neighbors = mergeFestivalNearbySights({
    scenicSpots: [
      {
        name: '돌머리해수욕장',
        contentId: '126291',
        lat: 35.0865542912,
        lng: 126.4419067904,
        rankBlurb: '함평 4경',
        localScenicListId: 'hampyeong-palgyeong',
      },
    ],
    grouped: {
      groups: [],
      rest: [
        {
          name: '돌머리어촌체험마을',
          contentId: '129113',
          lat: 35.0864514985,
          lng: 126.4402986018,
        },
      ],
    },
    origin,
  });
  assert.deepEqual(
    neighbors.items.map((spot) => spot.name).sort(),
    ['돌머리어촌체험마을', '돌머리해수욕장'],
  );
  assert.equal(neighbors.items.find((spot) => spot.name === '돌머리해수욕장').rankBlurb, '함평 4경');
  assert.equal(neighbors.items.find((spot) => spot.name === '돌머리어촌체험마을').rankBlurb, '');
});

test('exclude festival and event sights', () => {
  assert.equal(isFestivalOrEventSight({ name: '창원 진해군항제' }), true);
  assert.equal(
    isFestivalOrEventSight({
      name: '낙동강유채축제와 남지개비리',
      localScenicListId: 'changnyeong-gugyeong',
    }),
    false,
  );
  const merged = mergeFestivalNearbySights({
    scenicSpots: [
      {
        name: '창원 진해군항제',
        blurb: '진해군항제 — 창원 벚꽃 축제',
        lat: 35.149,
        lng: 128.66,
      },
      { name: '제황산공원', contentId: '1', lat: 35.15, lng: 128.66 },
    ],
    grouped: {
      groups: [],
      rest: [{ name: '봄꽃축제', contentTypeId: '15', contentId: '2', lat: 35.16, lng: 128.67 }],
    },
    origin: { lat: 35.1867, lng: 128.5639 },
  });
  assert.deepEqual(
    merged.items.map((spot) => spot.name),
    ['제황산공원'],
  );
});

test('MOONi prefers 팔경 and tourist sights over commercial venues', () => {
  const ranked = rankMooniNearbySights([
    { name: '리고엠', distKm: 2, cat2: 'A0204', cat3: 'A02040600' },
    { name: '수상한마법학교', distKm: 3.2, cat2: 'A0203' },
    { name: '경포대', distKm: 4.4, cat2: 'A0201' },
    { name: '안목해변', distKm: 4.8, cat1: 'A01', cat2: 'A0101' },
    {
      name: '돌머리해수욕장',
      distKm: 8,
      rankBlurb: '함평 4경',
      localScenicListId: 'hampyeong-palgyeong',
    },
  ]);
  assert.deepEqual(
    ranked.map((spot) => spot.name),
    ['돌머리해수욕장', '경포대', '안목해변', '리고엠', '수상한마법학교'],
  );
});

test('drop non-tourist facilities from nearby sights', () => {
  assert.equal(isNearbyTourAttractionTitle('기린사우나'), false);
  assert.equal(isNearbyTourAttractionTitle('대한노인회 강릉지회'), false);
  assert.equal(isNearbyTourAttractionTitle('강릉종합사회복지관'), false);
  assert.equal(isNearbyTourAttractionTitle('임당생활문화센터'), false);
  assert.equal(isNearbyTourAttractionTitle('경포해변'), true);
  const merged = mergeFestivalNearbySights({
    scenicSpots: [],
    grouped: {
      groups: [],
      rest: [
        { name: '기린사우나', contentId: '11', lat: 35.07, lng: 126.53 },
        { name: '임당생활문화센터', contentId: '12', lat: 35.08, lng: 126.54, cat3: 'A02050600' },
        { name: '이색찜질', contentId: '13', lat: 35.08, lng: 126.55, cat3: 'A02020400' },
        { name: '경포대', contentId: '14', lat: 35.08, lng: 126.56 },
      ],
    },
    origin,
  });
  assert.deepEqual(
    merged.items.map((spot) => spot.name),
    ['경포대'],
  );
});

test('nearby sights render without waiting for festival detail', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.equal(sheet.includes('!detailLoading && activeTab === TAB_INFO'), false);
  assert.equal(sheet.includes('!detailLoading && showTabs'), false);
  assert.match(sheet, /data-festival-detail-skeleton/);
  assert.match(sheet, /data-festival-photo-reserve/);
  assert.match(sheet, /prev.length > urls.length && urls.length <= 1/);
  const infoAt = sheet.indexOf('{activeTab === TAB_INFO && (');
  const nearbyAt = sheet.indexOf('data-festival-section="nearAttractions"');
  const lodgingAt = sheet.indexOf('data-festival-section="lodging"');
  assert.ok(infoAt >= 0 && nearbyAt > infoAt && lodgingAt > nearbyAt);
  const nearbyBlock = sheet.slice(infoAt, nearbyAt);
  assert.match(nearbyBlock, /detailLoading \?/);
  assert.match(nearbyBlock, /heroReady &&/);
  const section = sheet.slice(nearbyAt, lodgingAt);
  assert.match(section, /nearbyPending &&/);
  assert.match(section, /!nearbyPending && nearbySights\.items\.length > 0/);
  assert.match(sheet, /fetchNearbyTourAttractions\(/);
  assert.match(sheet, /readNearbyAttractionCache\(/);
  const cachedBlock = sheet.slice(sheet.indexOf('const cachedSpots = readNearbyAttractionCache'));
  assert.ok(cachedBlock.indexOf('if (!cachedSpots)') >= 0);
  assert.ok(
    cachedBlock.indexOf('if (!cachedSpots)') < cachedBlock.indexOf('fetchNearbyTourAttractions({'),
  );
  const sightsEffectEnd = sheet.indexOf('nearbySectionsWaitForSights');
  const sightsEffect = sheet.slice(
    sheet.indexOf('const cachedSpots = readNearbyAttractionCache'),
    sightsEffectEnd,
  );
  assert.equal(sightsEffect.includes('fetchNearbyTourRestaurants'), false);
  assert.equal(sightsEffect.includes('fetchNearbyTourLeports'), false);
  assert.equal(sightsEffect.includes('fetchNearbyTourCulture'), false);
  const restaurantsAt = sheet.indexOf('fetchNearbyTourRestaurants({');
  assert.ok(sightsEffectEnd >= 0 && restaurantsAt > sightsEffectEnd);
  const coursesAt = sheet.indexOf('fetchNearbyTourCourses({');
  const coursesGate = sheet.lastIndexOf(
    "nearbyStatus === 'loading' || nearbyStatus === 'idle'",
    coursesAt,
  );
  assert.ok(coursesGate >= 0 && coursesGate < coursesAt);
  const afterNearby = sheet.slice(nearbyAt, lodgingAt);
  assert.match(afterNearby, /!detailLoading && \(/);
});

test('nearby attraction cache round-trips in the given store', () => {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  const opts = { lat: 35.198, lng: 128.567, radiusKm: 8, limit: 8 };
  assert.equal(readNearbyAttractionCache(opts, [storage]), null);
  writeNearbyAttractionCache(opts, [{ name: '임항선 그린웨이', distKm: 0.29 }], [storage]);
  const hit = readNearbyAttractionCache(opts, [storage]);
  assert.equal(hit[0].name, '임항선 그린웨이');
  assert.equal(
    nearbyAttractionCacheKey({ ...opts, lat: 35.1984 }),
    nearbyAttractionCacheKey(opts),
  );
});

test('out-of-window festival detail opens again from the client cache', () => {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  const detail = {
    ok: true,
    contentId: '638576',
    common: { contentid: '638576', title: '국향대전', mapx: '126.5', mapy: '35.1', firstimage: 'https://img.example/a.jpg' },
    intro: { eventstartdate: '20261023', eventenddate: '20261108' },
  };
  assert.equal(readFestivalOpenDetail('638576', [storage]), null);
  writeFestivalOpenDetail('638576', detail, [storage]);
  const slim = slimFestivalOpenDetail(detail);
  const hit = readFestivalOpenDetail('638576', [storage]);
  assert.equal(hit.contentId, '638576');
  assert.equal(hit.common.mapx, slim.common.mapx);
  assert.equal(hit.common.mapy, '35.1');
});

test('locationBasedList for the same coords reopens from the client cache', () => {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  const body = {
    action: 'locationBasedList',
    locale: 'ko',
    contentTypeId: '39',
    mapX: 128.5674,
    mapY: 35.1981,
    radius: 3000,
    numOfRows: 8,
    pageNo: 1,
    arrange: 'E',
  };
  assert.equal(readTourApiProxyCache(body, [storage]), null);
  writeTourApiProxyCache(body, { ok: false, items: [] }, [storage]);
  assert.equal(readTourApiProxyCache(body, [storage]), null);
  writeTourApiProxyCache(body, { ok: true, items: [{ contentId: '1' }] }, [storage]);
  const hit = readTourApiProxyCache(
    { ...body, mapX: 128.5671, mapY: 35.1984 },
    [storage],
  );
  assert.equal(hit.ok, true);
  assert.equal(hit.items[0].contentId, '1');
  assert.equal(
    tourApiProxyCacheKey(body),
    tourApiProxyCacheKey({ ...body, mapX: 128.5671, mapY: 35.1984 }),
  );
  assert.notEqual(
    tourApiProxyCacheKey(body),
    tourApiProxyCacheKey({ ...body, contentTypeId: '28' }),
  );
});
