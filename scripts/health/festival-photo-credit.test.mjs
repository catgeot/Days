import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { formatFestivalPhotoCreditLine } from '../../src/pages/Korea/festivalPhotoCredit.js';
import { getManualFestivalEntry } from '../../src/pages/Korea/manualFestivalEntries.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('638576 EN credit when photo decoded — KTO KOGL Type 3', () => {
  const entry = getManualFestivalEntry('638576');
  const ko = entry.images[0].credit;
  assert.equal(
    formatFestivalPhotoCreditLine(ko, 'en'),
    'Photo: Korea Tourism Organization (KOGL Type 3)',
  );
  assert.equal(formatFestivalPhotoCreditLine(ko, 'ko'), ko);
});

test('EN credit generalizes 출처 prefix and KOGL types', () => {
  assert.equal(
    formatFestivalPhotoCreditLine('출처: 한국관광공사(공공누리 제1유형)', 'en'),
    'Photo: Korea Tourism Organization (KOGL Type 1)',
  );
  assert.equal(
    formatFestivalPhotoCreditLine('Photo: Visit Jeonnam', 'en'),
    'Photo: Visit Jeonnam',
  );
  assert.equal(
    formatFestivalPhotoCreditLine('Custom agency attribution', 'en'),
    'Photo: Custom agency attribution',
  );
});

test('festival detail sheet gates credit on heroPhotoDecoded with locale formatter', () => {
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  const index = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
  assert.match(sheet, /formatFestivalPhotoCreditLine/);
  assert.match(sheet, /activePhotoCredit && heroPhotoDecoded/);
  assert.doesNotMatch(sheet, /\{imageCredits\[activeImage\]\}/);
  assert.match(sheet, /onSelectHeroImage/);
  assert.doesNotMatch(sheet, /key=\{`\$\{hero\}-\$\{locale\}`\}/);
  assert.match(sheet, /useFestivalHeroPhotoDecoded/);
  const heroPhoto = readFileSync(join(root, 'src/pages/Korea/festivalHeroPhoto.js'), 'utf8');
  assert.match(heroPhoto, /data-festival-hero-decoded/);
  assert.match(index, /key=\{festivalId \|\| 'sheet'\}/);
  assert.doesNotMatch(index, /key=\{`\$\{festivalId.*\}-\$\{locale\}`\}/);
});

test('?lang=en deep link — boot reads URL lang before storage (EN credit path)', () => {
  const localeProvider = readFileSync(
    join(root, 'src/i18n/LocaleProvider.jsx'),
    'utf8',
  );
  const browserHint = readFileSync(join(root, 'src/i18n/browserLocaleHint.js'), 'utf8');
  assert.match(browserHint, /if \(isAppLocale\(urlLang\)\) return urlLang/);
  assert.match(localeProvider, /resolveBootLocaleFromSearchParams/);
  assert.match(localeProvider, /resolveLocaleFromUrl\(searchParams\)/);
});
