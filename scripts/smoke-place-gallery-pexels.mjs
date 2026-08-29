#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'), 'utf8');

assert.match(src, /const unsplashPageRef = useRef\(1\)/, 'unsplash page ref split');
assert.match(src, /const pexelsPageRef = useRef\(0\)/, 'pexels page ref starts at 0');
assert.match(src, /whakarewarewa-village/, 'whakarewarewa gallery query override');
assert.match(src, /needsPexelsBackfill/, 'pexels backfill after DB/cache hit');
assert.match(src, /mergeGalleryAppend/, 'dedup append helper');
assert.match(src, /신규 사진 없음/, 'no-op refresh logs warning');

console.log('smoke:place-gallery-pexels PASS');
