#!/usr/bin/env node
/**
 * P0 파일럿: 홍천9경·양구9경·인제8경 — koreaLocalScenicLists + hub append (일회성).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const listsPath = join(root, 'src/pages/Home/data/koreaLocalScenicLists.json');
const hubsPath = join(root, 'src/pages/Home/data/cityAttractionHubs.json');

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

const LISTS = [
  {
    listId: 'hongcheon-palgyeong',
    hubId: 'hongcheon',
    title: '홍천9경',
    title_en: 'Hongcheon Nine Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 9,
    aliases: ['홍천 팔경', '홍천군 팔경', '홍천9경'],
    sourceUrl:
      'https://www.hongcheon.go.kr/tour/selectTourCntntsWebList.do?ctgry=6&key=2035',
    sourceOrg: '홍천군',
    sourceFetchedAt: '2026-09-01',
    status: 'verified',
    members: [
      {
        attractionName: '홍천 팔봉산',
        name_en: 'Palbongsan',
        kind: 'park',
        lat: 37.695654675826525,
        lng: 127.6966173486738,
        linkStatus: 'appended',
      },
      {
        attractionName: '가리산',
        name_en: 'Garisan',
        kind: 'park',
        lat: 37.8639443482971,
        lng: 127.9846529189285,
        linkStatus: 'appended',
      },
      {
        attractionName: '미약골',
        name_en: 'Miyakgol Valley',
        kind: 'viewpoint',
        lat: 37.7306906334682,
        lng: 128.292608190439,
        linkStatus: 'appended',
      },
      {
        attractionName: '금학산',
        name_en: 'Geumhaksan',
        kind: 'viewpoint',
        lat: 37.71953808041714,
        lng: 127.7741850998237,
        linkStatus: 'appended',
      },
      {
        attractionName: '가령폭포',
        name_en: 'Garyeong Falls',
        kind: 'viewpoint',
        lat: 37.82909861024825,
        lng: 128.1582283826314,
        linkStatus: 'appended',
      },
      {
        attractionName: '공작산 수타사',
        name_en: 'Gongjaksan Suta Temple',
        kind: 'temple',
        lat: 37.69570386540188,
        lng: 127.9545225935472,
        linkStatus: 'appended',
      },
      {
        attractionName: '용소계곡',
        name_en: 'Yongso Valley',
        kind: 'park',
        lat: 37.8616996,
        lng: 128.1354762,
        linkStatus: 'appended',
      },
      {
        attractionName: '살둔계곡',
        name_en: 'Saldun Valley',
        kind: 'park',
        lat: 37.79795,
        lng: 128.35406,
        linkStatus: 'appended',
      },
      {
        attractionName: '삼봉약수',
        name_en: 'Sambong Mineral Spring',
        kind: 'landmark',
        lat: 37.857565,
        lng: 128.4636046,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'yanggu-gugyeong',
    hubId: 'yanggu',
    title: '양구9경',
    title_en: 'Yanggu Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['양구 구경', '양구9경', '양구 팔경'],
    sourceUrl: 'https://www.ygtour.kr/Home/H70000/placeDetail?place_no=118',
    sourceOrg: '양구군',
    sourceFetchedAt: '2026-09-01',
    status: 'verified',
    members: [
      { attractionName: '양구 수목원', linkStatus: 'linked' },
      { attractionName: '양구 한반도섬', linkStatus: 'linked' },
      { attractionName: '양구 두타연', linkStatus: 'linked' },
      { attractionName: '양구 박수근미술관', linkStatus: 'linked' },
      { attractionName: '양구백자박물관', linkStatus: 'linked' },
      {
        attractionName: '양구 펀치볼',
        name_en: 'Yanggu Punchbowl',
        kind: 'viewpoint',
        lat: 38.2882746790787,
        lng: 128.143418369818,
        linkStatus: 'appended',
      },
      {
        attractionName: '양구 봉화산',
        name_en: 'Yanggu Bonghwasan',
        kind: 'viewpoint',
        lat: 38.0850703267101,
        lng: 127.997401498552,
        linkStatus: 'appended',
      },
      {
        attractionName: '양구 상무룡 출렁다리',
        name_en: 'Yanggu Sangmuryong Suspension Bridge',
        kind: 'landmark',
        lat: 38.116445141129,
        lng: 127.896876973061,
        linkStatus: 'appended',
      },
      {
        attractionName: '양구 광치계곡',
        name_en: 'Yanggu Gwangchi Valley',
        kind: 'park',
        lat: 38.137451046534,
        lng: 128.061541678097,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'inje-palgyeong',
    hubId: 'inje',
    title: '인제8경',
    title_en: 'Inje Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['인제 팔경', '인제8경'],
    sourceUrl: 'https://injetour.co.kr/scenics/index',
    sourceOrg: '인제군',
    sourceFetchedAt: '2026-09-01',
    status: 'verified',
    members: [
      {
        attractionName: '대청봉',
        name_en: 'Daecheongbong Peak',
        kind: 'viewpoint',
        lat: 38.1206702,
        lng: 128.3982591,
        linkStatus: 'appended',
      },
      { attractionName: '대암산 용늪', linkStatus: 'linked' },
      {
        attractionName: '대승폭포',
        name_en: 'Daeseung Falls',
        kind: 'viewpoint',
        lat: 38.125713,
        lng: 128.3418533,
        linkStatus: 'appended',
      },
      { attractionName: '십이선녀탕', linkStatus: 'linked' },
      {
        attractionName: '내린천계곡',
        name_en: 'Naerincheon Valley',
        kind: 'park',
        lat: 37.9467452,
        lng: 128.3104194,
        linkStatus: 'appended',
      },
      {
        attractionName: '방동약수',
        name_en: 'Bangdong Mineral Spring',
        kind: 'landmark',
        lat: 37.9438021,
        lng: 128.3963164,
        linkStatus: 'appended',
      },
      { attractionName: '백담사', linkStatus: 'linked' },
      {
        attractionName: '합강정',
        name_en: 'Hapgangjeong Pavilion',
        kind: 'viewpoint',
        lat: 38.0769814,
        lng: 128.1863804,
        linkStatus: 'appended',
      },
    ],
  },
];

const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

function addAliases(hub, titles) {
  if (!hub.aliases) hub.aliases = [];
  const seen = new Set(hub.aliases.map(normalizeKey));
  for (const t of titles) {
    const nk = normalizeKey(t);
    if (!nk || seen.has(nk)) continue;
    hub.aliases.push(t);
    seen.add(nk);
  }
}

function mergeListIntoHub(list) {
  const hub = hubs.find((h) => h.hubId === list.hubId);
  if (!hub) throw new Error(`hub missing ${list.hubId}`);
  if (!hub.attractions) hub.attractions = [];

  const attrKeys = new Set(hub.attractions.map((a) => normalizeKey(a.name)));

  addAliases(hub, [list.title, ...(list.aliases || [])]);

  for (const m of list.members) {
    const key = normalizeKey(m.attractionName);
    if (m.linkStatus === 'linked') {
      if (!attrKeys.has(key)) {
        throw new Error(`${list.listId}: linked missing in hub: ${m.attractionName}`);
      }
      continue;
    }
    if (m.linkStatus === 'appended') {
      if (attrKeys.has(key)) {
        throw new Error(`${list.listId}: appended already exists: ${m.attractionName}`);
      }
      const row = {
        name: m.attractionName,
        name_en: m.name_en,
        kind: m.kind,
        lat: m.lat,
        lng: m.lng,
      };
      if (m.mapboxId != null) row.mapboxId = m.mapboxId;
      hub.attractions.push(row);
      attrKeys.add(key);
    }
  }
}

for (const list of LISTS) mergeListIntoHub(list);

writeFileSync(listsPath, `${JSON.stringify(LISTS, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged P0:', LISTS.map((l) => l.listId).join(', '));
