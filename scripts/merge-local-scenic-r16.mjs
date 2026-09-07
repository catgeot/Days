#!/usr/bin/env node
/**
 * F R16: koreaLocalScenicLists append + hub merge.
 * skip: yeongam
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R16_LISTS = [
  {
    listId: 'jangheung-gugyeong',
    hubId: 'jangheung',
    title: '장흥9경',
    title_en: 'Jangheung Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['장흥 9경', '장흥9경', '장흥 구경'],
    sourceUrl: 'http://sisatotalnews.com/article.asp?aid=1750063256383140025',
    sourceOrg: '장흥군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '장흥 편백숲 우드랜드', name_en: 'Jeongnamjin Cypress Woodland', kind: 'park', linkStatus: 'linked' },
    { attractionName: '천관산', name_en: 'Cheongwansan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '장흥 토요시장', name_en: 'Jeongnamjin Jangheung Saturday Market', kind: 'market', linkStatus: 'linked' },
    { attractionName: '장흥 126타워', name_en: 'Jangheung 126 Tower', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '장흥 보림사', name_en: 'Borimsa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '해동사', name_en: 'Haedongsa Shrine', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '선학동마을', name_en: 'Seonhak-dong Village', kind: 'neighborhood', linkStatus: 'pending_coord' },
    { attractionName: '소등섬', name_en: 'Sodeungseom Island', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '하늘빛수목정원', name_en: 'Sky Blue Arboretum', kind: 'park', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'boseong-gugyeong',
    hubId: 'boseong',
    title: '보성9경',
    title_en: 'Boseong Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['보성 9경', '보성9경', '보성 구경'],
    sourceUrl: 'https://linkareer.com/activity/200415',
    sourceOrg: '보성군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '보성녹차밭', name_en: 'Boseong Tea Fields', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '한국차박물관', name_en: 'Korea Tea Museum', kind: 'museum', linkStatus: 'linked' },
    { attractionName: '태백산맥문학관', name_en: 'Taebaeksanmaek Literature Center', kind: 'museum', linkStatus: 'pending_coord' },
    { attractionName: '율포해수욕장', name_en: 'Yulpo Beach', kind: 'beach', linkStatus: 'linked' },
    { attractionName: '비봉공룡공원', name_en: 'Bibong Dinosaur Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '제암산자연휴양림', name_en: 'Jeamsan Natural Recreation Forest', kind: 'park', linkStatus: 'linked' },
    { attractionName: '일림산 용추계곡', name_en: 'Ilimsan Yongchu Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '대원사', name_en: 'Daewonsa Temple', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '주암호 서재필기념관', name_en: 'Juamho and Seo Jae-pil Memorial', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'goheung-other',
    hubId: 'goheung',
    title: '고흥10경',
    title_en: 'Goheung Ten Scenic Views',
    listKind: 'other',
    memberCountClaimed: 10,
    aliases: ['고흥 10경', '고흥10경'],
    sourceUrl: 'https://www.goheung.go.kr/tour',
    sourceOrg: '고흥군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '팔영산 자연휴양림', name_en: 'Palyeongsan Natural Recreation Forest', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '고흥 소록도', name_en: 'Sorokdo Island', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '쑥섬', name_en: 'Ssukseom Island', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '연홍도', name_en: 'Yeonhongdo Island', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '금산 해안경관', name_en: 'Geumsan Coastal Scenery', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '천등산 봉수대', name_en: 'Cheondeungsan Beacon', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '나로우주센터', name_en: 'Naro Space Center', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '고흥 남열해돋이해수욕장', name_en: 'Namyel Sunrise Beach', kind: 'beach', linkStatus: 'linked' },
    { attractionName: '고흥만 수변노을공원', name_en: 'Goheung Bay Sunset Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '분청문화박물관과 운암산 녹음길', name_en: 'Buncheong Museum and Unamsan Green Trail', kind: 'museum', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R16_LISTS, { roundLabel: 'R16' });
