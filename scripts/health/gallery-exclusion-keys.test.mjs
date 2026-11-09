import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { sessionCacheAfterDroppedIds } from '../../src/shared/api/placeGalleryPersist.js';
import {
  GALLERY_HIDDEN_IDS_VERSION,
  addGalleryHiddenId,
  galleryHiddenIdsKey,
  readGalleryHiddenIds,
} from '../../src/utils/galleryCachePolicy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function photo(id) {
  return { id, source: 'unsplash', urls: { regular: 'https://images.unsplash.com/photo-x' } };
}

test('dropped ids are removed from the place session cache list', () => {
  const cached = [photo('ChSZETOal-I'), photo('bkk-wat')];
  const next = sessionCacheAfterDroppedIds(cached, ['ChSZETOal-I']);
  assert.equal(next.changed, true);
  assert.deepEqual(next.images.map((img) => img.id), ['bkk-wat']);
  const same = sessionCacheAfterDroppedIds(cached, ['missing']);
  assert.equal(same.changed, false);
  assert.equal(same.images.length, 2);
});

test('hidden photo ids stay on a stable key when the gallery cache version changes', () => {
  const storage = new Map();
  const mockStorage = {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
  };
  const placeKey = 'bangkok';
  addGalleryHiddenId(placeKey, 'hide-me', mockStorage);
  const stableKey = galleryHiddenIdsKey(GALLERY_HIDDEN_IDS_VERSION, placeKey);
  assert.ok(storage.has(stableKey));
  const legacyKey = galleryHiddenIdsKey('v1.24', placeKey);
  storage.set(legacyKey, JSON.stringify(['legacy-only']));
  storage.delete(stableKey);
  const fromLegacy = readGalleryHiddenIds(placeKey, mockStorage);
  assert.equal(fromLegacy.has('legacy-only'), true);
});

test('hook uses gallery_active_exclusion_keys only (no gallery_excluded_keys)', () => {
  const hook = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
    'utf8',
  );
  assert.match(hook, /gallery_active_exclusion_keys/);
  assert.doesNotMatch(hook, /gallery_excluded_keys/);
  assert.doesNotMatch(hook, /loadGalleryExcludedKeys/);
  assert.doesNotMatch(hook, /excludedKeysRef/);
  assert.match(hook, /withoutExcludedGalleryImages\(rawImages, galleryExclusionRef\.current\)/);
  assert.match(hook, /readGalleryHiddenIds\(placeKey, localStorage\)/);
  assert.match(hook, /galleryAtMax: images\.length >= GALLERY_MAX_IMAGES/);

  const persistAt = hook.indexOf("supabase.rpc('persist_place_gallery'");
  assert.ok(persistAt > 0);
  const persistBlock = hook.slice(persistAt, persistAt + 1200);
  const cacheWrite = persistBlock.indexOf('sessionCacheAfterDroppedIds');
  const staleReturn = persistBlock.indexOf('runAtCall !== galleryLoadSeqRef.current');
  assert.ok(cacheWrite > 0 && staleReturn > cacheWrite);
});

test('no pending gallery_excluded_keys or clean_list_region migrations in tree', () => {
  const migDir = join(root, 'supabase/migrations');
  const names = readdirSync(migDir);
  assert.equal(names.includes('20261022190000_gallery_clean_list_region.sql'), false);
  assert.equal(names.includes('20261022201000_gallery_excluded_keys.sql'), false);
});
