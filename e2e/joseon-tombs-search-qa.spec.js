/**
 * 조선왕릉 검색 오연결 QA — HEAD `cursor/joseon-tombs-search-b5ea`
 * Mapbox LIVE 없음: Search Box는 route fixture (실검증과 분리).
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = '/opt/cursor/artifacts/joseon-tombs-qa';
const QUERY = '조선왕릉';

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

  for (const office of OFFICES) {
    test(`${office.key}: 제안 클릭 → search 상세 · 서울 스냅 금지`, async ({ page }, testInfo) => {
      const width = testInfo.project.name === 'desktop-1280' ? 1280 : 390;
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      installMapboxFixtures(page);

      const input = await openExploreSearch(page);
      await input.fill(QUERY);

      const row = page.getByRole('button', { name: new RegExp(office.name.slice(0, 12)) }).first();
      await expect(row).toBeVisible({ timeout: 45_000 });
      await row.click();

      await expect(page).toHaveURL(new RegExp(`/place/search-${office.lat}-${office.lng}`), {
        timeout: 45_000,
      });
      await expect(page).not.toHaveURL(/\/place\/seoul(?:\/|$|\?)/);

      await expect(page.getByText(office.name, { exact: false }).first()).toBeVisible({ timeout: 45_000 });
      await expect(page.getByText('대한민국', { exact: false }).first()).toBeVisible({ timeout: 30_000 });
      const headerNeedle = office.name.slice(0, 14);
      await expect(page.getByRole('button', { name: new RegExp(headerNeedle) }).first()).toBeVisible({
        timeout: 30_000,
      });

      await stampHref(page);
      const suffix = width === 390 ? '390' : '1280';
      await clipViewportShot(page, `${office.key}-place-${suffix}.png`, width);

      await page.reload({ waitUntil: 'commit' });
      await expect(page).toHaveURL(new RegExp(`/place/search-${office.lat}-${office.lng}`));
      await expect(page).not.toHaveURL(/\/place\/seoul(?:\/|$|\?)/);
      await clipViewportShot(page, `${office.key}-after-reload-${suffix}.png`, width);

      await page.goBack({ waitUntil: 'commit' });
      await expect(page).toHaveURL(/\/explore/);
      await page.goForward({ waitUntil: 'commit' });
      await expect(page).toHaveURL(new RegExp(`/place/search-${office.lat}-${office.lng}`));
      await expect(page).not.toHaveURL(/\/place\/seoul(?:\/|$|\?)/);
    });
  }
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
});
