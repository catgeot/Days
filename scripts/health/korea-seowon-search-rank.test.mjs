import assert from 'node:assert/strict';
import test from 'node:test';
import { collectKoreaPoiTypeSearchCandidates } from '../../src/pages/Home/lib/koreaPoiTypeSearch.js';
import { titleMatchesSeowonAcademy } from '../../src/pages/Home/lib/koreaPoiTypeQuery.js';
import { buildCuratedEnterDisambiguation } from '../../src/pages/Home/lib/searchSuggestions.js';

const UNESCO_KOREA_SEOWON = [
  '소수서원',
  '남계서원',
  '옥산서원',
  '도산서원',
  '필암서원',
  '도동서원',
  '병산서원',
  '무성서원',
  '돈암서원',
];

function academyCore(name) {
  return String(name || '')
    .replace(/\s+/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*\)/g, '');
}

test('«서원» Enter는 해역 오타 카드로 빠지지 않는다', async () => {
  assert.equal(await buildCuratedEnterDisambiguation('서원'), null);
});

test('titleMatchesSeowonAcademy keeps heritage titles and drops 서원구', () => {
  assert.equal(titleMatchesSeowonAcademy('옥산서원 [유네스코 세계유산]'), true);
  assert.equal(titleMatchesSeowonAcademy('옥산서원(경주)'), true);
  assert.equal(titleMatchesSeowonAcademy('도동서원'), true);
  assert.equal(titleMatchesSeowonAcademy('대구광역시 서원구 보건소'), false);
  assert.equal(titleMatchesSeowonAcademy('서원골'), false);
});

test('collectKoreaPoiTypeSearchCandidates — «서원» pins UNESCO 9 and keeps the rest', async () => {
  const fillers = Array.from({ length: 200 }, (_, index) => ({
    contentId: String(8000 + index),
    name: `가${String(index).padStart(3, '0')}서원`,
    addr1: '서울특별시 종로구',
    lat: 37.57,
    lng: 126.98,
    areaCode: '1',
  }));
  const academies = [
    ['9101', '소수서원 [유네스코 세계유산]', '경상북도 영주시 순흥면', 36.92, 128.58],
    ['9102', '남계서원 [유네스코 세계유산]', '경상남도 함양군 수동면', 35.52, 127.75],
    ['9103', '옥산서원 [유네스코 세계유산]', '경상북도 경주시 안강읍', 36.01, 129.16],
    ['9104', '도산서원 [유네스코 세계유산]', '경상북도 안동시 도산면', 36.72, 128.84],
    ['9105', '필암서원 [유네스코 세계유산]', '전라남도 장성군 황룡면', 35.3, 126.78],
    ['9106', '도동서원 [유네스코 세계유산]', '대구광역시 달성군 구지면', 35.7, 128.4],
    ['9107', '병산서원 [유네스코 세계유산]', '경상북도 안동시 풍천면', 36.57, 128.62],
    ['9108', '무성서원 [유네스코 세계유산]', '전북특별자치도 정읍시 칠보면', 35.56, 126.99],
    ['9109', '돈암서원 [유네스코 세계유산]', '충청남도 논산시 연산면', 36.21, 127.18],
    ['9110', '옥산서원(경주)', '경상북도 경주시 안강읍', 36.01, 129.16],
  ].map(([contentId, name, addr1, lat, lng]) => ({
    contentId,
    name,
    addr1,
    lat,
    lng,
  }));
  const rows = await collectKoreaPoiTypeSearchCandidates('서원', {
    lookupTourAttractions: async () => [
      {
        contentId: '9001',
        name: '대구광역시 서원구 보건소',
        addr1: '대구광역시 서원구',
        lat: 35.87,
        lng: 128.6,
      },
      ...academies,
      ...fillers,
    ],
  });
  const names = rows.map((row) => String(row.name || ''));
  const cores = names.map(academyCore);
  assert.deepEqual(cores.slice(0, UNESCO_KOREA_SEOWON.length), UNESCO_KOREA_SEOWON);
  assert.ok(cores.indexOf('옥산서원') < cores.indexOf('도동서원'));
  assert.equal(names.filter((name) => name.includes('서원구')).length, 0);
  assert.equal(names.filter((name) => academyCore(name) === '옥산서원').length, 1);
  for (const filler of fillers) {
    assert.equal(names.includes(filler.name), true, filler.name);
  }
  assert.ok(names.includes('서천 문헌서원'));
  assert.ok(names.includes('영천 임고서원'));
  assert.ok(names.length > 180);
  assert.equal(names.length, new Set(cores).size);
});

