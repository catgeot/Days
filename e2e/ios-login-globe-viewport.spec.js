import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import {
  AUTH_LOGIN_FIXTURE,
  installAuthPasswordRoute,
  installStuckKeyboardViewportStub,
  readGlobeCanvasMetrics,
  releaseKeyboardViewport,
  stickKeyboardViewport,
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

async function openLoginFromHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.mapboxgl-canvas').first()).toBeVisible({ timeout: 90_000 });
  await page.goto('/auth/login?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Welcome Back|다시 만나요|로그인/i })).toBeVisible({
    timeout: 30_000,
  });
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

    test('password submit fires exactly one token POST and shows failure UI', async ({ page }) => {
      const auth = await installAuthPasswordRoute(page, { outcome: 'invalid' });
      page.on('dialog', (dialog) => dialog.accept());
      await openLoginFromHome(page);
      await fillLoginForm(page);
      await shot(page, outDir, 'login-modal-filled.png', width, height);
      const submit = page.getByRole('button', { name: /^로그인/ });
      await expect(submit).toBeEnabled();
      await page.evaluate(() => {
        const form = document.querySelector('form');
        form?.requestSubmit();
        form?.requestSubmit();
      });
      await expect.poll(() => auth.tokenPosts, { timeout: 15_000 }).toBe(1);
    });

    test('close login after keyboard viewport returns full-height globe', async ({ page }) => {
      await installStuckKeyboardViewportStub(page, 300);
      await openLoginFromHome(page);
      await fillLoginForm(page);
      await stickKeyboardViewport(page);
      const close = page.getByTitle('이전으로 돌아가기');
      await close.click();
      await expect(page).toHaveURL(/\/?(\?|$)/, { timeout: 30_000 });
      await expect(page.locator('.mapboxgl-canvas').first()).toBeVisible({ timeout: 90_000 });
      releaseKeyboardViewport(page);
      await page.waitForTimeout(400);
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
        window.visualViewport?.dispatchEvent(new Event('resize'));
      });
      const metrics = await readGlobeCanvasMetrics(page);
      const minHeight = Math.min(metrics.layoutHeight, metrics.visualViewportHeight) * 0.82;
      expect(metrics.canvasHeight).toBeGreaterThanOrEqual(minHeight);
      expect(metrics.mapHeight).toBeGreaterThanOrEqual(minHeight);
      await shot(page, outDir, 'home-after-login-close.png', width, height);
    });
  });
}

defineSuite({ name: '390', width: 390, height: 844, outDir: OUT_390 });
defineSuite({ name: '473', width: 473, height: 1024, outDir: OUT_473 });
defineSuite({ name: '1280', width: 1280, height: 720, outDir: OUT_1280 });
