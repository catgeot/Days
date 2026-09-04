#!/usr/bin/env node
/**
 * F R25: koreaLocalScenicLists append + hub merge.
 * skip: gimpo
 * skip: bucheon
 * skip: gwangmyeong
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R25_LISTS = [
  {
    listId: 'yeoju-palgyeong',
    hubId: 'yeoju',
    title: '여주8경',
    title_en: 'Yeoju Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['여주 8경', '여주8경', '여주 팔경', '여주팔경'],
    sourceUrl: 'https://www.yeojunews.co.kr/news/articleView.html?idxno=42978',
    sourceOrg: '여주시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '신륵모종', name_en: 'Silleuk Evening Bell', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '마암어등', name_en: 'Maam Fishing Lamps', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '학동모연', name_en: 'Hakdong Evening Mist', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '연탄귀범', name_en: 'Yeontan Returning Sails', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '양도낙안', name_en: 'Yangdo Setting Geese', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '팔수장림', name_en: 'Palsu Long Forest', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '이릉두견', name_en: 'Ireung Azaleas', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '파사성', name_en: 'Pasa Passing Rain', kind: 'viewpoint', linkStatus: 'linked' }
    ],
  },
  {
    listId: 'icheon-gugyeong',
    hubId: 'icheon',
    title: '이천9경',
    title_en: 'Icheon Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['이천 9경', '이천9경', '이천 구경'],
    sourceUrl: 'https://www.icheon.go.kr/tour/selectTourCntntsWebList.do?ctgry=15&key=1785',
    sourceOrg: '이천시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '노성산 말머리바위', name_en: 'Noseongsan Horsehead Rock', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '도드람산 삼봉', name_en: 'Dodeuramsan Three Peaks', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '반룡송', name_en: 'Banryongsong Pine', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '사기막골도예촌', name_en: 'Sagimakgol Pottery Village', kind: 'neighborhood', linkStatus: 'pending_coord' },
    { attractionName: '산수유마을', name_en: 'Cornelian Cherry Village', kind: 'neighborhood', linkStatus: 'pending_coord' },
    { attractionName: '설봉산 삼형제 바위', name_en: 'Seolbongsan Three Brothers Rocks', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '설봉산성', name_en: 'Seolbongsanseong Fortress', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '설봉공원', name_en: 'Seolbongho Lake', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '애련정', name_en: 'Aeryeonjeong Pavilion', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'gwangju-gi-palgyeong',
    hubId: 'gwangju_gi',
    title: '광주8경',
    title_en: 'Gwangju (Gyeonggi) Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['광주 8경', '광주8경', '경기광주8경', '광주 팔경'],
    sourceUrl: 'https://www.gjcity.go.kr/oldTour/contents.do?mId=0101010100',
    sourceOrg: '광주시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '경기광주 남한산성', name_en: 'Namhansanseong Fortress', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '경안천습지생태공원', name_en: 'Gyeongancheon Wetland Ecological Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '곤지암도자공원', name_en: 'Gonjiam Pottery Park', kind: 'museum', linkStatus: 'linked' },
    { attractionName: '화담숲', name_en: 'Hwadam Forest', kind: 'park', linkStatus: 'linked' },
    { attractionName: '중대물빛공원', name_en: 'Jungdae Water Light Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '무갑산', name_en: 'Mugapsan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '태화산', name_en: 'Taehwasan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '송정사', name_en: 'Songjeongsa Shrine', kind: 'shrine', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R25_LISTS, { roundLabel: 'R25' });
