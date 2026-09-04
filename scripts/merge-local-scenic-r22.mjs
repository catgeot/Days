#!/usr/bin/env node
/**
 * F R22: koreaLocalScenicLists append + hub merge.

 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R22_LISTS = [
  {
    listId: 'nonsan-other',
    hubId: 'nonsan',
    title: '논산11경',
    title_en: 'Nonsan Eleven Scenic Views',
    listKind: 'other',
    memberCountClaimed: 11,
    aliases: ['논산 11경', '논산11경'],
    sourceUrl: 'https://www.nonsan.go.kr/tour/html/sub02/0201.html',
    sourceOrg: '논산시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '관촉사', name_en: 'Gwanchoksa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '논산 탑정호', name_en: 'Tapjeongho Lake and Suspension Bridge', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '대둔산 수락계곡', name_en: 'Daedunsan Surak Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '계백장군유적지', name_en: 'General Gyebaek Historic Site', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '쌍계사', name_en: 'Ssanggyesa Temple', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '개태사', name_en: 'Gaetaesa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '강경포구와 근대역사거리', name_en: 'Ganggyeong Port and Modern History Street', kind: 'market', linkStatus: 'pending_coord' },
    { attractionName: '노성산성과 명재고택', name_en: 'Noseongsanseong and Myeongjae House', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '돈암서원', name_en: 'Donam Seowon Academy', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '선샤인랜드', name_en: 'Sunshine Land', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '종학당과 한국유교문화진흥원', name_en: 'Jonghakdang and Korean Confucian Culture Center', kind: 'shrine', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'gyeryong-gugyeong',
    hubId: 'gyeryong',
    title: '계룡9경',
    title_en: 'Gyeryong Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['계룡 9경', '계룡9경', '계룡 구경'],
    sourceUrl: 'https://www.gyeryong.go.kr/tour',
    sourceOrg: '계룡시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '계룡산국립공원', name_en: 'Gyeryongsan Cheonhwangbong Peak', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '동학사', name_en: 'Donghaksa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '갑사', name_en: 'Gapsa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '신원사', name_en: 'Sinwonsa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '향적산 국사봉', name_en: 'Hyangjeoksan Guksabong Peak', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '숫용추', name_en: 'Sutyongchu Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '암용추', name_en: 'Amyongchu Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '계룡대 통일탑', name_en: 'Gyeryongdae Unification Tower', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '사계고택', name_en: 'Sagye Historic House', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'geumsan-sipgyeong',
    hubId: 'geumsan',
    title: '금산10경',
    title_en: 'Geumsan Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['금산 10경', '금산10경', '금산 십경'],
    sourceUrl: 'https://www.geumsan.go.kr/tour/html/sub02/0206.html',
    sourceOrg: '금산군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '금산 적벽강', name_en: 'Jeokbyeokgang Silk Water Trail', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '대둔산 낙조대', name_en: 'Daedunsan Sunset Observatory', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '금산 진악산', name_en: 'Jinaksan Wild Ginseng Site', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '서대산 산꽃세상', name_en: 'Seodaesan Flower World', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '산림문화 힐링명소', name_en: 'Forest Culture Healing Site', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '금산인삼 세계농업유산', name_en: 'Geumsan Ginseng World Agricultural Heritage', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '인삼·약령시장', name_en: 'Ginseng and Herbal Market', kind: 'market', linkStatus: 'pending_coord' },
    { attractionName: '금산 칠백의총', name_en: 'Chilbaeguichong Geumseongsan', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '월영산 원골', name_en: 'Wolyeongsan Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '태조태실 요광은행나무', name_en: 'Taejo Shrine Ginkgo Tree', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R22_LISTS, { roundLabel: 'R22' });
