import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { splitPlaceOverview } from '../../src/components/PlaceCard/common/placeOverviewText.js';
import {
  getPlaceOverviewDescForDisplay,
  getLocalizedPlaceDesc,
  overviewTextIsKoreanOnly,
} from '../../src/pages/Home/lib/placeSeoText.js';
import { isSyntheticOrEmptyPlaceDesc } from '../../src/pages/Home/lib/placeDescText.js';
import { attractionToPlacePin, listCityAttractionHubs } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { isGateoPlaceGalleryOverviewFallbackEnabled } from '../../src/shared/gateoFeatureFlags.js';
import { resolveTourApiPlace } from '../../src/utils/tourApiMatch.js';
import {
  hydratePlaceGalleryOverview,
  resetPlaceGalleryOverviewCacheForTests,
} from '../../src/pages/Home/lib/hydratePlaceGalleryOverview.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('gallery overview flag defaults on', () => {
  assert.equal(isGateoPlaceGalleryOverviewFallbackEnabled(), true);
  globalThis.__VITE_ENV__ = { VITE_GATEO_PLACE_GALLERY_OVERVIEW_FALLBACK: '0' };
  assert.equal(isGateoPlaceGalleryOverviewFallbackEnabled(), false);
  delete globalThis.__VITE_ENV__;
});

test('flag OFF — splitPlaceOverview uses getLocalizedPlaceDesc (EN hides hangul desc)', () => {
  globalThis.__VITE_ENV__ = { VITE_GATEO_PLACE_GALLERY_OVERVIEW_FALLBACK: '0' };
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    desc: '조선 왕조의 법궁입니다.',
    placeChatIntroApplied: true,
  };
  assert.equal(getLocalizedPlaceDesc(pin, 'en'), '');
  assert.equal(splitPlaceOverview(pin, 'en').fixed, '');
  delete globalThis.__VITE_ENV__;
});

test('flag ON — EN shows KO overview body for display helper', () => {
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    desc: '조선 왕조의 법궁으로, 광화문과 근정전이 유명한 서울의 대표 고궁입니다.',
    placeChatIntroApplied: true,
  };
  assert.match(getPlaceOverviewDescForDisplay(pin, 'en'), /조선/);
  assert.equal(overviewTextIsKoreanOnly(getPlaceOverviewDescForDisplay(pin, 'en')), true);
});

test('read-only hydrate module — no AI persist or save RPC', () => {
  const src = readFileSync(join(root, 'src/pages/Home/lib/hydratePlaceGalleryOverview.js'), 'utf8');
  assert.doesNotMatch(src, /ensurePlaceChatIntroForLocation/);
  assert.doesNotMatch(src, /generatePlaceChatIntroWithAi/);
  assert.doesNotMatch(src, /persistPlaceChatIntroSummary/);
  assert.doesNotMatch(src, /\brpc\s*\(\s*['"]save_place_chat_intro/);
  assert.match(src, /overviewInflight\.get\(key\)/);
  assert.match(src, /overviewMemory\.has\(key\)/);
});

test('hook path — no save RPC or AI ensure', () => {
  const hook = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceGalleryOverviewHydration.js'),
    'utf8',
  );
  assert.doesNotMatch(hook, /save_place_chat_intro/);
  assert.doesNotMatch(hook, /persistPlaceChatIntroSummary/);
  assert.doesNotMatch(hook, /ensurePlaceChatIntroForLocation/);
});

test('in-flight dedup — parallel hydrate shares one inflight promise', async () => {
  resetPlaceGalleryOverviewCacheForTests();
  let introCalls = 0;
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    country: '대한민국',
    parentCity: '서울',
    desc: '서울의 명소 · 경복궁',
  };

  const readIntro = async () => {
    introCalls += 1;
    await new Promise((r) => setTimeout(r, 25));
    return '';
  };
  const readTour = async () =>
    '경복궁은 조선 태조 이성계가 1395년에 창건한 조선 왕조의 법궁입니다. 광화문과 근정전이 유명합니다.';

  const [a, b] = await Promise.all([
    hydratePlaceGalleryOverview(pin, { lng: 'ko', readIntro, readTour }),
    hydratePlaceGalleryOverview(pin, { lng: 'ko', readIntro, readTour }),
  ]);
  assert.equal(introCalls, 1, 'intro lookup once per place+locale');
  assert.equal(a, b);
  assert.match(a, /조선 태조/);
  const cached = await hydratePlaceGalleryOverview(pin, { lng: 'ko', readIntro, readTour });
  assert.equal(introCalls, 1, 'memory cache skips repeat intro fetch');
  assert.equal(cached, a);
  resetPlaceGalleryOverviewCacheForTests();
});

test('synthetic hub attraction desc is empty for display when flag on', () => {
  const seoul = listCityAttractionHubs().find((h) => h.hubId === 'seoul');
  const gyeongbok = seoul?.attractions?.find((a) => a.name === '경복궁');
  const pin = attractionToPlacePin(seoul, gyeongbok);
  assert.equal(isSyntheticOrEmptyPlaceDesc(pin), true);
  assert.equal(getPlaceOverviewDescForDisplay(pin, 'ko'), '');
});

test('Gallery UI wires EN korean description label i18n key', () => {
  const scroll = readFileSync(
    join(root, 'src/components/PlaceCard/views/GalleryInfoOverviewScrollContent.jsx'),
    'utf8',
  );
  assert.match(scroll, /descriptionInKorean/);
});

test('gyeongbokgung resolves Tour contentId via name', () => {
  const pin = {
    slug: 'gyeongbokgung-palace',
    name: '경복궁',
    country: '대한민국',
    contentId: '126508',
  };
  assert.equal(resolveTourApiPlace(pin)?.contentId, '126508');
});
