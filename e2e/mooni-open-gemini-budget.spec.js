import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';
import { dismissMooniHintIfPresent } from './helpers.js';
import {
  clearFestivalListSessionCache,
  dismissLocHint,
} from './mooni-festival-chip-helpers.js';
import { installFestivalTourApiFixtures } from './mooni-festival-tourapi-fixture.js';

const OUT_DIR = '/opt/cursor/artifacts';
const MARKER = 'GATEO_E2E_MOONI_BUDGET';
const RATE_LIMIT = /질문이 잠시 몰렸어요|Questions are briefly piling up|too many questions/i;

test.describe.configure({ mode: 'serial' });

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
});

function createRecorder() {
  const calls = [];
  return {
    calls,
    async install(context) {
      await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
        const request = route.request();
        if (request.method() === 'OPTIONS') {
          await route.fulfill({ status: 204 });
          return;
        }
        if (request.method() !== 'POST') {
          await route.fallback();
          return;
        }
        let task = '';
        let userText = '';
        try {
          const body = request.postDataJSON();
          task = String(body?.task || '');
          userText = String(body?.params?.userText || body?.params?.placeName || '');
        } catch {
          task = '';
        }
        calls.push({ task, userText, at: Date.now() });
        const text = task === 'mooni_chat'
          ? `빛 조형을 볼 수 있어요. ${MARKER}`
          : 'cached intro should not be generated on open';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' },
          body: JSON.stringify(buildGeminiProxyMockBody(text, { modelUsed: 'mock-open-budget' })),
        });
      });
    },
  };
}

function visibleQuickReplies(page) {
  return page.locator('[data-testid="mooni-quick-replies"]:visible');
}

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  return path;
}

async function waitQuiet(recorder, page, quietMs = 900, maxMs = 8000) {
  const start = Date.now();
  let last = recorder.calls.length;
  let changedAt = start;
  while (Date.now() - start < maxMs) {
    if (recorder.calls.length !== last) {
      last = recorder.calls.length;
      changedAt = Date.now();
    }
    if (Date.now() - changedAt >= quietMs && Date.now() - start >= quietMs) return;
    await page.waitForTimeout(100);
  }
}

async function note(row) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, 'mooni-open-gemini-budget.json');
  let rows = [];
  try {
    rows = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    rows = [];
  }
  rows.push(row);
  await writeFile(path, JSON.stringify(rows, null, 2));
  console.log(`BUDGET ${row.id} before=${row.before} chipTask=${row.chipTask} totalAfter=${row.totalAfter}`);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof createRecorder>} recorder
 * @param {() => Promise<void>} open
 * @param {() => Promise<void>} ask
 */
