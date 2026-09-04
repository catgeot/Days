#!/usr/bin/env node
/**
 * F R20: koreaLocalScenicLists append + hub merge.
 * skip: asan
 * skip: dangjin
 * skip: boryeong
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R20_LISTS = [
  {
    listId: 'cheonan-palgyeong',
    hubId: 'cheonan',
    title: '천안8경',
    title_en: 'Cheonan Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['천안 8경', '천안8경', '천안 팔경'],
    sourceUrl: 'https://www.cheonan.go.kr/tour',
    sourceOrg: '천안시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '천안 독립기념관', name_en: 'Independence Hall of Korea', kind: 'museum', linkStatus: 'linked' },
    { attractionName: '유관순열사사적지', name_en: 'Yu Gwan-sun Martyr Historic Site', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '천안삼거리공원', name_en: 'Cheonan Samgeori Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '태조산 왕건길과 청동대좌불', name_en: 'Taejosan Wanggeon Trail and Bronze Buddha', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '아라리오조각광장', name_en: 'Arario Sculpture Square', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '성성호수공원', name_en: 'Seongseong Lake Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '광덕산', name_en: 'Gwangdeoksan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '봉선홍경사갈기비', name_en: 'Bongseon Honggyeongsa Stele', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'seosan-gugyeong',
    hubId: 'seosan',
    title: '서산9경',
    title_en: 'Seosan Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['서산 9경', '서산9경', '서산 구경'],
    sourceUrl: 'https://www.seosan.go.kr/tour/index.do',
    sourceOrg: '서산시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '서산 해미읍성', name_en: 'Haemi Fortress', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '용현리 마애여래삼존상', name_en: 'Yonghyeonri Triad Buddha', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '간월암', name_en: 'Ganwolam Hermitage', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '개심사', name_en: 'Gaesimsa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '팔봉산', name_en: 'Palbongsan Mountain', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '가야산', name_en: 'Gayasan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '황금산', name_en: 'Hwanggeumsan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '서산 한우목장', name_en: 'Seosan Hanwoo Ranch', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '삼길포항', name_en: 'Samgilpo Port', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'taean-palgyeong',
    hubId: 'taean',
    title: '태안8경',
    title_en: 'Taean Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['태안 8경', '태안8경', '태안 팔경'],
    sourceUrl: 'https://www.taean.go.kr/tour',
    sourceOrg: '태안군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '백화산', name_en: 'Baekhwasan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '안흥성', name_en: 'Anheungseong Fortress', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '안면송림', name_en: 'Anmyeon Pine Forest', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '만리포해수욕장', name_en: 'Mallipo Beach', kind: 'beach', linkStatus: 'linked' },
    { attractionName: '신두사구', name_en: 'Sindu Sand Dunes', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '가의도', name_en: 'Gauido Island', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '몽산포해수욕장', name_en: 'Mongsan Beach', kind: 'beach', linkStatus: 'linked' },
    { attractionName: '할미할아비바위', name_en: 'Grandmother and Grandfather Rocks', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R20_LISTS, { roundLabel: 'R20' });
