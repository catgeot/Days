/**
 * 아이슬란드 숙소 — LIVE Edge(모의 아님) · 로컬 vite preview 전용.
 *
 *   npm run build
 *   DEV_SSL=0 npx vite preview --host 127.0.0.1 --port 5199
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5199 npx playwright test e2e/stay-card-image-link-iceland-live.spec.js
 *
 * PROD(www.gateo.kr) 아님 — Preview head 빌드만.
 */
import { test, expect } from '@playwright/test';

/** 390 캡처와 동일한 상위 노출 숙소(이름 부분 일치) */
const ICELAND_TOP_CARD_NEEDLES = ['KEX', '레지던스', '스쿠기', '버스 호스텔'];

async function openIcelandStayListMobile(page) {
  await page.goto('/place/iceland?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '아이슬란드' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
  await expect(page.getByRole('button', { name: '숙소 찾기' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '숙소 찾기' }).first().click();
  await expect(page.getByRole('dialog', { name: '숙소 전체 목록' })).toBeVisible({
    timeout: 90_000,
  });
  const dialog = page.getByRole('dialog', { name: '숙소 전체 목록' });
  await expect(dialog.locator('a[data-partner-booking-handoff="cta"]').first()).toBeVisible({
    timeout: 120_000,
  });
  return dialog;
}

async function openIcelandStayListDesktop(page, logLines = []) {
  page.on('response', (res) => {
    if (res.request().method() !== 'POST') return;
    if (!/\/fetch-mrt-stays/i.test(res.url())) return;
    logLines.push(`edgeHttpStatus=${res.status()}`);
  });

  await page.goto('/place/iceland?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '아이슬란드' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
  await page.getByRole('button', { name: '숙소 찾기' }).first().click();
  await expect(page.getByRole('region', { name: '숙소 목록' })).toBeVisible({
    timeout: 90_000,
  });
  const region = page.getByRole('region', { name: '숙소 목록' });
  await expect(region.getByText('숙소를 불러오는 중')).toHaveCount(0, { timeout: 120_000 });
  await expect(region.locator('a[data-partner-booking-handoff="cta"]').first()).toBeVisible({
    timeout: 30_000,
  });
  return region;
}

/**
 * @returns {Promise<{ status: string, naturalWidth?: number, naturalHeight?: number }>}
 */
async function waitTargetCardPhoto(scope, page, needle, timeoutMs = 60_000) {
  const link = scope
    .locator('a[data-partner-booking-handoff="cta"]')
    .filter({ hasText: needle })
    .first();
  await expect(link).toBeVisible({ timeout: 30_000 });
  await link.scrollIntoViewIfNeeded();

  const img = link.locator('img[src*="cloudfront.net"]');
  const noImage = link.getByText('No image', { exact: true });
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await noImage.isVisible().catch(() => false)) {
      return { status: 'no_image_field' };
    }
    if ((await img.count()) === 0) {
      await page.waitForTimeout(250);
      continue;
    }
    const imgEl = img.first();
    await imgEl.evaluate((node) => {
      if (node.loading === 'lazy') node.loading = 'eager';
    });
    const loadOutcome = await imgEl
      .evaluate(
        (node) =>
          new Promise((resolve) => {
            if (node.naturalWidth > 0 && node.naturalHeight > 0) {
              resolve('already');
              return;
            }
            const done = (status) => {
              node.removeEventListener('load', onLoad);
              node.removeEventListener('error', onError);
              resolve(status);
            };
            const onLoad = () => done('load');
            const onError = () => done('error');
            node.addEventListener('load', onLoad, { once: true });
            node.addEventListener('error', onError, { once: true });
            setTimeout(() => done('pending'), 500);
          }),
      )
      .catch(() => 'pending');
    if (loadOutcome === 'error') {
      return { status: 'failed_broken' };
    }
    const meta = await imgEl.evaluate((node) => ({
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      complete: node.complete,
    }));
    if (meta.naturalWidth > 0 && meta.naturalHeight > 0) {
      return {
        status: 'loaded',
        naturalWidth: meta.naturalWidth,
        naturalHeight: meta.naturalHeight,
      };
    }
    if (meta.complete && meta.naturalWidth === 0 && loadOutcome !== 'pending') {
      return { status: 'failed_broken' };
    }
    await page.waitForTimeout(300);
  }
  return { status: 'timeout_waiting' };
}

async function assertLiveStayCards(scope, logLines) {
  await expect(scope.locator('[data-stay-list-partner-notice]')).toHaveCount(1);
  await expect(scope.getByText('호텔 보고 예약 시작', { exact: true })).toHaveCount(0);

  const cardLinks = scope.locator('a[data-partner-booking-handoff="cta"]');
  const count = await cardLinks.count();
  expect(count).toBeGreaterThanOrEqual(2);
  logLines.push(`cardLinks=${count}`);

  const firstHref = await cardLinks.first().getAttribute('href');
  expect(firstHref).toMatch(/accommodation\.myrealtrip\.com\/union\/products\/\d+/);
  expect(firstHref).toMatch(/mylink_id=/);
  logLines.push(`firstHrefProduct=${firstHref?.match(/products\/(\d+)/)?.[1] ?? '?'}`);

  await expect(cardLinks.first()).toHaveAttribute('rel', /noopener/);
  await expect(cardLinks.first()).toHaveAttribute('rel', /sponsored/);

  const firstLabel = await cardLinks.first().getAttribute('aria-label');
  expect(firstLabel).toMatch(/호텔 보고 예약 시작|숙소 보고 예약 시작/);
  expect(firstLabel?.length ?? 0).toBeGreaterThan('호텔 보고 예약 시작'.length);
  logLines.push(`firstAriaLabelLen=${firstLabel?.length ?? 0}`);

  const imgs = scope.locator('img[src*="cloudfront.net"]');
  await expect(imgs.first()).toBeVisible({ timeout: 30_000 });
  const imgMeta = await imgs.first().evaluate((img) => ({
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    complete: img.complete,
  }));
  expect(imgMeta.complete).toBe(true);
  expect(imgMeta.naturalWidth).toBeGreaterThan(0);
  expect(imgMeta.naturalHeight).toBeGreaterThan(0);
  logLines.push(`firstImageNatural=${imgMeta.naturalWidth}x${imgMeta.naturalHeight}`);

  const imageBox = await scope
    .locator('a[data-partner-booking-handoff="cta"]')
    .first()
    .locator('div.relative')
    .first()
    .boundingBox();
  if (imageBox) {
    logLines.push(`firstCardImageBoxHeightPx=${Math.round(imageBox.height)}`);
  }
}

test.describe('Iceland stay list — LIVE preview (not PROD)', () => {
  test('390 — LIVE cards · no visible CTA · capture', async ({ page }) => {
    const logLines = ['surface=preview', 'place=iceland', 'viewport=390', 'data=LIVE_edge'];
    await page.setViewportSize({ width: 390, height: 844 });
    const dialog = await openIcelandStayListMobile(page);
    await assertLiveStayCards(dialog, logLines);

    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-card-image-link-iceland-live-390.png',
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    await import('node:fs/promises').then((fs) =>
      fs.writeFile(
        '/opt/cursor/artifacts/evidence-stay-card-image-link-iceland-live.log',
        `${logLines.join('\n')}\n`,
        'utf8',
      ),
    );
  });

  test('1280 — LIVE top cards photos · capture', async ({ page }) => {
    test.setTimeout(180_000);
    const logLines = ['surface=preview', 'place=iceland', 'viewport=1280', 'data=LIVE_edge'];
    try {
    await page.setViewportSize({ width: 1280, height: 900 });
    const region = await openIcelandStayListDesktop(page, logLines);
    await expect(region.getByText('호텔 보고 예약 시작', { exact: true })).toHaveCount(0);

    for (const needle of ICELAND_TOP_CARD_NEEDLES) {
      const result = await waitTargetCardPhoto(region, page, needle);
      logLines.push(
        `topCard:${needle}:status=${result.status}` +
          (result.naturalWidth
            ? `:natural=${result.naturalWidth}x${result.naturalHeight}`
            : ''),
      );
      expect(
        result.status,
        `1280 상위 카드 "${needle}" 이미지 — ${result.status}(timeout_waiting=대기 초과, failed_broken=로드 실패)`,
      ).toBe('loaded');
    }

    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-card-image-link-iceland-live-1280.png',
      clip: { x: 0, y: 0, width: 1280, height: 900 },
    });

    await import('node:fs/promises').then((fs) =>
      fs.writeFile(
        '/opt/cursor/artifacts/evidence-stay-card-image-link-iceland-live-1280.log',
        `${logLines.join('\n')}\n`,
        'utf8',
      ),
    );
    } catch (err) {
      logLines.push(`outcome=FAIL:${err.message?.slice(0, 120) || 'unknown'}`);
      await import('node:fs/promises').then((fs) =>
        fs.writeFile(
          '/opt/cursor/artifacts/evidence-stay-card-image-link-iceland-live-1280.log',
          `${logLines.join('\n')}\n`,
          'utf8',
        ),
      );
      throw err;
    }
  });
});
