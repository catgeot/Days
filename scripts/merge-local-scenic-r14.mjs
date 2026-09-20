#!/usr/bin/env node
/**
 * F R14: koreaLocalScenicLists append + hub merge.
 * skip: jangseong
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R14_LISTS = [
  {
    listId: 'damyang-other',
    hubId: 'damyang',
    title: '담양10경',
    title_en: 'Damyang Ten Scenic Views',
    listKind: 'other',
    memberCountClaimed: 10,
    aliases: ['담양 10경', '담양10경'],
    sourceUrl: 'https://www.damyang.go.kr/tour',
    sourceOrg: '담양군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '가마골용소', name_en: 'Gamagol Yongso', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '추월산', name_en: 'Chuwolsan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '금성산성', name_en: 'Geumseongsanseong Fortress', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '병풍산', name_en: 'Byeongpungsan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '삼인산', name_en: 'Samin Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '메타세쿼이아 가로수길', name_en: 'Metasequoia Tree Lane', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '죽녹원', name_en: 'Juknokwon Bamboo Garden', kind: 'park', linkStatus: 'linked' },
    { attractionName: '용흥사 계곡', name_en: 'Yongheungsa Valley', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '담양관방제림', name_en: 'Gwanbangjelim Forest', kind: 'park', linkStatus: 'linked' },
    { attractionName: '소쇄원', name_en: 'Soswaewon Garden', kind: 'landmark', linkStatus: 'linked' }
    ],
  },
  {
    listId: 'hwasun-other',
    hubId: 'hwasun',
    title: '화순11경',
    title_en: 'Hwasun Eleven Scenic Views',
    listKind: 'other',
    memberCountClaimed: 11,
    aliases: ['화순 11경', '화순11경'],
    sourceUrl: 'https://www.hwasun.go.kr/contents.do?M=010100000000&S=S05',
    sourceOrg: '화순군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '화순 적벽', name_en: 'Hwasun Jeokbyeok Cliff', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '운주사', name_en: 'Unjusa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '백아산 하늘다리', name_en: 'Baegasan Sky Bridge', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '고인돌 유적지', name_en: 'Dolmen Heritage Site', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '수만리 철쭉공원', name_en: 'Sumalli Azalea Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '규봉암', name_en: 'Gyubongam Hermitage', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '연둔리 숲정이', name_en: 'Yeondunri Forest Trail', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '세량지', name_en: 'Seryangji Pond', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '쌍봉사', name_en: 'Ssangbongsa Temple', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '화순 꽃강길 음악분수', name_en: 'Hwasun Flower River Music Fountain', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '환산정', name_en: 'Hwansanjeong Pavilion', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'hampyeong-palgyeong',
    hubId: 'hampyeong',
    title: '함평8경',
    title_en: 'Hampyeong Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['함평 8경', '함평8경', '함평 팔경'],
    sourceUrl: 'https://www.hampyeong.go.kr/tour',
    sourceOrg: '함평군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '함평자연생태공원', name_en: 'Hampyeong Natural Ecology Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '함평엑스포공원', name_en: 'Hampyeong Expo Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '용천사 함평', name_en: 'Yongcheonsa Hampyeong', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '돌머리해수욕장', name_en: 'Dolmeori Beach', kind: 'beach', linkStatus: 'linked' },
    { attractionName: '백제고도', name_en: 'Baekje Ancient Road', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '모악산', name_en: 'Moaksan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '삼호천', name_en: 'Samhocheon Stream', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '청계산', name_en: 'Cheonggyesan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'yeonggwang-gugyeong',
    hubId: 'yeonggwang',
    title: '영광9경',
    title_en: 'Yeonggwang Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['영광 9경', '영광9경', '영광 구경'],
    sourceUrl: 'https://www.yeonggwang.go.kr/tour',
    sourceOrg: '영광군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '불갑사', name_en: 'Bulgapsa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '칠산타워', name_en: 'Chilsan Tower', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '가마미해수욕장', name_en: 'Gamami Beach', kind: 'beach', linkStatus: 'linked' },
    { attractionName: '백사장해수욕장', name_en: 'Baeksajang Beach', kind: 'beach', linkStatus: 'linked' },
    { attractionName: '불갑저수지', name_en: 'Bulgap Reservoir', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '법성포', name_en: 'Beopseongpo Port', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '황금산', name_en: 'Hwanggeumsan Mountain', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '왕글공원', name_en: 'Wanggeul Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '백학촌', name_en: 'Baekhak Village', kind: 'neighborhood', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'mokpo-gugyeong',
    hubId: 'mokpo',
    title: '목포9경',
    title_en: 'Mokpo Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['목포 9경', '목포9경', '목포 구경'],
    sourceUrl: 'http://www.mmcablecar.com/tour/ninth.html',
    sourceOrg: '목포시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '유달산', name_en: 'Yudalsan Mountain', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '목포대교', name_en: 'Mokpo Bridge', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '목포갓바위', name_en: 'Gatbawi Rock', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '해상분수', name_en: 'Maritime Fountain', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '노적봉', name_en: 'Nojeokbong Hill', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '목포진', name_en: 'Mokpo Fortress', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '삼학도', name_en: 'Samhakdo Island', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '다도해 전경', name_en: 'Dadohae Panorama', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '외달도', name_en: 'Oedaldo Island', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R14_LISTS, { roundLabel: 'R14' });
