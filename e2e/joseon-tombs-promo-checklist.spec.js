/**
 * 조선왕릉 홍보 동선 점검표 — LIVE https://www.gateo.kr 또는 Preview baseURL.
 * 무니 질문·로그인 없음. 결과: /opt/cursor/artifacts/joseon-tombs-checklist.json + PNG.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';

const OUT = '/opt/cursor/artifacts/joseon-tombs-promo-checklist';
const CHECKLIST_PATH = '/opt/cursor/artifacts/joseon-tombs-checklist.json';
const IS_LIVE = /^https:\/\/(www\.)?gateo\.kr/i.test(
  String(process.env.PLAYWRIGHT_BASE_URL || process.env.LIVE_BASE_URL || ''),
);

const QUERIES = ['조선왕릉', '왕릉', '동구릉', '선정릉', '홍유릉'];

const checklist = [];

async function shot(page, name, width) {
  const path = join(OUT, name);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width, height: 844 },
  });
  return path;
}

async function waitPlaceShell(page) {
  await expect(
    page.getByRole('button', { name: /플래너|갤러리|Planner|Gallery/i }).first(),
  ).toBeVisible({ timeout: 90_000 });
}

async function openExploreSearch(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const searchBtn = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i })
    .first();
  await expect(searchBtn).toBeVisible({ timeout: 60_000 });
  await searchBtn.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 45_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible();
  return input;
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function searchRow(page, query) {
  return page
    .locator('[data-search-popover] button, [data-search-history-root] button')
    .filter({ hasNotText: /MOONi|전송|일반 탐색/i })
    .filter({ hasText: new RegExp(escapeRegExp(query.slice(0, Math.min(query.length, 6))), 'i') })
    .first();
}

test.describe('조선왕릉 홍보 점검표', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.beforeEach(async ({ context }) => {
    if (!IS_LIVE) {
      await installExploreGeminiMock(context);
      await installExploreTourapiMock(context);
    }
  });

  test.afterAll(async () => {
    await writeFile(
      CHECKLIST_PATH,
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          baseURL: process.env.PLAYWRIGHT_BASE_URL || 'default',
          live: IS_LIVE,
          rows: checklist,
        },
        null,
        2,
      ),
      'utf8',
    );
  });

  for (const query of QUERIES) {
    for (const viewport of [
      { width: 390, label: '390' },
      { width: 1280, label: '1280' },
    ]) {
      test(`${query} @${viewport.label}`, async ({ page }) => {
        const row = { query, viewport: viewport.label, live: IS_LIVE, steps: {} };
        await page.setViewportSize({ width: viewport.width, height: 844 });

        const input = await openExploreSearch(page);
        await input.fill(query);
        await input.press('Enter');

        await expect(page.getByText(/목적지를 찾고 있습니다|Finding this place/i)).toHaveCount(0, {
          timeout: 120_000,
        }).catch(() => {});

        const onPlace = await page
          .waitForURL(/\/place\//, { timeout: 15_000 })
          .then(() => true)
          .catch(() => false);

        if (!onPlace) {
          const card = searchRow(page, query);
          const cardVisible = await card.isVisible().catch(() => false);
          row.steps.searchCardVisible = cardVisible;
          if (cardVisible) {
            await card.click();
            await page.waitForURL(/\/place\//, { timeout: 90_000 }).catch(() => {});
          }
        }

        const href = page.url();
        row.steps.finalUrl = href;
        row.steps.seoulMisroute = /\/place\/seoul(?:\/|$|\?)/.test(href);
        row.steps.isSearchCoord = /\/place\/search-/.test(href);
        row.steps.isTour = /\/place\/tour-\d+/.test(href);

        if (/\/place\//.test(href)) {
          await waitPlaceShell(page);
          await page.getByRole('button', { name: /갤러리|Gallery/i }).first().click().catch(() => {});
          const visitCopy = await page
            .getByText(/유네스코|조선 왕릉|관람|입장/)
            .first()
            .isAttached()
            .catch(() => false);
          row.steps.visitCopyVisible = visitCopy;
          await shot(page, `${query}-${viewport.label}-detail.png`, viewport.width);
          await page.reload({ waitUntil: 'domcontentloaded' });
          await waitPlaceShell(page);
          row.steps.afterReloadUrl = page.url();
          row.steps.reloadSeoulMisroute = /\/place\/seoul(?:\/|$|\?)/.test(page.url());
          await shot(page, `${query}-${viewport.label}-reload.png`, viewport.width);
        } else {
          await shot(page, `${query}-${viewport.label}-explore.png`, viewport.width);
        }

        row.pass =
          !row.steps.seoulMisroute &&
          !row.steps.reloadSeoulMisroute &&
          (row.steps.visitCopyVisible !== false || query === '왕릉');
        checklist.push(row);

        if (query.includes('관리소') || query === '조선왕릉') {
          expect(row.steps.seoulMisroute, href).toBe(false);
        }
      });
    }
  }
});
