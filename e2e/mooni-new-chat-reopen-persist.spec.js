import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { dismissMooniHintIfPresent } from './helpers.js';

const ART_DIR =
  process.env.MOONI_NEW_CHAT_REOPEN_SCREENSHOT_DIR ||
  process.env.MOONI_SCREENSHOT_DIR ||
  join(process.cwd(), 'artifacts/screenshots/mooni-new-chat-reopen');

async function installShortGeminiMock(context) {
  const { buildGeminiProxyMockBody } = await import('./gemini-proxy-mock-response.js');
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody('MOONi E2E persist reply (mock)', {
          modelUsed: 'mock-e2e-new-chat-reopen',
        }),
      ),
    });
  });
}

async function openParisPlannerMooni(page) {
  await page.goto('/place/paris/planner?lang=ko');
  await dismissMooniHintIfPresent(page);
  await page.locator('.place-header-mooni-btn').first().click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 30_000 });
}

async function openHomeMooni(page) {
  await page.goto('/?lang=ko');
  await dismissMooniHintIfPresent(page);
  await page.getByTestId('mooni-fab-open').click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 30_000 });
}

async function sendMooniMessage(page, text) {
  const input = page.getByRole('textbox', {
    name: /메시지 입력|직접 입력|Type a message|Type directly/i,
  });
  await input.fill(text);
  await input.press('Enter');
}

async function clickNewChat(page) {
  await page.locator('[data-testid="mooni-chat-new"]:visible').first().click();
}

async function closeMooni(page) {
  await page.getByLabel(/채팅 닫기|Close chat/i).click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeHidden({ timeout: 15_000 });
}

async function clipViewport(page, name, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.waitForTimeout(350);
  await page.screenshot({
    path: `${ART_DIR}/${name}`,
    clip: { x: 0, y: 0, width, height: Math.min(844, width === 390 ? 844 : 900) },
  });
}

/** sessionStorage/localStorage mock 없음 — Playwright 기본 persist 컨텍스트 */
async function assertDraftLastIdInStorage(page, scopeSuffix) {
  const hasDraft = await page.evaluate((suffix) => {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      keys.push(sessionStorage.key(i));
    }
    const scoped = keys.find((k) => k.includes(suffix));
    if (!scoped) return false;
    const raw = sessionStorage.getItem(scoped);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return String(parsed.id || '').startsWith('draft_');
    } catch {
      return String(raw).startsWith('draft_');
    }
  }, scopeSuffix);
  expect(hasDraft).toBe(true);
}

test.describe('MOONi «새 대화» close/reopen persist', () => {
  test.beforeAll(() => {
    mkdirSync(ART_DIR, { recursive: true });
  });

  test('Paris + home: new chat → close → reopen keeps empty thread', async ({ page, context }) => {
    await installShortGeminiMock(context);

    const parisMarker = `E2E_PARIS_PERSIST_${Date.now()}`;
    await openParisPlannerMooni(page);
    await sendMooniMessage(page, parisMarker);
    await expect(page.getByText(parisMarker)).toBeVisible({ timeout: 45_000 });

    await clickNewChat(page);
    await expect(page.getByText(parisMarker)).toBeHidden({ timeout: 10_000 });
    await assertDraftLastIdInStorage(page, 'place:paris');

    await closeMooni(page);
    await openParisPlannerMooni(page);
    await expect(page.getByText(parisMarker)).toBeHidden({ timeout: 15_000 });

    await clipViewport(page, 'mooni-paris-reopen-empty-390.png', 390);
    await clipViewport(page, 'mooni-paris-reopen-empty-1280.png', 1280);

    await closeMooni(page);

    const homeMarker = `E2E_HOME_PERSIST_${Date.now()}`;
    await openHomeMooni(page);
    await sendMooniMessage(page, homeMarker);
    await expect(page.getByText(homeMarker)).toBeVisible({ timeout: 45_000 });

    await clickNewChat(page);
    await expect(page.getByText(homeMarker)).toBeHidden({ timeout: 10_000 });
    await assertDraftLastIdInStorage(page, ':general');

    await closeMooni(page);
    await openHomeMooni(page);
    await expect(page.getByText(homeMarker)).toBeHidden({ timeout: 15_000 });
  });
});
