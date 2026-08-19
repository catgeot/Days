#!/usr/bin/env node
/**
 * 명승 TourAPI 상세 locale 병합 — EN 본문 + KO 폴백.
 *
 *   npm run smoke:scenic-detail-locale
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mergeTourApiAttractionDetail } from '../src/utils/mergeTourApiAttractionDetail.js';
import {
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
    { overview: 'English overview', usetime: '' },
    { overview: '한글 개요', usetime: '09:00–18:00' },
  ).usetime === '09:00–18:00',
  'intro field empty EN falls back to KO',
);

const merged = mergeTourApiAttractionDetail(
  {
    contentId: '126508',
    title: 'Seoraksan National Park',
    overview: 'EN overview text',
    addr1: 'Seoraksan-ro, Sokcho-si',
    addr2: '',
    tel: '033-636-7700',
    homepage: '',
    imageUrl: 'https://example.com/en.jpg',
    galleryUrls: ['https://example.com/en.jpg'],
    intro: { usetime: 'Open daily', parking: '' },
    infoItems: [{ infoname: 'Fee', infotext: 'Free' }],
  },
  {
    contentId: '126508',
    title: '설악산국립공원',
    overview: '한글 개요',
    addr1: '강원특별자치도 속초시 설악산로',
    addr2: '',
    tel: '033-636-7700',
    homepage: '',
    imageUrl: 'https://example.com/ko.jpg',
    galleryUrls: ['https://example.com/ko.jpg'],
    intro: { usetime: '연중무휴', parking: '주차 가능' },
    infoItems: [{ infoname: '요금', infotext: '무료' }],
  },
);

assert(merged?.title === 'Seoraksan National Park', 'title prefers EN');
assert(merged?.overview === 'EN overview text', 'overview prefers EN');
assert(merged?.intro?.parking === '주차 가능', 'intro parking KO fallback');
assert(merged?.infoItems?.[0]?.infoname === 'Fee', 'info prefers EN rows');
assert(merged?.localeMerged === true, 'localeMerged flag set');

const emptyEnInfo = mergeTourApiFestivalInfoRows(
  [{ infoname: '', infotext: '' }],
  [{ infoname: '요금', infotext: '무료' }],
);
assert(emptyEnInfo[0]?.infoname === '요금', 'empty EN info falls back to KO');

const fetchJs = readFileSync(
  join(root, 'src/utils/fetchTourApiAttractionDetail.js'),
  'utf8',
);
assert(
  fetchJs.includes('fetchTourApiAttractionDetailLocalized') &&
    fetchJs.includes("locale: 'en'") &&
    fetchJs.includes("locale: 'ko'"),
  'attraction detail localized fetch with en/ko',
);

const modalJs = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
assert(
  modalJs.includes('fetchTourApiAttractionDetailLocalized') &&
    modalJs.includes('displayTitle'),
  'ThemeSpotDetailModal uses localized detail + displayTitle',
);
assert(
  modalJs.includes('i18n.language'),
  'ThemeSpotDetailModal refetches on locale change',
);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll scenic detail locale smoke checks passed');