async function assertOpenThenFirstChip(page, recorder, { id, open, ask, greeting }) {
  await waitQuiet(recorder, page);
  const beforeOpen = recorder.calls.length;
  await open();
  if (greeting) await expect(page.getByText(greeting).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(3500);
  const duringOpen = recorder.calls.slice(beforeOpen);
  expect(duringOpen, `${id} gemini-proxy after open`).toEqual([]);
  await expect(page.getByText(RATE_LIMIT)).toHaveCount(0);
  await ask();
  await expect.poll(() => recorder.calls.length, { timeout: 30_000 }).toBe(beforeOpen + 1);
  const chipCall = recorder.calls[beforeOpen];
  expect(chipCall.task).toBe('mooni_chat');
  await expect(page.getByText(MARKER)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(RATE_LIMIT)).toHaveCount(0);
  await note({
    id,
    before: duringOpen.length,
    chipTask: chipCall.task,
    totalAfter: recorder.calls.length - beforeOpen,
    pageLoadCalls: beforeOpen,
  });
}

test.describe('MOONi open does not spend the gemini-proxy minute window @390', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    process.env.MOONI_TOURAPI_STUB_ONLY = '1';
    await clearFestivalListSessionCache(page);
    await installFestivalTourApiFixtures(context, { festivalId: '2048902' });
    await context.route(/\/rest\/v1\/place_chat_intro/i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null',
      });
    });
  });

  test('festival detail ko — 해운대 빛축제 open then sights chip', async ({ page, context }) => {
    const recorder = createRecorder();
    await recorder.install(context);
    await page.goto('/korea/?festival=2048902&lang=ko', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    const openBtn = page.locator('[data-festival-mooni-inline]').first();
    await openBtn.waitFor({ state: 'visible', timeout: 90_000 });
    await assertOpenThenFirstChip(page, recorder, {
      id: 'festival-ko',
      greeting: /MOONi|빛축제|해운대/,
      open: async () => {
        await openBtn.click({ force: true });
        await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 30_000 });
        await shot(page, 'mooni-budget-festival-ko-open');
      },
      ask: async () => {
        const chip = page.getByRole('button', { name: /볼거리/ }).first();
        await expect(chip).toBeEnabled({ timeout: 20_000 });
        await chip.click();
        await shot(page, 'mooni-budget-festival-ko-chip');
      },
    });
  });

  test('festival detail en — Haeundae light festival open then sights chip', async ({ page, context }) => {
    const recorder = createRecorder();
    await recorder.install(context);
    await page.goto('/korea/?festival=2048902&lang=en', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    const openBtn = page.locator('[data-festival-mooni-inline]').first();
    await openBtn.waitFor({ state: 'visible', timeout: 90_000 });
    await assertOpenThenFirstChip(page, recorder, {
      id: 'festival-en',
      open: async () => {
        await openBtn.click({ force: true });
        await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({ timeout: 30_000 });
        await shot(page, 'mooni-budget-festival-en-open');
      },
      ask: async () => {
        const chip = page.getByRole('button', { name: /Sights & atmosphere/ }).first();
        await expect(chip).toBeEnabled({ timeout: 20_000 });
        await chip.click();
      },
    });
  });

  test('place detail ko — haeundae beach open then place chip', async ({ page, context }) => {
    const recorder = createRecorder();
    await recorder.install(context);
    await page.goto('/place/haeundae-beach?lang=ko', { waitUntil: 'domcontentloaded' });
    const openBtn = page.getByRole('button', { name: /MOONi에게 물어보기/ }).first();
    await openBtn.waitFor({ state: 'visible', timeout: 90_000 });
    await assertOpenThenFirstChip(page, recorder, {
      id: 'place-ko',
      greeting: /도와드릴게요|어떤 곳인지/,
      open: async () => {
        await openBtn.click({ force: true });
        await expect(visibleQuickReplies(page)).toBeVisible({ timeout: 30_000 });
        await shot(page, 'mooni-budget-place-ko-open');
      },
      ask: async () => {
        const explore = page.getByRole('button', { name: /궁금해/ }).first();
        await expect(explore).toBeEnabled({ timeout: 20_000 });
        await explore.click();
        expect(recorder.calls.filter((call) => call.task === 'mooni_chat')).toEqual([]);
        const overview = page.getByRole('button', { name: /어떤 곳/ }).first();
        await expect(overview).toBeEnabled({ timeout: 20_000 });
        await overview.click();
      },
    });
  });

  test('place detail en — haeundae beach open then place chip', async ({ page, context }) => {
    const recorder = createRecorder();
    await recorder.install(context);
    await page.goto('/place/haeundae-beach?lang=en', { waitUntil: 'domcontentloaded' });
    const openBtn = page.getByRole('button', { name: /Ask MOONi/ }).first();
    await openBtn.waitFor({ state: 'visible', timeout: 90_000 });
    await assertOpenThenFirstChip(page, recorder, {
      id: 'place-en',
      greeting: /I can help from what/,
      open: async () => {
        await openBtn.click({ force: true });
        await expect(visibleQuickReplies(page)).toBeVisible({ timeout: 30_000 });
        await shot(page, 'mooni-budget-place-en-open');
      },
      ask: async () => {
        const explore = page.getByRole('button', { name: /Curious/ }).first();
        await expect(explore).toBeEnabled({ timeout: 20_000 });
        await explore.click();
        const overview = page.getByRole('button', { name: /What's it like/ }).first();
        await expect(overview).toBeEnabled({ timeout: 20_000 });
        await overview.click();
      },
    });
  });

  test('home globe ko — unbound FAB then discovery chip', async ({ page, context }) => {
    const recorder = createRecorder();
    await recorder.install(context);
    await page.goto('/?lang=ko', { waitUntil: 'domcontentloaded' });
    await dismissMooniHintIfPresent(page);
    const fab = page.getByTestId('mooni-fab-open');
    await fab.waitFor({ state: 'visible', timeout: 60_000 });
    await assertOpenThenFirstChip(page, recorder, {
      id: 'home-ko',
      greeting: /안녕하세요! 저는 MOONi예요/,
      open: async () => {
        await fab.click();
        await expect(visibleQuickReplies(page)).toBeVisible({ timeout: 30_000 });
        await shot(page, 'mooni-budget-home-ko-open');
      },
      ask: async () => {
        const chip = page.getByRole('button', { name: /따뜻한 휴양지/ }).first();
        await expect(chip).toBeEnabled({ timeout: 20_000 });
        await chip.click();
      },
    });
  });

  test('home globe en — unbound FAB then discovery chip', async ({ page, context }) => {
    const recorder = createRecorder();
    await recorder.install(context);
    await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
    await dismissMooniHintIfPresent(page);
    const fab = page.getByTestId('mooni-fab-open');
    await fab.waitFor({ state: 'visible', timeout: 60_000 });
    await assertOpenThenFirstChip(page, recorder, {
      id: 'home-en',
      greeting: /Hi! I'm MOONi/,
      open: async () => {
        await fab.click();
        await expect(visibleQuickReplies(page)).toBeVisible({ timeout: 30_000 });
        await shot(page, 'mooni-budget-home-en-open');
      },
      ask: async () => {
        const chip = page.getByRole('button', { name: /따뜻한 휴양지/ }).first();
        await expect(chip).toBeEnabled({ timeout: 20_000 });
        await chip.click();
      },
    });
  });
});
