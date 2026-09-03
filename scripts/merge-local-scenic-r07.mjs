#!/usr/bin/env node
/**
 * F R07: 경북 3리스트 — koreaLocalScenicLists append + hub merge.
 * WorkerA: mungyeong-palgyeong (verified)
 * WorkerB: yecheon-palgyeong · yeongdeok-sipgyeong (verified)
 * skip: yeongju · bonghwa skip_no_source · cheongsong skip_ambiguous
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

const R07_LISTS = [
  {
    listId: 'mungyeong-palgyeong',
    hubId: 'mungyeong',
    title: '문경8경',
    title_en: 'Mungyeong Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['문경 팔경', '문경시 팔경', '문경 8 경'],
    sourceUrl: 'https://www.gbmg.go.kr/tour/contents.do?mId=0201010000',
    sourceOrg: '문경시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '새재계곡',
        name_en: 'Saejae Valley',
        kind: 'park',
        lat: 36.7585,
        lng: 128.0776,
        linkStatus: 'appended',
      },
      {
        attractionName: '선유동계곡',
        name_en: 'Seonyudong Valley',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '용추계곡',
        name_en: 'Yongchu Valley',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '쌍용계곡',
        name_en: 'Ssangyong Valley',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '진남교반',
        name_en: 'Jinnamgyoban',
        kind: 'viewpoint',
        lat: 36.662074,
        lng: 128.126468,
        linkStatus: 'linked',
      },
      {
        attractionName: '운달계곡',
        name_en: 'Undal Valley',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '경천호',
        name_en: 'Gyeongcheon Lake',
        kind: 'park',
        lat: 36.707606,
        lng: 128.312229,
        linkStatus: 'appended',
      },
      {
        attractionName: '봉암사백운대',
        name_en: 'Bongamsa Baekundai',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
    ],
  },
  {
    listId: 'yecheon-palgyeong',
    hubId: 'yecheon',
    title: '예천8경',
    title_en: 'Yecheon Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['예천 8경', '예천팔경', '예천 관광8경'],
    sourceUrl: 'https://www.insect-expo.org/attraction',
    sourceOrg: '예천군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '회룡포',
        name_en: 'Hoeryongpo',
        kind: 'viewpoint',
        lat: 36.619575,
        lng: 128.367378,
        linkStatus: 'linked',
      },
      {
        attractionName: '삼강주막',
        name_en: 'Samgang Tavern',
        kind: 'landmark',
        lat: 36.5629092,
        lng: 128.2980836,
        linkStatus: 'appended',
      },
      {
        attractionName: '금당실 전통마을과 송림',
        name_en: 'Geumdangsil Traditional Village and Pine Grove',
        kind: 'neighborhood',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '초간정',
        name_en: 'Choganjeong Pavilion',
        kind: 'landmark',
        lat: 36.7013269,
        lng: 128.3818331,
        linkStatus: 'linked',
      },
      {
        attractionName: '예천 용문사',
        name_en: 'Yecheon Yongmunsa',
        kind: 'temple',
        lat: 36.7311168,
        lng: 128.3689996,
        linkStatus: 'linked',
      },
      {
        attractionName: '예천곤충생태원',
        name_en: 'Yecheon Insect Ecological Park',
        kind: 'museum',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '석송령',
        name_en: 'Seoksongnyeong Pine',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '선몽대',
        name_en: 'Seonmongdae Pavilion',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
    ],
  },
  {
    listId: 'yeongdeok-sipgyeong',
    hubId: 'yeongdeok',
    title: '영덕9경',
    title_en: 'Yeongdeok Nine Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 9,
    aliases: ['영덕 9경', '영덕9경', '영덕구경'],
    sourceUrl: 'https://tour.yd.go.kr/kor/thema/themaList.aspx?MC=108001&idx=108000',
    sourceOrg: '영덕군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '영덕 해맞이공원',
        name_en: 'Yeongdeok Sunrise Park',
        kind: 'park',
        lat: 36.416,
        lng: 129.43,
        linkStatus: 'linked',
      },
      {
        attractionName: '영덕 삼사해상공원',
        name_en: 'Yeongdeok Samsa Maritime Park',
        kind: 'park',
        lat: 36.3483689,
        lng: 129.3849301,
        linkStatus: 'appended',
      },
      {
        attractionName: '영덕 도천숲',
        name_en: 'Yeongdeok Dochon Forest',
        kind: 'park',
        lat: 36.3067207,
        lng: 129.3524499,
        linkStatus: 'appended',
      },
      {
        attractionName: '영덕 팔각산',
        name_en: 'Yeongdeok Palgaksan',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '영덕 사월의 복사꽃',
        name_en: 'Yeongdeok April Camellia Blossoms',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '영덕 죽도산',
        name_en: 'Yeongdeok Jukdosan',
        kind: 'park',
        lat: 36.5074722,
        lng: 129.4510917,
        linkStatus: 'appended',
      },
      {
        attractionName: '영덕 괴시리전통마을',
        name_en: 'Yeongdeok Goesiri Traditional Village',
        kind: 'neighborhood',
        lat: 36.5439219,
        lng: 129.4168239,
        linkStatus: 'appended',
      },
      {
        attractionName: '영덕 고래불해수욕장',
        name_en: 'Yeongdeok Goraebul Beach',
        kind: 'beach',
        lat: 36.521,
        lng: 129.441,
        linkStatus: 'linked',
      },
      {
        attractionName: '영덕 나옹왕사 사적비',
        name_en: 'Yeongdeok Naongwangsa Stele',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R07_LISTS) {
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
    if (m.linkStatus === 'pending_coord') continue;
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

for (const list of R07_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R07_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R07:', R07_LISTS.map((l) => l.listId).join(', '));
console.log(
  'skip: yeongju · bonghwa skip_no_source · cheongsong skip_ambiguous',
);
