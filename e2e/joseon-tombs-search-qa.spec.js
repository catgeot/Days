/**
 * 조선왕릉 검색 오연결 QA — HEAD `cursor/joseon-tombs-search-b5ea`
 * Mapbox LIVE 없음: Search Box는 route fixture (실검증과 분리).
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = '/opt/cursor/artifacts/joseon-tombs-qa';
const COLLECTIVE_QUERY = '조선왕릉';

const OFFICES = [
  {
    key: 'seoul-central',
    name: '문화재청 궁능유적본부 조선왕릉중부지구관리소',
    mapboxId: 'poi-joseon-central-office',
    lat: 37.4768,
    lng: 127.0045,
    parentPlace: 'Seoul',
    parentKo: '서울',
  },
  {
    key: 'goyang-west',
    name: '국가유산청 궁능유적본부 조선왕릉서부지구관리소, 서오릉관리소',
    mapboxId: 'poi-joseon-west-office',
    lat: 37.6589,
    lng: 126.8321,
    parentPlace: 'Goyang-si',
    parentKo: '고양',
  },
];

function feature(office) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [office.lng, office.lat] },
    properties: {
      name: office.name,
      mapbox_id: office.mapboxId,
      feature_type: 'poi',
      place_formatted: `${office.parentPlace}, South Korea`,
      full_address: `${office.name}, ${office.parentPlace}, South Korea`,
      context: {
        country: { name: 'South Korea', country_code: 'KR' },
        place: { name: office.parentPlace },
      },
      poi_category: ['tourist_attraction'],
      poi_category_ids: ['tourist_attraction'],
    },
  };
}

function installMapboxFixtures(page) {
  page.route('**/api.mapbox.com/search/searchbox/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.includes('/suggest')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestions: OFFICES.map((o) => ({
            name: o.name,
            mapbox_id: o.mapboxId,
            feature_type: 'poi',
            place_formatted: `${o.parentPlace}, South Korea`,
          })),
        }),
      });
      return;
    }
    if (path.includes('/retrieve/')) {
      const id = path.split('/retrieve/')[1]?.split('?')[0] || '';
      const office = OFFICES.find((o) => o.mapboxId === id) || OFFICES[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ features: [feature(office)] }),
      });
      return;
    }
    if (path.includes('/forward')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ features: OFFICES.map(feature) }),
      });
      return;
    }
    await route.continue();
  });
}

async function stampHref(page) {
  await page.evaluate(() => {
    const id = 'qa-href-overlay';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#111;color:#0f8;font:11px ui-monospace;padding:4px 6px;word-break:break-all';
      document.body.appendChild(el);
    }
    el.textContent = location.href;
  });
}

async function clipViewportShot(page, fileName, width) {
  const path = join(OUT, fileName);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width, height: Math.min(1200, 900) },
  });
  return path;
}

async function waitOfficeDetail(page, office) {
  const headerNeedle = office.name.slice(0, 14);
  await expect(page.getByRole('button', { name: new RegExp(headerNeedle) }).first()).toBeVisible({
    timeout: 45_000,
  });
  const galleryTab = page.getByRole('button', { name: /갤러리|Gallery/i });
  if ((await galleryTab.count()) > 0 && (await galleryTab.first().isVisible())) {
    await galleryTab.first().click();
  }
  await expect(page.getByText(/유네스코|조선 왕릉|관람/).first()).toBeAttached({ timeout: 45_000 });
}

async function openExploreSearch(page) {
  await page.goto('/', { waitUntil: 'commit', timeout: 45_000 });
  const searchBtn = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i })
    .first();
  await expect(searchBtn).toBeVisible({ timeout: 45_000 });
  await searchBtn.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible();
  return input;
}

