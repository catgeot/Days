/**
 * MOONi GBR — origin search, contrast mock, planner return (WebKit ko).
 * npx playwright test e2e/mooni-gbr-multifix.spec.js --project=webkit
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';
import { dismissMooniHintIfPresent } from './helpers.js';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';

const ARTIFACT = '/opt/cursor/artifacts/mooni-gbr-multifix';
const GBR_SLUG = 'great-barrier-reef';
const MOCK_MARKER = 'E2E-GBR-MULTIFIX-7c2a';

mkdirSync(ARTIFACT, { recursive: true });

function clipShot(page, name, width, height = width === 1280 ? 900 : 844) {
  return page.screenshot({
    path: join(ARTIFACT, name),
    clip: { x: 0, y: 0, width, height },
  });
}

async function clipShotBoth(page, baseName) {
  await clipShot(page, `${baseName}-390.png`, 390);
  await page.setViewportSize({ width: 1280, height: 900 });
  await clipShot(page, `${baseName}-1280.png`, 1280);
  await page.setViewportSize({ width: 390, height: 844 });
}

function contrastRatio(fg, bg) {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(fg);
  const l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function parseRgb(color) {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

async function sampleContrast(page, selector, label, samples) {
  const locator = page.locator(selector).first();
  if (!(await locator.isVisible({ timeout: 5_000 }).catch(() => false))) return;
  const ratio = await locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    const fg = cs.color;
    let node = el;
  let bg = cs.backgroundColor;
    while (node && (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
      node = node.parentElement;
      if (!node) break;
      bg = getComputedStyle(node).backgroundColor;
    }
    return { fg, bg };
  });
  const fg = parseRgb(ratio.fg);
  const bg = parseRgb(ratio.bg);
  if (fg && bg) {
    samples.push({ label, ratio: contrastRatio(fg, bg), fg: ratio.fg, bg: ratio.bg });
  }
}

async function sendMooniTurn(page, text) {
  const input = page.getByRole('textbox', {
    name: /메시지 입력|직접 입력|Type a message|Type directly/i,
  });
  await expect(input).toBeVisible({ timeout: 30_000 });
  await input.fill(text);
  const chatForm = input.locator('xpath=ancestor::form[1]');
  const sendButton = chatForm.getByRole('button', { name: /전송|Send/i });
  if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendButton.click();
  } else {
    await chatForm.locator('button[type="submit"]').click();
  }
}

async function openGbrMooni(page) {
  await page.goto(`/place/${GBR_SLUG}/gallery?lang=ko`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await dismissMooniHintIfPresent(page);
  const mooniBtn = page.locator('.place-header-mooni-btn').first();
  await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
  await mooniBtn.click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 60_000 });
}

function visibleQuickReplies(page) {
  return page.locator('[data-testid="mooni-quick-replies"]:visible').first();
}

async function openAccessOriginDock(page) {
  const dock = visibleQuickReplies(page);
  await expect(dock).toBeVisible({ timeout: 60_000 });
  const access = dock.getByRole('button', { name: /✈️\s*가는 방법/ });
  await access.click({ force: true });
  const expand = page.getByRole('button', { name: /출발지 검색 펼치기|Expand departure search/i });
  if (await expand.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await expand.click();
  }
  await expect(page.locator('input[aria-autocomplete="list"]').first()).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('MOONi GBR multifix', () => {
  test.setTimeout(300_000);

  test('origin search + contrast + planner return (mock)', async ({ page, context }) => {
    let mooniChatCalls = 0;
    await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      let task = '';
      try {
        task = route.request().postDataJSON()?.task ?? '';
      } catch {
        task = '';
      }
      if (task === 'mooni_chat') mooniChatCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          buildGeminiProxyMockBody(`${MOCK_MARKER} 그레이트 배리어 리프 항공 안내입니다.`),
        ),
      });
    });

    await openGbrMooni(page);

    await openAccessOriginDock(page);

    const input = page.locator('input[aria-autocomplete="list"]').first();
    await input.fill('춘천');
    const option = page.getByTestId('flight-origin-option').first();
    await expect(option).toContainText(/ICN/);
    await expect(option).toContainText(/서울/);
    await clipShotBoth(page, '01-chuncheon-suggest');

    await input.fill('서울');
    await expect(page.getByTestId('flight-origin-option').first()).toBeVisible();
    await clipShotBoth(page, '02-seoul-suggest');

    const samples = [];
    await sampleContrast(page, '[data-testid="flight-origin-option"]', 'origin-option', samples);
    await sampleContrast(page, 'input[aria-autocomplete="list"]', 'origin-input', samples);

    await page.getByRole('button', { name: /다른 주제|Back to topics/i }).click();
    await sampleContrast(page, '[data-testid="mooni-quick-replies"]:visible button', 'topic-chip', samples);

    await sendMooniTurn(page, '그레이트 배리어 리프 항공편 알려줘');
    await expect(page.getByText(MOCK_MARKER)).toBeVisible({ timeout: 90_000 });
    await sampleContrast(page, 'button:has-text("항공권 안내 보기")', 'flight-guide-btn', samples);
    await sampleContrast(
      page,
      '[data-testid="mooni-model-reply"]:has-text("목적지 ·") button, [data-testid="mooni-model-reply"]:has-text("목적지 ·") [role="button"]',
      'destination-chip',
      samples,
    );
    await clipShotBoth(page, '03-mooni-chrome');

    for (const row of samples) {
      expect(row.ratio, `${row.label} contrast ${row.ratio?.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
    writeFileSync(
      join(ARTIFACT, 'contrast-samples.json'),
      `${JSON.stringify(samples, null, 2)}\n`,
      'utf8',
    );

    const scroll = page.getByTestId('mooni-message-scroll');
    await scroll.evaluate((el) => {
      el.scrollTop = 240;
    });
    const savedScroll = await scroll.evaluate((el) => el.scrollTop);

    const plannerNav = page.getByRole('button', {
      name: /플래너에서.*항공권 안내 보기/,
    });
    await expect(plannerNav).toBeVisible({ timeout: 30_000 });
    await plannerNav.click();
    await expect(page).toHaveURL(new RegExp(`/place/${GBR_SLUG}/planner`), { timeout: 60_000 });
    const returnBtn = page.getByTestId('mooni-return-to-chat');
    await expect(returnBtn).toBeVisible({ timeout: 30_000 });
    await clipShotBoth(page, '04-planner-return-btn');

    await returnBtn.click();
    await expect(page.getByText(MOCK_MARKER)).toBeVisible({ timeout: 30_000 });
    const scrollTop = await page.getByTestId('mooni-message-scroll').evaluate((el) => el.scrollTop);
    await clipShotBoth(page, '05-mooni-restored-scroll');

    expect(scrollTop).toBeGreaterThanOrEqual(savedScroll - 8);
    expect(mooniChatCalls, 'planner return must reuse chat without new AI').toBe(1);
  });

  test('place header — no header EN; surface locale switch (Lofoten)', async ({ page, context }) => {
    await installExploreTourapiMock(context);
    await page.goto('/place/lofoten/gallery?lang=ko', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await dismissMooniHintIfPresent(page);
    await expect(page.getByTestId('place-header-locale-toggle')).toHaveCount(0);

    await clipShotBoth(page, '06-lofoten-header-after');

    const toggle = page.locator('[data-testid="place-surface-locale-toggle"]:visible button').first();
    await expect(toggle).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('place-header-chrome-actions')).toBeVisible();
    const headerBox = await page.getByTestId('place-header-chrome-actions').boundingBox();
    const toggleBox = await toggle.boundingBox();
    expect(headerBox && toggleBox).toBeTruthy();
    const toggleBelowHeader = toggleBox.y > headerBox.y + headerBox.height - 8;
    expect(toggleBelowHeader, 'locale control must sit outside header action row').toBe(true);

    await clipShotBoth(page, '07-surface-locale-ko');

    await toggle.click();
    await expect(page).toHaveURL(/\?lang=en/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: /Lofoten/i }).first()).toBeVisible({ timeout: 60_000 });
    await clipShotBoth(page, '07-surface-locale-en');
  });
});