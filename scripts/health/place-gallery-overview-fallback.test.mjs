import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { splitPlaceOverview } from '../../src/components/PlaceCard/common/placeOverviewText.js';
import { getPlaceOverviewDescForDisplay } from '../../src/pages/Home/lib/placeSeoText.js';
import { isSyntheticOrEmptyPlaceDesc } from '../../src/pages/Home/lib/placeDescText.js';
import { attractionToPlacePin, listCityAttractionHubs } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  isGateoPlaceGalleryOverviewFallbackEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import { resolveTourApiPlace } from '../../src/utils/tourApiMatch.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('gallery overview flag defaults on', () => {
  assert.equal(isGateoPlaceGalleryOverviewFallbackEnabled(), true);
  globalThis.__VITE_ENV__ = { VITE_GATEO_PLACE_GALLERY_OVERVIEW_FALLBACK: '0' };
  assert.equal(isGateoPlaceGalleryOverviewFallbackEnabled(), false);
  delete globalThis.__VITE_ENV__;
});

test('synthetic hub attraction desc is empty for display', () => {
  const seoul = listCityAttractionHubs().find((h) => h.hubId === 'seoul');
  const gyeongbok = seoul?.attractions?.find((a) => a.name === '경복궁');
  assert.ok(gyeongbok, 'seoul 경복궁 hub attraction');
  const pin = attractionToPlacePin(seoul, gyeongbok);
  assert.equal(isSyntheticOrEmptyPlaceDesc(pin), true);
  assert.equal(getPlaceOverviewDescForDisplay(pin, 'ko'), '');
  assert.equal(splitPlaceOverview(pin, 'ko').fixed, '');
});

test('EN gallery shows hydrated KO overview when no desc_en', () => {
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    parentCity: '서울',
    country: '대한민국',
    desc: '조선 왕조의 법궁으로, 광화문과 근정전이 유명한 서울의 대표 고궁입니다.',
    placeChatIntroApplied: true,
  };
  assert.match(getPlaceOverviewDescForDisplay(pin, 'en'), /조선/);
  assert.match(splitPlaceOverview(pin, 'en').fixed, /조선/);
});

test('gyeongbokgung palace resolves Tour contentId from name without slug key', () => {
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    country: '대한민국',
    contentId: '126508',
  };
  assert.equal(String(pin.contentId), '126508');
  assert.equal(resolveTourApiPlace(pin)?.contentId, '126508');
  assert.equal(resolveTourApiPlace('경복궁')?.contentId, '126508');
});

test('major curated domestic landmarks share synthetic hub desc pattern', () => {
  const samples = ['경복궁', '남산서울타워', '북촌한옥마을', '창덕궁'];
  const found = [];
  for (const hub of listCityAttractionHubs()) {
    if (hub.country !== '대한민국') continue;
    for (const attraction of hub.attractions || []) {
      if (!samples.includes(attraction.name)) continue;
      const pin = attractionToPlacePin(hub, attraction);
      found.push({
        name: pin.name,
        slug: pin.slug,
        contentId: resolveTourApiPlace(pin)?.contentId || pin.contentId || '',
        synthetic: isSyntheticOrEmptyPlaceDesc(pin),
      });
    }
  }
  assert.equal(found.length, samples.length, `expected ${samples.length} landmarks, got ${JSON.stringify(found)}`);
  for (const row of found) {
    assert.equal(row.synthetic, true, row.name);
    assert.ok(row.contentId, `${row.name} needs Tour contentId`);
  }
});

test('GalleryInfoView wires overview hydration hook', () => {
  const src = readFileSync(join(root, 'src/components/PlaceCard/views/GalleryInfoView.jsx'), 'utf8');
  assert.match(src, /usePlaceGalleryOverviewHydration/);
});
