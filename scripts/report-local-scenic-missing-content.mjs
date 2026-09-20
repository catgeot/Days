#!/usr/bin/env node
/**
 * 지자체 팔경(koreaLocalScenicLists.json) 멤버들의 사진/본문/contentId 누락 현황을 허브별로 분석하는 스크립트.
 *
 *   node scripts/report-local-scenic-missing-content.mjs
 *   node scripts/report-local-scenic-missing-content.mjs --hub=mungyeong
 *   node scripts/report-local-scenic-missing-content.mjs --priority
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LISTS_PATH = join(__dirname, '../src/pages/Home/data/koreaLocalScenicLists.json');
const SCENIC_PATH = join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json');
const HUBS_PATH = join(__dirname, '../src/pages/Home/data/cityAttractionHubs.json');
const CODE_PATH = join(__dirname, '../src/pages/Home/lib/koreaLocalScenicLists.js');

const lists = JSON.parse(readFileSync(LISTS_PATH, 'utf8'));
const scenic = JSON.parse(readFileSync(SCENIC_PATH, 'utf8')).spots || [];
const hubs = JSON.parse(readFileSync(HUBS_PATH, 'utf8'));

// LOCAL_SCENIC_MEMBER_OVERLAYS 파싱
const code = readFileSync(CODE_PATH, 'utf8');
const overlayKeys = new Set();
const overlayMatch = code.match(/LOCAL_SCENIC_MEMBER_OVERLAYS\s*=\s*\{([\s\S]*?)\n\};/);
if (overlayMatch) {
  const matches = overlayMatch[1].matchAll(/'(local-scenic:[^']+)'/g);
  for (const m of matches) {
    overlayKeys.add(m[1]);
  }
}

const args = process.argv.slice(2);
const targetHubArg = args.find((a) => a.startsWith('--hub='))?.split('=')[1];
const priorityOnly = args.includes('--priority');

const normalizeKey = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '');

const scenicByKey = new Map();
for (const s of scenic) {
  const k = `${s.hubId}:${normalizeKey(s.attractionName || s.name)}`;
  scenicByKey.set(k, s);
}

const hubById = new Map();
for (const h of hubs) {
  hubById.set(h.hubId, h);
}

let totalMembers = 0;
let withContentId = 0;
let withPhoto = 0;
let withOverview = 0;
let fullyEnriched = 0;

const hubStats = [];

for (const list of lists) {
  if (targetHubArg && list.hubId !== targetHubArg) continue;

  const h = hubById.get(list.hubId);
  const members = list.members || [];
  let mTotal = members.length;
  let mHasCid = 0;
  let mHasPhoto = 0;
  let mHasOverview = 0;
  const missingMembers = [];

  for (const m of members) {
    totalMembers++;
    const name = m.attractionName;
    const spotId = `local-scenic:${list.listId}:${normalizeKey(name)}`;
    const hasOverlay = overlayKeys.has(spotId);

    // 1. contentId 체크
    const sHit = scenicByKey.get(`${list.hubId}:${normalizeKey(name)}`);
    const cid = m.contentId || sHit?.contentId || null;
    if (cid) {
      mHasCid++;
      withContentId++;
    }

    // 2. 사진 체크 (overlay or curated scenic spot or TourAPI contentId)
    const hasPhoto = hasOverlay || Boolean(sHit?.imageUrl) || Boolean(cid);
    if (hasPhoto) {
      mHasPhoto++;
      withPhoto++;
    }

    // 3. 본문/개요 체크
    const hasOverview = hasOverlay || Boolean(sHit?.overview) || Boolean(cid);
    if (hasOverview) {
      mHasOverview++;
      withOverview++;
    }

    if (!hasPhoto || !hasOverview || !cid) {
      missingMembers.push({
        name,
        spotId,
        cid,
        hasPhoto,
        hasOverview,
        hasOverlay,
        inScenic: Boolean(sHit),
      });
    } else {
      fullyEnriched++;
    }
  }

  hubStats.push({
    listId: list.listId,
    hubId: list.hubId,
    hubName: h?.name || list.hubId,
    title: list.title,
    total: mTotal,
    hasCid: mHasCid,
    hasPhoto: mHasPhoto,
    hasOverview: mHasOverview,
    missingCount: missingMembers.length,
    missingMembers,
  });
}

// 결손(missingCount) 내림차순 정렬
hubStats.sort((a, b) => b.missingCount - a.missingCount || a.hubName.localeCompare(b.hubName));

console.log('=================================================================');
console.log(' 지자체 팔경(94개 리스트, 876명) 멤버 누락 현황 보고서');
console.log('=================================================================');
console.log(`- 전체 멤버: ${totalMembers}명`);
console.log(`- contentId 보유: ${withContentId}명 (${((withContentId / totalMembers) * 100).toFixed(1)}%)`);
console.log(`- 사진/본문 조회 가능(Tour or Curated or Overlay): ${withPhoto}명 (${((withPhoto / totalMembers) * 100).toFixed(1)}%)`);
console.log(`- 순수 누락 멤버(사진/본문 모두 없음): ${totalMembers - withPhoto}명`);
console.log('-----------------------------------------------------------------');

const displayList = priorityOnly ? hubStats.slice(0, 15) : hubStats;

for (const stat of displayList) {
  if (stat.missingCount === 0 && priorityOnly) continue;
  console.log(`\n[${stat.hubName} (${stat.hubId})] ${stat.title} - 총 ${stat.total}명 중 ${stat.missingCount}명 보강 필요 (Cid:${stat.hasCid}/${stat.total})`);
  for (const m of stat.missingMembers) {
    const flags = [];
    if (!m.cid) flags.push('no-CID');
    if (!m.hasPhoto) flags.push('no-Photo');
    if (!m.hasOverview) flags.push('no-Overview');
    console.log(`  - ${m.name.padEnd(16, ' ')} [${flags.join(', ')}] (${m.spotId})`);
  }
}