const LIVE_HOMONYMS = [
  {
    contentId: '1959941',
    name: '옥산서원',
    addr1: '경상남도 하동군 옥종면 옥산서원길 61-7',
    lat: 35.162270449,
    lng: 127.8883550574,
  },
  {
    contentId: '1957023',
    name: '옥산서원',
    addr1: '전북특별자치도 정읍시 소성면 애당모촌길 9',
    lat: 35.5299847292,
    lng: 126.7800129508,
  },
  {
    contentId: '1958202',
    name: '김천 도동서원',
    addr1: '경상북도 김천시 구성면 상좌원3길',
    lat: 36.0448509866,
    lng: 128.0332853034,
  },
  {
    contentId: '1956969',
    name: '도동서원(고창)',
    addr1: '전북특별자치도 고창군 신림면 가평1길 64',
    lat: 35.4779705412,
    lng: 126.7419148771,
  },
  {
    contentId: '1958126',
    name: '남계서원',
    addr1: '대구광역시 군위군 군위읍 대북길 9',
    lat: 36.2537618464,
    lng: 128.5576941217,
  },
  {
    contentId: '1955818',
    name: '도산서원(대전)',
    addr1: '대전광역시 서구 남선로 8',
    lat: 36.351,
    lng: 127.384,
  },
  {
    contentId: '9001',
    name: '대구광역시 서원구 보건소',
    addr1: '대구광역시 서원구',
    lat: 35.87,
    lng: 128.6,
  },
];

test('«서원» keeps UNESCO places ahead of same-name academies when tour rows are the other region', async () => {
  const rows = await collectKoreaPoiTypeSearchCandidates('서원', {
    lookupTourAttractions: async () => LIVE_HOMONYMS,
  });
  const names = rows.map((row) => String(row.name || ''));
  const cores = names.map(academyCore);
  assert.deepEqual(cores.slice(0, UNESCO_KOREA_SEOWON.length), UNESCO_KOREA_SEOWON);
  const oksan = rows.filter((row) => academyCore(row.name) === '옥산서원');
  assert.equal(oksan[0]?.hubId, 'gyeongju');
  assert.equal(oksan[0]?.parentCity, '경주');
  assert.ok(oksan.some((row) => String(row.name).includes('하동')));
  assert.ok(oksan.some((row) => String(row.name).includes('정읍')));
  assert.ok(rows.findIndex((row) => row.hubId === 'gyeongju' && academyCore(row.name) === '옥산서원') < rows.findIndex((row) => String(row.name).includes('하동')));
  const dodongAt = rows.findIndex((row) => row.hubId === 'dalseong' && academyCore(row.name) === '도동서원');
  assert.equal(rows[dodongAt]?.parentCity, '달성');
  assert.ok(dodongAt < rows.findIndex((row) => String(row.name).includes('김천')));
  assert.ok(dodongAt < rows.findIndex((row) => String(row.name).includes('고창')));
  assert.equal(rows.find((row) => row.hubId === 'jangseong')?.parentCity, '장성');
  assert.equal(rows.find((row) => row.hubId === 'nonsan' && academyCore(row.name) === '돈암서원')?.parentCity, '논산');
  assert.equal(names.filter((name) => name.includes('서원구')).length, 0);
  assert.ok(names.some((name) => name.includes('군위')));
  assert.ok(names.some((name) => name.includes('대전')));
});

test('«옥산서원» and «도동서원» lead with Gyeongju and Dalseong', async () => {
  const oksan = await collectKoreaPoiTypeSearchCandidates('옥산서원', {
    lookupTourAttractions: async () => LIVE_HOMONYMS,
  });
  const dodong = await collectKoreaPoiTypeSearchCandidates('도동서원', {
    lookupTourAttractions: async () => LIVE_HOMONYMS,
  });
  assert.equal(oksan[0]?.hubId, 'gyeongju');
  assert.equal(oksan[0]?.parentCity, '경주');
  assert.ok(oksan.findIndex((row) => row.hubId === 'gyeongju') < oksan.findIndex((row) => String(row.addr1 || row.name).includes('하동')));
  assert.equal(dodong[0]?.hubId, 'dalseong');
  assert.equal(dodong[0]?.parentCity, '달성');
  assert.ok(dodong.findIndex((row) => row.hubId === 'dalseong') < dodong.findIndex((row) => String(row.name).includes('김천')));
  assert.ok(dodong.some((row) => String(row.name).includes('고창')));
});
