#!/usr/bin/env node
/**
 * F R03: 강원 마감 — koreaLocalScenicLists append 없음 (강원 예비 소진).
 * skip_no_source: hoengseong (시·군 단위 공식 N경 없음 — hsg.go.kr tour 팔경/8경/구경/비경 0건)
 * 예비 강원 5칸: P0·R01·R02로 전 hub 처리 완료 — 대체 없음
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const listsPath = join(root, 'src/pages/Home/data/koreaLocalScenicLists.json');

const R03_LISTS = [];

const existingLists = JSON.parse(readFileSync(listsPath, 'utf8'));
const existingIds = new Set(existingLists.map((l) => l.listId));

for (const list of R03_LISTS) {
  if (existingIds.has(list.listId)) {
    throw new Error(`listId already exists: ${list.listId}`);
  }
}

const GANGWON_HUBS = 18;
const GANGWON_VERIFIED = existingLists.filter((l) =>
  [
    'gangneung',
    'sokcho',
    'chuncheon',
    'pyeongchang',
    'yangyang',
    'donghae',
    'samcheok',
    'cheorwon',
    'wonju',
    'inje',
    'yeongwol',
    'goseong',
    'hongcheon',
    'yanggu',
    'jeongseon',
    'taebaek',
    'hoengseong',
    'hwacheon',
  ].includes(l.hubId),
).length;

if (GANGWON_VERIFIED !== existingLists.length) {
  throw new Error(`expected all lists in Gangwon phase, got ${GANGWON_VERIFIED}/${existingLists.length}`);
}

console.log('merged R03:', R03_LISTS.length ? R03_LISTS.map((l) => l.listId).join(', ') : '(none)');
console.log('skip_no_source: hoengseong (시·군 단위 공식 N경 없음)');
console.log('예비 강원 5칸: 소진 — lists', existingLists.length, '/ hubs', GANGWON_HUBS, '· skips chuncheon·gangneung·pyeongchang·hoengseong');
