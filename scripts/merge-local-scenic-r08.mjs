#!/usr/bin/env node
/**
 * F R08: 경북 2리스트 — koreaLocalScenicLists append + hub merge.
 * WorkerB: uiseong-binggye-palgyeong · seongju-sipgyeong
 * skip: uljin · goryeong · gunwi · chilgok skip_no_source
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

const R08_LISTS = [
  {
    listId: 'uiseong-binggye-palgyeong',
    hubId: 'uiseong',
    title: '빙계팔경',
    title_en: 'Binggye Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['빙계 팔경', '빙계8경', '의성 빙계팔경'],
    sourceUrl:
      'https://www.usc.go.kr/tour/page.do?cmd=2&code_uid=1067&conts_uid=25&mnu_uid=2165',
    sourceOrg: '의성군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '빙계 빙혈',
        name_en: 'Binggye Ice Cave',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '빙계 풍혈',
        name_en: 'Binggye Wind Cave',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '빙계 인암',
        name_en: 'Binggye Inam Rock',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '빙계 의각',
        name_en: 'Binggye Uigak Pavilion',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '빙계 수대',
        name_en: 'Binggye Water Mill Site',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '빙산사지 오층석탑',
        name_en: 'Bingsansa Five-story Stone Pagoda',
        kind: 'landmark',
        lat: 36.238134,
        lng: 128.770856,
        linkStatus: 'appended',
      },
      {
        attractionName: '빙계 불정',
        name_en: 'Binggye Buljeong Peak',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '빙계 용추',
        name_en: 'Binggye Dragon Pool',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
    ],
  },
  {
    listId: 'seongju-sipgyeong',
    hubId: 'seongju',
    title: '성주10경',
    title_en: 'Seongju Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['성주 10경', '성주10경', '성주 십경'],
    sourceUrl: 'https://www.sj.go.kr/tour/page.do?mnu_uid=3820',
    sourceOrg: '성주군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '성주 가야산',
        name_en: 'Seongju Gayasan',
        kind: 'viewpoint',
        lat: 35.803262,
        lng: 128.147799,
        linkStatus: 'linked',
      },
      {
        attractionName: '성주 독용산성',
        name_en: 'Dokyongsanseong Seongju',
        kind: 'landmark',
        lat: 35.9034834,
        lng: 128.1117824,
        linkStatus: 'linked',
      },
      {
        attractionName: '회연서원',
        name_en: 'Hoeyeon Seowon',
        kind: 'shrine',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '포천계곡',
        name_en: 'Pocheon Valley',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '성주 성밖숲',
        name_en: 'Seongbak Forest Seongju',
        kind: 'park',
        lat: 35.915522511036,
        lng: 128.280109593585,
        linkStatus: 'linked',
      },
      {
        attractionName: '세종대왕자태실',
        name_en: 'King Sejong Birthplace',
        kind: 'landmark',
        lat: 35.9743171,
        lng: 128.2866588,
        linkStatus: 'appended',
      },
      {
        attractionName: '성주 한개마을',
        name_en: 'Hangae Village Seongju',
        kind: 'neighborhood',
        lat: 35.8955,
        lng: 128.2455,
        linkStatus: 'linked',
      },
      {
        attractionName: '성주역사테마공원',
        name_en: 'Seongju History Theme Park',
        kind: 'park',
        lat: 35.9220537,
        lng: 128.2834101,
        linkStatus: 'appended',
      },
      {
        attractionName: '성산동 고분군',
        name_en: 'Seongsan-dong Tombs',
        kind: 'museum',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '성주참외하우스 들녘',
        name_en: 'Seongju Melon House Fields',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R08_LISTS) {
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

for (const list of R08_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R08_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R08:', R08_LISTS.map((l) => l.listId).join(', '));
console.log(
  'skip_no_source: uljin · goryeong · gunwi · chilgok (시·군 단위 공식 N경 SSOT 없음)',
);
