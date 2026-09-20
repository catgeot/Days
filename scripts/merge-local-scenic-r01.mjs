#!/usr/bin/env node
/**
 * F R01: 강원 6리스트 — koreaLocalScenicLists append + hub merge (A→B 직렬).
 * chuncheon·gangneung skip → 예비 samcheok-sipgyeong · donghae-bijing
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

const R01_LISTS = [
  {
    listId: 'samcheok-sipgyeong',
    hubId: 'samcheok',
    title: '삼척십경',
    title_en: 'Samcheok Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['삼척 십경', '삼척10경', '삼척 십경'],
    sourceUrl: 'https://www.samcheok.go.kr/intro/00362/00371.web',
    sourceOrg: '삼척시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      { attractionName: '죽서루', linkStatus: 'linked' },
      {
        attractionName: '삼척 해신당공원',
        name_en: 'Haesindang Folk Park',
        kind: 'park',
        lat: 37.2680078425,
        lng: 129.3273124779,
        linkStatus: 'linked',
      },
      {
        attractionName: '새천년해안유원지',
        name_en: 'Millennium Coast Park',
        kind: 'park',
        lat: 37.468,
        lng: 129.17,
        linkStatus: 'appended',
      },
      {
        attractionName: '황영조기념공원',
        name_en: 'Hwang Young-jo Memorial Park',
        kind: 'park',
        lat: 37.42,
        lng: 129.18,
        linkStatus: 'appended',
      },
      {
        attractionName: '삼척 환선굴',
        name_en: 'Hwanseongul Cave',
        kind: 'landmark',
        lat: 37.3263562754826,
        lng: 129.021222661193,
        linkStatus: 'linked',
      },
      {
        attractionName: '덕풍계곡',
        name_en: 'Deokpung Valley',
        kind: 'park',
        lat: 37.38,
        lng: 129.05,
        linkStatus: 'appended',
      },
      {
        attractionName: '척주동해비',
        name_en: 'Cheokju Donghaebi',
        kind: 'landmark',
        lat: 37.468,
        lng: 129.169,
        linkStatus: 'appended',
      },
      {
        attractionName: '삼척 맹방해수욕장',
        name_en: 'Maengbang Beach',
        kind: 'beach',
        lat: 37.3892,
        lng: 129.2341,
        linkStatus: 'linked',
      },
      {
        attractionName: '삼척 천은사',
        name_en: 'Samcheok Cheoneunsa',
        kind: 'temple',
        lat: 37.35,
        lng: 129.08,
        linkStatus: 'appended',
      },
      {
        attractionName: '준경묘',
        name_en: 'Jungyeongmyo Tomb',
        kind: 'landmark',
        lat: 37.36,
        lng: 129.09,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'wonju-palgyeong',
    hubId: 'wonju',
    title: '원주8경',
    title_en: 'Wonju Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['원주 팔경', '원주8경'],
    sourceUrl: 'https://www.wonju.go.kr/tour/contents.do?key=5521',
    sourceOrg: '원주시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '구룡사',
        name_en: 'Guryongsa',
        kind: 'temple',
        lat: 37.3994509348789,
        lng: 128.049844503067,
        linkStatus: 'linked',
      },
      {
        attractionName: '강원감영',
        name_en: 'Gangwon Gamyeong',
        kind: 'landmark',
        lat: 37.342,
        lng: 127.92,
        linkStatus: 'appended',
      },
      {
        attractionName: '상원사',
        name_en: 'Sangwonsa Temple',
        kind: 'temple',
        lat: 37.38,
        lng: 128.05,
        linkStatus: 'appended',
      },
      {
        attractionName: '비로봉',
        name_en: 'Birobong Peak',
        kind: 'viewpoint',
        lat: 37.36,
        lng: 128.08,
        linkStatus: 'appended',
      },
      {
        attractionName: '간현관광지',
        name_en: 'Ganhyeon Tourist Site',
        kind: 'viewpoint',
        lat: 37.42,
        lng: 127.85,
        linkStatus: 'appended',
      },
      {
        attractionName: '영원산성',
        name_en: 'Yeongwonsanseong Fortress',
        kind: 'landmark',
        lat: 37.35,
        lng: 127.95,
        linkStatus: 'appended',
      },
      {
        attractionName: '용소막성당',
        name_en: 'Yongsomak Cathedral',
        kind: 'landmark',
        lat: 37.34,
        lng: 127.93,
        linkStatus: 'appended',
      },
      {
        attractionName: '미륵불상',
        name_en: 'Mireuk Buddha Statue',
        kind: 'landmark',
        lat: 37.345,
        lng: 127.925,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'donghae-bijing',
    hubId: 'donghae',
    title: '동해비경',
    title_en: 'Donghae Scenic Views',
    listKind: 'other',
    memberCountClaimed: 9,
    aliases: ['동해 비경', '동해비경'],
    sourceUrl: 'https://dh.go.kr/tour/contents.do?key=1564',
    sourceOrg: '동해시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '추암촛대바위',
        name_en: 'Chuam Candle Rock',
        kind: 'landmark',
        lat: 37.4786,
        lng: 129.1594,
        linkStatus: 'linked',
      },
      {
        attractionName: '용추폭포',
        name_en: 'Yongchu Falls',
        kind: 'viewpoint',
        lat: 37.463117,
        lng: 129.019319,
        linkStatus: 'appended',
      },
      {
        attractionName: '무릉반석',
        name_en: 'Mureung Rock',
        kind: 'viewpoint',
        lat: 37.465,
        lng: 129.018,
        linkStatus: 'appended',
      },
      {
        attractionName: '동해 망상해수욕장',
        name_en: 'Donghae Mangsang Beach',
        kind: 'beach',
        lat: 37.5938,
        lng: 129.0896,
        linkStatus: 'linked',
      },
      {
        attractionName: '천곡황금박쥐동굴',
        name_en: 'Cheongok Golden Bat Cave',
        kind: 'landmark',
        lat: 37.5156,
        lng: 129.1217,
        linkStatus: 'linked',
      },
      {
        attractionName: '만경대',
        name_en: 'Mangyeongdae',
        kind: 'viewpoint',
        lat: 37.524,
        lng: 129.115,
        linkStatus: 'appended',
      },
      {
        attractionName: '호해정',
        name_en: 'Hohaejeong Pavilion',
        kind: 'viewpoint',
        lat: 37.53,
        lng: 129.11,
        linkStatus: 'appended',
      },
      {
        attractionName: '할미바위',
        name_en: 'Halmi Rock',
        kind: 'landmark',
        lat: 37.531,
        lng: 129.111,
        linkStatus: 'appended',
      },
      {
        attractionName: '초록봉',
        name_en: 'Chorokbong Peak',
        kind: 'viewpoint',
        lat: 37.5,
        lng: 129.08,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'sokcho-palgyeong',
    hubId: 'sokcho',
    title: '속초8경',
    title_en: 'Sokcho Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['속초 팔경', '속초8경'],
    sourceUrl: 'https://sokcho.go.kr/ct/tour',
    sourceOrg: '속초시',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '속초등대전망대',
        name_en: 'Sokcho Lighthouse Observatory',
        kind: 'viewpoint',
        lat: 38.2148,
        lng: 128.5985,
        linkStatus: 'linked',
      },
      {
        attractionName: '범바위',
        name_en: 'Beombawi Rock',
        kind: 'landmark',
        lat: 38.19,
        lng: 128.58,
        linkStatus: 'appended',
      },
      {
        attractionName: '청대산',
        name_en: 'Cheongdaesan',
        kind: 'viewpoint',
        lat: 38.21,
        lng: 128.59,
        linkStatus: 'appended',
      },
      {
        attractionName: '청초호',
        name_en: 'Cheongcho Lake',
        kind: 'park',
        lat: 38.2005,
        lng: 128.5802,
        linkStatus: 'linked',
      },
      {
        attractionName: '조도',
        name_en: 'Jodo Island',
        kind: 'landmark',
        lat: 38.205,
        lng: 128.575,
        linkStatus: 'appended',
      },
      {
        attractionName: '외옹치해수욕장',
        name_en: 'Oeongchi Beach',
        kind: 'beach',
        lat: 38.184,
        lng: 128.616,
        linkStatus: 'linked',
      },
      {
        attractionName: '설악해맞이공원',
        name_en: 'Seorak Sunrise Park',
        kind: 'park',
        lat: 38.17,
        lng: 128.61,
        linkStatus: 'appended',
      },
      {
        attractionName: '학무정',
        name_en: 'Hakmujeong Pavilion',
        kind: 'landmark',
        lat: 38.188,
        lng: 128.6,
        linkStatus: 'appended',
      },
    ],
  },
  {
    listId: 'yangyang-sipgyeong',
    hubId: 'yangyang',
    title: '양양10경',
    title_en: 'Yangyang Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['양양 십경', '양양10경'],
    sourceUrl: 'https://tour.yangyang.go.kr/pub/yy10view.do',
    sourceOrg: '양양군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '남대천',
        name_en: 'Namdaecheon Stream',
        kind: 'park',
        lat: 38.07,
        lng: 128.62,
        linkStatus: 'appended',
      },
      {
        attractionName: '설악산 대청봉',
        name_en: 'Seoraksan Daecheongbong',
        kind: 'viewpoint',
        lat: 38.12,
        lng: 128.45,
        linkStatus: 'appended',
      },
      {
        attractionName: '오색령',
        name_en: 'Oseongnyeong Pass',
        kind: 'viewpoint',
        lat: 38.1,
        lng: 128.5,
        linkStatus: 'appended',
      },
      {
        attractionName: '오색주전골',
        name_en: 'Oseok Jujeong Valley',
        kind: 'park',
        lat: 38.11,
        lng: 128.48,
        linkStatus: 'appended',
      },
      {
        attractionName: '하조대해수욕장',
        name_en: 'Hajodae Beach',
        kind: 'beach',
        lat: 38.0229894402,
        lng: 128.7242655472,
        linkStatus: 'linked',
      },
      {
        attractionName: '죽도정',
        name_en: 'Jukdo Pavilion',
        kind: 'viewpoint',
        lat: 37.976,
        lng: 128.76,
        linkStatus: 'appended',
      },
      {
        attractionName: '남애항',
        name_en: 'Namae Port',
        kind: 'landmark',
        lat: 37.95,
        lng: 128.78,
        linkStatus: 'appended',
      },
      {
        attractionName: '낙산사',
        name_en: 'Naksansa',
        kind: 'temple',
        lat: 38.124506,
        lng: 128.6291359,
        linkStatus: 'linked',
      },
      {
        attractionName: '오산리 선사유적박물관',
        name_en: 'Osanri Prehistoric Museum',
        kind: 'museum',
        lat: 38.05,
        lng: 128.65,
        linkStatus: 'appended',
      },
      {
        attractionName: '서피비치',
        name_en: 'Surfyy Beach',
        kind: 'beach',
        lat: 38.0735,
        lng: 128.6685,
        linkStatus: 'linked',
      },
    ],
  },
  {
    listId: 'goseong-palgyeong',
    hubId: 'goseong',
    title: '고성8경',
    title_en: 'Goseong Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['고성 팔경', '고성8경', '강원고성8경'],
    sourceUrl:
      'https://www.gwgs.go.kr/prog/tursmCn/tour/sub02_01/list.do?contentTypeCode=TC001',
    sourceOrg: '고성군',
    sourceFetchedAt: '2026-09-02',
    status: 'verified',
    members: [
      {
        attractionName: '건봉사',
        name_en: 'Geombongsa Temple',
        kind: 'temple',
        lat: 38.48,
        lng: 128.44,
        linkStatus: 'appended',
      },
      {
        attractionName: '천학정',
        name_en: 'Cheonhakjeong Pavilion',
        kind: 'viewpoint',
        lat: 38.47,
        lng: 128.445,
        linkStatus: 'appended',
      },
      {
        attractionName: '화진포',
        name_en: 'Hwajinpo Lake',
        kind: 'park',
        lat: 38.4721639,
        lng: 128.443693,
        linkStatus: 'linked',
      },
      {
        attractionName: '청간정',
        name_en: 'Cheongganjeong Pavilion',
        kind: 'viewpoint',
        lat: 38.473,
        lng: 128.442,
        linkStatus: 'appended',
      },
      {
        attractionName: '울산바위',
        name_en: 'Ulsan Rock',
        kind: 'landmark',
        lat: 38.55,
        lng: 128.38,
        linkStatus: 'appended',
      },
      {
        attractionName: '고성통일전망타워',
        name_en: 'Goseong Unification Observatory',
        kind: 'viewpoint',
        lat: 38.5867125,
        lng: 128.3748799,
        linkStatus: 'linked',
      },
      {
        attractionName: '송지호해수욕장',
        name_en: 'Songjiho Beach',
        kind: 'beach',
        lat: 38.34,
        lng: 128.52,
        linkStatus: 'linked',
      },
      {
        attractionName: '마산봉설경',
        name_en: 'Masanbong Snow Scenery',
        kind: 'viewpoint',
        lat: 38.4,
        lng: 128.42,
        linkStatus: 'appended',
      },
    ],
  },
];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const hubs = JSON.parse(readFileSync(hubsPath, 'utf8'));

const existingIds = new Set(existingLists.map((l) => l.listId));
for (const list of R01_LISTS) {
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

for (const list of R01_LISTS) mergeListIntoHub(list);

const mergedLists = [...existingLists, ...R01_LISTS];
writeFileSync(listsPath, `${JSON.stringify(mergedLists, null, 2)}\n`, 'utf8');
writeFileSync(hubsPath, `${JSON.stringify(hubs, null, 2)}\n`, 'utf8');
console.log('merged R01:', R01_LISTS.map((l) => l.listId).join(', '));
