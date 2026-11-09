import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { resolveGalleryStockQuery } from '../../src/pages/Home/lib/uiPlaceAssetQuery.js';
import { buildJoseonRoyalTombsCollectiveSuggestions } from '../../src/pages/Home/lib/joseonRoyalTombsSearch.js';
import {
  isJoseonRoyalTombGallerySlug,
  resolveJoseonRoyalTombsCatalogSlugPin,
} from '../../src/pages/Home/lib/joseonRoyalTombsSearch.js';
import { applyOfficialTourSearchMedia } from '../../src/pages/Home/lib/koreaLocalScenicLists.js';
import { lookupLocalScenicPhotoByContentId } from '../../src/pages/Home/lib/koreaLocalScenicLists.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const galleryHook = readFileSync(
  join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
  'utf8',
);

const SEOUL_STOCK_MARKERS = /Namsan|Gyeongbokgung|N Seoul Tower|남산타워|경복궁/i;

test('서오릉 catalog pin — Tour contentId·동구릉 URL 오염 없음', () => {
  const pin = resolveJoseonRoyalTombsCatalogSlugPin('seooreung-royal-tombs');
  assert.ok(pin);
  assert.equal(String(pin.contentId), '125549');
  assert.equal(pin.hubId, 'goyang');
  assert.ok(pin.imageUrl?.includes('3527720'), pin.imageUrl);
  assert.ok(!pin.imageUrl?.includes('4066104'), '동구릉 이미지 복붙 회귀');
  assert.ok(Array.isArray(pin.galleryUrls) && pin.galleryUrls.length >= 1);
  for (const url of pin.galleryUrls) {
    assert.ok(!SEOUL_STOCK_MARKERS.test(url));
    assert.match(url, /visitkorea\.or\.kr/);
  }
});

test('조선왕릉 집합 검색 서오릉 — 공식 썸네일', () => {
  const rows = buildJoseonRoyalTombsCollectiveSuggestions('서오릉');
  const seo = rows.find((r) => /서오릉/.test(r.name));
  assert.ok(seo?.imageUrl);
  assert.ok(seo.imageUrl.includes('3527720'));
  const enriched = applyOfficialTourSearchMedia(seo);
  assert.equal(String(enriched.contentId), '125549');
});

test('왕릉 slug — 스톡 갤러리 차단 훅 배선', () => {
  assert.equal(isJoseonRoyalTombGallerySlug('seooreung-royal-tombs'), true);
  assert.equal(isJoseonRoyalTombGallerySlug('donggureung-royal-tombs'), true);
  assert.equal(isJoseonRoyalTombGallerySlug('paris'), false);
  assert.match(galleryHook, /isJoseonRoyalTombGallerySlug/);
  assert.match(galleryHook, /joseonTombGallery/);
  assert.match(galleryHook, /tourOfficialGalleryFromPin/);
});

test('서오릉 갤러리 쿼리 — 서울 일반 도시 백업 아님', () => {
  const pin = resolveJoseonRoyalTombsCatalogSlugPin('seooreung-royal-tombs');
  const { primaryQuery, backupQuery } = resolveGalleryStockQuery(pin, {});
  assert.match(primaryQuery, /Seooreung/i);
  assert.ok(!/\bSeoul\b/i.test(backupQuery || ''), backupQuery);
});

test('contentId 125549 overlay — visitkorea 갤러리', () => {
  const overlay = lookupLocalScenicPhotoByContentId('125549');
  assert.ok(overlay?.imageUrl?.includes('3527720'));
  assert.ok(Array.isArray(overlay.galleryUrls) && overlay.galleryUrls.length >= 1);
});
