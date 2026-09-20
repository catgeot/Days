#!/usr/bin/env node
/**
 * F R05: 충북 5리스트 — koreaLocalScenicLists append + hub merge.
 * WorkerA: okcheon-gugyeong · yeongdong-yangsan-palgyeong · yeongdong-hancheon-palgyeong · jincheon-palgyeong
 * WorkerB: jeungpyeong-gugyeong
 * skip_no_source: eumseong (시·군 단위 공식 N경 없음 — eumseong.go.kr/tour)
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

const R05_LISTS = [
  {
    listId: 'okcheon-gugyeong',
    hubId: 'okcheon',
    title: '옥천9경',
    title_en: 'Okcheon Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['옥천 9경', '옥천구경', '옥천군 9경'],
    sourceUrl: 'https://www.oc.go.kr/tour/contents.do?key=3829',
    sourceOrg: '옥천군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '옥천 둔주봉', linkStatus: 'linked' },
      {
        attractionName: '옛37번 국도변 벚꽃길',
        name_en: 'Old Route 37 Cherry Blossom Road',
        kind: 'viewpoint',
        lat: 36.3212274,
        lng: 127.5853017,
        linkStatus: 'appended',
      },
      {
        attractionName: '부소담악',
        name_en: 'Busodamak',
        kind: 'viewpoint',
        lat: 36.3510085,
        lng: 127.5651863,
        linkStatus: 'appended',
      },
      {
        attractionName: '용암사 일출',
        name_en: 'Yongamsa Temple Sunrise',
        kind: 'temple',
        lat: 36.2595224,
        lng: 127.5644274,
        linkStatus: 'appended',
      },
      {
        attractionName: '장령산자연휴양림',
        name_en: 'Jangnyeongsan Recreational Forest',
        kind: 'park',
        lat: 36.2443543,
        lng: 127.5554117,
        linkStatus: 'appended',
      },
      { attractionName: '옥천 장계관광지', linkStatus: 'linked' },
      {
        attractionName: '금강유원지',
        name_en: 'Geumgang Resort',
        kind: 'park',
        lat: 36.2876041,
        lng: 127.6534897,
        linkStatus: 'appended',
      },
      {
        attractionName: '향수호수길',
        name_en: 'Hyangsu Lake Trail',
        kind: 'park',
        lat: 36.3482881,
        lng: 127.6110257,
        linkStatus: 'appended',
      },
      {
        attractionName: '옥천 구읍',
        name_en: 'Okcheon Old Village',
        kind: 'neighborhood',
        lat: 36.3295181,
        lng: 127.5558726,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'yeongdong-yangsan-palgyeong',
    hubId: 'yeongdong',
    title: '양산팔경',
    title_en: 'Yangsan Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['양산 팔경', '영동 양산팔경', '영동군 양산팔경'],
    sourceUrl: 'https://tour.yd21.go.kr/tour/html/sub01/0101.html',
    sourceOrg: '영동군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '영동 영국사', linkStatus: 'linked' },
      {
        attractionName: '강선대',
        name_en: 'Gangseondae Pavilion',
        kind: 'viewpoint',
        lat: 36.1310315,
        lng: 127.6829461,
        linkStatus: 'appended',
      },
      {
        attractionName: '비봉산',
        name_en: 'Bibongsan',
        kind: 'viewpoint',
        lat: 36.1216203,
        lng: 127.6501608,
        linkStatus: 'appended',
      },
      {
        attractionName: '봉황대',
        name_en: 'Bonghwangdae Pavilion',
        kind: 'viewpoint',
        lat: 36.1354442,
        lng: 127.6560459,
        linkStatus: 'appended',
      },
      {
        attractionName: '함벽정',
        name_en: 'Hambyeokjeong Pavilion',
        kind: 'viewpoint',
        lat: 36.1342362,
        lng: 127.6706742,
        linkStatus: 'appended',
      },
      {
        attractionName: '여의정',
        name_en: 'Yeouijeong Pavilion',
        kind: 'viewpoint',
        lat: 36.1306308,
        lng: 127.6780942,
        linkStatus: 'appended',
      },
      {
        attractionName: '자풍서당',
        name_en: 'Japung Seodang Academy',
        kind: 'landmark',
        lat: 36.1595,
        lng: 127.6125,
        linkStatus: 'appended',
      },
      {
        attractionName: '용암',
        name_en: 'Yongam Rock',
        kind: 'viewpoint',
        lat: 36.1555,
        lng: 127.7855,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'yeongdong-hancheon-palgyeong',
    hubId: 'yeongdong',
    title: '한천팔경',
    title_en: 'Hancheon Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['한천 팔경', '영동 한천팔경', '월류봉 팔경'],
    sourceUrl: 'https://www.yd21.go.kr/tour/html/sub01/01040206.html',
    sourceOrg: '영동군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '월류봉', linkStatus: 'linked' },
      {
        attractionName: '화헌악',
        name_en: 'Hwaheonyak',
        kind: 'viewpoint',
        lat: 36.22824,
        lng: 127.88763,
        linkStatus: 'appended',
      },
      {
        attractionName: '용연대',
        name_en: 'Yongyeondae',
        kind: 'viewpoint',
        lat: 36.2275,
        lng: 127.8865,
        linkStatus: 'appended',
      },
      {
        attractionName: '산양벽',
        name_en: 'Sanyangbyeok Cliff',
        kind: 'viewpoint',
        lat: 36.2268,
        lng: 127.8858,
        linkStatus: 'appended',
      },
      {
        attractionName: '청학굴',
        name_en: 'Cheonghak Cave',
        kind: 'viewpoint',
        lat: 36.2255,
        lng: 127.8842,
        linkStatus: 'appended',
      },
      {
        attractionName: '법존암',
        name_en: 'Beopjonam Hermitage',
        kind: 'temple',
        lat: 36.2248,
        lng: 127.8835,
        linkStatus: 'appended',
      },
      {
        attractionName: '사군봉',
        name_en: 'Sagunbong',
        kind: 'viewpoint',
        lat: 36.24587,
        lng: 127.90375,
        linkStatus: 'appended',
      },
      {
        attractionName: '냉천정',
        name_en: 'Naengcheonjeong Pavilion',
        kind: 'viewpoint',
        lat: 36.2235,
        lng: 127.882,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'jincheon-palgyeong',
    hubId: 'jincheon',
    title: '상산팔경',
    title_en: 'Sangsan Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['상산 팔경', '진천 상산팔경', '진천군 상산팔경', '상산8경'],
    sourceUrl: 'https://www.jincheon.go.kr/site/tour/main.do',
    sourceOrg: '진천군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '평사낙안',
        name_en: 'Pyeongsanakgan',
        kind: 'viewpoint',
        lat: 36.892,
        lng: 127.498,
        linkStatus: 'appended',
      },
      {
        attractionName: '우담제월',
        name_en: 'Udammje Wol',
        kind: 'viewpoint',
        lat: 36.884,
        lng: 127.506,
        linkStatus: 'appended',
      },
      {
        attractionName: '금계완사',
        name_en: 'Geumgyewansa',
        kind: 'viewpoint',
        lat: 36.9870019,
        lng: 127.4373695,
        linkStatus: 'appended',
      },
      {
        attractionName: '두타모종',
        name_en: 'Dutamojong',
        kind: 'viewpoint',
        lat: 36.8305681,
        lng: 127.5661495,
        linkStatus: 'appended',
      },
      {
        attractionName: '상산모운',
        name_en: 'Sangsanmoun',
        kind: 'viewpoint',
        lat: 36.782,
        lng: 127.472,
        linkStatus: 'appended',
      },
      {
        attractionName: '농암모설',
        name_en: 'Nongammoseol',
        kind: 'viewpoint',
        lat: 36.8260662,
        lng: 127.4933092,
        linkStatus: 'appended',
      },
      {
        attractionName: '어은계석',
        name_en: 'Eoungeyesok',
        kind: 'viewpoint',
        lat: 36.896,
        lng: 127.484,
        linkStatus: 'appended',
      },
      {
        attractionName: '적대청람',
        name_en: 'Jeokdaecheongram',
        kind: 'viewpoint',
        lat: 36.888,
        lng: 127.502,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'jeungpyeong-gugyeong',
    hubId: 'jeungpyeong',
    title: '증평구경',
    title_en: 'Jeungpyeong Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['증평 구경', '증평구(九)경', '증평 9경'],
    sourceUrl: 'https://www.jp.go.kr/tour/sub01_09.do',
    sourceOrg: '증평군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '증평 보강천 미루나무숲', linkStatus: 'linked' },
      {
        attractionName: '명상구름다리',
        name_en: 'Meditation Cloud Bridge',
        kind: 'landmark',
        lat: 36.84,
        lng: 127.62,
        linkStatus: 'appended',
      },
      {
        attractionName: '좌구산 천문대',
        name_en: 'Jwagusan Observatory',
        kind: 'landmark',
        lat: 36.7063,
        lng: 127.6512,
        linkStatus: 'appended',
      },
      {
        attractionName: '삼기저수지 등잔길',
        name_en: 'Samgi Reservoir Lantern Trail',
        kind: 'park',
        lat: 36.7187000,
        lng: 127.6238573,
        linkStatus: 'appended',
      },
      { attractionName: '증평 에듀팜', linkStatus: 'linked' },
      {
        attractionName: '연암지질생태공원',
        name_en: 'Yeonam Geopark',
        kind: 'park',
        lat: 36.8226,
        lng: 127.5953,
        linkStatus: 'appended',
      },
      {
        attractionName: '추성산성',
        name_en: 'Chuseongsanseong Fortress',
        kind: 'landmark',
        lat: 36.815,
        lng: 127.61,
        linkStatus: 'appended',
      },
      { attractionName: '증평민속체험박물관', linkStatus: 'linked' },
      {
        attractionName: '연병호 항일역사공원',
        name_en: 'Yeonbyeongho Anti-Japanese History Park',
        kind: 'museum',
        lat: 36.8209,
        lng: 127.6223,
        linkStatus: 'appended',
      },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R05_LISTS) {
  if (existingIds.has(list.listId)) {
    throw new Error(`listId already exists: ${list.listId}`);
  }
}

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

for (const list of R05_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R05_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R05:', R05_LISTS.map((l) => l.listId).join(', '));
console.log(
  'skip_no_source: eumseong (시·군 단위 공식 N경 없음 — eumseong.go.kr/tour)',
);
