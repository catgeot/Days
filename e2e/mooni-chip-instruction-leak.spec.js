import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';
import {
  clearFestivalListSessionCache,
  openFestivalMooni,
} from './mooni-festival-chip-helpers.js';
import { installFestivalTourApiFixtures } from './mooni-festival-tourapi-fixture.js';

const OUT_DIR = '/opt/cursor/artifacts';

const KO_LEAK =
  'GATEO가 확인한 축제 중 앞으로 30일 이 볼 수 것과 현장 분위기를 확인된 프로그램과 시간만 말하고 데이터에 없는 붐비는 시간은 지어내지 마와 겹치는 행사는 없어요.';

const EN_LEAK =
  'GATEO has no verified festivals overlapping What can I actually see and do at this festival, and what is the on-site feel? Use only confirmed programs and hours. Do not invent crowd times. for the next 30 days.';

const PLACE_LEAK =
  'GATEO가 확인한 축제 중 앞으로 30일 이곳은 어떤 곳이야?와 겹치는 행사는 없어요. 데이터에 없는 붐비는 시간은 지어내지 마.';

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  return path;
}

async function installLeakGeminiMock(context) {
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    let userText = '';
    try {
      const body = route.request().postDataJSON();
      userText = String(body?.params?.userText || '');
    } catch {
      userText = '';
    }
    let text = '해운대 빛축제 기간에 빛 조형을 볼 수 있어요.';
    if (/on-site feel|Do not invent crowd/i.test(userText)) text = EN_LEAK;
    else if (/볼 수 있는 것|먹을 곳|축제장까지|동선을 짜|입국과 비자|항공권은 GATEO|공항에서 이 축제/.test(userText)) {
      text = KO_LEAK;
    } else if (/어떤 곳이야|분위기와 치안|추천 액티비티|맛집 추천|What kind of place|vibe and safety|Suggest activities|Recommend restaurants/i.test(userText)) {
      text = PLACE_LEAK;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildGeminiProxyMockBody(text, { modelUsed: 'mock-chip-leak' })),
    });
  });
}

