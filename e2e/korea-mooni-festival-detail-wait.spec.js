import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';
import {
  clearFestivalListSessionCache,
  openFestivalMooni,
  tapFestivalSightsChip,
} from './mooni-festival-chip-helpers.js';

const OUT_DIR = '/opt/cursor/artifacts/mooni-festival-detail-wait';
const FESTIVAL_ID = '2048902';
const OTHER_ID = '3610001';
const SIGHTS = ['크루즈게이트', '터널게이트'];
const DETAIL_HOLD_MS = 60_000;
const CLIENT_WAIT_MS = 12_000;

const LIST_ITEM = {
  contentId: FESTIVAL_ID,
  title: '해운대 빛축제',
  eventStartDate: '20261128',
  eventEndDate: '20270110',
  addr1: '부산광역시 해운대구 해운대해변로 264',
  mapx: '129.160384',
  mapy: '35.158698',
  contentTypeId: '15',
};

const OTHER_ITEM = {
  contentId: OTHER_ID,
  title: '광안리 불꽃축제',
  eventStartDate: '20261128',
  eventEndDate: '20270110',
  addr1: '부산광역시 수영구 광안해변로 219',
  mapx: '129.118621',
  mapy: '35.153169',
  contentTypeId: '15',
};

const DETAIL = {
  ok: true,
  contentId: FESTIVAL_ID,
  intro: {
    contentId: FESTIVAL_ID,
    contentTypeId: '15',
    eventStartDate: '20261128',
    eventEndDate: '20270110',
    eventplace: '해운대해수욕장',
    program: '크루즈게이트\n터널게이트',
    mapx: '129.160384',
    mapy: '35.158698',
  },
  common: {
    contentId: FESTIVAL_ID,
    title: '해운대 빛축제',
    addr1: '부산광역시 해운대구 해운대해변로 264',
    overview: '백사장 중심에는 길이 12m의 배 조형물이 서 있어요.',
    mapx: '129.160384',
    mapy: '35.158698',
  },
};

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

function deferred() {
  let resolve = () => {};
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test.describe('festival detail arrives after MOONi opens', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(180_000);

  let releaseDetail = () => {};
  /** @type {{ task: string, hint: string, userText: string }[]} */
  let geminiPosts;

  test.beforeEach(async ({ context, page }) => {
    geminiPosts = [];
    const gate = deferred();
    releaseDetail = gate.resolve;
    await clearFestivalListSessionCache(page);

    await context.route(/tourapi-proxy/i, async (route) => {
      const request = route.request();
      if (request.method() !== 'POST') {
        await route.fulfill({ status: 200, headers: CORS, body: '' });
        return;
      }
      let body = {};
      try {
        body = request.postDataJSON() || {};
      } catch {
        body = {};
      }
      const action = String(body.action || '');
      const contentId = String(body.contentId || body.contentid || '');
      if (action === 'festivalDetail' && contentId === FESTIVAL_ID) {
        await Promise.race([
          gate.promise,
          new Promise((done) => setTimeout(done, DETAIL_HOLD_MS)),
        ]);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: CORS,
          body: JSON.stringify(DETAIL),
        });
        return;
      }
      const payload = action === 'festivalWindow' && body.locale !== 'en'
        ? { ok: true, items: [LIST_ITEM, OTHER_ITEM], fromCache: false }
        : { ok: true, items: [], fromCache: true };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify(payload),
      });
    });

    await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: CORS });
        return;
      }
      if (request.method() !== 'POST') {
        await route.fallback();
        return;
      }
      let task = '';
      let hint = '';
      let userText = '';
      try {
        const body = request.postDataJSON() || {};
        task = String(body.task || '');
        hint = String(body.params?.koreaFestivalHint || '');
        userText = String(body.params?.userText || '');
      } catch {
        task = '';
      }
      geminiPosts.push({ task, hint, userText });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify(
          buildGeminiProxyMockBody('해운대 밤바다에서 빛 조형을 볼 수 있어요.', {
            modelUsed: 'mock-detail-wait',
          }),
        ),
      });
    });
  });

  test('chip request waits for delayed detail sights', async ({ page }, testInfo) => {
    const width = page.viewportSize()?.width === 390 ? 390 : 1280;
    const height = width === 390 ? 844 : 800;
    const tag = testInfo.project.name.replace(/[^a-z0-9-]+/gi, '-');

    await openFestivalMooni(page, FESTIVAL_ID);
    const opening = page.getByTestId('mooni-festival-opening');
    await expect(opening).toBeVisible();
    await expect(opening).not.toContainText('크루즈게이트');
    await expect(opening).not.toContainText('터널게이트');
    await shot(page, `${tag}-open`, width, height);

    await tapFestivalSightsChip(page);
    await expect(page.getByText('스캔하고 있습니다')).toBeVisible({ timeout: 10_000 });
    releaseDetail();

    await expect(opening).toContainText('크루즈게이트', { timeout: 20_000 });
    await expect(opening).toContainText('터널게이트');
    const reply = page.getByTestId('mooni-model-reply').last();
    await expect(reply).toContainText('빛 조형을 볼 수 있어요', { timeout: 30_000 });
    await shot(page, `${tag}-chip`, width, height);

    expect(geminiPosts).toHaveLength(1);
    expect(geminiPosts[0].task).toBe('mooni_chat');
    for (const name of SIGHTS) {
      expect(geminiPosts[0].hint).toContain(name);
    }
    await page.waitForTimeout(400);
    expect(geminiPosts).toHaveLength(1);
  });

  test('closing during the detail wait sends no gemini request', async ({ page }) => {
    await openFestivalMooni(page, FESTIVAL_ID);
    const opening = page.getByTestId('mooni-festival-opening');
    await expect(opening).toBeVisible();
    await expect(opening).not.toContainText('크루즈게이트');

    await tapFestivalSightsChip(page);
    await expect(page.getByText('스캔하고 있습니다')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: '채팅 닫기' }).click();
    await expect(opening).toBeHidden();

    await page.waitForTimeout(CLIENT_WAIT_MS + 1_500);
    expect(geminiPosts).toHaveLength(0);
    releaseDetail();
    await page.waitForTimeout(500);
    expect(geminiPosts).toHaveLength(0);
  });

  test('switching festivals during the detail wait sends no gemini request', async ({ page }) => {
    await openFestivalMooni(page, FESTIVAL_ID);
    const opening = page.getByTestId('mooni-festival-opening');
    await expect(opening).toBeVisible();
    await expect(opening).not.toContainText('크루즈게이트');

    await tapFestivalSightsChip(page);
    await expect(page.getByText('스캔하고 있습니다')).toBeVisible({ timeout: 10_000 });
    const other = page.locator(`[data-festival-id="${OTHER_ID}"]`);
    await expect(other.first()).toBeAttached();
    await other.evaluateAll((nodes) => {
      nodes.forEach((node) => node.click());
    });
    await expect(page).toHaveURL(new RegExp(`festival=${OTHER_ID}`));
    await expect(opening).toBeHidden();

    await page.waitForTimeout(CLIENT_WAIT_MS + 1_500);
    expect(geminiPosts).toHaveLength(0);
    releaseDetail();
    await page.waitForTimeout(500);
    expect(geminiPosts).toHaveLength(0);
  });
});

async function shot(page, name, width, height) {
  await mkdir(OUT_DIR, { recursive: true });
  await page.screenshot({
    path: join(OUT_DIR, `${name}.png`),
    clip: { x: 0, y: 0, width, height },
  });
}
