// 옛 공유 링크 · 흥정계곡 갤러리 스크롤 · 감악산 빈 칸. 스테이징 TourAPI. prod 호스트 금지.
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = process.env.POI_SHOT_DIR || '/opt/cursor/artifacts/slug-poi-390-v3';
const PROD_HOSTS = new Set(['gateo.kr', 'www.gateo.kr']);
const PROD_SUPABASE = 'phdjnbfitvmrguqzverm';
const WRITE_RPC = /increment_place_stats|record_place_visit|save_place_chat_intro/;

const OLD_LINKS = [
  { slug: 'herbnara-farm', name: '흥정계곡', file: 'old-herbnara-farm' },
  { slug: 'woljeong-ri', name: '월정리해변', file: 'old-woljeong-ri' },
  { slug: 'seolma-ri', name: '감악산 운계폭포', file: 'old-seolma-ri' },
];

function assertPreviewHost(baseURL) {
  const host = new URL(baseURL).hostname;
  if (PROD_HOSTS.has(host)) throw new Error(`refusing production host ${host}`);
}

function watchProd(page, writes) {
  page.on('request', (request) => {
    if (request.url().includes(PROD_SUPABASE)) {
      throw new Error(`prod supabase request ${request.url().split('?')[0]}`);
    }
  });
  page.on('response', (response) => {
    if (!WRITE_RPC.test(response.url())) return;
    writes.push({ url: response.url(), status: response.status() });
  });
}

