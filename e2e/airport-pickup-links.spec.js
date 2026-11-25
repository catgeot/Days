// VITE_GATEO_AIRPORT_PICKUP_LINKS=1 — mocked WebKit. No live partner or Gemini calls.
import { mkdirSync } from 'node:fs';
import { test, expect } from './fixtures.js';
import { installMooniGeminiMock } from './mooni-gemini-mock.js';
import { installFestivalTourApiFixtures } from './mooni-festival-tourapi-fixture.js';
import { enableMooniE2eLoggedIn, openFestivalMooni } from './mooni-festival-chip-helpers.js';

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
  await expect(row).toContainText('푸켓국제공항(HKT)');
  await expect(row).toContainText('카오락');
  await expect(row).toContainText('픽업·차량 예약');
  await expect(row).toContainText('Trip.com에서 보기');
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

async function expectLegAfterFlight(reply, { title, place, partner, hrefPart }) {
  const section = reply.locator('[data-mooni-transport-section]');
  await expect(section).toBeVisible();
  const pickup = section.locator('[data-airport-pickup-row]');
  await expect(pickup).toBeVisible();
  await expect(pickup).toContainText(title);
  await expect(pickup).toContainText(place);
  await expect(pickup).toContainText('픽업·차량 예약');
  await expect(pickup).toContainText(partner);
  const href = await pickup.getAttribute('href');
  expect(href).toContain(hrefPart);
  const flight = section.getByRole('button', { name: /항공권/ }).first();
  await expect(flight).toBeVisible();
  const followsFlight = await flight.evaluate((flightEl) => {
    const row = flightEl.parentElement?.querySelector('[data-airport-pickup-row]');
    if (!row) return false;
    return Boolean(flightEl.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(followsFlight).toBe(true);
  return pickup;
}

async function frameTransport(page, pickup, width) {
  await frame(page, width);
  await pickup.evaluate((el) => {
    const section = el.closest('[data-mooni-transport-section]') || el;
    let node = el.parentElement;
    while (node) {
      const style = getComputedStyle(node);
      const scrolls = /(auto|scroll)/.test(style.overflowY) || node.scrollHeight > node.clientHeight + 8;
      if (scrolls) {
        const top = section.getBoundingClientRect().top - node.getBoundingClientRect().top + node.scrollTop;
        node.scrollTop = Math.max(0, top - 8);
      }
      node = node.parentElement;
    }
  });
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
    const khaoPickup = await expectLegAfterFlight(khaoReply, {
      title: '푸켓국제공항(HKT)',
      place: '카오락',
      partner: 'Trip.com에서 보기',
      hrefPart: '/airport-hkt/',
    });
    await expect(khaoReply.getByRole('link', { name: /코레일|버스타고|Korail|BUSTAGO/ })).toHaveCount(0);
    await frameTransport(page, khaoPickup, 390);
    await shot(page, 'khao-lak-mooni-pickup', 390);
    await frameTransport(page, khaoPickup, 1280);
    await shot(page, 'khao-lak-mooni-pickup', 1280);
    await frame(page, 390);

    const bangkokReply = await openMooniAccess(page, 'bangkok');
    const bangkokPickup = await expectLegAfterFlight(bangkokReply, {
      title: '수완나품국제공항(BKK)',
      place: '방콕',
      partner: 'Trip.com에서 보기',
      hrefPart: '/airport-transfers/bangkok/airport-bkk/',
    });
    await frameTransport(page, bangkokPickup, 390);
    await shot(page, 'bangkok-mooni-pickup', 390);
    await frameTransport(page, bangkokPickup, 1280);
    await shot(page, 'bangkok-mooni-pickup', 1280);
    await frame(page, 390);

    const tokyoReply = await openMooniAccess(page, 'tokyo');
    const tokyoPickup = await expectLegAfterFlight(tokyoReply, {
      title: '하네다공항(HND)',
      place: '도쿄',
      partner: '마이리얼트립에서 보기',
      hrefPart: 'myrealtrip.com/search',
    });
    const tokyoHref = await tokyoPickup.getAttribute('href');
    expect(new URL(tokyoHref).searchParams.get('q')).toBe('HND 공항 픽업');
    expect(tokyoHref).toContain('mylink_id=2640202');
    expect(tokyoHref).toContain('utm_source=mktpartner');
    await frameTransport(page, tokyoPickup, 390);
    await shot(page, 'tokyo-mooni-mrt', 390);
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

  test('domestic festival access answer has no pickup row', async ({ page, context }) => {
    await installFestivalTourApiFixtures(context);
    await enableMooniE2eLoggedIn(page);
    await openFestivalMooni(page);
    await page.getByRole('button', { name: /가는 법/ }).first().click({ force: true });
    await expect(page.getByTestId('mooni-festival-access-dock')).toBeVisible();
    await page.locator('[data-festival-origin="seoul"]').click({ force: true });
    await expect(page.getByText(/서울에서 이 축제장까지/).first()).toBeVisible();
    const reply = page.getByTestId('mooni-model-reply').last();
    await expect(reply).toBeVisible();
    await expect(reply).toContainText('E2E-MOCK-9f3a');
    await expect(reply.locator('[data-airport-pickup-row]')).toHaveCount(0);
    await expect(page.locator('[data-airport-pickup-row]')).toHaveCount(0);
  });

  test('overseas my-location answer places the pickup row after the flight button', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
    await context.route(/api\.mapbox\.com\/geocoding\/v5\/mapbox\.places\//i, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          features: [{
            id: 'place.bangkok',
            text: '방콕',
            place_type: ['place'],
            center: [100.5018, 13.7563],
            context: [{ id: 'country.th', text: '태국' }],
          }],
        }),
      });
    });
    await page.goto('/place/khao-lak?lang=ko', { waitUntil: 'domcontentloaded' });
    const hint = page.getByRole('button', { name: /말풍선 닫기|Close hint bubble/i });
    if (await hint.isVisible({ timeout: 3_000 }).catch(() => false)) await hint.click();
    const mooniBtn = page.locator('.place-header-mooni-btn').first();
    await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
    await mooniBtn.click();
    await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 60_000 });
    const dock = page.locator('[data-testid="mooni-quick-replies"]:visible').first();
    await expect(dock).toBeVisible({ timeout: 60_000 });
    await dock.getByRole('button', { name: /✈️\s*가는 방법/ }).click({ force: true });
    const expand = page.getByRole('button', { name: /출발지 검색 펼치기|Expand departure search/i });
    if (await expand.isVisible({ timeout: 8_000 }).catch(() => false)) await expand.click();
    await page.getByTestId('flight-origin-locate').click();
    const bubble = page.getByTestId('mooni-user-bubble').last();
    await expect(bubble).toHaveText('내 위치에서 이 여행지까지 가는 법을 알려줘');
    const reply = page.getByTestId('mooni-model-reply').last();
    await expectLegAfterFlight(reply, {
      title: '푸켓국제공항(HKT)',
      place: '카오락',
      partner: 'Trip.com에서 보기',
      hrefPart: '/airport-hkt/',
    });
    await expect(reply.getByRole('link', { name: /코레일|버스타고|Korail|BUSTAGO/ })).toHaveCount(0);
  });
});
