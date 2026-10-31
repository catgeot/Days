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
  galleryPersistReplaceSameAsStored,
  galleryPersistReplaceWouldShrinkStoredTailOnly,
  galleryReportErrorReason,
  imagesForGalleryPersist,
  isStockGalleryImage,
  isTourApiDominantGallery,
  loadedStatsGalleryRefFromDbRow,
  resolveGalleryPersistPlaceId,
  resolveLoadedStatsPersistSnapshot,
  skipPersistPlaceGalleryReplaceReason,
  withoutDroppedGalleryImages,
} from '../src/shared/api/placeGalleryPersist.js';
import {
  isPlaceChatIntroKeyAccepted,
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
assert.equal(
  isPlaceChatIntroRpcLength(`${'가'.repeat(PLACE_CHAT_INTRO_MIN_CHARS - 1)}.`),
  true,
);
assert.equal(
  isPlaceChatIntroRpcLength(`${'가'.repeat(PLACE_CHAT_INTRO_MAX_CHARS - 1)}.`),
  true,
);
assert.equal(isPlaceChatIntroRpcLength('가'.repeat(PLACE_CHAT_INTRO_MAX_CHARS + 1)), false);
const emoji = '😀';
assert.equal(`${'가'.repeat(38)}${emoji}`.length, 40, 'utf-16 length would pass the old check');
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(38)}${emoji}`), false, '39 code points stay under 40');
assert.equal(
  isPlaceChatIntroRpcLength(`${'가'.repeat(38)}${emoji}.`),
  true,
  '40 code points with emoji and sentence end are accepted',
);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(1198)}${emoji}.`), true);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(1200)}${emoji}`), false);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(40)} https://example.com`), false);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(40)} <b>bold</b>`), false);
assert.equal(isPlaceChatIntroRpcLength(`${'가'.repeat(19)}\n${'가'.repeat(20)}.`), true);

assert.equal(isPlaceChatIntroKeyAccepted('QA Place'), true);
assert.equal(isPlaceChatIntroKeyAccepted('qa\u007fplace'), false, 'DEL is [[:cntrl:]]');
assert.equal(isPlaceChatIntroKeyAccepted('qa\u0080place'), false, 'C1 start U+0080');
assert.equal(isPlaceChatIntroKeyAccepted('qa\u0085place'), false, 'C1 U+0085');
assert.equal(isPlaceChatIntroKeyAccepted('qa\u009fplace'), false, 'C1 end U+009F');
assert.equal(isPlaceChatIntroKeyAccepted('qa\u00a0place'), true, 'U+00A0 is not [[:cntrl:]]');

const tourA = { id: 'tourapi-1', source: 'tourapi', urls: { small: 'https://tong.visitkorea.or.kr/a.jpg' } };
const tourB = { id: 'tourapi-2', source: 'tourapi', urls: { small: 'https://tong.visitkorea.or.kr/b.jpg' } };
const tourBaseline = [tourA, tourB];
const stockOnly = [
  { id: 'vis-1', urls: { small: 'https://images.unsplash.com/vis-1/small' } },
  { id: 'pexels-1', source: 'pexels', urls: { small: 'https://images.pexels.com/1.jpg' } },
];

assert.equal(
  skipPersistPlaceGalleryReplaceReason(tourBaseline, tourBaseline),
  'unchanged',
  'replace skip when id sequence and URLs match DB baseline',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(
    tourBaseline,
    [{ ...tourA, urls: { small: 'http://tong.visitkorea.or.kr/a.jpg' } }, tourB],
  ),
  null,
  'http→https on same id must still persist',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(tourBaseline, [tourB, tourA]),
  null,
  'reordered ids still persist',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(tourBaseline, [tourA, stockOnly[0]]),
  null,
  'partial tour remaining allows replace RPC',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(tourBaseline, [
    stockOnly[0],
    { id: 'legacy-1', urls: { small: 'https://cdn.example/x.jpg' } },
  ]),
  null,
  'non-stock mixed payload is not tour_to_stock_only block',
);
assert.equal(loadedStatsGalleryRefFromDbRow([]), null, 'empty DB gallery clears baseline ref value');
assert.deepEqual(resolveLoadedStatsPersistSnapshot({ place_id: 'a', gallery_urls: tourBaseline }, true), {
  apply: false,
});
const triple = {
  id: 'tourapi-triple',
  urls: {
    small: 'https://tong.visitkorea.or.kr/s.jpg',
    regular: 'https://tong.visitkorea.or.kr/r.jpg',
    full: 'https://tong.visitkorea.or.kr/f.jpg',
  },
};
const tripleBaseline = [triple];
assert.equal(
  skipPersistPlaceGalleryReplaceReason(tripleBaseline, [
    { ...triple, urls: { ...triple.urls, regular: 'https://tong.visitkorea.or.kr/r2.jpg' } },
  ]),
  null,
  'regular-only URL change must persist',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(tripleBaseline, [
    { ...triple, urls: { ...triple.urls, full: 'https://tong.visitkorea.or.kr/f2.jpg' } },
  ]),
  null,
  'full-only URL change must persist',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(tourBaseline, stockOnly),
  'tour_to_stock_only',
  'block replace when tour-dominant DB would become stock-only',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason([], stockOnly),
  null,
  'first visit without DB baseline still allows replace',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(tourBaseline, [...tourBaseline, stockOnly[0]]),
  null,
  'normal replace when payload adds new ids',
);
assert.ok(isTourApiDominantGallery(tourBaseline), 'fixture is tour-dominant');
assert.ok(stockOnly.every((img) => isStockGalleryImage(img)), 'stock fixture');

const db107Prefix = [
  ...Array.from({ length: 24 }, (_, i) => ({
    id: `tourapi-detail-${i}`,
    source: 'tourapi',
    urls: { small: `https://tong.visitkorea.or.kr/t${i}.jpg` },
  })),
  ...Array.from({ length: 53 }, (_, i) => ({
    id: `pexels-${i}`,
    source: 'pexels',
    urls: { small: `https://images.pexels.com/p${i}.jpg` },
  })),
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `legacy-${i}`,
    urls: { small: `https://cdn.example/legacy-${i}.jpg` },
  })),
];
const payload24TourOnly = db107Prefix.slice(0, 24);
assert.equal(db107Prefix.length, 107);
assert.equal(
  galleryPersistReplaceWouldShrinkStoredTailOnly(db107Prefix, payload24TourOnly),
  true,
  '24 Tour ids match DB prefix',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(db107Prefix, payload24TourOnly),
  'unchanged',
  'gyeongbokgung-like cap must not replace-shrink DB tail',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(db107Prefix, db107Prefix.slice(0, 50)),
  'unchanged',
  'any same-order id prefix shorter than DB skips replace',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(db107Prefix, [db107Prefix[0], db107Prefix[2]]),
  null,
  'non-prefix shrink (skipped middle id) still allows replace',
);
const prefixUrlOnlyChange = payload24TourOnly.map((img, i) =>
  i === 0
    ? {
        ...img,
        urls: {
          ...img.urls,
          small: String(img.urls.small).replace(/^https:/, 'http:'),
        },
      }
    : img,
);
assert.equal(
  galleryPersistReplaceWouldShrinkStoredTailOnly(db107Prefix, prefixUrlOnlyChange),
  false,
  'prefix with URL drift is not tail-only shrink',
);
assert.equal(
  skipPersistPlaceGalleryReplaceReason(db107Prefix, prefixUrlOnlyChange),
  null,
  'prefix with only URL changed -> persist happens',
);

console.log('smoke:place-gallery-persist PASS');
