#!/usr/bin/env node
/**
 * 명소 세권 SSOT 스모크
 *
 *   npm run smoke:korea-scenic-clusters
 */
import {
  areaHasScenicClusters,
  normalizeScenicClusterId,
  scenicClusterIdForHubId,
} from '../src/pages/Home/lib/koreaScenicClusters.js';
import {
  listKoreaScenicClusterChips,
  listKoreaScenicHubChips,
} from '../src/pages/Home/lib/koreaScenicSpots.js';
import { scenicHomePathForHubId } from '../src/pages/Home/lib/koreaThemeCrossLinks.js';
import { resolveDefaultCuratedChips } from '../src/pages/KoreaTheme/scenicDefaultChips.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

assert(areaHasScenicClusters('31'), '경기 has clusters');
assert(!areaHasScenicClusters('1'), '서울 no clusters');
assert(scenicClusterIdForHubId('suwon') === 'gg-south', 'suwon→남부');
assert(scenicClusterIdForHubId('goyang') === 'gg-north', 'goyang→북부');
assert(
  normalizeScenicClusterId('31', 'gg-east') === 'gg-east',
  'normalize gg-east',
);
assert(normalizeScenicClusterId('31', 'nope') === null, 'reject bad cluster');

const gg = listKoreaScenicClusterChips('수도권', '31');
assert(gg.length === 4, '경기 4세권');
assert(gg[0].label === '북부', '첫 세권 북부');

const northHubs = listKoreaScenicHubChips('수도권', '31', 'gg-north');
assert(northHubs.length === 7, `북부 hub=7 (got ${northHubs.length})`);
assert(
  !northHubs.some((h) => h.hubId === 'suwon'),
  '북부 칩에 수원 없음',
);

const gw = resolveDefaultCuratedChips('강원');
assert(gw.clusterId === 'gw-yeongseo', '강원 기본 세권 영서');
assert(gw.hubId === 'hongcheon', '강원 기본 hub 홍천');

const path = scenicHomePathForHubId('paju');
assert(path.includes('ccluster=gg-north'), `paju path has cluster (${path})`);
assert(path.includes('hub=paju'), 'paju path has hub');

if (failed) {
  console.error(`\nFAIL smoke:korea-scenic-clusters (${failed})`);
  process.exit(1);
}
console.log('\nPASS smoke:korea-scenic-clusters');
