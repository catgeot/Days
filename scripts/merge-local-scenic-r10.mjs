#!/usr/bin/env node
/**
 * F R10: 경남 4리스트 — koreaLocalScenicLists append + hub merge.
 * WorkerA: tongyeong-palgyeong · geoje-gugyeong · sacheon-gugyeong
 * WorkerB: namhae-sipgyeong
 * skip: changwon · goseongnam skip_no_source
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

const R10_LISTS = [
  {
    listId: 'tongyeong-palgyeong',
    hubId: 'tongyeong',
    title: '통영팔경',
    title_en: 'Tongyeong Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['통영 팔경', '통영시 팔경'],
    sourceUrl: 'https://www.tongyeong.go.kr/eng/02802/02833/02838.web',
    sourceOrg: '통영시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      {
        attractionName: '연화도 용머리',
        name_en: 'Yeonhwado Yongmeori',
        kind: 'viewpoint',
        lat: 34.78097,
        lng: 128.39767,
        linkStatus: 'appended',
      },
      {
        attractionName: '사량도 옥녀봉',
        name_en: 'Saryangdo Oknyeobong',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '남망산공원',
        name_en: 'Nammangsan Park',
        kind: 'park',
        lat: 34.8408156,
        lng: 128.4299867,
        linkStatus: 'appended',
      },
      {
        attractionName: '한산도제승당',
        name_en: 'Jeseungdang',
        kind: 'landmark',
        lat: 34.7942317,
        lng: 128.4719002,
        linkStatus: 'linked',
      },
      {
        attractionName: '달아공원 일몰',
        name_en: 'Sunset at Dara Park',
        kind: 'viewpoint',
        lat: 34.7687133,
        lng: 128.4001192,
        linkStatus: 'appended',
      },
      {
        attractionName: '소매물도 등대섬',
        name_en: 'Somaemuldo Lighthouse Island',
        kind: 'landmark',
        lat: 34.6266153,
        lng: 128.549357,
        linkStatus: 'appended',
      },
      {
        attractionName: '통영운하 야경',
        name_en: 'Night View of Tongyeong Canal',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '미륵산',
        name_en: 'Mireuksan',
        kind: 'viewpoint',
        lat: 34.8106641,
        lng: 128.4161136,
        linkStatus: 'linked',
      },
    ],
  },
  {
    listId: 'geoje-gugyeong',
    hubId: 'geoje',
    title: '거제9경',
    title_en: 'Geoje Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['거제 9경', '거제구경'],
    sourceUrl: 'https://tour.geoje.go.kr/index.geoje?menuCd=DOM_000008502003011',
    sourceOrg: '거제시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      {
        attractionName: '해금강',
        name_en: 'Haegeumgang',
        kind: 'viewpoint',
        lat: 34.7327358,
        lng: 128.6839848,
        linkStatus: 'linked',
      },
      {
        attractionName: '바람의언덕',
        name_en: 'Windy Hill Geoje',
        kind: 'viewpoint',
        lat: 34.7432915,
        lng: 128.6633088,
        linkStatus: 'linked',
      },
      {
        attractionName: '외도보타니아',
        name_en: 'Oedo Botania',
        kind: 'park',
        lat: 34.7692662,
        lng: 128.7119207,
        linkStatus: 'linked',
      },
      {
        attractionName: '학동몽돌해수욕장',
        name_en: 'Hakdong Pebble Beach',
        kind: 'beach',
        lat: 34.7732942,
        lng: 128.6405889,
        linkStatus: 'linked',
      },
      {
        attractionName: '거제 식물원',
        name_en: 'Geoje Botanical Garden',
        kind: 'park',
        lat: 34.8569942,
        lng: 128.5781165,
        linkStatus: 'appended',
      },
      {
        attractionName: '거제포로수용소유적공원',
        name_en: 'Geoje POW Camp Park',
        kind: 'museum',
        lat: 34.8760819,
        lng: 128.6246009,
        linkStatus: 'linked',
      },
      {
        attractionName: '공곶이·내도',
        name_en: 'Gonggoji and Naedo',
        kind: 'viewpoint',
        lat: 34.7949092,
        lng: 128.7138306,
        linkStatus: 'appended',
      },
      {
        attractionName: '지심도',
        name_en: 'Jisimdo',
        kind: 'park',
        lat: 34.8179993905,
        lng: 128.7485334584,
        linkStatus: 'linked',
      },
      {
        attractionName: '매미성',
        name_en: 'Maemi Castle',
        kind: 'landmark',
        lat: 34.9682217,
        lng: 128.7050767,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'sacheon-gugyeong',
    hubId: 'sacheon',
    title: '사천9경',
    title_en: 'Sacheon Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['사천 구경', '사천 9경'],
    sourceUrl: 'https://www.toursacheon.net/sub_2_1_1',
    sourceOrg: '사천시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      {
        attractionName: '삼천포대교와 사천바다케이블카',
        name_en: 'Samcheonpo Bridge and Sacheon Sea Cable Car',
        kind: 'landmark',
        lat: 34.9315891,
        lng: 128.0536533,
        linkStatus: 'appended',
      },
      {
        attractionName: '실안낙조',
        name_en: 'Silan Sunset',
        kind: 'viewpoint',
        lat: 34.9480596,
        lng: 128.03966,
        linkStatus: 'appended',
      },
      {
        attractionName: '남일대 코끼리바위',
        name_en: 'Namildae Elephant Rock',
        kind: 'landmark',
        lat: 34.9265374,
        lng: 128.0964862,
        linkStatus: 'appended',
      },
      {
        attractionName: '선진리성 벚꽃',
        name_en: 'Seonjin-ri Fortress Cherry Blossoms',
        kind: 'landmark',
        lat: 35.0440167,
        lng: 128.0419212,
        linkStatus: 'appended',
      },
      {
        attractionName: '사천 와룡산',
        name_en: 'Sacheon Waryongsan',
        kind: 'viewpoint',
        lat: 34.9808533,
        lng: 128.0990438,
        linkStatus: 'linked',
      },
      {
        attractionName: '봉명산 다솔사',
        name_en: 'Bongmyeongsan Dasolsa Temple',
        kind: 'temple',
        lat: 35.0835355,
        lng: 127.9202812,
        linkStatus: 'appended',
      },
      {
        attractionName: '사천읍성 명월',
        name_en: 'Sacheon Eupseong Moonlight',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '비토섬 갯벌',
        name_en: 'Bito Island Tidal Flats',
        kind: 'landmark',
        lat: 34.9730246,
        lng: 127.9711691,
        linkStatus: 'appended',
      },
      {
        attractionName: '용두공원과 청룡사 겹벚꽃',
        name_en: 'Yongdu Park and Cheongnyongsa Double Cherry Blossoms',
        kind: 'park',
        lat: 34.974734,
        lng: 128.1123524,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'namhae-sipgyeong',
    hubId: 'namhae',
    title: '남해12경',
    title_en: 'Namhae Twelve Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 12,
    aliases: ['남해 12경', '남해 십이경'],
    sourceUrl: 'https://www.namhae.go.kr/tour/00007.web',
    sourceOrg: '남해군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      {
        attractionName: '남해 금산과 보리암',
        name_en: 'Namhae Geumsan and Boriam',
        kind: 'viewpoint',
        lat: 34.7521584,
        lng: 127.9829959,
        linkStatus: 'appended',
      },
      {
        attractionName: '남해대교와 남해 충렬사',
        name_en: 'Namhae Bridge and Chungnyeolsa',
        kind: 'landmark',
        lat: 34.937,
        lng: 127.871,
        linkStatus: 'appended',
      },
      {
        attractionName: '상주은모래비치',
        name_en: 'Sangju Eunmorae Beach',
        kind: 'beach',
        lat: 34.720841,
        lng: 127.988094,
        linkStatus: 'linked',
      },
      {
        attractionName: '창선교와 남해지족해협 죽방렴',
        name_en: 'Changseon Bridge and Jukbangryeom',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '남해 관음포 이충무공 유적',
        name_en: 'Namhae Gwaneumpo Yi Sun-sin Historic Site',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '남해 가천 암수바위와 남면해안',
        name_en: 'Namhae Gacheon Rock and Nammyeon Coast',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '서포 김만중 선생 유허와 노도',
        name_en: 'Nodo and Seopo Kim Man-jung Historic Site',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '송정솔바람해변',
        name_en: 'Songjeong Solbaram Beach',
        kind: 'beach',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '망운산과 화방사',
        name_en: 'Mangunsan and Hwabangsa',
        kind: 'temple',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '남해 물건리 방조어부림과 물미해안',
        name_en: 'Namhae Mulgeon Bangjo Forest and Mulmi Coast',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '호구산과 용문사',
        name_en: 'Hogusan and Yongmunsa',
        kind: 'temple',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '창선-삼천포대교',
        name_en: 'Changseon-Samcheonpo Bridge',
        kind: 'landmark',
        linkStatus: 'pending_coord',
      },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R10_LISTS) {
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

for (const list of R10_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R10_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R10:', R10_LISTS.map((l) => l.listId).join(', '));
console.log('skip: changwon · goseongnam skip_no_source');
