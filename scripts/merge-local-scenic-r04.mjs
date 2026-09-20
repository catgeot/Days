#!/usr/bin/env node
/**
 * F R04: 충북 2리스트 — koreaLocalScenicLists append + hub merge.
 * WorkerA: danyang-palgyeong · jecheon-sipgyeong
 * skip_no_source: chungju · cheongju · boeun · goesan (시·군 단위 공식 N경 없음)
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

const R04_LISTS = [
  {
    listId: 'danyang-palgyeong',
    hubId: 'danyang',
    title: '단양팔경',
    title_en: 'Danyang Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['단양 팔경', '단양8경', '단양군 팔경'],
    sourceUrl: 'https://www.danyang.go.kr/tour/1916',
    sourceOrg: '단양군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '도담삼봉', linkStatus: 'linked' },
      {
        attractionName: '석문',
        name_en: 'Seokmun Gate Rock',
        kind: 'landmark',
        lat: 37.0027238,
        lng: 128.3433158,
        linkStatus: 'appended',
      },
      { attractionName: '사인암', linkStatus: 'linked' },
      { attractionName: '구담봉', linkStatus: 'linked' },
      {
        attractionName: '옥순봉',
        name_en: 'Oksunbong Peak',
        kind: 'viewpoint',
        lat: 36.9437039,
        lng: 128.2371912,
        linkStatus: 'appended',
      },
      {
        attractionName: '상선암',
        name_en: 'Sangseonam Rock',
        kind: 'landmark',
        lat: 36.8717033,
        lng: 128.2959419,
        linkStatus: 'appended',
      },
      {
        attractionName: '중선암',
        name_en: 'Jungseonam Rock',
        kind: 'landmark',
        lat: 36.878353,
        lng: 128.298232,
        linkStatus: 'appended',
      },
      {
        attractionName: '하선암',
        name_en: 'Haseonam Rock',
        kind: 'landmark',
        lat: 36.9081177,
        lng: 128.3092207,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'jecheon-sipgyeong',
    hubId: 'jecheon',
    title: '제천10경',
    title_en: 'Jecheon Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['제천 십경', '제천10경', '堤川十景'],
    sourceUrl:
      'https://tour.jecheon.go.kr/tour/jtour/contents/view?contentsNo=39&menuLevel=3&menuNo=329',
    sourceOrg: '제천시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '의림지', linkStatus: 'linked' },
      {
        attractionName: '박달재',
        name_en: 'Bakdaljae Pass',
        kind: 'viewpoint',
        lat: 37.149436,
        lng: 128.047069,
        linkStatus: 'appended',
      },
      { attractionName: '월악산', linkStatus: 'linked' },
      { attractionName: '청풍문화재단지', linkStatus: 'linked' },
      {
        attractionName: '금수산',
        name_en: 'Geumsusan Mountain',
        kind: 'viewpoint',
        lat: 36.9847255,
        lng: 128.2569094,
        linkStatus: 'appended',
      },
      {
        attractionName: '용하구곡',
        name_en: 'Yongha Valley',
        kind: 'park',
        lat: 36.8479514,
        lng: 128.1884301,
        linkStatus: 'appended',
      },
      { attractionName: '송계계곡', linkStatus: 'linked' },
      {
        attractionName: '제천 옥순봉',
        name_en: 'Jecheon Oksunbong Peak',
        kind: 'viewpoint',
        lat: 36.9437039,
        lng: 128.2371912,
        linkStatus: 'appended',
      },
      {
        attractionName: '탁사정',
        name_en: 'Taksajeong Pavilion',
        kind: 'viewpoint',
        lat: 37.1665854,
        lng: 128.1083244,
        linkStatus: 'appended',
      },
      {
        attractionName: '배론성지',
        name_en: 'Baeron Holy Ground',
        kind: 'landmark',
        lat: 37.1597651,
        lng: 128.0841016,
        linkStatus: 'appended',
      },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R04_LISTS) {
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

for (const list of R04_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R04_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R04:', R04_LISTS.map((l) => l.listId).join(', '));
console.log(
  'skip_no_source: chungju · cheongju · boeun · goesan (시·군 단위 공식 N경 없음 — chungju.go.kr·cheongju.go.kr·boeun.go.kr·goesan.go.kr)',
);
