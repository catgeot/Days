import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import aliases from '../../src/utils/galleryPlaceAliases.json' with { type: 'json' };
import {
  GALLERY_PURGE_STORED_PHOTOS,
  GALLERY_UNSPLASH_MAX_PAGE,
  filterGalleryIncomingForSave,
  galleryCandidatesForSave,
  galleryPhotoConflictsWithTarget,
  galleryUnsplashSearchQuery,
  resolveGallerySaveTarget,
  unsplashGallerySearchPage,
} from '../../src/utils/gallerySaveGuard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const barcelona = resolveGallerySaveTarget({
  slug: 'barcelona',
  name: '바르셀로나',
  name_en: 'Barcelona',
  country: '스페인',
  country_en: 'Spain',
}, 'barcelona');

const bangkok = resolveGallerySaveTarget({
  slug: 'bangkok',
  name: '방콕',
  name_en: 'Bangkok',
  country: '태국',
  country_en: 'Thailand',
}, 'bangkok');

function photo(id, fields) {
  return { id, source: 'unsplash', urls: { small: `https://images.unsplash.com/${id}` }, ...fields };
}

test('Unsplash query appends the country and stays on pages 1-2', () => {
  assert.equal(galleryUnsplashSearchQuery('Bangkok', bangkok), 'Bangkok Thailand');
  assert.equal(galleryUnsplashSearchQuery('Barcelona', barcelona), 'Barcelona Spain');
  assert.equal(galleryUnsplashSearchQuery('Bangkok Thailand', bangkok), 'Bangkok Thailand');
  assert.equal(GALLERY_UNSPLASH_MAX_PAGE, 2);
  assert.equal(unsplashGallerySearchPage(1), 1);
  assert.equal(unsplashGallerySearchPage(2), 2);
  assert.equal(unsplashGallerySearchPage(3), null);
  assert.equal(unsplashGallerySearchPage(60), null);
});

test('Barcelona drops Madrid and Seville text and keeps a Barcelona photo', () => {
  const madrid = photo('ChSZETOal-I', {
    description: 'Gran Vía in Madrid',
    alt_description: 'city scale under blue sky',
    location: { name: 'Edificio Metropoli, Gran vía - Madrid, Spain', city: 'Madrid', country: 'Spain' },
  });
  const seville = photo('Z95viY3WaZs', {
    description: 'in seville',
    alt_description: 'two brown tables outside',
    location: { name: 'Santa Cruz, Sevilla, Spain', city: 'Sevilla', country: 'Spain' },
  });
  const granVia = photo('WBGjg0DsO_g', {
    description: 'Gran Via in Madrid',
    location: { city: 'Madrid', country: 'Spain' },
  });
  const local = photo('bcn-sagrada', {
    description: 'Sagrada Familia, Barcelona',
    location: { city: 'Barcelona', country: 'Spain' },
  });
  const spainOnly = photo('bcn-spain', {
    alt_description: 'a gothic church in Spain',
    location: { country: 'Spain' },
  });
  const saved = filterGalleryIncomingForSave([madrid, seville, granVia, local, spainOnly], barcelona);
  assert.deepEqual(saved.map((img) => img.id), ['bcn-sagrada', 'bcn-spain']);
  assert.equal(galleryPhotoConflictsWithTarget(madrid, barcelona), true);
  assert.equal(galleryPhotoConflictsWithTarget(local, barcelona), false);
});

test('Bangkok drops Peterhof, Dresden, and Macau names and keeps unlabeled photos', () => {
  const peterhof = photo('q7J4p8V-RWU', {
    alt_description: 'a golden fountain',
    location: { name: 'Peterhof', city: 'Saint Petersburg', country: 'Russia' },
  });
  const dresden = photo('pl5XlVpwJTY', {
    description: 'palace in Dresden',
    location: { city: 'Dresden', country: 'Germany' },
  });
  const macau = photo('SkP6nM-R5M8', {
    location: { name: 'Grand Lisboa', city: 'Macau', country: 'China' },
  });
  const unlabeled = photo('wWLrcEVZaGQ', {
    alt_description: 'a white and gold palace',
  });
  const unlabeledDome = photo('EXER_fRsq4o', {
    alt_description: 'gold dome against the sky',
    location: {},
  });
  const local = photo('bkk-wat', {
    description: 'Wat Arun in Bangkok',
    location: { city: 'Bangkok', country: 'Thailand' },
  });
  const saved = filterGalleryIncomingForSave(
    [peterhof, dresden, macau, unlabeled, unlabeledDome, local],
    bangkok,
  );
  assert.deepEqual(saved.map((img) => img.id), ['wWLrcEVZaGQ', 'EXER_fRsq4o', 'bkk-wat']);
});

