#!/usr/bin/env node
/**
 * 명승 목록 — 동일 권역·시·군 뭉침 정렬.
 *
 *   npm run smoke:korea-scenic-place-cluster
 */
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';
import { listKoreaHeritageScenic } from '../src/pages/Home/lib/koreaHeritageScenic.js';
import { formatScenicSpotPlaceLabel } from '../src/pages/Home/lib/scenicSpotPlaceLabel.js';
import { sortScenicSpotsByPlaceCluster } from '../src/pages/Home/lib/sortScenicSpotsByPlaceCluster.js';
import { scenicAreaCodeForHubId } from '../src/pages/Home/lib/koreaTourAttractionMap.js';

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

const curated = sortScenicSpotsByPlaceCluster(listKoreaScenicSpots('경상'));
assert(curated.length >= 5, `경상 선정 ≥5 (got ${curated.length})`);

const gyeongjuIdx = curated
  .map((s, i) => ({ s, i }))
  .filter(({ s }) => scenicAreaCodeForHubId(s.hubId) === '35')
  .filter(({ s }) => formatScenicSpotPlaceLabel(s).includes('경주'));
assert(gyeongjuIdx.length >= 2, `경주 선정 ≥2 (got ${gyeongjuIdx.length})`);

let gyeongjuContiguous = true;
for (let i = 1; i < gyeongjuIdx.length; i += 1) {
  if (gyeongjuIdx[i].i !== gyeongjuIdx[i - 1].i + 1) {
    gyeongjuContiguous = false;
    break;
  }
}
assert(gyeongjuContiguous, '경주 선정 명소가 연속으로 뭉침');

const labels = curated.map((s) => formatScenicSpotPlaceLabel(s));
const firstGyeongju = labels.indexOf('경북 경주');
const lastGyeongju = labels.lastIndexOf('경북 경주');
if (firstGyeongju >= 0 && lastGyeongju >= 0) {
  const between = labels.slice(firstGyeongju, lastGyeongju + 1);
  assert(
    between.every((l) => l === '경북 경주'),
    `경북 경주 구간이 다른 지역과 섞이지 않음 (${between.filter((l) => l !== '경북 경주').join(',') || 'ok'})`,
  );
}

const heritage = sortScenicSpotsByPlaceCluster(
  listKoreaHeritageScenic({ region: '경상' }),
);
assert(heritage.length >= 5, `경상 유산 ≥5 (got ${heritage.length})`);

/** 시도(areaLabel)가 바뀔 때 이전 시도로 되돌아가지 않음 */
const areaSeq = heritage.map((s) => String(s.areaLabel || ''));
const seen = new Set();
let areaMonotone = true;
let prev = '';
for (const a of areaSeq) {
  if (!a) continue;
  if (a !== prev) {
    if (seen.has(a)) {
      areaMonotone = false;
      break;
    }
    seen.add(a);
    prev = a;
  }
}
assert(areaMonotone, '유산 목록 시도(areaLabel)가 섞이지 않고 구간으로 뭉침');

if (failed) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nPASS smoke:korea-scenic-place-cluster');
