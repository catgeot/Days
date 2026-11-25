import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { resolveGalleryStockQuery } from '../../src/pages/Home/lib/uiPlaceAssetQuery.js';
import {
  buildPersistPlaceGalleryArgs,
  commitGalleryPersistRpc,
} from '../../src/shared/api/placeGalleryPersist.js';
import {
  GALLERY_MAX_IMAGES,
  capPersistedGalleryImages,
  filterGalleryImagesForPersist,
  filterGalleryIncomingForSave,
  galleryPhotoConflictsWithTarget,
  galleryPhotoPositivelyMatchesTarget,
  galleryReplaceOmitsOnlyAllowed,
  galleryTargetRequiresPositivePersist,
  planThinStockGalleryPersist,
  resolveGallerySaveTarget,
} from '../../src/utils/gallerySaveGuard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const aitutakiSpot = {
  slug: 'aitutaki',
  name: '아이투타키',
  name_en: 'Aitutaki',
  country: '쿡 제도',
  country_en: 'Cook Islands',
  lat: -18.8578,
  lng: -159.785,
};

const seoulSpot = {
  slug: 'seoul',
  name: '서울',
  name_en: 'Seoul',
  country: '대한민국',
  country_en: 'South Korea',
  lat: 37.5665,
  lng: 126.978,
};

const aitutaki = resolveGallerySaveTarget(aitutakiSpot, 'aitutaki');
const seoul = resolveGallerySaveTarget(seoulSpot, 'seoul');
const bangkok = resolveGallerySaveTarget({
  slug: 'bangkok',
  name: '방콕',
  name_en: 'Bangkok',
  country: '태국',
  country_en: 'Thailand',
}, 'bangkok');

function photo(id, fields) {
  return {
    id,
    source: 'unsplash',
    urls: { small: `https://images.unsplash.com/${id}` },
    ...fields,
  };
}

const nagalandGate = photo('4avODyJOjQ4', {
  alt_description: 'man walks through a traditional wooden village gate',
});
const africanDress = photo('XwxjreOoA3s', {
  alt_description: 'a group of young women in african dress',
});
const oneFoot = photo('PkgzxrkurRw', {
  description:
    'One Foot Island, a small island on the Aitutaki Atoll in the Cook Islands, South Pacific Ocean',
});
const emptyMeta = photo('empty-meta', { description: '   ', alt_description: '' });

test('overseas stock query leads with the Latin place and country', () => {
  assert.equal(galleryTargetRequiresPositivePersist(aitutaki), true);
  assert.equal(galleryTargetRequiresPositivePersist(seoul), false);
  const overseas = resolveGalleryStockQuery(aitutakiSpot, {});
  assert.equal(overseas.primaryQuery, 'Aitutaki Cook Islands');
  const domestic = resolveGalleryStockQuery(seoulSpot, {});
  assert.equal(domestic.primaryQuery, 'Seoul');
});

test('Aitutaki persist keeps One Foot Island and drops Nagaland, African dress, and empty metadata', () => {
  assert.equal(galleryPhotoConflictsWithTarget(nagalandGate, aitutaki), false);
  assert.equal(galleryPhotoPositivelyMatchesTarget(nagalandGate, aitutaki), false);
  assert.equal(galleryPhotoConflictsWithTarget(africanDress, aitutaki), false);
  assert.equal(galleryPhotoPositivelyMatchesTarget(africanDress, aitutaki), false);
  assert.equal(galleryPhotoPositivelyMatchesTarget(oneFoot, aitutaki), true);
  assert.equal(galleryPhotoPositivelyMatchesTarget(emptyMeta, aitutaki), false);
  const countryOnly = photo('lagoon', { description: 'turquoise lagoon in the Cook Islands' });
  const koreanAlias = photo('ko-name', { alt: '아이투타키 라군' });
  const tagsOnly = photo('tags-only', { tags: [{ title: 'Cook Islands' }] });
  assert.equal(galleryPhotoPositivelyMatchesTarget(countryOnly, aitutaki), true);
  assert.equal(galleryPhotoPositivelyMatchesTarget(koreanAlias, aitutaki), true);
  assert.equal(galleryPhotoPositivelyMatchesTarget(tagsOnly, aitutaki), true);

  const saved = filterGalleryImagesForPersist(
    [nagalandGate, africanDress, oneFoot, emptyMeta, countryOnly, tagsOnly],
    aitutaki,
  );
  assert.deepEqual(saved.map((img) => img.id), ['PkgzxrkurRw', 'lagoon', 'tags-only']);

  assert.equal(filterGalleryIncomingForSave([nagalandGate], aitutaki).length, 1);
  const unlabeled = photo('wWLrcEVZaGQ', { alt_description: 'a white and gold palace' });
  assert.equal(filterGalleryIncomingForSave([unlabeled], bangkok).length, 1);
  assert.equal(filterGalleryImagesForPersist([unlabeled], bangkok).length, 0);
});

test('domestic persist still keeps empty metadata and still drops another city', () => {
  assert.equal(galleryTargetRequiresPositivePersist(seoul), false);
  const saved = filterGalleryImagesForPersist(
    [emptyMeta, photo('sel-1', { description: '경복궁, 서울' }), photo('pus-1', { description: '해운대, 부산' })],
    seoul,
  );
  assert.deepEqual(saved.map((img) => img.id), ['empty-meta', 'sel-1']);
});

