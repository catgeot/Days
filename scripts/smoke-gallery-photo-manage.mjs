#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GALLERY_LONG_PRESS_MS,
  GALLERY_LONG_PRESS_MOVE_PX,
  shouldCancelGalleryLongPress,
} from '../src/components/PlaceCard/common/galleryLongPress.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(GALLERY_LONG_PRESS_MS >= 400, true, 'long-press delay is holdable, not a tap');
assert.equal(GALLERY_LONG_PRESS_MOVE_PX >= 8, true, 'move cancel allows small finger jitter');

assert.equal(
  shouldCancelGalleryLongPress({ x: 0, y: 0 }, { x: 0, y: 0 }),
  false,
  'no movement keeps hold',
);
assert.equal(
  shouldCancelGalleryLongPress({ x: 10, y: 10 }, { x: 14, y: 12 }),
  false,
  'small jitter keeps hold',
);
assert.equal(
  shouldCancelGalleryLongPress({ x: 0, y: 0 }, { x: 40, y: 0 }),
  true,
  'scroll/swipe cancels hold',
);
assert.equal(
  shouldCancelGalleryLongPress(null, { x: 1, y: 1 }),
  true,
  'missing start cancels',
);

const view = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceGalleryView.jsx'), 'utf8');
assert.match(view, /useGalleryLongPress/, 'grid/lightbox long-press hook wired');
assert.match(view, /GalleryManageSheet/, 'confirm sheet for mobile manage');
assert.match(view, /enableLongPress/, 'tiles opt into long-press on touch');
assert.match(view, /handleRemoveImage/, 'remove still uses existing DB handler');
assert.match(view, /e\.ctrlKey \|\| e\.metaKey/, 'PC Ctrl/Cmd + double-click remains');
assert.match(view, /place\.gallery\.manageRemove/, 'manage copy is i18n');

const hook = readFileSync(join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'), 'utf8');
assert.match(hook, /gallery_urls:\s*newImages/, 'remove persists remaining photos to place_stats');
assert.match(hook, /\.eq\('place_id',\s*koreanName\)/, 'remove targets place_stats by place_id');

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/gallery/, 'vercel.json has /qa/gallery');
assert.match(
  vercel,
  /days-git-cursor-gallery-manage-173f-catgeots-projects\.vercel\.app\/place\/paris\/gallery/,
  'qa/gallery points at gallery-manage Preview',
);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /branch:\s*'cursor\/gallery-manage-173f'/, 'qa share branch is gallery-manage');

const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
for (const key of ['manageTitle', 'manageBody', 'manageRemove', 'manageCancel']) {
  assert.equal(typeof ko.place.gallery[key], 'string', `ko place.gallery.${key}`);
  assert.equal(typeof en.place.gallery[key], 'string', `en place.gallery.${key}`);
  assert.ok(ko.place.gallery[key].length > 0);
  assert.ok(en.place.gallery[key].length > 0);
}

console.log('smoke:gallery-photo-manage PASS');
