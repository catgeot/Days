#!/usr/bin/env node
/**
 * 저장용 목록과 화면용 목록 분리.
 * replace 는 숨김을 빼지 않은 storage. merge_keep_hero 는 fresh 만.
 */
import assert from 'node:assert/strict';
import {
  buildPersistPlaceGalleryArgs,
  droppedGalleryIds,
  galleryAdminFromProbe,
  galleryModerateFailureReason,
  galleryPersistDropsStoredImages,
  galleryReportErrorReason,
  imagesForGalleryPersist,
  resolveGalleryPersistPlaceId,
  withoutDroppedGalleryImages,
} from '../src/shared/api/placeGalleryPersist.js';
import {
  isPlaceChatIntroRpcLength,
  PLACE_CHAT_INTRO_MAX_CHARS,
  PLACE_CHAT_INTRO_MIN_CHARS,
} from '../src/pages/Home/lib/placeChatIntroLimits.js';

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

assert.equal(galleryReportErrorReason({ code: '23503' }), 'missing_photo');
assert.equal(
  galleryReportErrorReason({
    code: 'PGRST205',
    message: "Could not find the table 'public.gallery_photo_reports' in the schema cache",
  }),
  'unavailable',
);
assert.equal(galleryReportErrorReason({ code: '42P01', message: 'relation does not exist' }), 'unavailable');

assert.equal(
  galleryAdminFromProbe({ seq: 1, latestSeq: 2, hasUser: true, error: null, data: true }),
  null,
  'late admin response is ignored',
);
assert.equal(
  galleryAdminFromProbe({ seq: 2, latestSeq: 2, hasUser: true, error: { message: 'down' }, data: null }),
  false,
  'admin probe error fails closed',
);
assert.equal(
  galleryAdminFromProbe({ seq: 2, latestSeq: 2, hasUser: true, error: null, data: true }),
  true,
);
assert.equal(
  galleryModerateFailureReason({ context: { status: 403 } }, null),
  'forbidden',
);

const dropped = withoutDroppedGalleryImages(storage, droppedGalleryIds({ dropped_ids: ['hidden-photo'] }));
assert.deepEqual(dropped.map((img) => img.id), ['visible-photo']);

assert.equal(isPlaceChatIntroRpcLength('짧음'), false);
assert.equal(isPlaceChatIntroRpcLength('가'.repeat(PLACE_CHAT_INTRO_MIN_CHARS - 1)), false);
assert.equal(isPlaceChatIntroRpcLength('가'.repeat(PLACE_CHAT_INTRO_MIN_CHARS)), true);
assert.equal(isPlaceChatIntroRpcLength('가'.repeat(PLACE_CHAT_INTRO_MAX_CHARS)), true);
assert.equal(isPlaceChatIntroRpcLength('가'.repeat(PLACE_CHAT_INTRO_MAX_CHARS + 1)), false);
const emoji = '😀';
assert.equal(`${'가'.repeat(38)}${emoji}`.length, 40, 'utf-16 length would pass the old check');
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(38)}${emoji}`), false, '39 code points stay under 40');
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(39)}${emoji}`), true, '40 code points with emoji are accepted');
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(1199)}${emoji}`), true);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(1200)}${emoji}`), false);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(40)} https://example.com`), false);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(40)} <b>bold</b>`), false);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(20)}\n${'가'.repeat(20)}`), true);

console.log('smoke:place-gallery-persist PASS');
