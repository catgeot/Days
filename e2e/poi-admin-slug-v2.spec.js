// 검색 드롭다운 → 카드 URL. 스테이징 TourAPI. prod 호스트 금지.
import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = process.env.POI_SHOT_DIR || '/opt/cursor/artifacts/slug-poi-390-v2';
const PREFIX = process.env.POI_SHOT_PREFIX || 'branch';
const ASSERT_CONTENT = process.env.POI_ASSERT_CONTENT !== '0';
const ASSERT_SLUG = process.env.POI_ASSERT_SLUG !== '0';
const PROD_HOSTS = new Set(['gateo.kr', 'www.gateo.kr']);
const PROD_SUPABASE = 'phdjnbfitvmrguqzverm';
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
    query: '운계폭포',
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
  if (PROD_HOSTS.has(host)) throw new Error(`refusing production host ${host}`);
}

async function stampHref(page) {
  await page.evaluate(() => {
    const id = 'qa-href-overlay';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'z-index:2147483647',
        'background:#111',
        'color:#fff',
        'font:12px/1.35 ui-monospace,monospace',
        'padding:6px 8px',
        'word-break:break-all',
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = location.href;
  });
}

async function openHomeSearch(page) {
  const search = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations|Search on 3D globe/i })
    .first();
  let opened = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto('/', { waitUntil: 'commit', timeout: 30_000 });
    try {
      await expect(search).toBeVisible({ timeout: 20_000 });
      opened = true;
      break;
    } catch {
      /* first paint can miss the module graph */
    }
  }
  expect(opened, 'home search button').toBe(true);
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible();
  return input;
}

async function openFullPlaceCard(page) {
  if (/\/place\//.test(page.url())) return;
  const more = page.getByRole('button', { name: /^더보기$/ }).first();
  await expect(more).toBeVisible({ timeout: 20_000 });
  await more.click();
  await page.waitForURL(/\/place\//, { timeout: 30_000 });
}

test.describe('POI search evidence', () => {
  test.beforeEach(async ({ baseURL }) => {
    assertPreviewHost(baseURL || 'http://127.0.0.1:5173');
    await mkdir(OUT_DIR, { recursive: true });
  });

  for (const place of PLACES) {
    test(`${place.name} dropdown and card`, async ({ page }) => {
      const writes = [];
      page.on('request', (request) => {
        if (request.url().includes(PROD_SUPABASE)) {
          throw new Error(`prod supabase request ${request.url().split('?')[0]}`);
        }
      });
      page.on('response', (response) => {
        if (!WRITE_RPC.test(response.url())) return;
        writes.push({ url: response.url(), status: response.status() });
      });

      const input = await openHomeSearch(page);
      await input.click();
      await input.fill('');
      await input.type(place.query, { delay: 30 });
      const row = page
        .locator('button')
        .filter({ has: page.getByText(place.name, { exact: true }) })
        .filter({ hasNotText: 'MOONi' })
        .first();
      await expect(row).toBeVisible({ timeout: 35_000 });
      await page.screenshot({ path: join(OUT_DIR, `${PREFIX}-${place.file}-dropdown.png`) });
      await row.click();

      await expect(page).not.toHaveURL(/\/explore/, { timeout: 45_000 });
      await openFullPlaceCard(page);

      const path = decodeURIComponent(new URL(page.url()).pathname);
      if (ASSERT_SLUG && place.expectSlug) {
        expect(path).toMatch(new RegExp(`/place/${place.expectSlug}(?:/|$)`));
      }
      if (ASSERT_SLUG && place.forbidSlug) {
        expect(path).not.toMatch(new RegExp(`/place/${place.forbidSlug}(?:/|$)`));
        expect(path.replace(/\s+/g, '')).toContain(place.name.replace(/\s+/g, ''));
      }

      const scroller = page.locator('.custom-scrollbar-blue').first();
      await expect(scroller).toBeAttached({ timeout: 20_000 });
      await scroller.evaluate((el) => {
        el.scrollTop = 0;
      });

      if (ASSERT_CONTENT) {
        await expect(page.getByText('대한민국').first()).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText('SOUTH KOREA')).toHaveCount(0);
        await expect(page.locator('img[src*="visitkorea"], img[src*="tong.visitkorea"]').first()).toBeVisible({
          timeout: 40_000,
        });
        await expect(page.getByText('등록된 이미지가 없습니다')).toHaveCount(0);
      }

      await stampHref(page);
      await appendFile(
        join(OUT_DIR, 'urls.txt'),
        `${PREFIX}\t${place.file}\t${page.url()}\n`,
      );
      await page.screenshot({ path: join(OUT_DIR, `${PREFIX}-${place.file}-card.png`) });

      for (const write of writes) {
        expect(write.status, write.url).not.toBeLessThan(400);
      }
    });
  }

  test('old shared /place/pyeongchang still opens', async ({ page }) => {
    test.skip(process.env.POI_OLD_LINK !== '1', 'branch capture only');
    page.on('request', (request) => {
      if (request.url().includes(PROD_SUPABASE)) {
        throw new Error('prod supabase request');
      }
    });
    await page.goto('/place/pyeongchang', { waitUntil: 'commit', timeout: 30_000 });
    await expect(page.getByText('평창', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    const path = decodeURIComponent(new URL(page.url()).pathname);
    expect(path).toMatch(/\/place\/pyeongchang(?:\/|$)/);
    await stampHref(page);
    await appendFile(join(OUT_DIR, 'urls.txt'), `${PREFIX}\told-link\t${page.url()}\n`);
    await page.screenshot({ path: join(OUT_DIR, `${PREFIX}-old-pyeongchang-link.png`) });
  });
});
