#!/usr/bin/env node
/**
 * F R21: koreaLocalScenicLists append + hub merge.
 * skip: cheongyang
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R21_LISTS = [
  {
    listId: 'seocheon-gugyeong',
    hubId: 'seocheon',
    title: '서천9경',
    title_en: 'Seocheon Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['서천 9경', '서천9경', '서천 구경'],
    sourceUrl: 'https://seocheon.grandculture.net/seocheon/toc/GC09500011',
    sourceOrg: '서천군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '마량리동백숲', name_en: 'Maryangri Camellia Forest Sunrise', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '신성리갈대밭', name_en: 'Sinseongri Reed Field', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '한산모시관', name_en: 'Hansan Mosi Village', kind: 'neighborhood', linkStatus: 'linked' },
    { attractionName: '서천 문헌서원', name_en: 'Munheon Seowon Academy', kind: 'shrine', linkStatus: 'linked' },
    { attractionName: '춘장대해수욕장', name_en: 'Chunjangdae Beach', kind: 'beach', linkStatus: 'pending_coord' },
    { attractionName: '국립생태원', name_en: 'National Ecological Institute and Marine Bio Center', kind: 'museum', linkStatus: 'linked' },
    { attractionName: '금강 하구 철새 도래지', name_en: 'Geumgang Estuary Bird Habitat', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '장항송림산림욕장과 장항스카이워크', name_en: 'Janghang Pine Forest and Skywalk', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '유부도와 서천갯벌', name_en: 'Yubudo Island and Seocheon Tidal Flat', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'hongseong-other',
    hubId: 'hongseong',
    title: '홍성12경',
    title_en: 'Hongseong Twelve Scenic Views',
    listKind: 'other',
    memberCountClaimed: 12,
    aliases: ['홍성 12경', '홍성12경'],
    sourceUrl: 'https://www.hongseong.go.kr/tour',
    sourceOrg: '홍성군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '홍주읍성', name_en: 'Hongju Eupseong Fortress', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '남당항', name_en: 'Namdang Port', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '홍성 용봉산', name_en: 'Yongbongsan Mountain', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '죽도', name_en: 'Jukdo Island', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '오서산', name_en: 'Oseosan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '궁리포구', name_en: 'Gungni Port', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '만해한용운생가지', name_en: 'Manhae Han Yong-un Birthplace', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '백야김좌진장군생가지', name_en: 'Baekya Kim Jwa-jin Birthplace', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '선상문선생 유허지', name_en: 'Seonsangmun Teacher Memorial Site', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '고암이응노 생가 기념관', name_en: 'Goam Lee Eung-no Birthplace Memorial', kind: 'museum', linkStatus: 'pending_coord' },
    { attractionName: '홍주의사총', name_en: 'Hongju Martyrs Cemetery', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '그림같은수목원', name_en: 'Picturesque Arboretum', kind: 'park', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'yesan-sipgyeong',
    hubId: 'yesan',
    title: '예산10경',
    title_en: 'Yesan Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['예산 10경', '예산10경', '예산 십경'],
    sourceUrl: 'http://www.yesan.go.kr/tour/sub01_01_01_08_01.do',
    sourceOrg: '예산군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '예산 수덕사', name_en: 'Sudeoksa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '충의사', name_en: 'Chunguisa Shrine', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '추사고택', name_en: 'Chusa Historic House', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '임존성', name_en: 'Imjonsanseong Fortress', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '예당호', name_en: 'Yedangho Lake', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '삽교평야', name_en: 'Sapgyo Plain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '가야산', name_en: 'Gayasan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '예산사과', name_en: 'Yesan Apple Orchards', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '예산황새공원', name_en: 'Yesan Stork Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '덕산온천', name_en: 'Deoksan Hot Springs', kind: 'landmark', linkStatus: 'linked' }
    ],
  },
  {
    listId: 'gongju-sipgyeong',
    hubId: 'gongju',
    title: '공주10경',
    title_en: 'Gongju Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['공주 10경', '공주10경', '공주 십경'],
    sourceUrl: 'https://www.traveli.co.kr/read/contentsView/180/0/0/1',
    sourceOrg: '공주시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '갑사', name_en: 'Gapsa Temple', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '계룡산', name_en: 'Gyeryongsan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '고마나루', name_en: 'Gomanaru Ferry', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '공산성', name_en: 'Gongsanseong Fortress', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '금강', name_en: 'Geumgang River', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '금학생태공원', name_en: 'Geumhak Ecological Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '마곡사', name_en: 'Magoksa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '무령왕릉', name_en: 'King Muryeong Tomb', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '석장리박물관', name_en: 'Seokjangni Historic Site', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '창벽', name_en: 'Changbyeok Cliff', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'buyeo-sipgyeong',
    hubId: 'buyeo',
    title: '부여10경',
    title_en: 'Buyeo Ten Scenic Views',
    listKind: 'sipgyeong',
    memberCountClaimed: 10,
    aliases: ['부여 10경', '부여10경', '부여 십경'],
    sourceUrl: 'https://buyeo.go.kr/html/tour/info/info_010107.html',
    sourceOrg: '부여군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '낙화암', name_en: 'Nakwhaam Rock of Busosan', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '정림사지 오층석탑', name_en: 'Five-story Stone Pagoda at Jeongnimsa', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '궁남지', name_en: 'Gungnamji Pond Four Seasons', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '부여왕릉원', name_en: 'Buyeo Royal Tombs', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '천정대 백제보', name_en: 'Cheonjeongdae Baekje Fort', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '백마강 수상관광', name_en: 'Baekma River Boat Tour', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '백제문화단지', name_en: 'Baekje Cultural Land', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '만수산 무량사', name_en: 'Musangsan Muryangsa Temple', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '서동요 테마파크', name_en: 'Seodongyo Theme Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '성흥산 사랑나무', name_en: 'Seongheungsan Love Tree', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R21_LISTS, { roundLabel: 'R21' });
