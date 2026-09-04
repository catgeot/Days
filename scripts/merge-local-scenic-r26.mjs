#!/usr/bin/env node
/**
 * F R26: koreaLocalScenicLists append + hub merge.
 * skip: siheung
 * skip: pyeongtaek
 * skip: suwon
 * skip: seongnam
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R26_LISTS = [
  {
    listId: 'ansan-gugyeong',
    hubId: 'ansan',
    title: '안산9경',
    title_en: 'Ansan Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['안산 9경', '안산9경', '안산 구경'],
    sourceUrl: 'https://www.ansan.go.kr/vote/main/selectVoteResult.do?vote_no=486',
    sourceOrg: '안산시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '시화호조력발전소', name_en: 'Sihwaho Tidal Power Plant', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '대부도', name_en: 'Daebu Haesol Trail', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '구봉도 낙조', name_en: 'Gubongdo Sunset', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '탄도 바닷길', name_en: 'Tando Tidal Flat Trail', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '풍도', name_en: 'Pungdo Island', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '동주염전', name_en: 'Dongju Salt Field', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '안산갈대습지공원', name_en: 'Ansan Reed Wetland', kind: 'park', linkStatus: 'linked' },
    { attractionName: '다문화거리', name_en: 'Multicultural Street', kind: 'neighborhood', linkStatus: 'pending_coord' },
    { attractionName: '노적봉공원', name_en: 'Nojeokbong Park', kind: 'park', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'hwaseong-palgyeong',
    hubId: 'hwaseong',
    title: '화성8경',
    title_en: 'Hwaseong Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['화성 8경', '화성8경', '화성 팔경'],
    sourceUrl: 'https://gnews.gg.go.kr/news/news_detail.do?number=201606031800046284C076&s_code=C076',
    sourceOrg: '화성시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '융건릉', name_en: 'Yungneung and Geolleung Royal Tombs', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '용주사 범종', name_en: 'Yongjusa Temple Bell', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '제부도', name_en: 'Jebumose Island', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '궁평리해수욕장', name_en: 'Gungpyeong Sunset', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '남양황라', name_en: 'Namyang Yellow Waves', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '입파홍암', name_en: 'Ipahongam Red Cliffs', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '제암만세', name_en: 'Jeammansae Memorial', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '남양성지', name_en: 'Namyang Holy Site', kind: 'shrine', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R26_LISTS, { roundLabel: 'R26' });
