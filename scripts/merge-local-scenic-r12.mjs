#!/usr/bin/env node
/** F R12: 경남 6리스트 — gimhae · yangsan · miryang · uiryeong · haman · changnyeong */
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

const R12_LISTS = [
  {
    listId: 'gimhae-gugyeong',
    hubId: 'gimhae',
    title: '김해9경',
    title_en: 'Gimhae Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['김해 9경', '김해9경', '김해 구경'],
    sourceUrl: 'https://www.gimhae.go.kr/00204/00550/00554.web',
    sourceOrg: '김해시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '봉하마을', name_en: 'Bongha Village', kind: 'neighborhood', lat: 35.1982, lng: 128.9094, linkStatus: 'linked' },
      { attractionName: '클레이아크김해미술관', name_en: 'Clayarch Gimhae Museum', kind: 'museum', lat: 35.2506781, lng: 128.7448197, linkStatus: 'linked' },
      { attractionName: '김해 수로왕릉', name_en: 'Tomb of King Suro', kind: 'landmark', lat: 35.2353, lng: 128.8784, linkStatus: 'linked' },
      { attractionName: '연지공원 사계', name_en: 'Yeonji Park Four Seasons', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '화포천습지 생태공원', name_en: 'Hwaposcheon Wetland Ecological Park', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '대청계곡', name_en: 'Daecheong Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '신어산 철쭉', name_en: 'Sineosan Azaleas', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '경전철에서 바라본 가야유적', name_en: 'Gaya Heritage from the Light Rail', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '분산(천문대)전경 및 운무', name_en: 'Bunsan Observatory View and Sea of Clouds', kind: 'viewpoint', linkStatus: 'pending_coord' },
    ],
  },
  {
    listId: 'yangsan-other',
    hubId: 'yangsan',
    title: '양산12경',
    title_en: 'Yangsan Twelve Scenic Views',
    listKind: 'other',
    memberCountClaimed: 12,
    aliases: ['양산 12경', '양산12경', '양산 8경'],
    sourceUrl: 'https://www.yangsan.go.kr/tour/main.do',
    sourceOrg: '양산시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '통도사', name_en: 'Tongdosa', kind: 'temple', lat: 35.4881, lng: 129.0644, linkStatus: 'linked' },
      { attractionName: '천성산', name_en: 'Cheonseongsan', kind: 'viewpoint', lat: 35.4015733, lng: 129.1062817, linkStatus: 'linked' },
      { attractionName: '내원사 계곡', name_en: 'Naewonsa Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '홍룡폭포', name_en: 'Hongryong Falls', kind: 'viewpoint', lat: 35.3969996749, lng: 129.0864871696, linkStatus: 'linked' },
      { attractionName: '배내골', name_en: 'Baenaegol', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '천태산', name_en: 'Cheontaesan', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '오봉산 임경대', name_en: 'Obongsan Imgyeongdae', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '대운산 자연휴양림', name_en: 'Daeunsan Natural Recreation Forest', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '황산공원', name_en: 'Hwangsan Park', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '법기수원지', name_en: 'Beopgi Reservoir', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '양산타워', name_en: 'Yangsan Tower', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '가야진사', name_en: 'Gayajinsa Shrine', kind: 'shrine', linkStatus: 'pending_coord' },
    ],
  },
  {
    listId: 'miryang-palgyeong',
    hubId: 'miryang',
    title: '밀양8경',
    title_en: 'Miryang Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['밀양 8경', '밀양8경', '밀양 팔경'],
    sourceUrl: 'https://www.miryang.go.kr/tur/index.do?mnNo=10302000000',
    sourceOrg: '밀양시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '밀양 영남루', name_en: 'Yeongnamnu Pavilion', kind: 'landmark', lat: 35.4915993, lng: 128.7550955, linkStatus: 'linked' },
      { attractionName: '시례 호박소', name_en: 'Sire Hobakso', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '밀양 표충사', name_en: 'Pyochungsa Temple', kind: 'temple', lat: 35.5326461, lng: 128.9594529, linkStatus: 'linked' },
      { attractionName: '월연정 풍경', name_en: 'Wolyeonjeong Scenery', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '밀양 위양지', name_en: 'Wiyangji Reservoir', kind: 'park', lat: 35.4453, lng: 128.8042, linkStatus: 'linked' },
      { attractionName: '만어사 운해', name_en: 'Maneosa Sea of Clouds', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '종남산 진달래', name_en: 'Jongnamsan Azaleas', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '재약산 억새', name_en: 'Jaeaksan Silver Grass', kind: 'viewpoint', linkStatus: 'pending_coord' },
    ],
  },
  {
    listId: 'uiryeong-gugyeong',
    hubId: 'uiryeong',
    title: '의령9경',
    title_en: 'Uiryeong Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['의령 9경', '의령9경', '의령 구경'],
    sourceUrl: 'https://www.uiryeong.go.kr/board/list.uiryeong?boardId=ATTRACTION',
    sourceOrg: '의령군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '충익사', name_en: 'Chungiksa', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '자굴산', name_en: 'Jagulsan', kind: 'viewpoint', lat: 35.3770754, lng: 128.2034816, linkStatus: 'appended' },
      { attractionName: '의령 봉황대', name_en: 'Bonghwangdae Uiryeong', kind: 'viewpoint', lat: 35.4352846, lng: 128.24126, linkStatus: 'appended' },
      { attractionName: '벽계관광지', name_en: 'Byeokgye Tourist Site', kind: 'park', lat: 35.4265497, lng: 128.211231, linkStatus: 'appended' },
      { attractionName: '정암루(솥바위)', name_en: 'Jeongamru (Sotbawi Rock)', kind: 'landmark', lat: 35.3139551, lng: 128.294889, linkStatus: 'appended' },
      { attractionName: '탑바위', name_en: 'Tapbawi Rock', kind: 'viewpoint', lat: 35.3648756, lng: 128.323217, linkStatus: 'appended' },
      { attractionName: '수도사', name_en: 'Sudosa Temple', kind: 'temple', linkStatus: 'pending_coord' },
      { attractionName: '백산안희제선생 생가', name_en: 'Birthplace of An Hui-je', kind: 'landmark', lat: 35.4542373, lng: 128.349735, linkStatus: 'appended' },
      { attractionName: '호암이병철선생 생가', name_en: 'Birthplace of Lee Byung-chul (Ho-am)', kind: 'landmark', lat: 35.3821339, lng: 128.323257, linkStatus: 'appended' },
    ],
  },
  {
    listId: 'haman-gugyeong',
    hubId: 'haman',
    title: '함안9경',
    title_en: 'Haman Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['함안 9경', '함안9경', '함안 구경'],
    sourceUrl: 'https://www.haman.go.kr/01834/01858/01872.web',
    sourceOrg: '함안군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '말이산고분군', name_en: 'Mari Mountain Burial Mounds', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '악양의 꽃길과 노을', name_en: 'Agyang Flower Path and Sunset', kind: 'park', lat: 35.3352472, lng: 128.3985107, linkStatus: 'appended' },
      { attractionName: '입곡군립공원의 단풍', name_en: 'Autumn Foliage at Ipgok County Park', kind: 'park', lat: 35.32, lng: 128.38, linkStatus: 'appended' },
      { attractionName: '무진정의 사계', name_en: 'Four Seasons at Mujinjeong Pavilion', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '연꽃테마파크의 아라홍련', name_en: 'Ara Hongryeon Lotus at Lotus Theme Park', kind: 'park', lat: 35.29, lng: 128.42, linkStatus: 'appended' },
      { attractionName: '강나루생태공원의 청보리', name_en: 'Green Barley at Gangnaru Eco Park', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '장춘사의 산사풍경', name_en: 'Mountain Temple Scenery at Jangchunsa', kind: 'temple', linkStatus: 'pending_coord' },
      { attractionName: '합강정과 반구정의 해돋이', name_en: 'Sunrise at Hapgangjeong and Banggujeong', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '대평늪의 늪지식물', name_en: 'Wetland Plants at Daepyeong Marsh', kind: 'park', linkStatus: 'pending_coord' },
    ],
  },
  {
    listId: 'changnyeong-gugyeong',
    hubId: 'changnyeong',
    title: '창녕구경',
    title_en: 'Changnyeong Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['창녕 9경', '창녕9경', '창녕 구경'],
    sourceUrl: 'https://www.cng.go.kr/01658/02072.web',
    sourceOrg: '창녕군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '우포늪과 따오기', name_en: 'Upo Wetland and Crested Ibis', kind: 'park', lat: 35.553, lng: 128.415, linkStatus: 'appended' },
      { attractionName: '화왕산 억새와 진달래', name_en: 'Silver Grass and Azaleas on Hawangsan', kind: 'viewpoint', lat: 35.5471482, lng: 128.531694, linkStatus: 'appended' },
      { attractionName: '부곡온천', name_en: 'Bugok Hot Spring', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '낙동강유채축제와 남지개비리', name_en: 'Nakdong River Rapeseed Festival and Namji Gaetbili Trail', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '산토끼노래동산과 생태곤충원', name_en: 'Santokki Song Hill and Eco Insect Garden', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '만옥정공원과 신라진흥왕척경비, 술정리동삼층석탑', name_en: 'Manokjeong Park, Jinheung Stele, and Suljeong-ri Pagoda', kind: 'park', lat: 35.540651, lng: 128.502155, linkStatus: 'appended' },
      { attractionName: '교동과 송현동고분군', name_en: 'Gyodong and Songhyeon-dong Burial Mounds', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '3·1민속문화제와 영산만년교', name_en: 'March 1 Folk Culture Festival and Yeongsan Mannyun Bridge', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '관룡사와 용선대', name_en: 'Gwallyongsa Temple and Yongseondae', kind: 'temple', linkStatus: 'pending_coord' },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));
const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R12_LISTS) {
  if (existingIds.has(list.listId)) throw new Error(`exists: ${list.listId}`);
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
      if (!attrKeys.has(key)) throw new Error(`${list.listId}: linked missing: ${m.attractionName}`);
      continue;
    }
    if (m.linkStatus === 'pending_coord') continue;
    if (m.linkStatus === 'appended') {
      if (attrKeys.has(key)) throw new Error(`${list.listId}: dup: ${m.attractionName}`);
      const row = { name: m.attractionName, name_en: m.name_en, kind: m.kind, lat: m.lat, lng: m.lng };
      hub.attractions.push(row);
      attrKeys.add(key);
    }
  }
}

for (const list of R12_LISTS) mergeListIntoHub(list);
writeFileSync(listsPath, `${JSON.stringify([...existingLists, ...R12_LISTS], null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R12:', R12_LISTS.map((l) => l.listId).join(', '));
