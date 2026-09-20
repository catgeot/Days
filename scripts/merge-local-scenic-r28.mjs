#!/usr/bin/env node
/**
 * F R28: koreaLocalScenicLists append + hub merge.

 */
import { mergeListsIntoTip } from './lib/merge-local-scenic.mjs';

const R28_LISTS = [
  {
    listId: 'anseong-palgyeong',
    hubId: 'anseong',
    title: '안성8경',
    title_en: 'Anseong Eight Scenic Views',
    listKind: 'palgyeong',
    memberCountClaimed: 8,
    aliases: ['안성 8경', '안성8경', '안성 팔경'],
    sourceUrl: 'https://www.data.go.kr/data/15078322/fileData.do',
    sourceOrg: '안성시',
    sourceFetchedAt: '2026-09-04',
    status: 'verified',
    members: [
    { attractionName: '안성 칠장사', name_en: 'Chiljangsa Temple', kind: 'temple', linkStatus: 'linked' },
    { attractionName: '안성 미리내성지', name_en: 'Mirinae Holy Site', kind: 'shrine', linkStatus: 'linked' },
    { attractionName: '석남사', name_en: 'Seongnamsa Temple', kind: 'temple', linkStatus: 'pending_coord' },
    { attractionName: '안성맞춤랜드', name_en: 'Anseong Matchum Land', kind: 'park', linkStatus: 'linked' },
    { attractionName: '안성 서운산', name_en: 'Seounsan Mountain', kind: 'viewpoint', linkStatus: 'linked' },
    { attractionName: '금광호수', name_en: 'Geumgwang Lake', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '고삼호수', name_en: 'Gosam Lake', kind: 'viewpoint', linkStatus: 'pending_coord' },
    { attractionName: '안성팜랜드', name_en: 'Anseong Farmland', kind: 'park', linkStatus: 'pending_coord' }
    ],
  }
];

mergeListsIntoTip(R28_LISTS, { roundLabel: 'R28' });
