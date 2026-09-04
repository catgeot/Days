#!/usr/bin/env node
/**
 * F R27: koreaLocalScenicLists append + hub merge.
 * skip: gunpo
 * skip: uiwang
 * skip: gwacheon
 * skip: osan
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R27_LISTS = [
  {
    listId: 'yongin-palgyeong',
    hubId: 'yongin',
    title: '용인8경',
    title_en: 'Yongin Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['용인 8경', '용인8경', '용인 팔경'],
    sourceUrl: 'https://www.yongin.go.kr/home/yitour/ytour01/yttour02/yttourmn01.jsp',
    sourceOrg: '용인시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '용인 석성산', name_en: 'Seokseongsan Sunrise', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '광교산 사계', name_en: 'Gwanggyosan Four Seasons', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '기흥호수공원', name_en: 'Giheung Lake Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '용인농촌테마파크와 연꽃단지', name_en: 'Yongin Rural Theme Park and Lotus Pond', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '용인자연휴양림', name_en: 'Yongin Natural Recreation Forest', kind: 'park', linkStatus: 'linked' },
    { attractionName: '조비산', name_en: 'Jobisan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '가실벚꽃', name_en: 'Gasil Cherry Blossoms', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '어비낙조', name_en: 'Eobi Sunset', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'anyang-gugyeong',
    hubId: 'anyang',
    title: '안양9경',
    title_en: 'Anyang Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['안양 9경', '안양9경', '안양 구경'],
    sourceUrl: 'https://www.anyang.go.kr/main/contents.do?key=732',
    sourceOrg: '안양시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '안양예술공원', name_en: 'Anyang Art Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '안양천생태공원', name_en: 'Anyangcheon Stream', kind: 'park', linkStatus: 'linked' },
    { attractionName: '평촌중앙공원', name_en: 'Pyeongchon Central Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '망해암일몰', name_en: 'Manghaeam Sunset', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '안양중앙시장', name_en: 'Anyang First Street', kind: 'market', linkStatus: 'linked' },
    { attractionName: '수리산성지', name_en: 'Surisan Holy Site', kind: 'shrine', linkStatus: 'pending_coord' },
    { attractionName: '평촌1번가 문화의거리', name_en: 'Pyeongchon Culture Street', kind: 'neighborhood', linkStatus: 'pending_coord' },
    { attractionName: '병목안 시민공원', name_en: 'Byeongmokam Citizens Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '만안교', name_en: 'Manangyo Bridge', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R27_LISTS, { roundLabel: 'R27' });
