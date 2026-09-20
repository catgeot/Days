#!/usr/bin/env node
/**
 * F R09: 경북 2리스트 — koreaLocalScenicLists append + hub merge.
 * WorkerA: yeongcheon-gugyeong · cheongdo-gugyeong
 * skip: gyeongsan · yeongyang skip_ambiguous · ulleung · dokdo skip_no_source
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

const R09_LISTS = [
  {
    listId: 'yeongcheon-gugyeong',
    hubId: 'yeongcheon',
    title: '영천9경',
    title_en: 'Yeongcheon Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['영천 9경', '영천구경'],
    sourceUrl: 'https://www.yeongcheon.go.kr/tour/contents.do?mId=0603020000',
    sourceOrg: '영천시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '영천 은해사',
        name_en: 'Eunhaesa Yeongcheon',
        kind: 'temple',
        lat: 35.9919834,
        lng: 128.7898616,
        linkStatus: 'linked',
      },
      {
        attractionName: '영천 임고서원',
        name_en: 'Imgo Seowon Yeongcheon',
        kind: 'landmark',
        lat: 36.0167326,
        lng: 128.973464,
        linkStatus: 'linked',
      },
      {
        attractionName: '영천 보현산천문대',
        name_en: 'Bohyeonsan Observatory',
        kind: 'viewpoint',
        lat: 36.1640698,
        lng: 128.976682,
        linkStatus: 'linked',
      },
      {
        attractionName: '영천 치산관광지',
        name_en: 'Chisan Tourist Site Yeongcheon',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '영천 보현산댐 짚와이어',
        name_en: 'Bohyeonsan Dam Zip Wire',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '영천 운주산승마자연휴양림',
        name_en: 'Unjusan Horse Riding Natural Recreation Forest',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '영천댐 벚꽃 백리길',
        name_en: 'Yeongcheon Dam Cherry Blossom Road',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '영천 한의마을',
        name_en: 'Yeongcheon Oriental Medicine Village',
        kind: 'neighborhood',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '영천 별별미술마을',
        name_en: 'Byeolbyeol Art Village Yeongcheon',
        kind: 'neighborhood',
        linkStatus: 'pending_coord',
      },
    ],
  },
  {
    listId: 'cheongdo-gugyeong',
    hubId: 'cheongdo',
    title: '청도 관광 9경',
    title_en: 'Cheongdo Tourism Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['청도관광9경', '청도 관광9경', '청도 9경'],
    sourceUrl: 'https://www.cheongdo.go.kr/tour/contents.do?mid=0105000000',
    sourceOrg: '청도군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '청도읍성',
        name_en: 'Cheongdo Eupseong',
        kind: 'landmark',
        lat: 35.6498326,
        lng: 128.7056471,
        linkStatus: 'linked',
      },
      {
        attractionName: '청도 새마을운동발상지기념공원',
        name_en: 'Saemaul Movement Origin Memorial Park',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '청도 신화랑풍류마을',
        name_en: 'Cheongdo Sinhwarang Pungryu Village',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '청도 운문사',
        name_en: 'Unmunsa Cheongdo',
        kind: 'temple',
        lat: 35.6610955,
        lng: 128.9602875,
        linkStatus: 'linked',
      },
      {
        attractionName: '청도 섶마리한옥마을',
        name_en: 'Cheongdo Seopmari Hanok Village',
        kind: 'neighborhood',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '청도 낙대폭포',
        name_en: 'Cheongdo Nakdae Falls',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '청도 유등연지',
        name_en: 'Yudeung Yeonji Cheongdo',
        kind: 'park',
        lat: 35.6752813,
        lng: 128.6929875,
        linkStatus: 'linked',
      },
      {
        attractionName: '청도 와인터널',
        name_en: 'Cheongdo Wine Tunnel',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '청도 레일바이크',
        name_en: 'Cheongdo Rail Bike',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R09_LISTS) {
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

for (const list of R09_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R09_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R09:', R09_LISTS.map((l) => l.listId).join(', '));
console.log(
  'skip: gyeongsan · yeongyang skip_ambiguous · ulleung · dokdo skip_no_source',
);
