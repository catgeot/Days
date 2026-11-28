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
import {
  KOREAN_SCENIC_GALLERY_OFFICIAL_STOCK_THRESHOLD,
  buildKoreaScenicSsotGalleryImage,
  countGalleryOfficialImages,
  galleryCacheHasScenicSsotUrl,
  partitionGalleryOfficialBeforeStock,
  prependScenicSsotHeroes,
  shouldSuppressKoreanScenicGalleryStock,
} from '../../src/utils/galleryKoreanOfficialStock.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const galleryHook = readFileSync(
  join(root, 'src/components/PlaceCard/hooks/usePlaceGallery.js'),
  'utf8',
);

test('Korean scenic gallery uses named official-vs-stock threshold', () => {
  assert.equal(KOREAN_SCENIC_GALLERY_OFFICIAL_STOCK_THRESHOLD, 8);
  assert.match(galleryHook, /shouldSuppressKoreanScenicGalleryStock/);
  assert.match(galleryHook, /prependScenicSsotHeroes/);
  assert.match(galleryHook, /cacheMissingScenicSsotHero/);
  assert.match(galleryHook, /scenicSsotUrlIsSelfHosted/);
});

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

test('SSOT hero prepends before Tour images and carries KOGL credit', () => {
  const spot = (koreaScenicSpots.spots || []).find((s) => s.id === 'sosu-seowon');
  const heroUrl = listKoreaScenicGalleryUrlsFromSpot(spot)[0];
  const tour = [
    {
      id: 'tourapi-1',
      source: 'tourapi',
      urls: { small: 'https://tong.visitkorea.or.kr/a.jpg', regular: 'https://tong.visitkorea.or.kr/a.jpg' },
    },
  ];
  const merged = prependScenicSsotHeroes(tour, [heroUrl], {
    stablePlaceKey: 'sosu-seowon',
    koreanName: '소수서원',
    scenicSpot: spot,
    idSuffix: '-t',
  });
  assert.equal(merged.length, 2);
  assert.equal(merged[0].urls.regular, heroUrl);
  assert.equal(merged[0].source, 'korea-scenic-ssot');
  assert.equal(merged[0].photo_note, spot.imageCredit);
  assert.match(String(merged[0].id), /sosu-seowon/);
});

test('>=8 official images => 0 stock fetch; <8 official allows stock fill', () => {
  const official = (n) =>
    Array.from({ length: n }, (_, i) => ({
      id: `tourapi-${i}`,
      source: 'tourapi',
      urls: { small: `https://tong.visitkorea.or.kr/${i}.jpg`, regular: `https://tong.visitkorea.or.kr/${i}.jpg` },
    }));
  const stock = {
    id: 'pexels-1',
    source: 'pexels',
    urls: { small: 'https://images.pexels.com/1.jpg', regular: 'https://images.pexels.com/1.jpg' },
  };
  assert.equal(countGalleryOfficialImages(official(8)), 8);
  assert.equal(
    shouldSuppressKoreanScenicGalleryStock([...official(8), stock], true),
    true,
  );
  assert.equal(
    shouldSuppressKoreanScenicGalleryStock([...official(7), stock], true),
    false,
  );
  const ordered = partitionGalleryOfficialBeforeStock([stock, ...official(2)]);
  assert.equal(ordered[0].source, 'tourapi');
  assert.equal(ordered.at(-1).source, 'pexels');
});

test('session cache without SSOT hero URL is treated as stale', () => {
  const spot = (koreaScenicSpots.spots || []).find((s) => s.id === 'sosu-seowon');
  const heroUrl = listKoreaScenicGalleryUrlsFromSpot(spot)[0];
  const cached = [
    {
      id: 'pexels-x',
      source: 'pexels',
      urls: { small: 'https://images.pexels.com/x.jpg', regular: 'https://images.pexels.com/x.jpg' },
    },
  ];
  assert.equal(galleryCacheHasScenicSsotUrl(cached, [heroUrl]), false);
  assert.equal(
    galleryCacheHasScenicSsotUrl(
      prependScenicSsotHeroes(cached, [heroUrl], {
        stablePlaceKey: 'sosu-seowon',
        scenicSpot: spot,
      }),
      [heroUrl],
    ),
    true,
  );
});

test('Wikimedia scenic SSOT rows use wikimedia source for grid credit', () => {
  const wiki =
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/Suncheon_Bay.jpg/1280px-Suncheon_Bay.jpg';
  const row = buildKoreaScenicSsotGalleryImage(wiki, {
    stablePlaceKey: 'suncheon-bay-wetland',
    koreanName: '순천만습지',
    scenicSpot: { imageCredit: '문화재청 / 공공누리 제1유형' },
  });
  assert.equal(row.source, 'wikimedia');
  assert.ok(row.user?.name);
  assert.equal(row.urls.regular, wiki);
});