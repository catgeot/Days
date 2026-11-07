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

async function assertControlsFullyVisible(page, reelId) {
  const sound = page.locator(`[data-reel-sound="${reelId}"]`);
  const credit = page.locator(`[data-reel-credit="${reelId}"]`);
  await expect(sound).toBeVisible();
  await expect(credit).toBeVisible();

  const box = await sound.boundingBox();
  expect(box).toBeTruthy();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);

  const creditBox = await credit.boundingBox();
  expect(creditBox).toBeTruthy();
  expect(creditBox.y + creditBox.height).toBeLessThanOrEqual(viewport.height + 0.5);

  await expect(sound).toBeEnabled();
  await sound.click();
}

async function assertNoOverlappingChrome(page) {
  // Real shared footer (TrustLinkBar) — must stay hidden on /reels only.
  await expect(page.getByLabel('GATEO 약관 및 출처')).toHaveCount(0);
  // DEV/PreviewDebugChrome only — production-like vite preview must omit these.
  await expect(page.getByText('모바일 위젯 로그')).toHaveCount(0);
  await expect(page.getByText('작업 로그')).toHaveCount(0);
  await expect(page.locator('[data-cloud-preview-work-log]')).toHaveCount(0);
  await expect(page.locator('[data-flight-debug-panel]')).toHaveCount(0);
}

/** object-contain: full intrinsic frame fits inside the stage (no cover crop). */
async function assertNineSixteenContained(page, reelId) {
  await expect.poll(async () => {
    return page.evaluate((id) => {
      const video = document.querySelector(`[data-reel-video="${id}"]`);
      return video && video.videoWidth > 0 ? video.videoWidth : 0;
    }, reelId);
  }, { timeout: 20_000 }).toBeGreaterThan(0);

  const info = await page.evaluate((id) => {
    const video = document.querySelector(`[data-reel-video="${id}"]`);
    const stage = document.querySelector(`[data-reel-stage="${id}"]`);
    const controls = document.querySelector(`[data-reel-controls="${id}"]`);
    if (!video || !stage) return null;
    const style = getComputedStyle(video);
    const sb = stage.getBoundingClientRect();
    const cb = controls?.getBoundingClientRect() ?? null;
    const contentAspect = video.videoWidth / video.videoHeight;
    const stageAspect = sb.width / sb.height;
    let paintW;
    let paintH;
    if (stageAspect > contentAspect) {
      paintH = sb.height;
      paintW = paintH * contentAspect;
    } else {
      paintW = sb.width;
      paintH = paintW / contentAspect;
    }
    return {
      objectFit: style.objectFit,
      stageW: sb.width,
      stageH: sb.height,
      paintW,
      paintH,
      contentAspect,
      sideLetterbox: stageAspect > contentAspect + 0.02,
      topLetterbox: stageAspect < contentAspect - 0.02,
      controlsBelowStage: cb ? cb.y >= sb.y + sb.height - 1 : false,
    };
  }, reelId);

  expect(info).toBeTruthy();
  expect(info.objectFit).toBe('contain');
  expect(info.paintW).toBeLessThanOrEqual(info.stageW + 1);
  expect(info.paintH).toBeLessThanOrEqual(info.stageH + 1);
  expect(info.controlsBelowStage).toBe(true);
  // Painted frame uses the full intrinsic aspect (within float tolerance).
  expect(Math.abs(info.paintW / info.paintH - info.contentAspect)).toBeLessThan(0.02);
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
    await assertNoOverlappingChrome(page);

    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 20_000 }).toBe(1);
    let state = await readPlayback(page);
    expect(state.playingCount).toBe(1);
    expect(state.playingIndexes).toEqual([0]);
    expect(state.muted).toEqual([true, true]);
    expect(state.playsInline).toEqual([true, true]);
    expect(state.activeAttr).toBe('0');

    await assertControlsFullyVisible(page, 'fixture-allow');
    await expect.poll(async () => (await readPlayback(page)).muted[0]).toBe(false);

    await scrollToReel(page, 1);
    await expect.poll(async () => (await readPlayback(page)).playingIndexes, { timeout: 20_000 }).toEqual([1]);
    state = await readPlayback(page);
    expect(state.playingCount).toBe(1);
    expect(state.muted[1]).toBe(true);
    expect(state.mutedAttr).toBe('1');
    expect(state.activeAttr).toBe('1');
    await assertControlsFullyVisible(page, 'fixture-second');

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
    // Other pages keep the shared TrustLinkBar (reels-only hide).
    await expect(page.getByLabel('GATEO 약관 및 출처')).toBeVisible({ timeout: 15_000 });
  });

  test('fixture layout captures 390 and 1280', async ({ page }) => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    await stubFixtureVideos(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/reels', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-self-reels-feed="1"]')).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 20_000 }).toBe(1);
    await assertNoOverlappingChrome(page);
    await assertNineSixteenContained(page, 'fixture-allow');
    await assertControlsFullyVisible(page, 'fixture-allow');
    // Remute for a clean capture (controls assert toggled sound on).
    await page.locator('[data-reel-sound="fixture-allow"]').click();
    await expect.poll(async () => (await readPlayback(page)).muted[0]).toBe(true);
    const path390 = path.join(ARTIFACT_DIR, 'fixture-feed-390.png');
    await page.screenshot({
      path: path390,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/reels', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-self-reels-feed="1"]')).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await readPlayback(page)).playingCount, { timeout: 20_000 }).toBe(1);
    await assertNoOverlappingChrome(page);
    await assertNineSixteenContained(page, 'fixture-allow');
    const wide = await page.evaluate(() => {
      const stage = document.querySelector('[data-reel-stage="fixture-allow"]');
      const video = document.querySelector('[data-reel-video="fixture-allow"]');
      if (!stage || !video || !video.videoHeight) return null;
      const sb = stage.getBoundingClientRect();
      return sb.width / sb.height > video.videoWidth / video.videoHeight + 0.02;
    });
    expect(wide).toBe(true);
    await assertControlsFullyVisible(page, 'fixture-allow');
    await page.locator('[data-reel-sound="fixture-allow"]').click();
    await expect.poll(async () => (await readPlayback(page)).muted[0]).toBe(true);
    const path1280 = path.join(ARTIFACT_DIR, 'fixture-feed-1280.png');
    await page.screenshot({
      path: path1280,
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });

    expect(fs.existsSync(path390)).toBe(true);
    expect(fs.existsSync(path1280)).toBe(true);
  });
});