test.describe('조선왕릉 Mapbox fixture 검색', () => {
  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  const COLLECTIVE_ROWS = [
    {
      key: 'donggureung',
      label: /조선왕릉 동구릉/,
      slug: 'donggureung-royal-tombs',
      header: /동구릉/,
    },
    {
      key: 'seooreung',
      label: /조선왕릉 서오릉/,
      slug: 'seooreung-royal-tombs',
      header: /서오릉/,
    },
  ];

  for (const row of COLLECTIVE_ROWS) {
    test(`${row.key}: 집합 검색 → /place/${row.slug} · 새로고침`, async ({ page }, testInfo) => {
      const width = testInfo.project.name === 'desktop-1280' ? 1280 : 390;
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      installMapboxFixtures(page);

      const input = await openExploreSearch(page);
      await input.fill(COLLECTIVE_QUERY);
      await expect(page.getByRole('button', { name: row.label }).first()).toBeVisible({
        timeout: 45_000,
      });
      const suffix = width === 390 ? '390' : '1280';
      if (row.key === 'donggureung' && width === 390) {
        await clipViewportShot(page, 'joseon-collective-search-390.png', 390);
      }
      await page.getByRole('button', { name: row.label }).first().click();

      await expect(page).toHaveURL(new RegExp(`/place/${row.slug}`), { timeout: 45_000 });
      await expect(page).not.toHaveURL(/\/place\/seoul(?:\/|$|\?)/);
      await expect(page).not.toHaveURL(/\/place\/search-/);

      await expect(page.getByRole('button', { name: row.header }).first()).toBeVisible({
        timeout: 45_000,
      });
      const galleryTab = page.getByRole('button', { name: /갤러리|Gallery/i });
      if ((await galleryTab.count()) > 0 && (await galleryTab.first().isVisible())) {
        await galleryTab.first().click();
      }
      await expect(page.getByText(/유네스코|조선 왕릉|관람/).first()).toBeAttached({ timeout: 45_000 });

      await stampHref(page);
      await clipViewportShot(page, `${row.key}-place-${suffix}.png`, width);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/place/${row.slug}`));
      await expect(page.getByText(/사진을 불러오지 못했습니다/).first()).not.toBeVisible({
        timeout: 15_000,
      }).catch(() => {});
      await clipViewportShot(page, `${row.key}-after-reload-${suffix}.png`, width);
    });
  }

  test('중부지구 집합 검색', async ({ page }, testInfo) => {
    const width = testInfo.project.name === 'desktop-1280' ? 1280 : 390;
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    installMapboxFixtures(page);
    const input = await openExploreSearch(page);
    await input.fill('중부지구');
    await expect(page.getByRole('button', { name: /조선왕릉 동구릉/ }).first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole('button', { name: /경찰/ })).toHaveCount(0);
    await clipViewportShot(page, `jungbu-collective-search-${width === 390 ? '390' : '1280'}.png`, width);
  });
});

test.describe('회귀 — 라우팅', () => {
  test('서울 SSOT 도시 /place/seoul', async ({ page }) => {
    await page.goto('/place/seoul', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/place\/seoul(?:\/|$|\?)/);
    await expect(page.getByText('서울', { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  });

  test('해외 Mapbox 도시 평양 /place/pyongyang', async ({ page }) => {
    await page.goto('/place/pyongyang', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/place\/pyongyang/);
  });

  test('Tour contentId tour-127982 (고산사)', async ({ page }) => {
    await page.goto('/place/tour-127982', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/place\/tour-127982/);
  });

  test('hub 평창 /place/pyeongchang', async ({ page }) => {
    await page.goto('/place/pyeongchang', { waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/place\/pyeongchang/);
  });

  for (const row of [
    { slug: 'tour-125545', needle: /동구릉|유네스코/ },
    { slug: 'tour-125548', needle: /홍유릉|조선/ },
  ]) {
    test(`${row.slug} 직접·새로고침 @390`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/place/${row.slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/place/${row.slug}`));
      await expect(page.getByText(row.needle).first()).toBeAttached({ timeout: 90_000 });
      await clipViewportShot(page, `${row.slug}-open-390.png`, 390);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByText(row.needle).first()).toBeAttached({ timeout: 90_000 });
      await clipViewportShot(page, `${row.slug}-reload-390.png`, 390);
    });
  }
});
