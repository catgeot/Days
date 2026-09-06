#!/usr/bin/env node
/**
 * 자킨토스 검색 #2 — SSOT 없이 uiPlace 라틴 지명 → 카드·갤러리·영상
 * 네트워크 없음.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { resolveTravelSpotFromSearchQuery } from '../src/utils/travelSpotResolve.js';
import { getPlaceTitleLines } from '../src/components/PlaceCard/common/locationDisplay.js';
import {
  mergeLatinPlaceFields,
  mergeSearchBoxEnglishHits,
  pickLatinPlaceName,
  resolveGalleryStockQuery,
  resolvePlaceVideoQueries,
  needsLatinPlaceName,
  ensureLatinPlaceSlug,
  overlayGeocodeLatinOnHits,
} from '../src/pages/Home/lib/uiPlaceAssetQuery.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(
  TRAVEL_SPOTS.some((s) => s.slug === 'zakynthos'),
  false,
  'zakynthos is not a travelSpots SSOT',
);
assert.equal(
  resolveTravelSpotFromSearchQuery('자킨토스'),
  null,
  '자킨토스 search does not snap to SSOT',
);

const hangulOnly = {
  uiPlace: true,
  name: '자킨토스',
  name_en: '자킨토스',
  country: '그리스',
  country_en: '그리스',
  lat: 37.787,
  lng: 20.9,
};
assert.equal(pickLatinPlaceName(hangulOnly), '');
assert.equal(needsLatinPlaceName(hangulOnly), true);
assert.equal(resolveGalleryStockQuery(hangulOnly).primaryQuery, '');
assert.equal(getPlaceTitleLines(hangulOnly).secondaryName, '');

const hydrated = mergeLatinPlaceFields(hangulOnly, {
  name: 'Zakynthos',
  name_en: 'Zakynthos',
  country: 'Greece',
  country_en: 'Greece',
});
assert.equal(hydrated.name, '자킨토스', 'keep Korean display name');
assert.equal(hydrated.name_en, 'Zakynthos');
assert.equal(hydrated.country, '그리스');
assert.equal(hydrated.country_en, 'Greece');

const titles = getPlaceTitleLines(hydrated);
assert.equal(titles.primaryName, '자킨토스');
assert.equal(titles.secondaryName, 'Zakynthos');

const gallery = resolveGalleryStockQuery(hydrated);
assert.equal(gallery.primaryQuery, 'Zakynthos');
assert.match(gallery.backupQuery, /Greece/);

const videos = resolvePlaceVideoQueries(hydrated);
assert.equal(videos.query, 'Zakynthos Greece');
assert.equal(videos.fallbackQuery, 'Zakynthos travel vlog');

const mergedHits = mergeSearchBoxEnglishHits(
  [
    {
      mapboxId: 'zak-1',
      name: '자킨토스',
      name_en: '',
      country: '그리스',
      country_en: '그리스',
      uiPlace: true,
    },
  ],
  [
    {
      mapboxId: 'zak-1',
      name: 'Zakynthos',
      name_en: 'Zakynthos',
      country: 'Greece',
      country_en: 'Greece',
    },
  ],
);
assert.equal(mergedHits[0].name, '자킨토스');
assert.equal(mergedHits[0].name_en, 'Zakynthos');
assert.equal(mergedHits[0].country_en, 'Greece');
assert.equal(mergedHits[0].slug, 'zakynthos');

const mergedByCenter = mergeSearchBoxEnglishHits(
  [
    {
      mapboxId: 'zak-ko',
      name: '자킨토스',
      name_en: '',
      country: '그리스',
      lat: 37.787,
      lng: 20.9,
      uiPlace: true,
    },
  ],
  [
    {
      mapboxId: 'zak-en',
      name: 'Zakynthos',
      name_en: 'Zakynthos',
      country: 'Greece',
      country_en: 'Greece',
      lat: 37.79,
      lng: 20.89,
    },
  ],
);
assert.equal(mergedByCenter[0].name, '자킨토스');
assert.equal(mergedByCenter[0].name_en, 'Zakynthos');
assert.equal(mergedByCenter[0].slug, 'zakynthos');

const stamped = ensureLatinPlaceSlug({
  name: '자킨토스',
  name_en: 'Zakynthos',
  country: '그리스',
  uiPlace: true,
});
assert.equal(stamped.slug, 'zakynthos');

const overlaid = overlayGeocodeLatinOnHits(
  [
    {
      name: '자킨토스',
      name_en: '',
      country: '그리스',
      lat: 37.787,
      lng: 20.9,
      uiPlace: true,
    },
  ],
  {
    name: '자킨토스',
    name_en: 'Zakynthos',
    country: '그리스',
    country_en: 'Greece',
    lat: 37.787,
    lng: 20.9,
  },
);
assert.equal(overlaid[0].name_en, 'Zakynthos');
assert.equal(overlaid[0].slug, 'zakynthos');
assert.equal(overlaid[0].name, '자킨토스');

const modalSrc = readFileSync(
  join(root, 'src/pages/Home/components/SearchDiscoveryModal.jsx'),
  'utf8',
);
assert.match(modalSrc, /hydrateSearchBoxLatinName/, 'dropdown select hydrates latin name');
assert.match(
  modalSrc,
  /setIsSearchHistoryOpen\(keepChoiceDropdown\)/,
  'Enter choice cards keep the typing dropdown open',
);
assert.match(
  modalSrc,
  /disambiguation\?\.candidates\?\.length\s*\?\s*disambiguation\.candidates/,
  'dropdown lists the same pins as left choice cards',
);
assert.doesNotMatch(
  modalSrc,
  /if \(disambiguation\?\.candidates\?\.length\) return;/,
  'focus/click still open autocomplete when choice cards exist',
);

const handlersSrc = readFileSync(
  join(root, 'src/pages/Home/hooks/useHomeHandlers.js'),
  'utf8',
);
assert.match(handlersSrc, /overlayGeocodeLatinOnHits/, 'Enter cards reuse geocode latin');

const gallerySrc = readFileSync(
  join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
  'utf8',
);
assert.match(gallerySrc, /CACHE_VERSION = 'v1\.21'/);
assert.match(gallerySrc, /isLatinPlaceName\(koreanName\)/, 'pexels extras skip hangul names');
assert.doesNotMatch(gallerySrc, /"자킨토스": "Zakynthos"/);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /slug:\s*'zakynthos'/);
assert.match(qa, /cursor\/zakynthos-search-e84a/);
assert.match(qa, /days-git-cursor-zakynthos-search-e84a/);
const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/zakynthos/);
assert.match(vercel, /days-git-cursor-zakynthos-search-e84a/);

console.log('PASS zakynthos-search (uiPlace latin name · no SSOT · gallery/video query)');
