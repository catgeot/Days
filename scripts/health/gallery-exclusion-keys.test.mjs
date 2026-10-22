import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  emptyGalleryExclusion,
  filterExcludedGalleryImages,
  galleryExclusionFromRows,
  galleryExclusionIsActive,
  galleryExclusionRpcIsMissing,
  galleryUrlKey,
  isGalleryPhotoExcluded,
  loadGalleryExcludedKeys,
  resetGalleryExclusionRpcMemo,
  sessionCacheAfterDroppedIds,
} from '../../src/utils/galleryExclusion.js';
import {
  GALLERY_HIDDEN_IDS_VERSION,
  addGalleryHiddenId,
  galleryHiddenIdsKey,
  readGalleryHiddenIds,
} from '../../src/utils/galleryCachePolicy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function photo(id, regular, small = regular) {
  return {
    id,
    source: 'unsplash',
    urls: { regular, small },
  };
}

test('galleryUrlKey matches gallery_url_key host and path', () => {
  assert.equal(
    galleryUrlKey('https://images.unsplash.com/photo-abc?auto=format&w=100'),
    'images.unsplash.com/photo-abc',
  );
  assert.equal(
    galleryUrlKey('https://images.unsplash.com/photo-abc#frag'),
    'images.unsplash.com/photo-abc',
  );
  assert.equal(
    galleryUrlKey('https://Images.Unsplash.com/Photo-ABC'),
    'images.unsplash.com/Photo-ABC',
  );
  assert.equal(galleryUrlKey('https://images.unsplash.com'), 'images.unsplash.com/');
  assert.equal(
    galleryUrlKey('https://images.unsplash.com:443/photo-abc'),
    'images.unsplash.com/photo-abc',
  );
  assert.equal(galleryUrlKey('https://images.unsplash.com:8080/photo-abc'), 'images.unsplash.com/');
  assert.equal(galleryUrlKey('http://images.unsplash.com/photo-abc'), '');
  assert.equal(galleryUrlKey(''), '');
});

test('active exclusion rows drop by image id or url key', () => {
  const removed = photo(
    'q7J4p8V-RWU',
    'https://images.unsplash.com/photo-peterhof?w=10',
    'https://images.unsplash.com/photo-peterhof?w=4',
  );
  const sameFileNewId = photo(
    'fresh-copy',
    'https://images.unsplash.com/photo-peterhof?ixid=abc',
  );
  const kept = photo('bkk-wat', 'https://images.unsplash.com/photo-wat-arun');
  const exclusion = galleryExclusionFromRows([
    { image_id: 'q7J4p8V-RWU', image_url_key: 'images.unsplash.com/photo-peterhof' },
    { image_id: '', image_url_key: '' },
  ]);
  assert.equal(isGalleryPhotoExcluded(removed, exclusion), true);
  assert.equal(isGalleryPhotoExcluded(sameFileNewId, exclusion), true);
  assert.equal(isGalleryPhotoExcluded(kept, exclusion), false);
  assert.deepEqual(
    filterExcludedGalleryImages([removed, sameFileNewId, kept], exclusion).map((img) => img.id),
    ['bkk-wat'],
  );
});

test('gallery_excluded_keys errors fail open', async () => {
  resetGalleryExclusionRpcMemo();
  const visible = photo('keep-me', 'https://images.unsplash.com/photo-keep');
  const thrown = await loadGalleryExcludedKeys(async () => {
    throw new Error('network down');
  }, 'bangkok');
  assert.equal(thrown.ids.size, 0);
  assert.equal(filterExcludedGalleryImages([visible], thrown).length, 1);

  const rpcError = await loadGalleryExcludedKeys(async () => ({
    data: null,
    error: { message: 'function missing' },
  }), 'bangkok');
  assert.deepEqual(filterExcludedGalleryImages([visible], rpcError), [visible]);

  const blank = await loadGalleryExcludedKeys(async () => {
    throw new Error('should not be called');
  }, '  ');
  assert.equal(blank.urlKeys.size, 0);
  assert.equal(filterExcludedGalleryImages([visible], emptyGalleryExclusion()).length, 1);
});

test('a missing gallery_excluded_keys function is not requested again this session', async () => {
  resetGalleryExclusionRpcMemo();
  let calls = 0;
  const rpc = async () => {
    calls += 1;
    return {
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find the function public.gallery_excluded_keys in the schema cache',
      },
    };
  };
  const first = await loadGalleryExcludedKeys(rpc, 'bangkok');
  const second = await loadGalleryExcludedKeys(rpc, 'barcelona');
  assert.equal(galleryExclusionIsActive(first), false);
  assert.equal(second.ids.size, 0);
  assert.equal(calls, 1);
  assert.equal(galleryExclusionRpcIsMissing({ status: 404 }), true);
  assert.equal(galleryExclusionRpcIsMissing({ message: 'timeout' }), false);

  resetGalleryExclusionRpcMemo();
  let transient = 0;
  await loadGalleryExcludedKeys(async () => {
    transient += 1;
    return { data: null, error: { message: 'timeout' } };
  }, 'seoul');
  await loadGalleryExcludedKeys(async () => {
    transient += 1;
    return { data: [{ image_id: 'gone', image_url_key: null }] };
  }, 'seoul');
  assert.equal(transient, 2);
  resetGalleryExclusionRpcMemo();
});

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    data,
  };
}

