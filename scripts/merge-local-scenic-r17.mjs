#!/usr/bin/env node
/**
 * F R17: koreaLocalScenicLists append + hub merge.
 * skip: jeonju
 * skip: iksan
 * skip: gimje
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R17_LISTS = [
  {
    listId: 'wanju-gugyeong',
    hubId: 'wanju',
    title: '완주9경',
    title_en: 'Wanju Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['완주 9경', '완주9경', '완주 구경'],
    sourceUrl: 'https://wanju.grandculture.net/wanju/toc/GC07000227',
    sourceOrg: '완주군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '대둔산', name_en: 'Daedunsan Provincial Park', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '고산자연휴양림', name_en: 'Gosan Natural Recreation Forest', kind: 'park', linkStatus: 'linked' },
    { attractionName: '모악산 완주', name_en: 'Moaksan Provincial Park', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '대아수목원', name_en: 'Dae Arboretum', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '송광사 완주', name_en: 'Songgwangsa Cherry Blossom Road', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '삼례문화예술촌', name_en: 'Samnye Culture and Art Village', kind: 'neighborhood', linkStatus: 'linked' },
    { attractionName: '동상 운장산계곡', name_en: 'Dongsang Unjangsan Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '위봉사', name_en: 'Wibongsa, Wibong Falls and Wibongsan', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '화암사', name_en: 'Hwaamsa Temple', kind: 'temple', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'gunsan-palgyeong',
    hubId: 'gunsan',
    title: '선유8경',
    title_en: 'Seonyu Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['선유 8경', '선유8경', '군산 선유8경'],
    sourceUrl: 'https://www.gunsan.go.kr/tour/m2200',
    sourceOrg: '군산시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '선유낙조', name_en: 'Seonyu Sunset', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '명사십리', name_en: 'Myeongsa Beach', kind: 'beach', linkStatus: 'pending_coord' },
    { attractionName: '망주폭포', name_en: 'Mangju Falls', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '평사낙안', name_en: 'Pingsa Migratory Birds', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '삼도귀범', name_en: 'Samdo Returning Sails', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '장자어화', name_en: 'Jangja Fishing Lights', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '월영단풍', name_en: 'Wolyeong Autumn Leaves', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '무산십이봉', name_en: 'Musan Twelve Peaks', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'buan-palgyeong',
    hubId: 'buan',
    title: '변산8경',
    title_en: 'Byeonsan Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['변산 8경', '변산8경', '변산 팔경'],
    sourceUrl: 'https://www.grandculture.net/buan/toc/GC08000222',
    sourceOrg: '부안군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '웅연조대', name_en: 'Ungyeonjodae Fishing Platform', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '직소폭포', name_en: 'Jikso Falls', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '소사모종', name_en: 'Sosamojong Evening Bell', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '월명무애', name_en: 'Wolmyeongmuae Moonlit Mist', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '서해낙조', name_en: 'West Sea Sunset', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '채석강', name_en: 'Chaeseok Sail Rock', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '지포신경', name_en: 'Jiposin-gyeong Scenic Point', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '개암고적', name_en: 'Gaeam Historic Site', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R17_LISTS, { roundLabel: 'R17' });
