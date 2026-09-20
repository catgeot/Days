#!/usr/bin/env node
/**
 * F R02: 강원 5리스트 — koreaLocalScenicLists append + hub merge.
 * EXISTS: samcheok-sipgyeong · donghae-bijing → cheorwon-gugyeong · yeongwol-sipgyeong
 * skip_no_source: pyeongchang (시·군 단위 공식 N경 없음)
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

const R02_LISTS = [
  {
    listId: 'cheorwon-gugyeong',
    hubId: 'cheorwon',
    title: '철원9경',
    title_en: 'Cheorwon Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['철원 9경', '철원9경', '철원 구경'],
    sourceUrl: 'https://www.cwg.go.kr/tour/contents.do?key=1817',
    sourceOrg: '철원군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '고석정', linkStatus: 'linked' },
      {
        attractionName: '삼부연폭포',
        name_en: 'Sambuyeon Falls',
        kind: 'viewpoint',
        lat: 38.1396,
        lng: 127.3265,
        linkStatus: 'appended',
      },
      {
        attractionName: '직탕폭포',
        name_en: 'Jiktang Falls',
        kind: 'viewpoint',
        lat: 38.255,
        lng: 127.295,
        linkStatus: 'appended',
      },
      {
        attractionName: '매월대폭포',
        name_en: 'Maewoldae Falls',
        kind: 'viewpoint',
        lat: 38.22,
        lng: 127.25,
        linkStatus: 'appended',
      },
      {
        attractionName: '순담계곡',
        name_en: 'Sundam Valley',
        kind: 'park',
        lat: 38.24,
        lng: 127.28,
        linkStatus: 'appended',
      },
      {
        attractionName: '소이산 재송평',
        name_en: 'Soisan Red Pine Field',
        kind: 'viewpoint',
        lat: 38.21,
        lng: 127.22,
        linkStatus: 'appended',
      },
      {
        attractionName: '용양늪',
        name_en: 'Yongyang Swamp',
        kind: 'park',
        lat: 38.18,
        lng: 127.15,
        linkStatus: 'appended',
      },
      {
        attractionName: '송대소 주상절리',
        name_en: 'Songdaeso Columnar Joints',
        kind: 'landmark',
        lat: 38.19,
        lng: 127.29,
        linkStatus: 'appended',
      },
      {
        attractionName: '학저수지 여명',
        name_en: 'Hakjeo Reservoir Dawn',
        kind: 'viewpoint',
        lat: 38.2,
        lng: 127.3,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'yeongwol-sipgyeong',
    hubId: 'yeongwol',
    title: '영월10경',
    title_en: 'Yeongwol Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['영월 10경', '영월10경', '영월 십경'],
    sourceUrl: 'https://www.yw.go.kr/tour/contents.do?ctgry=5&key=559',
    sourceOrg: '영월군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '영월 장릉', linkStatus: 'linked' },
      { attractionName: '청령포', linkStatus: 'linked' },
      { attractionName: '별마로천문대', linkStatus: 'linked' },
      {
        attractionName: '김삿갓유적지',
        name_en: 'Kim Sat-gat Historic Site',
        kind: 'landmark',
        lat: 37.22,
        lng: 128.55,
        linkStatus: 'appended',
      },
      { attractionName: '고씨동굴', linkStatus: 'linked' },
      { attractionName: '선돌', linkStatus: 'linked' },
      {
        attractionName: '어라연',
        name_en: 'Eorayeon',
        kind: 'viewpoint',
        lat: 37.19,
        lng: 128.47,
        linkStatus: 'appended',
      },
      { attractionName: '한반도지형', linkStatus: 'linked' },
      {
        attractionName: '법흥사',
        name_en: 'Beopheungsa Temple',
        kind: 'temple',
        lat: 37.12,
        lng: 128.52,
        linkStatus: 'appended',
      },
      {
        attractionName: '요선암',
        name_en: 'Yoseonam',
        kind: 'temple',
        lat: 37.08,
        lng: 128.48,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'taebaek-palgyeong',
    hubId: 'taebaek',
    title: '태백8경',
    title_en: 'Taebaek Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['태백 팔경', '태백8경'],
    sourceUrl: 'https://tour.taebaek.go.kr/tour/tour/quest/tour_clear_springhead',
    sourceOrg: '태백시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '삼수령',
        name_en: 'Samsuryeong Pass',
        kind: 'viewpoint',
        lat: 37.15,
        lng: 129.05,
        linkStatus: 'appended',
      },
      { attractionName: '구문소', linkStatus: 'linked' },
      {
        attractionName: '장성하부고생대화석산지',
        name_en: 'Jangseong Lower Paleozoic Fossil Site',
        kind: 'landmark',
        lat: 37.18,
        lng: 129.02,
        linkStatus: 'appended',
      },
      { attractionName: '황지연못', linkStatus: 'linked' },
      {
        attractionName: '검룡소',
        name_en: 'Geomnyongso',
        kind: 'viewpoint',
        lat: 37.14,
        lng: 128.98,
        linkStatus: 'appended',
      },
      { attractionName: '태백산 천제단', linkStatus: 'linked' },
      {
        attractionName: '용연굴',
        name_en: 'Yongyeon Cave',
        kind: 'landmark',
        lat: 37.16,
        lng: 128.99,
        linkStatus: 'appended',
      },
      {
        attractionName: '절골마을관리휴양지',
        name_en: 'Jeolgol Village Recreation Area',
        kind: 'park',
        lat: 37.17,
        lng: 129.0,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'jeongseon-palgyeong',
    hubId: 'jeongseon',
    title: '화암8경',
    title_en: 'Hwaam Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['정선 화암8경', '화암 팔경', '화암8경'],
    sourceUrl: 'https://www.jeongseon.go.kr/tour/jeongseontour/attractions?contentSeq=419&mode=read',
    sourceOrg: '정선군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '화암약수',
        name_en: 'Hwaam Mineral Spring',
        kind: 'viewpoint',
        lat: 37.35,
        lng: 128.79,
        linkStatus: 'appended',
      },
      {
        attractionName: '거북바위',
        name_en: 'Geobuk Rock',
        kind: 'landmark',
        lat: 37.35,
        lng: 128.79,
        linkStatus: 'appended',
      },
      {
        attractionName: '용마소',
        name_en: 'Yongmaso',
        kind: 'viewpoint',
        lat: 37.36,
        lng: 128.78,
        linkStatus: 'appended',
      },
      { attractionName: '화암동굴', linkStatus: 'linked' },
      {
        attractionName: '화표주',
        name_en: 'Hwapyoju Rock',
        kind: 'landmark',
        lat: 37.34,
        lng: 128.77,
        linkStatus: 'appended',
      },
      {
        attractionName: '소금강',
        name_en: 'Sogeumgang Valley',
        kind: 'viewpoint',
        lat: 37.37,
        lng: 128.76,
        linkStatus: 'appended',
      },
      {
        attractionName: '몰운대',
        name_en: 'Molundae Cliff',
        kind: 'viewpoint',
        lat: 37.38,
        lng: 128.75,
        linkStatus: 'appended',
      },
      {
        attractionName: '광대곡',
        name_en: 'Gwangdaegok Valley',
        kind: 'park',
        lat: 37.36,
        lng: 128.74,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'hwacheon-gugyeong',
    hubId: 'hwacheon',
    title: '화천9경',
    title_en: 'Hwacheon Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['화천 9경', '화천9경', '화천 구경'],
    sourceUrl: 'https://tour.ihc.go.kr/tour/theme/nine_views',
    sourceOrg: '화천군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '파로호', linkStatus: 'linked' },
      {
        attractionName: '딴산',
        name_en: 'Ttansan',
        kind: 'viewpoint',
        lat: 38.1,
        lng: 127.72,
        linkStatus: 'appended',
      },
      { attractionName: '비수구미계곡', linkStatus: 'linked' },
      { attractionName: '평화의댐', linkStatus: 'linked' },
      {
        attractionName: '용화산',
        name_en: 'Yonghwasan',
        kind: 'viewpoint',
        lat: 38.08,
        lng: 127.7,
        linkStatus: 'appended',
      },
      {
        attractionName: '비래바위',
        name_en: 'Birae Rock',
        kind: 'landmark',
        lat: 38.05,
        lng: 127.65,
        linkStatus: 'appended',
      },
      {
        attractionName: '용담계곡',
        name_en: 'Yongdam Valley',
        kind: 'park',
        lat: 38.04,
        lng: 127.6,
        linkStatus: 'appended',
      },
      {
        attractionName: '화악산',
        name_en: 'Hwaaksan',
        kind: 'viewpoint',
        lat: 38.02,
        lng: 127.55,
        linkStatus: 'appended',
      },
      {
        attractionName: '광덕산',
        name_en: 'Gwangdeoksan',
        kind: 'viewpoint',
        lat: 38.0,
        lng: 127.5,
        linkStatus: 'appended',
      },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R02_LISTS) {
  if (existingIds.has(list.listId)) {
    throw new Error(`listId already exists: ${list.listId}`);
  }
}

const EXISTS_SKIP = ['samcheok-sipgyeong', 'donghae-bijing'];
for (const id of EXISTS_SKIP) {
  if (!existingIds.has(id)) {
    throw new Error(`expected EXISTS on tip: ${id}`);
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

for (const list of R02_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R02_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R02:', R02_LISTS.map((l) => l.listId).join(', '));
console.log('EXISTS skip:', EXISTS_SKIP.join(', '));
console.log('skip_no_source: pyeongchang (시·군 단위 공식 N경 없음)');