function assertWritesBlocked(writes) {
  for (const write of writes) {
    expect(write.status, write.url).not.toBeLessThan(400);
  }
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

async function scrollGalleryIntoView(page) {
  const scroller = page.locator('.custom-scrollbar-blue').first();
  await expect(scroller).toBeAttached({ timeout: 20_000 });
  const photo = page.locator('img[src*="visitkorea"], img[src*="tong.visitkorea"]').first();
  await expect(photo).toBeAttached({ timeout: 40_000 });
  await expect.poll(async () => photo.evaluate((img) => (
    img.complete && img.naturalWidth > 0 ? 1 : 0
  )), { timeout: 20_000 }).toBe(1);
  await photo.evaluate((img) => {
    const scroller = img.closest('.custom-scrollbar-blue');
    if (!scroller) {
      img.scrollIntoView({ block: 'center' });
      return;
    }
    const imgRect = img.getBoundingClientRect();
    const box = scroller.getBoundingClientRect();
    scroller.scrollTop += imgRect.top - box.top - 48;
  });
  await expect.poll(async () => photo.evaluate((img) => (
    img.complete && img.naturalWidth > 0 && getComputedStyle(img).opacity === '1' ? 1 : 0
  )), { timeout: 12_000 }).toBe(1);
}

async function readGalleryAudit(page) {
  return page.evaluate(() => {
    const tiles = [...document.querySelectorAll('.columns-2 > div')];
    const rows = tiles.map((tile, index) => {
      const img = tile.querySelector('img');
      const style = img ? getComputedStyle(img) : null;
      const border = getComputedStyle(tile).borderTopColor;
      const rect = tile.getBoundingClientRect();
      return {
        index,
        src: img?.currentSrc || img?.src || '',
        complete: Boolean(img?.complete),
        naturalWidth: img?.naturalWidth || 0,
        naturalHeight: img?.naturalHeight || 0,
        opacity: style ? Number(style.opacity) : null,
        x: Math.round(rect.x),
        clientWidth: Math.round(rect.width),
        clientHeight: Math.round(rect.height),
        border,
        pulse: Boolean(tile.querySelector('.animate-pulse')),
      };
    });
    const broken = rows.filter((row) => row.complete && row.naturalWidth === 0);
    const empty = rows.filter(
      (row) => row.clientHeight > 8 && (row.naturalWidth === 0 || row.opacity === 0),
    );
    const loadingChrome = Boolean(document.querySelector('[aria-busy="true"]'));
    return {
      tiles: rows.length,
      images: rows.filter((row) => row.naturalWidth > 0).length,
      broken: broken.length,
      empty: empty.length,
      loadingChrome,
      rows,
    };
  });
}

test.describe('POI legacy links and gallery', () => {
  test.beforeEach(async ({ baseURL }) => {
    assertPreviewHost(baseURL || 'http://127.0.0.1:5173');
    await mkdir(OUT_DIR, { recursive: true });
  });

  for (const link of OLD_LINKS) {
    test(`old /place/${link.slug} opens a card`, async ({ page }) => {
      const writes = [];
      watchProd(page, writes);
      await page.goto(`/place/${link.slug}`, { waitUntil: 'commit', timeout: 30_000 });
      await expect(page).not.toHaveURL(/^https?:\/\/[^/]+\/?$/, { timeout: 8_000 });
      await expect(page.getByText(link.name, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
      const path = decodeURIComponent(new URL(page.url()).pathname);
      expect(path).toMatch(new RegExp(`/place/${link.slug}(?:/|$)`));
      await expect(page.getByText('등록된 이미지가 없습니다')).toHaveCount(0);
      await stampHref(page);
      await appendFile(join(OUT_DIR, 'urls.txt'), `old\t${link.slug}\t${page.url()}\n`);
      await page.screenshot({ path: join(OUT_DIR, `${link.file}.png`) });
      assertWritesBlocked(writes);
    });
  }

  test('흥정계곡 gallery photos are on screen', async ({ page }) => {
    const writes = [];
    watchProd(page, writes);
    const input = await openHomeSearch(page);
    await input.fill('');
    await input.type('흥정계곡', { delay: 30 });
    const row = page
      .locator('button')
      .filter({ has: page.getByText('흥정계곡', { exact: true }) })
      .filter({ hasNotText: 'MOONi' })
      .first();
    await expect(row).toBeVisible({ timeout: 35_000 });
    await row.click();
    await expect(page).not.toHaveURL(/\/explore/, { timeout: 45_000 });
    await openFullPlaceCard(page);
    const path = decodeURIComponent(new URL(page.url()).pathname);
    expect(path).not.toMatch(/\/place\/pyeongchang(?:\/|$)/);
    await scrollGalleryIntoView(page);
    await stampHref(page);
    await appendFile(join(OUT_DIR, 'urls.txt'), `gallery\theungjeong\t${page.url()}\n`);
    await page.screenshot({ path: join(OUT_DIR, 'heungjeong-gallery.png') });
    assertWritesBlocked(writes);
  });

  test('감악산 운계폭포 gallery has no broken or empty cells', async ({ page }) => {
    const writes = [];
    watchProd(page, writes);
    const input = await openHomeSearch(page);
    await input.fill('');
    await input.type('운계폭포', { delay: 30 });
    const row = page
      .locator('button')
      .filter({ has: page.getByText('감악산 운계폭포', { exact: true }) })
      .filter({ hasNotText: 'MOONi' })
      .first();
    await expect(row).toBeVisible({ timeout: 35_000 });
    await row.click();
    await expect(page).not.toHaveURL(/\/explore/, { timeout: 45_000 });
    await openFullPlaceCard(page);
    await scrollGalleryIntoView(page);

    let audit = await readGalleryAudit(page);
    const started = Date.now();
    while (Date.now() - started < 12_000) {
      audit = await readGalleryAudit(page);
      const pending = audit.rows.some((row) => !row.complete);
      if (!audit.loadingChrome && !pending && audit.tiles > 0) break;
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(500);
    audit = await readGalleryAudit(page);
    await writeFile(join(OUT_DIR, 'gamaksan-gallery-audit.json'), JSON.stringify(audit, null, 2));
    await stampHref(page);
    await appendFile(
      join(OUT_DIR, 'urls.txt'),
      `gallery\tgamaksan\t${page.url()}\timages=${audit.images}\tbroken=${audit.broken}\tempty=${audit.empty}\n`,
    );
    await page.screenshot({ path: join(OUT_DIR, 'gamaksan-gallery.png') });
    const left = audit.rows.filter((row) => row.x < 160);
    const right = audit.rows.filter((row) => row.x >= 160);
    expect(audit.tiles, 'gallery tiles').toBeGreaterThan(0);
    expect(left.length, 'left column tiles').toBeGreaterThan(0);
    expect(right.length, 'right column tiles').toBeGreaterThan(0);
    expect(audit.broken, 'broken images').toBe(0);
    expect(audit.empty, 'empty cells').toBe(0);
    expect(audit.loadingChrome, 'still loading').toBe(false);
    assertWritesBlocked(writes);
  });
});
