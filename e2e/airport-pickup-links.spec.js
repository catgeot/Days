// VITE_GATEO_AIRPORT_PICKUP_LINKS=1 — mocked WebKit. No live partner or Gemini calls.
import { mkdirSync } from 'node:fs';
import { test, expect } from './fixtures.js';
import { installMooniGeminiMock } from './mooni-gemini-mock.js';

const OUT = '/opt/cursor/artifacts';

async function reveal(locator) {
  await locator.evaluate((el) => {
    let node = el.parentElement;
    while (node) {
      const style = getComputedStyle(node);
      const scrolls = /(auto|scroll)/.test(style.overflowY) || node.scrollHeight > node.clientHeight + 8;
      if (scrolls) {
        const top = el.getBoundingClientRect().top - node.getBoundingClientRect().top + node.scrollTop;
        node.scrollTop = Math.max(0, top - node.clientHeight / 3);
      }
      node = node.parentElement;
    }
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
}

async function shot(page, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.screenshot({
    path: `${OUT}/${name}-${width}.png`,
    clip: { x: 0, y: 0, width, height },
  });
}

async function openAirportFact(page) {
  await page.goto('/place/khao-lak?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('카오락').first()).toBeVisible({ timeout: 60_000 });
  const factsHeader = page.getByRole('button', { name: /현지 정보/ }).first();
  await factsHeader.click();
  const airport = page.locator('[data-local-info-row="airport"]:visible');
  await expect(airport).toBeVisible();
  await airport.locator('button').click();
  const row = airport.locator('[data-airport-pickup-row]');
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row).toHaveText('공항 픽업·차량 예약');
  const href = await row.getAttribute('href');
  expect(href).toContain('/airport-transfers/phuket/airport-hkt/');
  expect(href).toContain('Allianceid=8182427');
  expect(href).toContain('SID=309563143');
    await reveal(row);
  return row;
}

async function frame(page, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
}

async function openMooniAccess(page, slug) {
  await page.goto(`/place/${slug}?lang=ko`, { waitUntil: 'domcontentloaded' });
  const hint = page.getByRole('button', { name: /말풍선 닫기|Close hint bubble/i });
  if (await hint.isVisible({ timeout: 3_000 }).catch(() => false)) await hint.click();
  const mooniBtn = page.locator('.place-header-mooni-btn').first();
  await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
  await mooniBtn.click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 60_000 });
  const dock = page.locator('[data-testid="mooni-quick-replies"]:visible').first();
  await expect(dock).toBeVisible({ timeout: 60_000 });
  await dock.getByRole('button', { name: /✈️\s*가는 방법/ }).click({ force: true });
  await page.getByRole('button', { name: '물어보기', exact: true }).click();
  const reply = page.getByTestId('mooni-model-reply').last();
  await expect(reply).toBeVisible({ timeout: 60_000 });
  return reply;
}

test.describe('airport pickup row (flag on)', () => {
  test.beforeAll(() => {
    mkdirSync(OUT, { recursive: true });
  });

  test.beforeEach(async ({ context }) => {
    await installMooniGeminiMock(context);
  });

  test('Khao Lak place card and MOONi show HKT pickup; Seoul does not', async ({ page }) => {
    const placeRow = await openAirportFact(page);
    await expect(placeRow).toBeVisible();
    await frame(page, 390);
    await reveal(placeRow);
    await shot(page, 'khao-lak-place-pickup', 390);
    await frame(page, 1280);
    const placeRowDesktop = await openAirportFact(page);
    await reveal(placeRowDesktop);
    await shot(page, 'khao-lak-place-pickup', 1280);
    await frame(page, 390);

    const khaoReply = await openMooniAccess(page, 'khao-lak');
    const khaoPickup = khaoReply.locator('[data-airport-pickup-row]');
    await expect(khaoPickup).toBeVisible();
    await expect(khaoPickup).toHaveText('공항 픽업·차량 예약');
    const href = await khaoPickup.getAttribute('href');
    expect(href).toContain('/airport-hkt/');
    await expect(khaoReply.getByRole('link', { name: /코레일|버스타고|Korail|BUSTAGO/ })).toHaveCount(0);
    await khaoPickup.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await frame(page, 390);
    await reveal(khaoPickup);
    await shot(page, 'khao-lak-mooni-pickup', 390);
    await frame(page, 1280);
    await reveal(khaoPickup);
    await shot(page, 'khao-lak-mooni-pickup', 1280);
    await frame(page, 390);

    const seoulReply = await openMooniAccess(page, 'seoul');
    await expect(seoulReply.locator('[data-airport-pickup-row]')).toHaveCount(0);
    await expect(page.locator('[data-airport-pickup-row]')).toHaveCount(0);
    await frame(page, 390);
    await reveal(seoulReply);
    await shot(page, 'seoul-mooni-no-pickup', 390);
    await frame(page, 1280);
    await reveal(seoulReply);
    await shot(page, 'seoul-mooni-no-pickup', 1280);
  });
});