test('persisted galleries are capped at GALLERY_MAX_IMAGES', () => {
  assert.equal(GALLERY_MAX_IMAGES, 60);
  const many = Array.from({ length: 80 }, (_, i) => photo(`cook-${i}`, {
    description: 'Aitutaki lagoon, Cook Islands',
  }));
  const capped = capPersistedGalleryImages(
    filterGalleryImagesForPersist(many, aitutaki),
    GALLERY_MAX_IMAGES,
  );
  assert.equal(capped.length, 60);
  assert.equal(capped[0].id, 'cook-0');
  assert.equal(capped[59].id, 'cook-59');
  assert.equal(
    galleryReplaceOmitsOnlyAllowed(capped, many, aitutaki, GALLERY_MAX_IMAGES),
    true,
  );
  assert.equal(
    galleryReplaceOmitsOnlyAllowed(capped.slice(0, 59), many, aitutaki, GALLERY_MAX_IMAGES),
    false,
  );
});

test('thin overseas refetch merges positive photos and does not replace the verified row', async () => {
  const stored = [oneFoot];
  const incoming = [oneFoot, nagalandGate, africanDress, emptyMeta, photo('one-foot-new', {
    description: 'One Foot Island lagoon in the Cook Islands',
    location: { name: 'Aitutaki' },
  })];
  const plan = planThinStockGalleryPersist({
    stored,
    incoming,
    target: aitutaki,
    max: GALLERY_MAX_IMAGES,
  });
  assert.equal(plan.overseas, true);
  assert.equal(plan.mode, 'merge_keep_hero');
  assert.deepEqual(plan.images.map((img) => img.id), ['one-foot-new']);

  const calls = [];
  const rpc = (name, args) => {
    calls.push({ name, args });
    return Promise.resolve({ data: { applied: 'ok', dropped_ids: [] }, error: null });
  };
  const saved = await commitGalleryPersistRpc(rpc, buildPersistPlaceGalleryArgs({
    placeId: 'aitutaki',
    mode: plan.mode,
    images: plan.images,
    imageUrl: null,
  }));
  assert.equal(saved.error, null);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'persist_place_gallery');
  assert.equal(calls[0].args.p_place_id, 'aitutaki');
  assert.equal(calls[0].args.p_mode, 'merge_keep_hero');
  assert.deepEqual(calls[0].args.p_images.map((img) => img.id), ['one-foot-new']);
  assert.equal(calls[0].args.p_images.some((img) => img.id === 'PkgzxrkurRw'), false);
  assert.equal(calls.some((call) => call.args.p_mode === 'replace'), false);

  const blocked = planThinStockGalleryPersist({
    stored,
    incoming: [nagalandGate, africanDress, emptyMeta],
    target: aitutaki,
    max: GALLERY_MAX_IMAGES,
  });
  assert.equal(blocked.mode, null);
  assert.deepEqual(blocked.images, []);
  const idle = [];
  await commitGalleryPersistRpc(
    (name, args) => {
      idle.push({ name, args });
      return Promise.resolve({ data: null, error: null });
    },
    blocked.mode
      ? buildPersistPlaceGalleryArgs({
        placeId: 'aitutaki',
        mode: blocked.mode,
        images: blocked.images,
        imageUrl: null,
      })
      : null,
  );
  assert.equal(idle.length, 0);

  const flood = Array.from({ length: 80 }, (_, i) => photo(`more-${i}`, {
    tags: ['Aitutaki'],
  }));
  const cappedPlan = planThinStockGalleryPersist({
    stored,
    incoming: flood,
    target: aitutaki,
    max: GALLERY_MAX_IMAGES,
  });
  assert.equal(cappedPlan.images.length, GALLERY_MAX_IMAGES - 1);
  assert.equal(cappedPlan.images.some((img) => img.id === 'PkgzxrkurRw'), false);
});

test('gallery hook redirects thin overseas replace into the positive merge plan', () => {
  const hook = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
    'utf8',
  );
  assert.match(hook, /thinStockStored = gallerySlice/);
  assert.match(hook, /planThinStockGalleryPersist/);
  assert.match(hook, /filterGalleryImagesForPersist/);
  assert.match(hook, /capPersistedGalleryImages/);
  assert.match(hook, /mergeGalleryAppend\(thinStockStored, finalResults\)/);
  const spots = readFileSync(join(root, 'src/pages/Home/data/travelSpots.js'), 'utf8');
  const at = spots.indexOf('"slug": "aitutaki"');
  assert.ok(at > 0);
  const block = spots.slice(at, at + 900);
  assert.match(block, /고요한 섬이에요/);
  assert.doesNotMatch(block, /고요한 섬입니다/);
});

test('persist_place_gallery is only called from the gallery persist helper', () => {
  const hits = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === 'dist') continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.(js|jsx|mjs)$/.test(name)) continue;
      const text = readFileSync(path, 'utf8');
      if (text.includes('persist_place_gallery')) hits.push(path.slice(root.length + 1));
    }
  };
  walk(join(root, 'src'));
  hits.sort();
  assert.deepEqual(hits, [
    'src/components/PlaceCard/hooks/usePlaceGallery.js',
    'src/shared/api/placeGalleryPersist.js',
  ]);
});
