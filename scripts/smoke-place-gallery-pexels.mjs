#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'), 'utf8');

assert.match(src, /const unsplashPageRef = useRef\(1\)/, 'unsplash page ref split');
assert.match(src, /const pexelsPageRef = useRef\(0\)/, 'pexels page ref starts at 0');
assert.match(src, /GALLERY_DB_SKIP_SLUGS/, 'explicit DB skip slugs');
assert.match(src, /isThinStockGallery/, 'thin stock refetch guard');
assert.doesNotMatch(src, /whakarewarewa-village[\s\S]*primary:/, 'no unsplash override for whakarewarewa');
assert.match(src, /GALLERY_PEXELS_EXTRA_QUERIES/, 'pexels extra queries for whakarewarewa');
assert.match(src, /GALLERY_UNSPLASH_EXTRA_QUERIES/, 'unsplash extra queries for whakarewarewa');
assert.match(src, /shouldMergePexelsStock/, 'pexels merge when gallery has no pexels yet');
assert.match(src, /needsPexelsBackfill/, 'pexels backfill after DB/cache hit');
assert.doesNotMatch(src, /VITE_PEXELS_API_KEY missing/, 'no noisy missing-key warnings');
assert.doesNotMatch(src, /needsPexelsBackfill[\s\S]*images\.length > 15/, 'no 15-image cap on pexels backfill');
assert.match(src, /GALLERY_MAX_IMAGES/, 'gallery max image cap');
assert.match(src, /GALLERY_PEXELS_BATCH_LIMIT/, 'pexels batch limit');
assert.match(src, /capGalleryImages/, 'cap helper');
assert.match(src, /신규 사진 없음/, 'no-op refresh logs warning');

const apiSrc = readFileSync(join(root, 'src/pages/Home/lib/apiClient.js'), 'utf8');
assert.match(apiSrc, /fetchPexelsImagesViaProxy/, 'pexels edge proxy fallback');
assert.match(apiSrc, /pexels-proxy/, 'pexels-proxy function name');

console.log('smoke:place-gallery-pexels PASS');
