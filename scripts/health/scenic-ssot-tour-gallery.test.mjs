import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import koreaScenicSpots from '../../src/pages/Home/data/koreaScenicSpots.json' with { type: 'json' };
import {
  listKoreaScenicGalleryUrlsFromSpot,
  resolveKoreaScenicGalleryUrlsForPlace,
} from '../../src/pages/Home/lib/placeScenicGateway.js';
import { resolveTourGalleryContentId } from '../../src/utils/gateoManualTourContentId.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const galleryHook = readFileSync(
  join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
  'utf8',
);

test('scenic SSOT-only short-circuit must not skip official Tour contentId gallery', () => {
  assert.match(galleryHook, /scenicSsotWouldBlockOfficialTour/);
  assert.match(
    galleryHook,
    /scenicSsotGalleryOnly && hasOfficialTourContentId/,
  );
  assert.match(galleryHook, /!scenicSsotWouldBlockOfficialTour/);
});

test('소수서원 — scenic SSOT 1장 + Tour contentId (modal과 동일 LIVE 경로)', () => {
  const spot = (koreaScenicSpots.spots || []).find((s) => s.id === 'sosu-seowon');
  assert.ok(spot?.contentId, 'contentId SSOT');
  assert.equal(resolveTourGalleryContentId(spot.contentId), '126201');
  const scenicUrls = listKoreaScenicGalleryUrlsFromSpot(spot);
  assert.equal(scenicUrls.length, 1);
  assert.match(scenicUrls[0], /^\/site\/scenic\//);
  const fromPlace = resolveKoreaScenicGalleryUrlsForPlace({
    slug: spot.placeSlug,
    country: '대한민국',
  });
  assert.deepEqual(fromPlace, scenicUrls);
});

test('순천만습지 — scenic SSOT 1장 + Tour contentId (동일 scenic-only 패턴)', () => {
  const spot = (koreaScenicSpots.spots || []).find((s) => s.id === 'suncheon-bay-wetland');
  assert.ok(spot?.contentId, 'contentId SSOT');
  assert.equal(resolveTourGalleryContentId(spot.contentId), '126730');
  const scenicUrls = listKoreaScenicGalleryUrlsFromSpot(spot);
  assert.equal(scenicUrls.length, 1);
  assert.match(scenicUrls[0], /^https:\/\//);
});