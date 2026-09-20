#!/usr/bin/env node
/**
 * F R06: 경북 2리스트 — koreaLocalScenicLists append + hub merge.
 * WorkerA+B: gyeongju-8gwae · pohang-sipgyeong
 * skip_no_source: andong · gumi · sangju · gimcheon (시·군 단위 공식 N경 SSOT 없음)
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

const R06_LISTS = [
  {
    listId: 'gyeongju-8gwae',
    hubId: 'gyeongju',
    title: '경주8怪',
    title_en: 'Gyeongju Eight Wonders',
    listKind: 'other',
    memberCountClaimed: 8,
    aliases: ['경주 8怪', '경주 팔괴', '삼보3기8괴', '3보3기8괴'],
    sourceUrl: 'https://gyeongju.go.kr/open_content/ko/page.do?mnu_uid=4239',
    sourceOrg: '경주시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '남산부석',
        name_en: 'Namsan Floating Rock',
        kind: 'landmark',
        lat: 35.794,
        lng: 129.063,
        linkStatus: 'appended',
      },
      {
        attractionName: '문천도사',
        name_en: 'Muncheon Upside-down Sand',
        kind: 'viewpoint',
        lat: 35.84,
        lng: 129.21,
        linkStatus: 'appended',
      },
      {
        attractionName: '계림황엽',
        name_en: 'Gyeryim Yellow Leaves',
        kind: 'park',
        lat: 35.828,
        lng: 129.215,
        linkStatus: 'appended',
      },
      {
        attractionName: '압지부평',
        name_en: 'Apji Duckweed',
        kind: 'landmark',
        lat: 35.8329004,
        lng: 129.2267647,
        linkStatus: 'appended',
      },
      {
        attractionName: '백율송순',
        name_en: 'Baekyul Pine Shoots',
        kind: 'park',
        lat: 36.015,
        lng: 129.0,
        linkStatus: 'appended',
      },
      {
        attractionName: '금장낙안',
        name_en: 'Geumjang Falling Geese',
        kind: 'viewpoint',
        lat: 35.85,
        lng: 129.28,
        linkStatus: 'appended',
      },
      {
        attractionName: '불국영지',
        name_en: 'Bulguk Shadow Pond',
        kind: 'landmark',
        lat: 35.7889948,
        lng: 129.3308902,
        linkStatus: 'appended',
      },
      {
        attractionName: '나원백탑',
        name_en: 'Nawon White Pagoda',
        kind: 'landmark',
        lat: 35.8936438,
        lng: 129.2123178,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'pohang-sipgyeong',
    hubId: 'pohang',
    title: '포항12경',
    title_en: 'Pohang Twelve Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 12,
    aliases: ['포항 12경', '포항12경', '포항 십이경'],
    sourceUrl:
      'https://www.pohang.go.kr/phtour/wmap/tourInformation/index.do?menu_idx=45&representative_views=true',
    sourceOrg: '포항시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '호미곶 일출',
        name_en: 'Homigot Sunrise',
        kind: 'viewpoint',
        lat: 36.0767516,
        lng: 129.5700631,
        linkStatus: 'appended',
      },
      {
        attractionName: '내연산 12폭포',
        name_en: 'Naeyeonsan Twelve Falls',
        kind: 'viewpoint',
        lat: 36.352,
        lng: 129.385,
        linkStatus: 'appended',
      },
      {
        attractionName: '운제산 오어사 사계',
        name_en: 'Unjesan Oeosa Four Seasons',
        kind: 'temple',
        lat: 35.992,
        lng: 129.318,
        linkStatus: 'appended',
      },
      {
        attractionName: '호미반도 해안둘레길',
        name_en: 'Homi Peninsula Coastal Trail',
        kind: 'park',
        lat: 36.05,
        lng: 129.555,
        linkStatus: 'appended',
      },
      {
        attractionName: '영일대 포스코 야경',
        name_en: 'Yeongildae POSCO Night View',
        kind: 'viewpoint',
        lat: 36.055,
        lng: 129.3779,
        linkStatus: 'appended',
      },
      {
        attractionName: '포항운하',
        name_en: 'Pohang Canal',
        kind: 'landmark',
        lat: 36.0237772,
        lng: 129.377584,
        linkStatus: 'appended',
      },
      {
        attractionName: '경상북도수목원 사계',
        name_en: 'Gyeongbuk Arboretum Four Seasons',
        kind: 'park',
        lat: 36.318,
        lng: 129.252,
        linkStatus: 'appended',
      },
      {
        attractionName: '연오랑세오녀 테마공원',
        name_en: 'Yeonorang Seonyeo Theme Park',
        kind: 'park',
        lat: 36.0037327,
        lng: 129.4632059,
        linkStatus: 'appended',
      },
      {
        attractionName: '철길숲 불의 정원',
        name_en: 'Railway Forest Fire Garden',
        kind: 'park',
        lat: 36.0090092,
        lng: 129.3421711,
        linkStatus: 'appended',
      },
      {
        attractionName: '죽장 하옥계곡',
        name_en: 'Jukjang Haok Valley',
        kind: 'park',
        lat: 36.322,
        lng: 129.278,
        linkStatus: 'appended',
      },
      {
        attractionName: '장기읍성 유배문화체험촌',
        name_en: 'Janggi Fortress Exile Culture Village',
        kind: 'landmark',
        lat: 35.985,
        lng: 129.418,
        linkStatus: 'appended',
      },
      { attractionName: '구룡포 일본인 가옥거리', linkStatus: 'linked' },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R06_LISTS) {
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

for (const list of R06_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R06_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R06:', R06_LISTS.map((l) => l.listId).join(', '));
console.log(
  'skip_no_source: andong · gumi · sangju · gimcheon (시·군 단위 공식 N경 SSOT 없음)',
);
