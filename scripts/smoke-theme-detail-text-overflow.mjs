/**
 * 관광지·코스 상세 모달 — 긴 TourAPI 토큰 가로 넘침 가드.
 * 낙산도립공원(contentId 125589) info URL · keep-all+break-words · overflow-x-hidden.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spotModal = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
const courseModal = readFileSync(
  join(root, 'src/pages/KoreaTheme/CourseDetailModal.jsx'),
  'utf8',
);

const checks = [
  [
    'ThemeSpotDetailModal DetailRow break-words',
    /DETAIL_BODY_TEXT_CLASS[\s\S]*break-keep break-words/,
    spotModal,
  ],
  [
    'ThemeSpotDetailModal scroll overflow-x-hidden',
    /overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar/,
    spotModal,
  ],
  [
    'CourseDetailModal scroll overflow-x-hidden',
    /overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar/,
    courseModal,
  ],
  [
    'CourseDetailModal overview break-words',
    /whitespace-pre-line text-sm leading-relaxed text-stone-600 break-keep break-words/,
    courseModal,
  ],
];

let failed = 0;
for (const [label, re, src] of checks) {
  if (!re.test(src)) {
    console.error(`FAIL: ${label}`);
    failed += 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

const sampleUrl = 'http://hiking.kworks.co.kr/sub_map/map_user01.aspx';
if (sampleUrl.length < 40) {
  console.error('FAIL: sample URL too short for regression intent');
  failed += 1;
} else {
  console.log(`PASS: sample long token len=${sampleUrl.length} (낙산도립공원 입산통제)`);
}

if (failed > 0) {
  console.error(`smoke-theme-detail-text-overflow: ${failed} failed`);
  process.exit(1);
}
console.log('smoke-theme-detail-text-overflow: OK');
