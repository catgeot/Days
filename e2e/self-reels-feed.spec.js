import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const FIXTURE_MP4 = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/self-reels-fixture.mp4'),
);

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

test.describe('self reels fixture feed', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('one visible video plays muted with playsInline', async ({ page }) => {
    await stubFixtureVideos(page);
    await page.goto('/reels', { waitUntil: 'domcontentloaded' });

    const feed = page.locator('[data-self-reels-feed="1"]');
    await expect(feed).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('확인할 영상이 없어요.')).toHaveCount(0);

    const videos = page.locator('video[data-reel-video]');
    await expect(videos).toHaveCount(2);

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const nodes = [...document.querySelectorAll('video[data-reel-video]')];
            return {
              count: nodes.length,
              playing: nodes.filter((node) => !node.paused).length,
              muted: nodes.map((node) => node.muted),
              playsInline: nodes.map((node) => node.playsInline),
            };
          }),
        { timeout: 20_000 },
      )
      .toEqual({
        count: 2,
        playing: 1,
        muted: [true, true],
        playsInline: [true, true],
      });

    const sound = page.locator('[data-reel-sound="fixture-allow"]');
    await sound.click();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const active = document.querySelector('video[data-reel-video="fixture-allow"]');
          return active ? active.muted : null;
        }),
      )
      .toBe(false);

    const afterUnmute = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('video[data-reel-video]')];
      return {
        playing: nodes.filter((node) => !node.paused).length,
        mutedActive: document.querySelector('video[data-reel-video="fixture-allow"]')?.muted,
      };
    });
    expect(afterUnmute.playing).toBe(1);
    expect(afterUnmute.mutedActive).toBe(false);
  });
});
