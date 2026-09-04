#!/usr/bin/env node
/**
 * F R15: koreaLocalScenicLists append + hub merge.
 * skip: sinan
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R15_LISTS = [
  {
    listId: 'muan-gugyeong',
    hubId: 'muan',
    title: '무안9경',
    title_en: 'Muan Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['무안 9경', '무안9경', '무안 구경'],
    sourceUrl: 'http://www.muannews.com/news/articleView.html?idxno=500784',
    sourceOrg: '무안군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '회산백련지', name_en: 'Hoesan White Lotus Pond', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '무안황토갯벌랜드', name_en: 'Yellow-earth Tidal Flat Land', kind: 'park', linkStatus: 'linked' },
    { attractionName: '영산강 식영정과 느러지', name_en: 'Seonyeongjeong and Neureoji on Yeongsangang', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '초의선사탄생지', name_en: 'Birthplace of Choeuisunsa', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '톱머리·홀통 해수욕장', name_en: 'Topmeori and Holtong Beaches', kind: 'beach', linkStatus: 'pending_coord' },
    { attractionName: '백로와 왜가리 번식지', name_en: 'Egret and Heron Habitat', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '도리포해수욕장', name_en: 'Doripo Sunrise and Sunset', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '승달산', name_en: 'Seungdalsan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '낙지공원', name_en: 'Octopus Park', kind: 'park', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'jindo-other',
    hubId: 'jindo',
    title: '진도10경',
    title_en: 'Jindo Ten Scenic Views',
    listKind: 'other',
    memberCountClaimed: 10,
    aliases: ['진도 10경', '진도10경'],
    sourceUrl: 'https://www.jindo.go.kr/tour',
    sourceOrg: '진도군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '진도타워', name_en: 'Jindo Tower', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '운림산방', name_en: 'Unrimsanbang House', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '세방낙조전망대', name_en: 'Sebang Sunset Observatory', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '용장산성', name_en: 'Yongjangsan Fortress', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '관매도', name_en: 'Gwanmaedo Island', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '조도관음도', name_en: 'Jodo Gwaneumdo Island', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '신비의 바닷길', name_en: 'Mysterious Sea Road', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '의장대', name_en: 'Uijangdae Pavilion', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '돈대산', name_en: 'Dondaesan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '하조대', name_en: 'Hajodae Coast', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'haenam-palgyeong',
    hubId: 'haenam',
    title: '해남8경',
    title_en: 'Haenam Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['해남 8경', '해남8경', '해남 팔경'],
    sourceUrl: 'https://www.data.go.kr/data/15059734/fileData.do',
    sourceOrg: '해남군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '해남 구 목포구등대 낙조 전망대', name_en: 'Old Mokpo Lighthouse Sunset View', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '해남공룡박물관', name_en: 'Haenam Dinosaur Museum', kind: 'museum', linkStatus: 'linked' },
    { attractionName: '해남윤씨 옥우당', name_en: 'Haenam Yun Clan Okudang', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '미황사 및 도솔암', name_en: 'Mihwangsa and Dosolam', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '고천암 철새도래지', name_en: 'Gocheonam Bird Habitat', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '대흥사', name_en: 'Daeheungsa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '울돌목', name_en: 'Uldolmok Strait', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '땅끝탑', name_en: 'Land End Tower', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'wando-palgyeong',
    hubId: 'wando',
    title: '완도8경',
    title_en: 'Wando Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['완도 8경', '완도8경', '완도 팔경'],
    sourceUrl: 'https://www.wando.go.kr/tour',
    sourceOrg: '완도군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '완도타워', name_en: 'Wando Tower', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '신지명사십리해수욕장', name_en: 'Sinjimyeongsa Beach', kind: 'beach', linkStatus: 'linked' },
    { attractionName: '보길도 윤선도 원림', name_en: 'Bogildo Yunsundo Primeval Forest', kind: 'park', linkStatus: 'linked' },
    { attractionName: '정도리 구계등', name_en: 'Jeongdori Gugyedong Lighthouse', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '청산도', name_en: 'Cheongsando Island', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '생일도', name_en: 'Saengildo Island', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '약산', name_en: 'Yaksan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '국화섬', name_en: 'National Flower Island', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'gangjin-other',
    hubId: 'gangjin',
    title: '강진12경',
    title_en: 'Gangjin Twelve Scenic Views',
    listKind: 'other',
    memberCountClaimed: 12,
    aliases: ['강진 12경', '강진12경'],
    sourceUrl: 'https://www.gangjin.go.kr/tour',
    sourceOrg: '강진군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '다산초당', name_en: 'Dasan Chodang House', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '가우도', name_en: 'Gaudo Island', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '금곡사 강진', name_en: 'Geumgoksa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '강진다원', name_en: 'Gangjin Tea Plantation', kind: 'park', linkStatus: 'linked' },
    { attractionName: '강진만생태공원', name_en: 'Gangjin Bay Ecological Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '월출산', name_en: 'Wolchulsan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '가학산', name_en: 'Gahaksan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '백야김좌진기념관', name_en: 'Baekya Kim Jwa-jin Memorial', kind: 'museum', linkStatus: 'pending_coord' },
    { attractionName: '남도별미식문화박물관', name_en: 'Namdo Food Culture Museum', kind: 'museum', linkStatus: 'pending_coord' },
    { attractionName: '강진청자박물관', name_en: 'Gangjin Celadon Museum', kind: 'museum', linkStatus: 'pending_coord' },
    { attractionName: '병영성', name_en: 'Byeongyeong Fortress', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '청자단지', name_en: 'Celadon Village', kind: 'neighborhood', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R15_LISTS, { roundLabel: 'R15' });
