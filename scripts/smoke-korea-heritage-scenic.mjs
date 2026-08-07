#!/usr/bin/env node
/**
 * 국가유산 명승 SSOT smoke
 *
 *   npm run smoke:korea-heritage-scenic
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  countKoreaHeritageScenicByRegion,
  getKoreaHeritageScenicById,
  listKoreaHeritageCategoryChips,
  listKoreaHeritageScenic,
  koreaHeritageScenicCount,
  normalizeHeritageCategory,
} from '../src/pages/Home/lib/koreaHeritageScenic.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(
  __dirname,
  '../src/pages/Home/data/koreaHeritageScenic.json',
);
const PAGE = join(__dirname, '../src/pages/KoreaTheme/ScenicPage.jsx');
const MODAL = join(
  __dirname,
  '../src/pages/KoreaTheme/ThemeSpotDetailModal.jsx',
);

const raw = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const pageSrc = readFileSync(PAGE, 'utf8');
const modalSrc = readFileSync(MODAL, 'utf8');

assert.equal(raw?.meta?.kdcd, '15', 'kdcd=15 명승');
assert.ok(raw.meta.count >= 100, `count>=100 (got ${raw.meta.count})`);
assert.equal(koreaHeritageScenicCount(), raw.meta.count, 'lib count');
assert.equal(raw.spots.length, raw.meta.count, 'spots length');

const byRegion = countKoreaHeritageScenicByRegion();
let sum = 0;
for (const n of Object.values(byRegion)) sum += n;
assert.equal(sum, raw.meta.count, 'region sum');

const gangwon = listKoreaHeritageScenic({ region: '강원' });
assert.ok(gangwon.length >= 20, `강원>=20 (got ${gangwon.length})`);

const sample = raw.spots.find((s) => s.content && s.imageUrl && s.lat);
assert.ok(sample, 'sample with content+image+coords');
assert.equal(getKoreaHeritageScenicById(sample.id)?.id, sample.id, 'getById');
assert.ok(sample.designatedAt, 'designatedAt');
assert.ok(sample.quantity, 'quantity');
assert.ok(sample.category || sample.heritageKind, 'category');
assert.ok(
  Array.isArray(sample.galleryUrls) && sample.galleryUrls.length >= 1,
  'galleryUrls',
);
const multi = raw.spots.filter((s) => (s.galleryUrls || []).length > 1);
assert.ok(multi.length >= 80, `multi-image spots≥80 (got ${multi.length})`);

assert.ok(pageSrc.includes('국가유산 명승'), 'ScenicPage heritage section');
assert.ok(pageSrc.includes('listKoreaHeritageScenic'), 'ScenicPage uses lib');
assert.ok(pageSrc.includes('명승 권역 대분류'), 'heritage region chips in section');
assert.ok(pageSrc.includes('명승 경관 소분류'), 'heritage category chips');
assert.ok(pageSrc.includes('명소 권역 대분류'), 'curated region chips');
assert.ok(pageSrc.includes('명소 여행지 소분류'), 'curated hub chips');
assert.ok(!pageSrc.includes('aria-label="권역 대분류"'), 'no page-top heritage chips');
assert.ok(pageSrc.includes('keepChipByCount'), 'hide zero-count chips helper');
assert.ok(pageSrc.includes('chipLabelsEqual'), 'hide same mid/small label helper');
assert.ok(pageSrc.includes('curatedHubChipsVisible'), 'curated hub chips filtered');
assert.ok(pageSrc.includes('tourCat3ChipsVisible'), 'tour cat3 zero-count filtered');
assert.ok(modalSrc.includes("spot.source === 'cha'"), 'modal CHA detail');
assert.ok(modalSrc.includes('heritageMeta'), 'modal heritage meta rows');
assert.ok(modalSrc.includes('지정번호'), 'modal designation no');

assert.equal(normalizeHeritageCategory('자연경관'), '자연경관', 'normalize hcat');
assert.equal(normalizeHeritageCategory('기타'), null, 'reject bad hcat');
const gangwonCats = listKoreaHeritageCategoryChips({ region: '강원' });
assert.ok(gangwonCats.length >= 2, `강원 경관칩≥2 (got ${gangwonCats.length})`);
const natureOnly = listKoreaHeritageScenic({
  region: '강원',
  category: '자연경관',
});
assert.ok(
  natureOnly.length >= 1 && natureOnly.length < gangwon.length,
  `강원·자연경관 세분 (${natureOnly.length}<${gangwon.length})`,
);

console.log(
  `smoke:korea-heritage-scenic PASS count=${raw.meta.count} 강원=${gangwon.length} gallery>1=${multi.length} cats=${gangwonCats.length}`,
);
