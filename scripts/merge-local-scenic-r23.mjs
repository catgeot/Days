#!/usr/bin/env node
/**
 * F R23: koreaLocalScenicLists append + hub merge.
 * skip: goyang
 * skip: paju
 * skip: yangju
 * skip: dongducheon
 * skip: pocheon
 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R23_LISTS = [
  {
    listId: 'uijeongbu-palgyeong',
    hubId: 'uijeongbu',
    title: '의정부8경',
    title_en: 'Uijeongbu Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['의정부 8경', '의정부8경', '의정부 팔경'],
    sourceUrl: 'https://www.uijeongbu.go.kr/tour',
    sourceOrg: '의정부시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '망월사', name_en: 'Mangwolsa Temple', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '미술도서관', name_en: 'Art Library', kind: 'museum', linkStatus: 'pending_coord' },
    { attractionName: '수락산 도정봉', name_en: 'Suraksan Dojeongbong Peak', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '음악도서관', name_en: 'Music Library', kind: 'museum', linkStatus: 'pending_coord' },
    { attractionName: '의정부경전철', name_en: 'Uijeongbu Light Rail', kind: 'landmark', linkStatus: 'pending_coord' },
    { attractionName: '의정부예술의전당', name_en: 'Uijeongbu Arts Center', kind: 'landmark', linkStatus: 'linked' },
    { attractionName: '의정부제일시장', name_en: 'Uijeongbu First Market', kind: 'market', linkStatus: 'pending_coord' },
    { attractionName: '회룡사', name_en: 'Hoeryongsa Temple', kind: 'temple', linkStatus: 'linked' }
    ],
  }
];

mergeListsIntoTip(R23_LISTS, { roundLabel: 'R23' });
