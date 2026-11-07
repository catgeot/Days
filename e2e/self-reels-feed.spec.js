import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const FIXTURE_MP4 = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/self-reels-fixture.mp4'),
);

const ARTIFACT_DIR = '/opt/cursor/artifacts/self-reels-session3';

async function stubFixtureVideos(page) {
  await page.route('https://fixture.invalid/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'video/mp4',
      body: FIXTURE_MP4,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  });
}

async function readPlayback(page) {
  return page.evaluate(() => {
    const feed = document.querySelector('[data-self-reels-feed="1"]');
    const nodes = [...document.querySelectorAll('video[data-reel-video]')];
    const playingIndexes = nodes
      .map((node, index) => ({ index, paused: node.paused, id: node.getAttribute('data-reel-video') }))
      .filter((row) => !row.paused)
      .map((row) => row.index);
    return {
      activeAttr: feed?.getAttribute('data-active-index') ?? null,
      mutedAttr: feed?.getAttribute('data-feed-muted') ?? null,
      playingCount: playingIndexes.length,
      playingIndexes,
      muted: nodes.map((node) => node.muted),
      playsInline: nodes.map((node) => node.playsInline),
      paused: nodes.map((node) => node.paused),
    };
  });
}

async function scrollToReel(page, index) {
  await page.evaluate((target) => {
    const node = document.querySelector(`[data-reel-index="${target}"]`);
    if (node) node.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, index);
}

test.describe('self reels fixture feed', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('visibility, scroll round-trip, remute, hide, leave', async ({ page }) => {
    await stubFixtureVideos(page);
    await page.goto('/reels', { waitUntil: 'domcontentloaded' });

    const feed = page.locator('[data-self-reels-feed="1"]');
    await expect(feed).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('확인할 영상이 없어요.')).toHaveCount(0);
    await expect(page.getByText('fixture').first()).toBeVisible();

    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 20_000 }).toBe(1);
    let state = await readPlayback(page);
    expect(state.playingCount).toBe(1);
    expect(state.playingIndexes).toEqual([0]);
    expect(state.muted).toEqual([true, true]);
    expect(state.playsInline).toEqual([true, true]);
    expect(state.activeAttr).toBe('0');

    await page.locator('[data-reel-sound="fixture-allow"]').click();
    await expect.poll(async () => (await readPlayback(page)).muted[0]).toBe(false);

    await scrollToReel(page, 1);
    await expect.poll(async () => (await readPlayback(page)).playingIndexes, { timeout: 20_000 }).toEqual([1]);
    state = await readPlayback(page);
    expect(state.playingCount).toBe(1);
    expect(state.muted[1]).toBe(true);
    expect(state.mutedAttr).toBe('1');
    expect(state.activeAttr).toBe('1');

    await scrollToReel(page, 0);
    await expect.poll(async () => (await readPlayback(page)).playingIndexes, { timeout: 20_000 }).toEqual([0]);
    state = await readPlayback(page);
    expect(state.playingCount).toBe(1);
    expect(state.muted[0]).toBe(true);
    expect(state.mutedAttr).toBe('1');

    for (let i = 0; i < 4; i += 1) {
      await scrollToReel(page, i % 2);
      await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 10_000 }).toBe(1);
      state = await readPlayback(page);
      expect(state.playingCount).toBe(1);
      expect(state.playingIndexes.length).toBe(1);
    }

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 10_000 }).toBe(0);
    state = await readPlayback(page);
    expect(state.paused).toEqual([true, true]);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 10_000 }).toBe(1);

    await page.evaluate(() => {
      const root = document.querySelector('[data-self-reels-feed="1"]');
      if (!root) return;
      root.style.scrollSnapType = 'none';
      // Half-way: each full-height slide is ~50% visible (< 0.55 threshold).
      root.scrollTop = Math.round(root.clientHeight * 0.5);
      root.dispatchEvent(new Event('scroll'));
    });
    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 15_000 }).toBe(0);
    await expect.poll(async () => (await readPlayback(page)).activeAttr, { timeout: 15_000 }).toBe('');

    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-self-reels-feed="1"]')).toHaveCount(0);
  });

  test('fixture layout captures 390 and 1280', async ({ page }) => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    await stubFixtureVideos(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/reels', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-self-reels-feed="1"]')).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 20_000 }).toBe(1);
    const path390 = path.join(ARTIFACT_DIR, 'fixture-feed-390.png');
    await page.screenshot({
      path: path390,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/reels', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-self-reels-feed="1"]')).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 20_000 }).toBe(1);
    const path1280 = path.join(ARTIFACT_DIR, 'fixture-feed-1280.png');
    await page.screenshot({
      path: path1280,
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });

    expect(fs.existsSync(path390)).toBe(true);
    expect(fs.existsSync(path1280)).toBe(true);
  });
});
