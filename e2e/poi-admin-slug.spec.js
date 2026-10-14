// 홈 검색 POI — 행정구역 slug로 열리지 않는지 (WebKit 390x844)
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = '/opt/cursor/artifacts/slug-poi-390';
const PROD_HOSTS = new Set(['gateo.kr', 'www.gateo.kr']);
const WRITE_RPC = /increment_place_stats|record_place_visit|save_place_chat_intro/;

const PLACES = [
  {
    file: 'heungjeong-valley',
    query: '흥정계곡',
    name: '흥정계곡',
    forbidSlug: 'pyeongchang',
  },
  {
    file: 'woljeong-beach',
    query: '월정리해변',
    name: '월정리해변',
    forbidSlug: 'jeju',
  },
  {
    file: 'gamaksan-ungye',
    query: '감악산 운계폭포',
    name: '감악산 운계폭포',
    forbidSlug: 'paju',
  },
  {
    file: 'pyeongchang',
    query: '평창',
    name: '평창',
    expectSlug: 'pyeongchang',
  },
];

function assertPreviewHost(baseURL) {
  const host = new URL(baseURL).hostname;
  if (PROD_HOSTS.has(host)) {
    throw new Error(`refusing production host ${host}`);
  }
}

async function openHomeSearch(page) {
  await page.goto('/');
  const search = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i })
    .first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible();
  return input;
}

async function scrollCardToEnd(page) {
  await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('div')].filter((el) => {
      const style = getComputedStyle(el);
      const scrollable = style.overflowY === 'auto' || style.overflowY === 'scroll';
      return scrollable && el.scrollHeight > el.clientHeight + 24;
    });
    nodes.sort((a, b) => b.scrollHeight - a.scrollHeight);
    const target = nodes[0];
    if (target) {
      target.scrollTop = target.scrollHeight;
      return;
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
}

test.describe('POI search does not open the admin slug', () => {
  test.beforeEach(async ({ baseURL }) => {
    assertPreviewHost(baseURL || 'https://127.0.0.1:5173');
    await mkdir(OUT_DIR, { recursive: true });
  });

  for (const place of PLACES) {
    test(`${place.name} card`, async ({ page }) => {
      const writes = [];
      page.on('response', (response) => {
        if (!WRITE_RPC.test(response.url())) return;
        writes.push({ url: response.url(), status: response.status() });
      });

      const input = await openHomeSearch(page);
      await input.click();
      await input.fill(place.query);
      const row = page
        .locator('button')
        .filter({ has: page.getByText(place.name, { exact: true }) })
        .filter({ hasNotText: 'MOONi' })
        .first();
      await expect(row).toBeVisible({ timeout: 30_000 });
      await row.click();

      await expect(page).not.toHaveURL(/\/explore/, { timeout: 45_000 });
      await expect(page.getByText(place.name, { exact: true }).first()).toBeVisible();

      if (!/\/place\//.test(page.url())) {
        await page.locator('span.text-2xl').filter({ hasText: place.name }).first().click();
        await page.waitForURL(/\/place\//, { timeout: 30_000 });
      }

      const path = decodeURIComponent(new URL(page.url()).pathname);
      if (place.expectSlug) {
        expect(path).toMatch(new RegExp(`/place/${place.expectSlug}(?:/|$)`));
      }
      if (place.forbidSlug) {
        expect(path).not.toMatch(new RegExp(`/place/${place.forbidSlug}(?:/|$)`));
        expect(path.toLowerCase()).not.toContain(place.forbidSlug);
      }
      await expect(page.getByText(place.name, { exact: true }).first()).toBeVisible();

      await scrollCardToEnd(page);
      await page.screenshot({ path: join(OUT_DIR, `${place.file}.png`) });

      for (const write of writes) {
        expect(write.status, write.url).not.toBeLessThan(400);
      }
    });
  }
});