test('hidden photo ids stay on a stable key when the gallery cache version changes', () => {
  const placeKey = 'bangkok';
  const legacyKey = galleryHiddenIdsKey('v1.24', placeKey);
  const stableKey = galleryHiddenIdsKey(GALLERY_HIDDEN_IDS_VERSION, placeKey);
  const storage = memoryStorage({ [legacyKey]: JSON.stringify(['q7J4p8V-RWU']) });
  const read = readGalleryHiddenIds(placeKey, storage);
  assert.equal(read.has('q7J4p8V-RWU'), true);
  assert.equal(storage.data[stableKey], JSON.stringify(['q7J4p8V-RWU']));

  storage.setItem(stableKey, JSON.stringify(['kept-by-user']));
  storage.setItem(galleryHiddenIdsKey('v1.25', placeKey), JSON.stringify(['from-cache-bump']));
  const stable = readGalleryHiddenIds(placeKey, storage);
  assert.deepEqual([...stable], ['kept-by-user']);
  assert.equal(addGalleryHiddenId(placeKey, 'second', storage), true);
  assert.equal(storage.data[stableKey].includes('second'), true);
  assert.equal(Object.keys(storage.data).some((key) => key.includes('v1.25')), true);
  assert.equal(storage.data[stableKey].includes('from-cache-bump'), false);
});

test('dropped ids are removed from the place session cache list', () => {
  const cached = [
    photo('ChSZETOal-I', 'https://images.unsplash.com/photo-madrid'),
    photo('bkk-wat', 'https://images.unsplash.com/photo-wat'),
  ];
  const next = sessionCacheAfterDroppedIds(cached, ['ChSZETOal-I']);
  assert.equal(next.changed, true);
  assert.deepEqual(next.images.map((img) => img.id), ['bkk-wat']);
  const same = sessionCacheAfterDroppedIds(cached, ['missing']);
  assert.equal(same.changed, false);
  assert.equal(same.images.length, 2);
});

test('hook filters every render path and writes a stale persist drop into cache', () => {
  const hook = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
    'utf8',
  );
  const sql = readFileSync(
    join(root, 'supabase/migrations/20261022201000_gallery_excluded_keys.sql'),
    'utf8',
  );
  assert.match(hook, /CACHE_VERSION = 'v1\.25'/);
  assert.equal(hook.match(/loadGalleryExcludedKeys\(/g).length, 1);
  assert.doesNotMatch(hook, /await withTimeout\(\s*loadGalleryExcludedKeys/);
  const exclusionAt = hook.indexOf('loadGalleryExcludedKeys(');
  const cacheAt = hook.indexOf('const validCache = loadFromSmartCache(CACHE_KEY)');
  assert.ok(exclusionAt > 0 && cacheAt > exclusionAt);
  assert.match(hook, /filterExcludedGalleryImages\(rawImages, excludedKeysRef\.current\)/);
  assert.doesNotMatch(hook, /galleryHiddenIdsKey\(CACHE_VERSION/);
  assert.match(hook, /readGalleryHiddenIds\(placeKey, localStorage\)/);
  assert.match(hook, /galleryAtMax: images\.length >= GALLERY_MAX_IMAGES/);
  assert.match(hook, /void loadGalleryExcludedKeys\(/);
  assert.match(sql, /FUNCTION public\.gallery_excluded_keys\(p_place_id text\)/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.gallery_excluded_keys\(text\) TO anon, authenticated/);
  assert.match(sql, /e\.restored_at IS NULL/);
  assert.doesNotMatch(sql, /image_snapshot/);
  assert.doesNotMatch(sql, /UPDATE\s+public\./i);
  assert.doesNotMatch(sql, /DELETE\s+FROM/i);

  const persistAt = hook.indexOf("supabase.rpc('persist_place_gallery'");
  assert.ok(persistAt > 0);
  const persistBlock = hook.slice(persistAt, persistAt + 1200);
  const cacheWrite = persistBlock.indexOf('sessionCacheAfterDroppedIds');
  const staleReturn = persistBlock.indexOf('runAtCall !== galleryLoadSeqRef.current');
  assert.ok(cacheWrite > 0 && staleReturn > cacheWrite);
});
