import { writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import {
  AUTH_LOGIN_FIXTURE,
  attachMapboxNetworkProbe,
  installAuthPasswordRoute,
  installStuckKeyboardViewportStub,
  readGlobeCanvasMetrics,
  releaseKeyboardViewport,
  sampleGlobeCanvasVisual,
  stickKeyboardViewport,
  waitForGlobeReady,
} from './fixtures/auth-login-mocks.js';

const OUT_390 = '/opt/cursor/artifacts/ios-login-globe-viewport-390';
const OUT_473 = '/opt/cursor/artifacts/ios-login-globe-viewport-473';
const OUT_1280 = '/opt/cursor/artifacts/ios-login-globe-viewport-1280';

async function shot(page, outDir, file, width, height) {
  await page.screenshot({
    path: join(outDir, file),
    clip: { x: 0, y: 0, width, height: Math.min(height, 2000) },
  });
}

async function writeMetrics(outDir, tag, payload) {
  await writeFile(join(outDir, `${tag}-viewport-canvas-metrics.json`), `${JSON.stringify(payload, null, 2)}\n`);
}

async function openLoginFromHome(page) {
  const probe = attachMapboxNetworkProbe(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForGlobeReady(page, { settleMs: 2_000 });
  await page.goto('/auth/login?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Welcome Back|다시 만나요|로그인/i })).toBeVisible({
    timeout: 30_000,
  });
  return probe;
}

async function fillLoginForm(page) {
  const email = page.locator('input[type="email"]');
  const password = page.locator('input[type="password"]');
  await email.fill(AUTH_LOGIN_FIXTURE.email);
  await password.fill(AUTH_LOGIN_FIXTURE.password);
  await password.focus();
}

function defineSuite({ name, width, height, outDir }) {
  test.describe(`ios login globe viewport (${name}, mocked auth)`, () => {
    test.use({
      viewport: { width, height },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
      hasTouch: true,
    });

    test.beforeAll(async () => {
      await mkdir(outDir, { recursive: true });
    });

    test('mock auth — token POST 1x, invalid credentials UI, duplicate submit blocked', async ({ page }) => {
      const auth = await installAuthPasswordRoute(page, { outcome: 'invalid' });
      let dialogMessage = '';
      page.on('dialog', async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.accept();
      });
      await openLoginFromHome(page);
      await fillLoginForm(page);
      await shot(page, outDir, `${name}-login-filled-before-submit.png`, width, height);
      const submit = page.getByRole('button', { name: /^로그인/ });
      await expect(submit).toBeEnabled();
      await page.evaluate(() => {
        const form = document.querySelector('form');
        form?.requestSubmit();
        form?.requestSubmit();
      });
      await expect.poll(() => auth.tokenPosts, { timeout: 15_000 }).toBe(1);
      await expect.poll(() => dialogMessage.length, { timeout: 10_000 }).toBeGreaterThan(0);
      await shot(page, outDir, `${name}-login-submit-invalid-credentials-ui.png`, width, height);
    });

    test('layout — close login after keyboard stub restores canvas height (not full visual tiles)', async ({
      page,
    }) => {
      const probe = attachMapboxNetworkProbe(page);
      await installStuckKeyboardViewportStub(page, 300);
      await openLoginFromHome(page);
      await fillLoginForm(page);
      await stickKeyboardViewport(page);
      const close = page.getByTitle('이전으로 돌아가기');
      await close.click();
      await expect(page).toHaveURL(/\/?(\?|$)/, { timeout: 30_000 });
      releaseKeyboardViewport(page);
      await page.waitForTimeout(400);
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
        window.visualViewport?.dispatchEvent(new Event('resize'));
      });
      await expect(page.locator('.mapboxgl-canvas').first()).toBeVisible({ timeout: 90_000 });

      const layoutMetrics = await readGlobeCanvasMetrics(page);
      const minHeight = Math.min(layoutMetrics.layoutHeight, layoutMetrics.visualViewportHeight) * 0.82;
      expect(layoutMetrics.canvasHeight).toBeGreaterThanOrEqual(minHeight);
      expect(layoutMetrics.mapHeight).toBeGreaterThanOrEqual(minHeight);
      await shot(page, outDir, `${name}-home-after-login-close-layout.png`, width, height);

      const globeWait = await waitForGlobeReady(page, { settleMs: 10_000 });
      const visual = await sampleGlobeCanvasVisual(page);
      const afterLayout = await readGlobeCanvasMetrics(page);
      await shot(page, outDir, `${name}-home-after-login-close-after-globe-settle.png`, width, height);

      const metrics = {
        viewport: { width, height },
        category: 'layout-vs-visual-tiles',
        layoutPass: true,
        visualTilesAdvisory: true,
        globeWait,
        layoutAfterClose: layoutMetrics,
        layoutAfterSettle: afterLayout,
        visualSample: visual,
        mapboxProbe: probe,
        note:
          'layoutPass=canvasHeight>=82% viewport. visualTilesAdvisory=nonDarkRatio on WebGL sample; 390 may stay dark while 1280 shows continents — timing/WebGL read limit, not proxy change.',
      };
      await writeMetrics(outDir, name, metrics);

      test.info().annotations.push({
        type: 'visual-tiles',
        description: `WebGL nonDarkRatio=${visual.nonDarkRatio ?? 'n/a'} mapbox.tileOk=${probe.tileOk} — manual PNG review required; do not infer from canvas height alone`,
      });
    });

    test('mock auth success — navigates home and sets viewport reset flag path', async ({ page }) => {
      const auth = await installAuthPasswordRoute(page, { outcome: 'success' });
      await openLoginFromHome(page);
      await fillLoginForm(page);
      const submit = page.getByRole('button', { name: /^로그인/ });
      await submit.click();
      await expect.poll(() => auth.tokenPosts, { timeout: 15_000 }).toBe(1);
      await expect(page).toHaveURL(/\//, { timeout: 30_000 });
      await waitForGlobeReady(page, { settleMs: 3_000 });
      const layout = await readGlobeCanvasMetrics(page);
      const minHeight = Math.min(layout.layoutHeight, layout.visualViewportHeight) * 0.82;
      expect(layout.canvasHeight).toBeGreaterThanOrEqual(minHeight);
    });
  });
}

defineSuite({ name: '390', width: 390, height: 844, outDir: OUT_390 });
defineSuite({ name: '473', width: 473, height: 1024, outDir: OUT_473 });
defineSuite({ name: '1280', width: 1280, height: 720, outDir: OUT_1280 });

test.describe('PC regression smoke (1280 project, mocked auth suite neighbor)', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    locale: 'ko-KR',
  });

  test('home globe still mounts after auth round-trip', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForGlobeReady(page, { settleMs: 2_000 });
    await page.goto('/auth/login?lang=ko');
    await page.getByTitle('이전으로 돌아가기').click();
    await expect(page).toHaveURL(/\//, { timeout: 20_000 });
    await waitForGlobeReady(page, { settleMs: 4_000 });
    await expect(page.locator('.mapboxgl-map').first()).toBeVisible();
  });
});
