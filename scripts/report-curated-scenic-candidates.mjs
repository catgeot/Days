#!/usr/bin/env node
/**
 * TourAPI 미등재 또는 상세/사진 부족 명소(contentId null 등) 큐레이션 후보 보고서.
 *
 *   node scripts/report-curated-scenic-candidates.mjs
 *   node scripts/report-curated-scenic-candidates.mjs --markdown
 *   node scripts/report-curated-scenic-candidates.mjs --missing-image
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCENIC_PATH = join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json');

const args = process.argv.slice(2);
const formatMarkdown = args.includes('--markdown');
const missingImageOnly = args.includes('--missing-image');

const data = JSON.parse(readFileSync(SCENIC_PATH, 'utf8'));
const spots = data.spots || [];

// 1. contentId null 후보군
const nullContentIdSpots = spots.filter((s) => !s.contentId);
const missingImageSpots = spots.filter((s) => !s.imageUrl);

// 분류 기준:
// - fully_curated: overview가 있고(임시문구 아님), addr1, homepage, imageUrl, galleryUrls 구비
// - partial: overview 또는 image는 있으나 주소/홈페이지/갤러리 미흡
// - empty: overview 없거나 image 없음
function checkCurationStatus(s) {
  const hasImage = Boolean(s.imageUrl);
  const hasAddr = Boolean(s.addr1);
  const hasHomepage = Boolean(s.homepage);
  const galleryCount = Array.isArray(s.galleryUrls) ? s.galleryUrls.length : 0;
  const rawOv = String(s.overview || '').trim();
  const isTempOverview =
    rawOv.includes('GATEO 선정 안내') ||
    rawOv.includes('TourAPI에 동일 관광지 상세가 없어') ||
    rawOv.length < 50;
  const hasQualityOverview = Boolean(rawOv && !isTempOverview);

  if (hasQualityOverview && hasImage && galleryCount >= 3 && hasAddr) {
    return 'DONE'; // 양구 수목원처럼 완료된 상태
  }
  if (hasQualityOverview || hasImage) {
    return 'PARTIAL';
  }
  return 'TODO';
}

const evaluated = nullContentIdSpots.map((s) => {
  const status = checkCurationStatus(s);
  return {
    id: s.id,
    name: s.name,
    region: s.region,
    hubId: s.hubId,
    order: s.order,
    status,
    hasImage: Boolean(s.imageUrl),
    galleryCount: Array.isArray(s.galleryUrls) ? s.galleryUrls.length : 0,
    hasAddr: Boolean(s.addr1),
    hasHomepage: Boolean(s.homepage),
    overviewLen: (s.overview || '').length,
  };
});

const doneCount = evaluated.filter((e) => e.status === 'DONE').length;
const partialCount = evaluated.filter((e) => e.status === 'PARTIAL').length;
const todoCount = evaluated.filter((e) => e.status === 'TODO').length;

console.log('=================================================================');
console.log(` TourAPI 미등재(contentId: null) 자체 큐레이션 현황 보고서`);
console.log('=================================================================');
console.log(`- 전체 명소: ${spots.length}건`);
console.log(`- contentId null 대상: ${nullContentIdSpots.length}건`);
console.log(`- 사진 미보유(전체): ${missingImageSpots.length}건`);
console.log(`- 자체 큐레이션 상태: 완료(DONE) ${doneCount}건 / 부분(PARTIAL) ${partialCount}건 / 미흡(TODO) ${todoCount}건`);
console.log('-----------------------------------------------------------------');

if (formatMarkdown) {
  console.log('| 순번 | ID | 명소명 | 권역 | 허브 | 상태 | 사진 | 갤러리 | 주소 | 홈피 | 본문길이 |');
  console.log('|---|---|---|---|---|---|:---:|:---:|:---:|:---:|:---:|');
  evaluated.forEach((e, idx) => {
    const icon = e.status === 'DONE' ? '✅' : e.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(
      `| ${idx + 1} | \`${e.id}\` | ${e.name} | ${e.region} | \`${e.hubId}\` | ${icon} ${e.status} | ${e.hasImage ? 'Y' : '-'} | ${e.galleryCount || '-'} | ${e.hasAddr ? 'Y' : '-'} | ${e.hasHomepage ? 'Y' : '-'} | ${e.overviewLen}자 |`
    );
  });
} else {
  evaluated.forEach((e, idx) => {
    const icon = e.status === 'DONE' ? '✅' : e.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(
      `[${String(idx + 1).padStart(2, '0')}] ${icon} ${e.name.padEnd(16, ' ')} (${e.id}) [${e.region}/${e.hubId}] status:${e.status} img:${e.hasImage ? 'Y' : 'N'} gal:${e.galleryCount} addr:${e.hasAddr ? 'Y' : 'N'} hp:${e.hasHomepage ? 'Y' : 'N'} ov:${e.overviewLen}자`
    );
  });
}