test.describe('MOONi chip instruction does not leak @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    process.env.MOONI_TOURAPI_STUB_ONLY = '1';
    await clearFestivalListSessionCache(page);
    await installFestivalTourApiFixtures(context);
    await installLeakGeminiMock(context);
  });

  test('해운대 빛축제 볼거리·근처 칩은 지시문 대신 프로그램·안내를 보여 준다', async ({ page }) => {
    await openFestivalMooni(page, '2048902');
    await expect(page.getByRole('button', { name: /볼거리·분위기/ })).toBeVisible();
    await shot(page, 'mooni-chip-haeundae-before');

    await page.getByRole('button', { name: /볼거리·분위기/ }).first().click({ force: true });
    await expect(page.getByText('볼 수 있는 프로그램은')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('크루즈게이트')).toBeVisible();
    await expect(page.getByText('터널게이트')).toBeVisible();
    await expect(page.getByText('지어내지 마')).toHaveCount(0);
    await expect(page.getByText('데이터에 없는')).toHaveCount(0);
    await expect(page.getByText('겹치는 행사는 없어요')).toHaveCount(0);
    await shot(page, 'mooni-chip-haeundae-after-sights');

    const nearby = page.getByRole('button', { name: /근처 먹고 둘러볼 곳/ }).first();
    await nearby.click({ force: true });
    const nearbyReply = page.getByText('근처 먹고 둘러볼 곳 알려 줘');
    await expect(nearbyReply).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('지어내지 마')).toHaveCount(0);
    await expect(page.getByText('넣지 마')).toHaveCount(0);
    await expect(page.getByText('겹치는 행사는 없어요')).toHaveCount(0);
    await nearbyReply.evaluate((node) => {
      let next = node.parentElement;
      for (let i = 0; i < 6 && next; i += 1) {
        const reply = next.nextElementSibling;
        if (reply) {
          reply.scrollIntoView({ block: 'center' });
          return;
        }
        next = next.parentElement;
      }
      node.scrollIntoView({ block: 'start' });
    });
    await shot(page, 'mooni-chip-haeundae-after-nearby');
  });

  test('서울빛초롱축제 볼거리 칩도 지시문을 보여 주지 않는다', async ({ page }) => {
    await openFestivalMooni(page, '1095732');
    await shot(page, 'mooni-chip-seoul-lantern-before');
    await page.getByRole('button', { name: /볼거리·분위기/ }).first().click({ force: true });
    await expect(page.getByText('볼 수 있는 프로그램은 청계천 등불과 빛 조형이에요')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('지어내지 마')).toHaveCount(0);
    await expect(page.getByText('겹치는 행사는 없어요')).toHaveCount(0);
    await shot(page, 'mooni-chip-seoul-lantern-after-sights');
  });

  test('English sights chip hides the instruction', async ({ page }) => {
    await page.goto('/korea/?festival=2048902&lang=en', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
    await mooniBtn.waitFor({ state: 'attached', timeout: 90_000 });
    await mooniBtn.click({ force: true, timeout: 15_000 });
    await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 120_000 });
    const chip = page.getByRole('button', { name: /Sights & atmosphere/i }).first();
    await expect(chip).toBeVisible({ timeout: 30_000 });
    await shot(page, 'mooni-chip-haeundae-en-before');
    await chip.click({ force: true });
    await expect(page.getByText(/Confirmed programs include/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('크루즈게이트')).toBeVisible();
    await expect(page.getByText(/Do not invent/i)).toHaveCount(0);
    await expect(page.getByText(/on-site feel/i)).toHaveCount(0);
    await expect(page.getByText(/no verified festivals overlapping/i)).toHaveCount(0);
    await expect(page.getByText(/Seattle|시애틀/)).toHaveCount(0);
    await shot(page, 'mooni-chip-haeundae-en-after-sights');
  });

  test('a normal sentence that shares one instruction word stays, and Seattle is not attached', async ({ page, context }) => {
    await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      let userText = '';
      try {
        userText = String(route.request().postDataJSON()?.params?.userText || '');
      } catch {
        userText = '';
      }
      const text = /on-site feel/i.test(userText)
        ? 'The on-site feel is a bright beach walk. Cruise gate lights stay on until late.'
        : '데이터에 없는 부스 이름은 빼고 크루즈게이트를 말해요. 밤바다에 조명이 이어져요.';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildGeminiProxyMockBody(text, { modelUsed: 'mock-chip-keep' })),
      });
    });

    await openFestivalMooni(page, '2048902');
    await page.getByRole('button', { name: /볼거리·분위기/ }).first().click({ force: true });
    await expect(page.getByText('데이터에 없는 부스 이름은 빼고 크루즈게이트를 말해요')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('밤바다에 조명이 이어져요')).toBeVisible();
    await expect(page.getByText('볼 수 있는 프로그램은')).toHaveCount(0);
    await shot(page, 'mooni-chip-haeundae-keep-ko');

    await page.goto('/korea/?festival=2048902&lang=en', {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
    await mooniBtn.waitFor({ state: 'attached', timeout: 90_000 });
    await mooniBtn.click({ force: true, timeout: 15_000 });
    await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 120_000 });
    const chip = page.getByRole('button', { name: /Sights & atmosphere/i }).first();
    await expect(chip).toBeVisible({ timeout: 30_000 });
    await chip.click({ force: true });
    await expect(page.getByText('The on-site feel is a bright beach walk.')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Cruise gate lights stay on until late.')).toBeVisible();
    await expect(page.getByText(/Confirmed programs include/)).toHaveCount(0);
    await expect(page.getByText(/Seattle|시애틀/)).toHaveCount(0);
    await shot(page, 'mooni-chip-haeundae-keep-en');
  });

  test('경복궁·파리 장소 칩은 겹치는 행사 템플릿을 보여 주지 않는다', async ({ page }) => {
    for (const slug of ['gyeongbokgung-palace', 'paris']) {
      await page.goto(`/place/${slug}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      const open = page.getByRole('button', { name: /MOONi에게 물어보기/ }).first();
      await expect(open).toBeVisible({ timeout: 60_000 });
      await open.click();
      const explore = page.getByRole('button', { name: /궁금해/ }).first();
      await expect(explore).toBeVisible({ timeout: 30_000 });
      await explore.click();
      const chip = page.getByRole('button', { name: /어떤 곳/ }).first();
      await expect(chip).toBeVisible({ timeout: 30_000 });
      await shot(page, `mooni-chip-place-${slug}-before`);
      await chip.click({ force: true });
      await expect(page.getByText('확인된 내용만 말할 수 있어요')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText('지어내지 마')).toHaveCount(0);
      await expect(page.getByText('겹치는 행사는 없어요')).toHaveCount(0);
      const enjoy = page.getByRole('button', { name: /즐길거리/ }).first();
      if (await enjoy.isVisible()) {
        await enjoy.click();
        const food = page.getByRole('button', { name: /맛집/ }).first();
        if (await food.isVisible()) {
          await food.click({ force: true });
          await expect(page.getByText('지어내지 마')).toHaveCount(0);
          await expect(page.getByText('겹치는 행사는 없어요')).toHaveCount(0);
        }
      }
      await shot(page, `mooni-chip-place-${slug}-after`);
    }
  });
});
