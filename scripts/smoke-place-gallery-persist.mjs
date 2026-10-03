#!/usr/bin/env node
/**
 * 저장용 목록과 화면용 목록 분리.
 * replace 는 숨김을 빼지 않은 storage. merge_keep_hero 는 fresh 만.
 */
import assert from 'node:assert/strict';
import {
  buildPersistPlaceGalleryArgs,
  galleryPersistDropsStoredImages,
  imagesForGalleryPersist,
  resolveGalleryPersistPlaceId,
} from '../src/shared/api/placeGalleryPersist.js';

const hidden = { id: 'hidden-photo', urls: { small: 'https://images.unsplash.com/hidden' } };
const visible = { id: 'visible-photo', urls: { small: 'https://images.unsplash.com/visible' } };
const fresh = { id: 'fresh-photo', urls: { small: 'https://images.unsplash.com/fresh' } };
const storage = [hidden, visible];
const view = storage.filter((img) => img.id !== hidden.id);

const replaceImages = imagesForGalleryPersist('replace', { storage, fresh: view });
assert.deepEqual(
  replaceImages.map((img) => img.id),
  ['hidden-photo', 'visible-photo'],
  'replace sends unfiltered storage, including a locally hidden id',
);
assert.equal(galleryPersistDropsStoredImages(view, storage), true, 'view list drops the hidden id');
assert.equal(galleryPersistDropsStoredImages(replaceImages, storage), false, 'storage list drops nothing');
assert.ok(replaceImages.some((img) => img.id === 'visible-photo'), 'non-hidden photo stays in replace body');

const replaceArgs = buildPersistPlaceGalleryArgs({
  placeId: 'loaded-latin-row',
  mode: 'replace',
  images: replaceImages,
});
assert.equal(replaceArgs.p_place_id, 'loaded-latin-row');
assert.equal(replaceArgs.p_mode, 'replace');
assert.ok(
  replaceArgs.p_images.some((img) => img.id === 'hidden-photo'),
  'hidden id is in the replace body',
);
assert.notDeepEqual(
  replaceArgs.p_images.map((img) => img.id),
  view.map((img) => img.id),
  'replace body is not the hidden-filtered view',
);

const mergeImages = imagesForGalleryPersist('merge_keep_hero', { storage, fresh: [fresh] });
assert.deepEqual(mergeImages.map((img) => img.id), ['fresh-photo']);
assert.equal(
  mergeImages.some((img) => img.id === 'hidden-photo'),
  false,
  'SWR fresh body does not include the already stored hidden id',
);
assert.ok(mergeImages.some((img) => img.id === 'fresh-photo'), 'fresh non-hidden photo is not dropped');

const thumbArgs = buildPersistPlaceGalleryArgs({
  placeId: 'loaded-latin-row',
  mode: 'thumb',
  images: storage,
  imageUrl: 'https://images.unsplash.com/thumb',
});
assert.equal(thumbArgs.p_images, null);
assert.equal(thumbArgs.p_image_url, 'https://images.unsplash.com/thumb');

assert.equal(
  resolveGalleryPersistPlaceId('loaded-latin-row', 'qa-gallery-writer'),
  'loaded-latin-row',
  'loaded row id wins over canonical alias',
);
assert.equal(resolveGalleryPersistPlaceId('', 'qa-gallery-writer'), 'qa-gallery-writer');
assert.equal(resolveGalleryPersistPlaceId('  ', 'qa-gallery-writer'), 'qa-gallery-writer');

console.log('smoke:place-gallery-persist PASS');
