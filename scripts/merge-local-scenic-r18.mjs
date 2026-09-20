#!/usr/bin/env node
/**
 * F R18: koreaLocalScenicLists append + hub merge.
 * skip: gochang
 * skip: namwon
 * skip: jinan
 * skip: jangsu
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R18_LISTS = [
  {
    listId: 'jeongeup-gugyeong',
    hubId: 'jeongeup',
    title: '정읍9경',
    title_en: 'Jeongeup Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['정읍 9경', '정읍9경', '정읍 구경'],
    sourceUrl: 'https://www.kogl.or.kr/recommend/recommendDivView.do?atcUrl=personal&division=img&recommendIdx=145907',
    sourceOrg: '정읍시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '내장산국립공원', name_en: 'Naejangsan National Park', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '정읍 구절초 지방정원', name_en: 'Jeongeup Iris Garden', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '정읍사공원', name_en: 'Jeongeup Lake Park and Moonlight Forest', kind: 'park', linkStatus: 'linked' },
    { attractionName: '동학농민혁명기념공원', name_en: 'Donghak Peasant Revolution Memorial Park', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '무성서원', name_en: 'Museong Seowon Academy', kind: 'shrine', linkStatus: 'linked' },
    { attractionName: '용산호', name_en: 'Yongsan Lake', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '피향정', name_en: 'Pihyangjeong Pavilion', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '월영습지와 솔티숲', name_en: 'Wolyeong Wetland and Solti Forest', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '김명관 고택', name_en: 'Kim Myeong-gwan Historic House', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'muju-other',
    hubId: 'muju',
    title: '구천동33경',
    title_en: 'Gucheondong Thirty-three Scenic Views',
    listKind: 'other',
    memberCountClaimed: 33,
    aliases: ['무주 구천동33경', '구천동 33경', '구천동33경'],
    sourceUrl: 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=6166837d-0d68-4e02-ac27-c14a229f7c95',
    sourceOrg: '무주군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '라제통문', name_en: 'Naje Tongmun Gate', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '은구암', name_en: 'Eunguam Rock', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '청금대', name_en: 'Cheonggeumdae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '와룡담', name_en: 'Waryongdam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '학소대', name_en: 'Haksodae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '일사대', name_en: 'Ilsadae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '함벽소', name_en: 'Hambekso Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '가의암', name_en: 'Gauiam Rock', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '추월담', name_en: 'Chuwoldam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '만조탄', name_en: 'Manjotan Beach', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '파회', name_en: 'Pahoe Rapids', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '수심대', name_en: 'Susimdae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '세심대', name_en: 'Sesimdae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '수경대', name_en: 'Sugyeongdae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '월하탄', name_en: 'Wolhatan Beach', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '인월담', name_en: 'Inwoldam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '사자담', name_en: 'Sajadam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '청류동', name_en: 'Cheongnyudong Cave', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '비파담', name_en: 'Bipadam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '다연대', name_en: 'Dayeondae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '구월담', name_en: 'Guwoldam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '금포탄', name_en: 'Geumpotan Beach', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '호탄암', name_en: 'Hotanam Rock', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '청류계', name_en: 'Cheongnyugye Stream', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '안심대', name_en: 'Ansimdae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '신양담', name_en: 'Sinyangdam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '명경담', name_en: 'Myeonggyeongdam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '구천폭포', name_en: 'Gucheom Falls', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '백련담', name_en: 'Baengnyeondam Pond', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '연화폭', name_en: 'Yeonhwa Falls', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '이속대', name_en: 'Isokdae Pavilion', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '백련사', name_en: 'Baengnyeonsa Temple', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '향적봉', name_en: 'Hyangjeokbong Peak', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R18_LISTS, { roundLabel: 'R18' });
