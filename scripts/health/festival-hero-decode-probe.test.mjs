import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { isFestivalPhotoDecoded } from '../../src/pages/Korea/festivalPhotoFrame.js';
import {
  FESTIVAL_HERO_IMG_SELECTOR,
  queryFestivalHeroImg,
} from '../../src/pages/Korea/useFestivalHeroPhotoDecoded.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('isFestivalPhotoDecoded uses complete and naturalWidth', () => {
  assert.equal(isFestivalPhotoDecoded({ complete: true, naturalWidth: 100 }), true);
  assert.equal(isFestivalPhotoDecoded({ complete: true, naturalWidth: 0 }), false);
});

test('FestivalDetailSheet uses DOM probe hook for heroPhotoDecoded', () => {
  const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
  assert.match(sheet, /useFestivalHeroPhotoDecoded/);
  assert.match(sheet, /decoded=\{heroPhotoDecoded\}/);
  assert.doesNotMatch(sheet, /setHeroPhotoDecoded/);
  assert.equal(FESTIVAL_HERO_IMG_SELECTOR, '[data-festival-hero] img[data-festival-photo]');
  assert.equal(queryFestivalHeroImg.name, 'queryFestivalHeroImg');
});
