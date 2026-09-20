#!/usr/bin/env node
/**
 * 큐레이션 이미지 폴백(place_stats 후보·추출) 회귀.
 * Usage: node scripts/smoke-curation-image-resolve.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const {
  buildCurationImageQueries,
  curationPlaceStatsCandidates,
  pickImageFromPlaceStatsRow,
  pickImageFromPlaceStatsRows,
} = await import(pathToFileURL(join(root, 'src/pages/DailyReport/lib/curationImageResolve.js')).href);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL ${msg}`);
    failed += 1;
  } else {
    console.log(`PASS ${msg}`);
  }
}

const aitutakiParsed = {
  location: '아이투타키',
  locationEn: 'Aitutaki, Cook Islands',
  searchKeyword: 'Aitutaki tropical island pristine beach clear water landscape',
  slug: 'aitutaki',
};
const catalog = {
  slug: 'aitutaki',
  name: '아이투타키',
  name_en: 'Aitutaki',
  country: '쿡 제도',
  country_en: 'Cook Islands',
};

const candidates = curationPlaceStatsCandidates(aitutakiParsed, catalog);
assert(candidates.includes('aitutaki'), 'candidates include slug');
assert(candidates.includes('아이투타키'), 'candidates include KO name');
assert(candidates.includes('Aitutaki'), 'candidates include EN city');

const queries = buildCurationImageQueries(aitutakiParsed);
assert(queries[0]?.includes('Aitutaki'), 'searchKeyword first');
assert(queries.some((q) => q.includes('lagoon')), 'lagoon backup query');

const thumbRow = {
  place_id: 'aitutaki',
  image_url: 'https://images.unsplash.com/photo-aitutaki-thumb',
  gallery_urls: [],
};
const fromThumb = pickImageFromPlaceStatsRow(thumbRow);
assert(fromThumb?.imageUrl === thumbRow.image_url, 'prefer image_url');
assert(fromThumb?.imageSource === 'place_stats', 'source place_stats');

const galleryOnly = pickImageFromPlaceStatsRow({
  place_id: 'aitutaki',
  image_url: '',
  gallery_urls: [{ urls: { regular: 'https://images.unsplash.com/photo-aitutaki-gallery' } }],
});
assert(galleryOnly?.imageUrl?.includes('gallery'), 'gallery_urls fallback');

const ordered = pickImageFromPlaceStatsRows(
  [
    { place_id: '아이투타키', image_url: 'https://example.com/ko.jpg' },
    { place_id: 'aitutaki', image_url: 'https://example.com/slug.jpg' },
  ],
  ['aitutaki', '아이투타키'],
);
assert(ordered.imageUrl === 'https://example.com/slug.jpg', 'candidate order prefers slug');

assert(pickImageFromPlaceStatsRow(null) === null, 'null row');
assert(pickImageFromPlaceStatsRows([], ['aitutaki']).imageUrl === null, 'empty rows');

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nAll curation image resolve smoke checks passed.');
