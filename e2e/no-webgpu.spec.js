// Home must render Mapbox globe when WebGPU is unavailable (three/webgpu not in eager vendor).
import { test, expect, devices } from '@playwright/test';

test.use({ ignoreHTTPSErrors: true });

const GPU_ERROR_RE = /GPUShaderStage|can't access property "VERTEX"/i;

async function expectHomeMapVisible(page) {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.locator('.mapboxgl-map').first()).toBeVisible({ timeout: 90_000 });
}

test.describe('Home without WebGPU', () => {
  test('Firefox — mapbox map visible, no GPUShaderStage error', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['Desktop Firefox'] });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await expectHomeMapVisible(page);

    const gpuErrors = pageErrors.filter((m) => GPU_ERROR_RE.test(m));
    expect(gpuErrors, gpuErrors.join('\n')).toEqual([]);

    await context.close();
  });

  test('Chromium — GPUShaderStage stripped, mapbox map visible', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['Desktop Chrome'] });
    await context.addInitScript(() => {
      delete self.GPUShaderStage;
      delete navigator.gpu;
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await expectHomeMapVisible(page);

    const gpuErrors = pageErrors.filter((m) => GPU_ERROR_RE.test(m));
    expect(gpuErrors, gpuErrors.join('\n')).toEqual([]);

    await context.close();
  });

  test('/korea does not load three chunk', async ({ page }) => {
    const threeLoads = [];
    page.on('response', (res) => {
      const url = res.url();
      if (/three-[^/]+\.js/i.test(url)) threeLoads.push(url);
    });

    await page.goto('/korea');
    await expect(page.locator('#root')).toBeVisible({ timeout: 60_000 });

    expect(threeLoads, threeLoads.join('\n')).toEqual([]);
  });
});
