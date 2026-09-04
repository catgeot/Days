#!/usr/bin/env node
/**
 * F R11: 경남 6리스트 — hadong · jinju · sancheong · hamyang · geochang · hapcheon
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

const R11_LISTS = [
  {
    listId: 'hadong-sipgyeong',
    hubId: 'hadong',
    title: '하동10경',
    title_en: 'Hadong Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['하동 10경', '하동10경', '하동팔경'],
    sourceUrl: 'https://tour.hadong.go.kr/02640/02649/02757.web',
    sourceOrg: '하동군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '화개장터십리벚꽃', name_en: 'Hwagae Market Cherry Blossoms', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '금오산 일출과 다도해', name_en: 'Geumo Sunrise and Dadohae', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '쌍계사의 가을', name_en: 'Ssanggyesa Autumn', kind: 'temple', linkStatus: 'pending_coord' },
      { attractionName: '평사리 최참판댁', name_en: 'Pyeongsari Choi Champan House', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '형제봉 철쭉', name_en: 'Hyeongjebong Azaleas', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '청학동 삼성궁', name_en: 'Cheonghakdong Samsung Palace', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '지리산 불일폭포', name_en: 'Jirisan Bulil Falls', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '하동포구 백사청송', name_en: 'Hadong Port White Sand Pine', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '화개동천 야생차밭', name_en: 'Hwagaedongcheon Wild Tea Fields', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '섬호정에서 바라본 섬진강', name_en: 'Seomjin River from Seomhojeong', kind: 'viewpoint', linkStatus: 'pending_coord' },
    ],
  },
  {
    listId: 'jinju-palgyeong',
    hubId: 'jinju',
    title: '진주8경',
    title_en: 'Jinju Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['진주 8경', '진주8경', '진주 팔경'],
    sourceUrl: 'https://www.jinju.go.kr/02232/02244.web',
    sourceOrg: '진주시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '진주성 촉석루', name_en: 'Jinju Fortress Chokseongnu', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '남강 의암', name_en: 'Namgang Uiam', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '뒤벼리', name_en: 'Dwi-byeori', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '새벼리', name_en: 'Sae-byeori', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '망진산 봉수대', name_en: 'Mangjinsan Beacon', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '비봉산의 봄', name_en: 'Bibongsan Spring', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '월아산 해돋이', name_en: 'Wolaksan Sunrise', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '진양호', name_en: 'Jinyang Lake', kind: 'park', lat: 35.174021, lng: 128.0295489, linkStatus: 'linked' },
    ],
  },
  {
    listId: 'sancheong-gugyeong',
    hubId: 'sancheong',
    title: '산청9경',
    title_en: 'Sancheong Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['산청 9경', '산청9경', '산청 구경'],
    sourceUrl: 'https://sancheong.sancheong.go.kr/tour/contents.do?key=547',
    sourceOrg: '산청군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '지리산 천왕봉', name_en: 'Jirisan Cheonwangbong', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '대원사 계곡', name_en: 'Daewonsa Valley', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '황매산 철쭉', name_en: 'Hwangmaesan Azaleas', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '구형왕릉', name_en: 'Guhyeong Royal Tomb', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '경호강 비경', name_en: 'Gyeongho River Scenery', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '남사예담촌', name_en: 'Namsa Yedamchon', kind: 'neighborhood', lat: 35.35, lng: 127.88, linkStatus: 'linked' },
      { attractionName: '남명조식유적지', name_en: 'Nammyeong Josik Historic Site', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '정취암 조망', name_en: 'Jeongchuiam View', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '산청 동의보감촌', name_en: 'Sancheong Donguibogam Village', kind: 'park', lat: 35.4393076, lng: 127.8280553, linkStatus: 'linked' },
    ],
  },
  {
    listId: 'hamyang-palgyeong',
    hubId: 'hamyang',
    title: '함양8경',
    title_en: 'Hamyang Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['함양 팔경', '함양8경'],
    sourceUrl: 'https://www.hygn.go.kr/01211/01214.web',
    sourceOrg: '함양군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '상림공원', name_en: 'Sangrim Park', kind: 'park', lat: 35.526946, lng: 127.718076, linkStatus: 'linked' },
      { attractionName: '금대지리', name_en: 'Geumdaejiri', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '용추비경', name_en: 'Yongchu Scenic View', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '남계서원', name_en: 'Namgye Seowon', kind: 'landmark', lat: 35.5488763, lng: 127.783632, linkStatus: 'linked' },
      { attractionName: '칠선시류', name_en: 'Chilseon Poetry Stream', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '서암석불', name_en: 'Seoam Stone Buddha', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '덕유운해', name_en: 'Deogyu Sea of Clouds', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '함양 대봉산 휴양밸리', name_en: 'Daebongsan Recreation Valley', kind: 'park', lat: 35.58, lng: 127.68, linkStatus: 'linked' },
    ],
  },
  {
    listId: 'geochang-gugyeong',
    hubId: 'geochang',
    title: '거창9경',
    title_en: 'Geochang Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['거창 9경', '거창9경', '거창 구경'],
    sourceUrl: 'https://www.geochang.go.kr/tour/tourcontent/sights/major/List.do?pageCd=TU0101000000',
    sourceOrg: '거창군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '거창 창포원', name_en: 'Geochang Iris Garden', kind: 'park', lat: 35.6535267, lng: 127.9102618219, linkStatus: 'linked' },
      { attractionName: '거창사건추모공원', name_en: 'Geochang Incident Memorial Park', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '수승대', name_en: 'Suseungdae', kind: 'park', lat: 35.7597812, lng: 127.8344671, linkStatus: 'linked' },
      { attractionName: '거창 산림레포츠파크', name_en: 'Geochang Forest Leisure Park', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '거창 항노화힐링랜드', name_en: 'Geochang Anti-aging Healing Land', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '금원산', name_en: 'Geumwonsan', kind: 'viewpoint', lat: 35.731, lng: 127.761, linkStatus: 'linked' },
      { attractionName: '거창 별바람언덕', name_en: 'Geochang Star Wind Hill', kind: 'viewpoint', linkStatus: 'pending_coord' },
      { attractionName: '거창 월성리 계곡', name_en: 'Wolseong Valley', kind: 'park', lat: 35.78, lng: 127.88, linkStatus: 'linked' },
      { attractionName: '거창 가조온천', name_en: 'Geochang Gajo Hot Spring', kind: 'landmark', lat: 35.6984819, lng: 128.0229847, linkStatus: 'linked' },
    ],
  },
  {
    listId: 'hapcheon-palgyeong',
    hubId: 'hapcheon',
    title: '합천8경',
    title_en: 'Hapcheon Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['합천 팔경', '합천8경'],
    sourceUrl: 'https://www.hc.go.kr/06571/06779/06782.web',
    sourceOrg: '합천군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
      { attractionName: '가야산과 해인사', name_en: 'Gayasan and Haeinsa', kind: 'temple', linkStatus: 'pending_coord' },
      { attractionName: '소리길과 홍류동계곡', name_en: 'Sorigil and Hongnyudong Valley', kind: 'park', linkStatus: 'pending_coord' },
      { attractionName: '황매산', name_en: 'Hwangmaesan', kind: 'viewpoint', lat: 35.4942361, lng: 127.9745887, linkStatus: 'linked' },
      { attractionName: '합천호', name_en: 'Hapcheon Lake', kind: 'park', lat: 35.5788967, lng: 128.0191136, linkStatus: 'linked' },
      { attractionName: '합천영상테마파크', name_en: 'Hapcheon Image Theme Park', kind: 'landmark', lat: 35.5488884, lng: 128.0715409, linkStatus: 'linked' },
      { attractionName: '합천 운석충돌구', name_en: 'Hapcheon Impact Crater', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '옥전고분군', name_en: 'Okjeon Tumuli', kind: 'landmark', linkStatus: 'pending_coord' },
      { attractionName: '함벽루', name_en: 'Hambyeongnu', kind: 'landmark', lat: 35.5598, lng: 128.1655, linkStatus: 'linked' },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R11_LISTS) {
  if (existingIds.has(list.listId)) throw new Error(`listId exists: ${list.listId}`);
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
      if (attrKeys.has(key)) throw new Error(`${list.listId}: dup append: ${m.attractionName}`);
      const row = { name: m.attractionName, name_en: m.name_en, kind: m.kind, lat: m.lat, lng: m.lng };
      if (m.mapboxId != null) row.mapboxId = m.mapboxId;
      hub.attractions.push(row);
      attrKeys.add(key);
    }
  }
}

for (const list of R11_LISTS) mergeListIntoHub(list);
writeFileSync(listsPath, `${JSON.stringify([...existingLists, ...R11_LISTS], null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R11:', R11_LISTS.map((l) => l.listId).join(', '));
