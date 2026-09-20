#!/usr/bin/env node
/**
 * F R30: 광역시 백로그 — koreaLocalScenicLists append + hub merge.
 * WorkerA: incheon-gugyeong · ganghwa-palgyeong · daegu-sipgyeong
 * WorkerB: daejeon-palgyeong · ulsan-sipgyeong
 * skip: seoul · ongjin · busan · busanjin · gwangju · sejong skip_no_source
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

const R30_LISTS = [
  {
    listId: 'incheon-gugyeong',
    hubId: 'incheon',
    title: '인천9경',
    title_en: 'Incheon Nine Scenic Experiences',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['인천 9경', '인천9경', '오늘문득인천9경'],
    sourceUrl: 'https://www.incheon.go.kr/IC010205/view?repSeq=DOM_0000000010747346',
    sourceOrg: '인천광역시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      {
        attractionName: '인천차이나타운',
        name_en: 'Incheon Chinatown',
        kind: 'neighborhood',
        lat: 37.4756,
        lng: 126.6175,
        linkStatus: 'linked',
        note: '제1경 1883년 개항장 과거로 시간여행',
      },
      {
        attractionName: '월미도',
        name_en: 'Wolmido',
        kind: 'neighborhood',
        lat: 37.4722,
        lng: 126.6001,
        linkStatus: 'linked',
        note: '제2경 월미바다열차·월미도',
      },
      {
        attractionName: '인천 소래포구',
        name_en: 'Sorae Port Incheon',
        kind: 'market',
        linkStatus: 'pending_coord',
        note: '제3경 소래포구 생태자연',
      },
      {
        attractionName: '인천 계양 아라온',
        name_en: 'Gyeyang Araon Incheon',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
        note: '제4경 계양 아라온 야경',
      },
      {
        attractionName: '송도센트럴파크',
        name_en: 'Songdo Central Park',
        kind: 'park',
        lat: 37.3937611252816,
        lng: 126.64462119093,
        linkStatus: 'linked',
        note: '제5경 송도센트럴파크',
      },
      {
        attractionName: '인천 영종 씨사이드파크',
        name_en: 'Yeongjong Seaside Park Incheon',
        kind: 'park',
        linkStatus: 'pending_coord',
        note: '제6경 영종 씨사이드파크 레일바이크',
      },
      {
        attractionName: '인천 강화읍 원도심',
        name_en: 'Ganghwa-eup Old Town Incheon',
        kind: 'neighborhood',
        linkStatus: 'pending_coord',
        note: '제7경 강화읍 원도심 도보',
      },
      {
        attractionName: '인천 신시모도',
        name_en: 'Sin-Si-Modo Islands Incheon',
        kind: 'park',
        linkStatus: 'pending_coord',
        note: '제8경 신·시·모도 삼형제 섬',
      },
      {
        attractionName: '인천 백령도',
        name_en: 'Baengnyeongdo Incheon',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
        note: '제9경 백령도 물범',
      },
    ],
  },
  {
    listId: 'ganghwa-palgyeong',
    hubId: 'ganghwa',
    title: '강화8경',
    title_en: 'Ganghwa Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['강화 팔경', '강화8경', '강화군 팔경'],
    sourceUrl: 'https://www.ganghwa.go.kr/open_content/tour/tour/tourInfoList.do?tourdiv=eight',
    sourceOrg: '강화군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      {
        attractionName: '갑곶돈대',
        name_en: 'Gapgot Dondae',
        kind: 'landmark',
        lat: 37.7335377029,
        lng: 126.5171140395,
        linkStatus: 'linked',
        note: '공식명 강화 갑곶돈',
      },
      {
        attractionName: '광성보',
        name_en: 'Gwangseongbo Fortress',
        kind: 'landmark',
        lat: 37.6639281,
        lng: 126.5278429,
        linkStatus: 'appended',
      },
      {
        attractionName: '연미정',
        name_en: 'Yeonmijeong Pavilion',
        kind: 'landmark',
        lat: 37.7698973,
        lng: 126.5108613,
        linkStatus: 'appended',
      },
      {
        attractionName: '초지진',
        name_en: 'Chojijin',
        kind: 'landmark',
        lat: 37.6325614284,
        lng: 126.5322409778,
        linkStatus: 'linked',
        note: '공식명 강화 초지진',
      },
      {
        attractionName: '마니산',
        name_en: 'Manisan',
        kind: 'viewpoint',
        lat: 37.615542,
        lng: 126.4296828,
        linkStatus: 'linked',
        note: '공식명 마니산(참성단)',
      },
      {
        attractionName: '보문사',
        name_en: 'Bomunsa Ganghwa',
        kind: 'temple',
        lat: 37.6882523,
        lng: 126.3215578,
        linkStatus: 'linked',
      },
      {
        attractionName: '적석사',
        name_en: 'Jeokseoksa',
        kind: 'temple',
        lat: 37.7323548,
        lng: 126.414192,
        linkStatus: 'appended',
      },
      {
        attractionName: '전등사',
        name_en: 'Jeondeungsa Ganghwa',
        kind: 'temple',
        lat: 37.6369531,
        lng: 126.4933238,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'daegu-sipgyeong',
    hubId: 'daegu',
    title: '대구12경',
    title_en: 'Daegu Twelve Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 12,
    aliases: ['대구 12경', '대구12경', '대구 십이경'],
    sourceUrl: 'https://tour.daegu.go.kr/index.do?menu_id=00002911',
    sourceOrg: '대구광역시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '대구 비슬산', name_en: 'Biseulsan', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '대구 강정고령보', name_en: 'Gangjeong Goryeongbo', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '대구 신천', name_en: 'Sincheon Stream', kind: 'park', linkStatus: 'pending_coord' },
      {
        attractionName: '대구 국채보상운동 기념공원',
        name_en: 'National Debt Repayment Movement Memorial Park',
        kind: 'park',
        linkStatus: 'pending_coord',
      },
      { attractionName: '대구 팔공산', name_en: 'Palgongsan', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '대구 수성못', name_en: 'Suseongmot Lake', kind: 'park', linkStatus: 'pending_coord' },
      {
        attractionName: '83타워',
        name_en: '83 Tower',
        kind: 'viewpoint',
        lat: 35.8535044,
        lng: 128.5662742,
        linkStatus: 'linked',
      },
      {
        attractionName: '서문시장',
        name_en: 'Seomun Market',
        kind: 'market',
        lat: 35.86943,
        lng: 128.5807059,
        linkStatus: 'linked',
      },
      { attractionName: '대구스타디움', name_en: 'Daegu Stadium', kind: 'landmark', linkStatus: 'pending_coord' },
      {
        attractionName: '동성로',
        name_en: 'Dongseong-ro',
        kind: 'neighborhood',
        lat: 35.8695,
        lng: 128.5956,
        linkStatus: 'linked',
      },
      { attractionName: '대구 달성토성', name_en: 'Dalseong Fortress', kind: 'landmark', linkStatus: 'pending_coord' },
      {
        attractionName: '대구 경상감영과 옛골목',
        name_en: 'Gyeongsang Gamyeong and Old Alleys',
        kind: 'neighborhood',
        linkStatus: 'pending_coord',
      },
    ],
  },
  {
    listId: 'daejeon-palgyeong',
    hubId: 'daejeon',
    title: '대전8경',
    title_en: 'Daejeon Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['대전 8경', '대전8경', '대전팔경'],
    sourceUrl:
      'https://www.daejeon.go.kr/its/ItsdjNormalboardView.do?boardGubun=itsdj05&boardSeq=825&menuSeq=5934&pageIndex=1',
    sourceOrg: '대전광역시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      {
        attractionName: '유성온천',
        name_en: 'Yuseong Hot Springs',
        kind: 'neighborhood',
        lat: 36.355,
        lng: 127.345,
        linkStatus: 'linked',
      },
      { attractionName: '대전 구봉산', name_en: 'Gubongsan', kind: 'park', linkStatus: 'pending_coord' },
      {
        attractionName: '엑스포과학공원',
        name_en: 'Expo Science Park',
        kind: 'park',
        lat: 36.3759931713,
        lng: 127.3802705364,
        linkStatus: 'linked',
      },
      {
        attractionName: '계족산 황톳길',
        name_en: 'Gyejoksan Hwangtotgil',
        kind: 'viewpoint',
        lat: 36.3947042,
        lng: 127.4538486,
        linkStatus: 'linked',
        note: '공식 대전8경 계족산',
      },
      { attractionName: '대전 식장산', name_en: 'Sikjangsan', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '대전 대청호', name_en: 'Daecheongho Lake', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '대전 장태산', name_en: 'Jangtaesan', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '대전 보문산', name_en: 'Bomunsan', kind: 'park', linkStatus: 'pending_coord' },
    ],
  },
  {
    listId: 'ulsan-sipgyeong',
    hubId: 'ulsan',
    title: '울산12경',
    title_en: 'Ulsan Twelve Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 12,
    aliases: ['울산 12경', '울산12경', '울산 십이경'],
    sourceUrl: 'https://www.ulsan.go.kr/tour/kor/contents.ulsan?mId=001001006000000000',
    sourceOrg: '울산광역시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      {
        attractionName: '태화강국가정원',
        name_en: 'Taehwagang National Garden',
        kind: 'park',
        lat: 35.549,
        lng: 129.295,
        linkStatus: 'linked',
        note: '공식 태화강 국가정원과 십리대숲',
      },
      {
        attractionName: '대왕암공원',
        name_en: 'Daewangam Park',
        kind: 'park',
        lat: 35.4904590082,
        lng: 129.4352747432,
        linkStatus: 'linked',
      },
      { attractionName: '울산 가지산 사계', name_en: 'Gajisan Four Seasons', kind: 'park', linkStatus: 'pending_coord' },
      {
        attractionName: '울산 신불산 억새평원',
        name_en: 'Sinbulsan Silver Grass Plains',
        kind: 'viewpoint',
        linkStatus: 'pending_coord',
      },
      {
        attractionName: '간절곶',
        name_en: 'Ganjeolgot',
        kind: 'viewpoint',
        lat: 35.3589668021,
        lng: 129.3605738299,
        linkStatus: 'linked',
        note: '공식 간절곶 일출',
      },
      {
        attractionName: '울산 반구대암각화',
        name_en: 'Bangudae Petroglyphs',
        kind: 'museum',
        linkStatus: 'pending_coord',
        note: '공식 반구대암각화·천전리 명문',
      },
      { attractionName: '울산 강동몽돌해변', name_en: 'Gangdong Pebble Beach', kind: 'beach', linkStatus: 'pending_coord' },
      { attractionName: '울산대공원', name_en: 'Ulsan Grand Park', kind: 'park', linkStatus: 'pending_coord' },
      {
        attractionName: '울산대교전망대',
        name_en: 'Ulsan Bridge Observatory',
        kind: 'viewpoint',
        lat: 35.5017517,
        lng: 129.4061489,
        linkStatus: 'linked',
        note: '공식 울산대교 야경',
      },
      {
        attractionName: '고래문화마을',
        name_en: 'Jangsaengpo Whale Culture Village',
        kind: 'museum',
        lat: 35.5059156009,
        lng: 129.3830959043,
        linkStatus: 'linked',
        note: '공식 장생포 고래문화마을',
      },
      { attractionName: '울산 외고산 옹기마을', name_en: 'Oegosan Onggi Village', kind: 'museum', linkStatus: 'pending_coord' },
      { attractionName: '울산 대운산 내원암', name_en: 'Daewunsan Naewonam', kind: 'park', linkStatus: 'pending_coord' },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R30_LISTS) {
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

for (const list of R30_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R30_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R30:', R30_LISTS.map((l) => l.listId).join(', '));
console.log(
  'skip: seoul · ongjin · busan · busanjin · gwangju · sejong skip_no_source',
);
