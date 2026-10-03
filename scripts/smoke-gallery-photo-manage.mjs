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
assert.match(view, /handleHideGalleryImage/, 'hide uses local-only handler');
assert.match(view, /handleReportGalleryImage/, 'report action wired');
assert.match(view, /openManageSheet\(selectedImg\)/, 'PC Ctrl/Cmd + double-click opens sheet');
assert.doesNotMatch(
  view,
  /handleRemoveImage/,
  'legacy immediate remove handler removed from view',
);
assert.match(view, /place\.gallery\.manageHide/, 'hide copy is i18n');
assert.match(view, /place\.gallery\.manageReport/, 'report copy is i18n');
assert.match(view, /place\.gallery\.manageReportToast/, 'report toast is i18n');
assert.match(view, /place\.gallery\.manageReportDuplicate/, 'duplicate report toast is i18n');
assert.match(view, /place\.gallery\.manageLogin/, 'logged-out report shows login prompt');
assert.match(view, /place\.gallery\.manageAdminRemove/, 'admin remove copy is i18n');
assert.match(view, /isGalleryAdmin &&/, 'admin remove button is role-gated');
assert.doesNotMatch(view, /저장된 목록에서도 빠집니다/, 'view must not promise global removal');

const hook = readFileSync(join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'), 'utf8');
assert.match(hook, /handleHideGalleryImage/, 'hide handler exported');
assert.match(hook, /handleAdminRemoveGalleryImage/, 'admin remove handler');
assert.match(hook, /syncGalleryViewFromStorage/, 'view list applies hidden filter only');
assert.match(hook, /allImagesRef\.current = storage/, 'storage ref keeps unfiltered gallery');
assert.doesNotMatch(
  hook,
  /handleHideGalleryImage[\s\S]{0,400}allImagesRef\.current\.filter/,
  'hide does not remove from storage ref',
);
const adminFn = hook.match(
  /const handleAdminRemoveGalleryImage = useCallback\([\s\S]*?\n  \);/,
)?.[0];
assert.ok(adminFn, 'handleAdminRemoveGalleryImage block');
assert.match(adminFn, /gallery-moderate/, 'admin remove calls gallery-moderate');
assert.match(adminFn, /action:\s*'remove'/, 'admin remove action');
assert.doesNotMatch(adminFn, /place_stats/, 'admin remove does not write place_stats');
assert.match(hook, /persist_place_gallery/, 'gallery writes go through persist_place_gallery');
assert.match(hook, /merge_keep_hero/, 'SWR uses merge_keep_hero');
assert.match(hook, /am_i_app_admin/, 'admin UI follows am_i_app_admin');
assert.match(hook, /loadedStatsPlaceIdRef/, 'persist uses the loaded place_stats row id');
const hideFn = hook.match(
  /const handleHideGalleryImage = useCallback\([\s\S]*?\n  \);/,
)?.[0];
assert.ok(hideFn, 'handleHideGalleryImage block');
assert.doesNotMatch(hideFn, /place_stats/, 'hide handler does not touch place_stats');

const adminUtil = readFileSync(join(root, 'src/utils/galleryAdmin.js'), 'utf8');
assert.match(adminUtil, /f31e47ac-144d-41e3-9ef9-441a2d008424/, 'default admin UID');
assert.match(adminUtil, /VITE_ADMIN_UIDS/, 'optional admin UID override');
assert.match(adminUtil, /adminUidSet\.add/, 'VITE_ADMIN_UIDS merges with default admin');

const reportUtil = readFileSync(join(root, 'src/shared/analytics/galleryPhotoReport.js'), 'utf8');
assert.match(reportUtil, /gallery_photo_report/, 'GA report event name');

const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
for (const key of [
  'manageTitle',
  'manageBody',
  'manageBodyAdmin',
  'manageHide',
  'manageReport',
  'manageReportToast',
  'manageReportDuplicate',
  'manageLogin',
  'manageLoginAction',
  'manageReasonIrrelevant',
  'manageReasonInappropriate',
  'manageReasonLowQuality',
  'manageReasonCopyright',
  'manageReasonOther',
  'manageAdminRemove',
  'manageCancel',
]) {
  assert.equal(typeof ko.place.gallery[key], 'string', `ko place.gallery.${key}`);
  assert.equal(typeof en.place.gallery[key], 'string', `en place.gallery.${key}`);
  assert.ok(ko.place.gallery[key].length > 0);
  assert.ok(en.place.gallery[key].length > 0);
}
const forbiddenKo = '저장된 목록에서도 빠집니다';
const forbiddenEn = 'saved list';
assert.ok(
  !JSON.stringify(ko.place.gallery).includes(forbiddenKo),
  'ko gallery manage copy must not promise global saved-list removal',
);
assert.ok(
  !en.place.gallery.manageBody.toLowerCase().includes(forbiddenEn),
  'en manageBody must not promise saved-list removal',
);

console.log('smoke:gallery-photo-manage PASS');
