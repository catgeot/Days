#!/usr/bin/env node
/**
 * F R19: koreaLocalScenicLists append + hub merge.
 * skip: sunchang
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R19_LISTS = [
  {
    listId: 'imsil-gugyeong',
    hubId: 'imsil',
    title: '임실9경',
    title_en: 'Imsil Nine Scenic Views',
    listKind: 'gugyeong',
    memberCountClaimed: 9,
    aliases: ['임실 9경', '임실9경', '임실 구경'],
    sourceUrl: 'https://www.imsil.go.kr/tour/board/list.imsil?boardId=BBS_0000050&menuCd=DOM_000000202001000000',
    sourceOrg: '임실군',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '강변사리', name_en: 'Gangbyeonsari Village', kind: 'neighborhood', linkStatus: 'pending_coord' },
    { attractionName: '옥정호', name_en: 'Okjeongho Suspension Bridge and Bung-eoseom', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '임실치즈마을', name_en: 'Imsil Cheese Village', kind: 'neighborhood', linkStatus: 'linked' },
    { attractionName: '필봉농악전수관', name_en: 'Pilbong Nongak Transmission Center', kind: 'museum', linkStatus: 'pending_coord' },
    { attractionName: '임실치즈테마파크', name_en: 'Imsil Cheese Theme Park', kind: 'park', linkStatus: 'linked' },
    { attractionName: '왜가리서식지', name_en: 'Heron Habitat', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '오수의견', name_en: 'Osu Uigyeon Scenic Rock', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '사선대', name_en: 'Saseondae Observatory', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '옥정호', name_en: 'Mysterious Okjeongho Island', kind: 'viewpoint', linkStatus: 'linked' }
    ],
  }
];

mergeListsIntoTip(R19_LISTS, { roundLabel: 'R19' });