test('Korean city names count, and the target city keeps a photo that also names another city', () => {
  const seoul = photo('sel-1', { description: '경복궁, 서울' });
  assert.equal(galleryPhotoConflictsWithTarget(seoul, bangkok), true);
  const both = photo('bkk-note', { description: 'Bangkok trip, with a comparison to Moscow' });
  assert.equal(galleryPhotoConflictsWithTarget(both, bangkok), false);
  const phuket = photo('pkt-1', { description: 'Phuket beach', location: { country: 'Thailand' } });
  assert.equal(galleryPhotoConflictsWithTarget(phuket, bangkok), true);
});

test('gallery_photo_exclusions drop an otherwise valid photo', () => {
  const local = photo('bkk-kept', { description: 'Bangkok river' });
  const excluded = photo('bkk-hidden', { description: 'Bangkok temple' });
  const saved = filterGalleryIncomingForSave([local, excluded], bangkok, ['bkk-hidden']);
  assert.deepEqual(saved.map((img) => img.id), ['bkk-kept']);
});

test('stored photos are not removed when the purge flag is off', () => {
  assert.equal(GALLERY_PURGE_STORED_PHOTOS, false);
  const stored = [
    photo('ChSZETOal-I', { description: 'Gran Vía in Madrid' }),
    photo('q7J4p8V-RWU', { location: { city: 'Peterhof', country: 'Russia' } }),
  ];
  const incoming = [
    photo('fresh-madrid', { description: 'Gran Via in Madrid' }),
    photo('fresh-bkk', { description: 'Bangkok canal' }),
  ];
  const plan = galleryCandidatesForSave({
    stored,
    incoming,
    target: bangkok,
    excludedIds: [],
  });
  assert.equal(plan.stored, stored);
  assert.deepEqual(plan.stored.map((img) => img.id), ['ChSZETOal-I', 'q7J4p8V-RWU']);
  assert.deepEqual(plan.incoming.map((img) => img.id), ['fresh-bkk']);
});

test('migration only replaces gallery_clean_list and does not rewrite place_stats', () => {
  const sql = readFileSync(
    join(root, 'supabase/migrations/20261022190000_gallery_clean_list_region.sql'),
    'utf8',
  );
  const embedded = sql.match(/\$gallery_aliases\$\s*([\s\S]*?)\s*\$gallery_aliases\$/);
  assert.ok(embedded, 'alias list is embedded');
  assert.deepEqual(JSON.parse(embedded[1]), aliases);
  assert.match(sql, /FUNCTION public\.gallery_clean_list\(p_place_id text, p_list jsonb, p_max integer\)/);
  assert.match(sql, /gallery_is_excluded\(p_place_id, s\)/);
  assert.match(sql, /gallery_foreign_place\(p_place_id, x\)/);
  assert.doesNotMatch(sql, /CREATE OR REPLACE FUNCTION public\.gallery_keep_stored/);
  assert.doesNotMatch(sql, /UPDATE\s+public\.place_stats/i);
  assert.doesNotMatch(sql, /DELETE\s+FROM/i);
  assert.match(sql, /방콕/);
  assert.match(sql, /페테르고프/);
  assert.match(sql, /세비야/);
});

test('the gallery hook filters incoming saves and still renders stored rows', () => {
  const hook = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
    'utf8',
  );
  assert.match(hook, /fetchPlaceUnsplash/);
  assert.match(hook, /unsplashGallerySearchPage/);
  assert.match(hook, /galleryUnsplashSearchQuery/);
  assert.match(hook, /filterGalleryIncomingForSave\(results, galleryTarget\)/);
  assert.doesNotMatch(hook, /filterGalleryIncomingForSave\(\s*gallerySlice/);
  assert.doesNotMatch(hook, /filterGalleryIncomingForSave\(\s*rawGallerySlice/);
  assert.doesNotMatch(hook, /filterGalleryIncomingForSave\(\s*dbData/);
});
