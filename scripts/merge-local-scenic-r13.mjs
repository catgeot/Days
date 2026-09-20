#!/usr/bin/env node
/**
 * F R13: koreaLocalScenicLists append + hub merge.
 * skip: suncheon
 * skip: naju
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R13_LISTS = [
  {
    listId: 'yeosu-other',
    hubId: 'yeosu',
    title: '여수10경',
    title_en: 'Yeosu Ten Scenic Views',
    listKind: 'other',
    memberCountClaimed: 10,
    aliases: ['여수 10경', '여수10경', '여수 10미10경'],
    sourceUrl: 'https://www.yeosu.go.kr/tour',
    sourceOrg: '여수시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '오동도', name_en: 'Odongdo', kind: 'park', linkStatus: 'linked' },
    { attractionName: '거문도와 백도', name_en: 'Geomundo and Baekdo', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '향일암', name_en: 'Hyangiram Hermitage', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '금오도 비렁길', name_en: 'Geumodo Cliff Trail', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '여수세계박람회장', name_en: 'Yeosu Expo Site', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '진남관', name_en: 'Jinnamgwan Hall', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '여수 밤바다와 산단 야경', name_en: 'Yeosu Night Sea and Industrial Night View', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '영취산 진달래', name_en: 'Yeongchuisan Azaleas', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '여수해상케이블카', name_en: 'Yeosu Maritime Cable Car', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '여수 이순신대교', name_en: 'Yeosu Yi Sun-sin Bridge', kind: 'landmark', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'gwangyang-gugyeong',
    hubId: 'gwangyang',
    title: '광양9경',
    title_en: 'Gwangyang Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['광양 9경', '광양9경', '광양 구경'],
    sourceUrl: 'https://gwangyang.go.kr/tour/menu.es?mid=a31201000000',
    sourceOrg: '광양시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '백운산 4대 계곡', name_en: 'Baekunsan Four Valleys', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '광양 매화마을', name_en: 'Gwangyang Maehwa Village', kind: 'neighborhood', linkStatus: 'linked' },
    { attractionName: '백운산 자연휴양림', name_en: 'Baekunsan Natural Recreation Forest', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '광양이순신대교', name_en: 'Gwangyang Yi Sun-sin Bridge', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '망덕포구', name_en: 'Seomjingang Mangdeok Port', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '광양만 야경', name_en: 'Gwangyang Bay Night View', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '옥룡사지 동백나무 숲', name_en: 'Okryongsa Site Camellia Forest', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '구봉산 케이블카', name_en: 'Gubongsan Observatory', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '광양읍수와 이팝나무', name_en: 'Gwangyang Eup Pond and Poplar Trees', kind: 'park', linkStatus: 'pending_coord' }
    ],
  },
  {
    listId: 'gokseong-gugyeong',
    hubId: 'gokseong',
    title: '곡성9경',
    title_en: 'Gokseong Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['곡성 9경', '곡성9경', '곡성관광9경'],
    sourceUrl: 'https://www.gokseong.go.kr/tour/tourist/9tour',
    sourceOrg: '곡성군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '섬진강기차마을', name_en: 'Train Village and Rose Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '태안사', name_en: 'Bongdusan and Taeansa', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '섬진강 침실습지', name_en: 'Seomjingang Chimsil Wetland', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '도림사', name_en: 'Dongaksan and Dorimsa', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '섬진강변 철쭉길', name_en: 'Seomjingang Azalea Trail', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '대황강 출렁다리', name_en: 'Daehwanggang Suspension Bridge', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '설산과 성륜사', name_en: 'Seolsan and Seongryunsa', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '반구정습지와 대황강자연휴식공원', name_en: 'Bangujeong Wetland and Daehwanggang Park', kind: 'park', linkStatus: 'pending_coord' },
    { attractionName: '압록유원지', name_en: 'Amnok Recreation Area', kind: 'park', linkStatus: 'linked' }
    ],
  },
  {
    listId: 'gurye-other',
    hubId: 'gurye',
    title: '구례10경',
    title_en: 'Gurye Ten Scenic Views',
    listKind: 'other',
    memberCountClaimed: 10,
    aliases: ['구례 10경', '구례10경'],
    sourceUrl: 'https://www.gurye.go.kr/tour/subPage.do?menuNo=101006000000',
    sourceOrg: '구례군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '노고단 운해', name_en: 'Nogodan Sea of Clouds', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '반야봉 낙조', name_en: 'Banyabong Sunset', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '피아골 단풍', name_en: 'Piagol Autumn Leaves', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '구례 섬진강', name_en: 'Seomjingang Clear Stream', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '산동 산수유꽃', name_en: 'Sandong Cornelian Cherry Blossoms', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '섬진강 벚꽃길', name_en: 'Seomjingang Cherry Blossom Road', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '수락폭포', name_en: 'Surak Falls', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '화엄사', name_en: 'Hwaeomsa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '사성암', name_en: 'Osan and Saseongam', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '노고단 설경', name_en: 'Nogodan Winter Scenery', kind: 'viewpoint', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R13_LISTS, { roundLabel: 'R13' });
