#!/usr/bin/env node
/**
 * 축제 상세 locale 병합 — KO 목록 SSOT · EN 본문 + KO 폴백.
 *
 *   npm run smoke:festival-detail-locale
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  mergeTourApiFestivalDetailBundle,
  mergeTourApiFestivalFields,
  mergeTourApiFestivalInfoRows,
} from '../src/utils/mergeTourApiFestivalDetail.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

assert(
  mergeTourApiFestivalFields(
    { overview: 'English overview', program: '' },
    { overview: '한글 개요', program: '한글 프로그램' },
  ).overview === 'English overview',
  'overview prefers EN',
);
assert(
  mergeTourApiFestivalFields(
    { overview: 'English overview', program: '' },
    { overview: '한글 개요', program: '한글 프로그램' },
  ).program === '한글 프로그램',
  'empty EN field falls back to KO',
);

const mergedInfo = mergeTourApiFestivalInfoRows(
  [{ infoname: 'Fee', infotext: 'Free' }],
  [{ infoname: '요금', infotext: '무료' }],
);
assert(mergedInfo[0]?.infoname === 'Fee', 'info prefers EN rows');

const koOnlyInfo = mergeTourApiFestivalInfoRows(
  [{ infoname: '', infotext: '' }],
  [{ infoname: '요금', infotext: '무료' }],
);
assert(koOnlyInfo[0]?.infoname === '요금', 'empty EN info falls back to KO');

const bundle = mergeTourApiFestivalDetailBundle(
  {
    ok: true,
    intro: { eventplace: 'Seoul Plaza', program: '' },
    common: { title: 'Garden Night Market', overview: 'EN text' },
    info: [],
  },
  {
    ok: true,
    intro: { eventplace: '서울광장', program: '한글 행사' },
    common: { title: '가든 나이트 마켓', overview: '한글 개요' },
    info: [{ infoname: '요금', infotext: '무료' }],
  },
);
assert(bundle.ok === true, 'bundle ok when either locale ok');
assert(bundle.common?.title === 'Garden Night Market', 'bundle title EN');
assert(bundle.intro?.program === '한글 행사', 'bundle intro program KO fallback');
assert(bundle.info?.[0]?.infoname === '요금', 'bundle info KO fallback');

const festivalsJs = readFileSync(
  join(root, 'src/utils/fetchTourApiFestivals.js'),
  'utf8',
);
assert(
  festivalsJs.includes("locale: 'ko'") &&
    festivalsJs.includes('fetchTourApiFestivalDetailLocalized'),
  'festivalWindow forces ko + localized detail export',
);

const windowJs = readFileSync(
  join(root, 'src/pages/Korea/fetchKoreaFestivalsWindow.js'),
  'utf8',
);
assert(
  windowJs.includes('rolling12:ko'),
  'sessionStorage cache key includes ko',
);

const sheetJs = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  sheetJs.includes('fetchTourApiFestivalDetailLocalized') &&
    sheetJs.includes('displayTitle'),
  'FestivalDetailSheet uses localized detail + displayTitle',
);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll festival detail locale smoke checks passed');
