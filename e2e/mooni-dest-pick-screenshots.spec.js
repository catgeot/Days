import { test, expect } from '@playwright/test';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';
import { dismissMooniHintIfPresent } from './helpers.js';
import path from 'node:path';

const OUT_DIR =
  process.env.MOONI_PICK_SCREENSHOT_DIR || '/opt/cursor/artifacts/screenshots/mooni-dest-pick';

async function installGeminiMock(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildGeminiProxyMockBody('본문 답 — 네 곳 비교 표를 정리했어요.', {
          modelUsed: 'mock-screenshot',
        }),
      ),
    });
  });
}

async function openMooni(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await dismissMooniHintIfPresent(page);
  await page.getByRole('button', { name: /MOONi와 대화하기|Chat with MOONi/i }).click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 30_000 });
}

async function send(page, text) {
  const input = page.getByRole('textbox', {
    name: /메시지 입력|직접 입력|Type a message|Type directly/i,
  });
  await input.fill(text);
  const form = input.locator('xpath=ancestor::form[1]');
  const sendBtn = form.getByRole('button', { name: /전송|Send/i });
  if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendBtn.click();
  } else {
    await form.locator('button[type="submit"]').click();
  }
}

async function clip390(page, fileName) {
  await page.screenshot({
    path: path.join(OUT_DIR, fileName),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

test.describe('MOONi dest pick regression screenshots', () => {
  test.setTimeout(180_000);

  test('four-place compare + guam snork (390 clip)', async ({ page, context }) => {
    test.skip(!process.env.MOONI_PICK_SCREENSHOT_DIR, 'set MOONI_PICK_SCREENSHOT_DIR');
    await installGeminiMock(context);
    await openMooni(page);

    await send(page, '괌·오키나와·팔라우·보홀 4곳을 표로 비교해 주세요');
    await expect(page.getByTestId('mooni-model-reply').first()).toBeVisible({ timeout: 90_000 });
    await clip390(page, '01-four-place-compare-reply.png');

    await send(page, '괌으로 5박 6일 부부 스노클링 여행을 가려고 해요');
    await expect(page.getByTestId('mooni-model-reply').nth(1)).toBeVisible({ timeout: 90_000 });
    await clip390(page, '02-guam-snorkel-reply.png');
  });
});
