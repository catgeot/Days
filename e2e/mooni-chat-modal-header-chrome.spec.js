import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { dismissMooniHintIfPresent } from './helpers.js';
import { installMooniGeminiMock } from './mooni-gemini-mock.js';

const ART_DIR =
  process.env.MOONI_CHAT_MODAL_CHROME_ART ||
  '/opt/cursor/artifacts/mooni-chat-modal-header-chrome';

const localPreview = (process.env.PLAYWRIGHT_BASE_URL || '').includes('127.0.0.1');
if (localPreview) {
  test.use({ ignoreHTTPSErrors: true });
}

function boxesOverlap(a, b, tolerance = 1) {
  return !(
    a.x + a.width <= b.x + tolerance ||
    b.x + b.width <= a.x + tolerance ||
    a.y + a.height <= b.y + tolerance ||
    b.y + b.height <= a.y + tolerance
  );
}

async function openSapporoMooni(page) {
  await page.goto('/place/sapporo?lang=ko', { waitUntil: 'domcontentloaded' });
  await dismissMooniHintIfPresent(page);
  await page.locator('.place-header-mooni-btn').first().click();
  await expect(page.getByTestId('mooni-chat-close')).toBeVisible({ timeout: 60_000 });
}

async function collectHeaderChromeBoxes(page, viewportWidth) {
  const close = page.getByTestId('mooni-chat-close');
  const mainHeader = page.getByTestId('mooni-chat-main-header');
  const planner = mainHeader.getByRole('button', { name: /플래너|여행 플래너 열기/i });
  const newChat =
    viewportWidth < 768
      ? mainHeader.getByTestId('mooni-chat-new')
      : page.locator('.hidden.md\\:flex').getByTestId('mooni-chat-new');
  const targets = {
    close,
    planner,
    newChat,
  };

  const boxes = {};
  for (const [key, locator] of Object.entries(targets)) {
    await expect(locator, `${key} visible`).toBeVisible({ timeout: 30_000 });
    const box = await locator.boundingBox();
    expect(box, `${key} bounding box`).toBeTruthy();
    boxes[key] = box;
  }
  return boxes;
}

function assertCloseDoesNotOverlapActions(boxes) {
  for (const key of ['planner', 'newChat']) {
    expect(
      boxesOverlap(boxes.close, boxes[key]),
      `close overlaps ${key}: ${JSON.stringify({ close: boxes.close, [key]: boxes[key] })}`,
    ).toBe(false);
    expect(
      boxes[key].x + boxes[key].width <= boxes.close.x + 1,
      `${key} must sit left of close: ${JSON.stringify({ close: boxes.close, [key]: boxes[key] })}`,
    ).toBe(true);
  }
}

for (const viewport of [
  { width: 390, height: 844, label: '390' },
  { width: 1280, height: 900, label: '1280' },
]) {
  test.describe(`MOONi chat modal header chrome @${viewport.label}`, () => {
    test.beforeAll(() => {
      mkdirSync(ART_DIR, { recursive: true });
    });

    test(`sapporo — close, planner, new chat layout (${viewport.label})`, async ({ page, context }) => {
      await installMooniGeminiMock(context);
      await page.setViewportSize(viewport);
      await openSapporoMooni(page);

      const boxes = await collectHeaderChromeBoxes(page, viewport.width);
      assertCloseDoesNotOverlapActions(boxes);

      await page.screenshot({
        path: join(ART_DIR, `sapporo-mooni-header-${viewport.label}.png`),
        clip: { x: 0, y: 0, width: viewport.width, height: Math.min(320, viewport.height) },
      });

      const input = page.getByRole('textbox', {
        name: /메시지 입력|직접 입력|Type a message|Type directly/i,
      });
      const marker = `E2E_HEADER_CHROME_${viewport.label}`;
      await input.fill(marker);
      await input.press('Enter');
      await expect(page.getByText(marker)).toBeVisible({ timeout: 90_000 });

      const newChatBtn =
        viewport.width < 768
          ? page.getByTestId('mooni-chat-main-header').getByTestId('mooni-chat-new')
          : page.locator('.hidden.md\\:flex').getByTestId('mooni-chat-new');
      await newChatBtn.click();
      await expect(page.getByText(marker)).toHaveCount(0, { timeout: 15_000 });

      await page
        .getByTestId('mooni-chat-main-header')
        .getByRole('button', { name: /플래너|여행 플래너 열기/i })
        .click();
      await expect(page.getByTestId('mooni-chat-close')).toBeHidden({ timeout: 30_000 });
      await expect(page).toHaveURL(/\/place\/sapporo\/planner/);
    });
  });
}