import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT = join(process.cwd(), 'docs/qa/pr492');
const VIEWPORT = { width: 390, height: 844 };
const manifest = [];

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function shot(page, file, meta = {}) {
  const path = join(OUT, file);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
  manifest.push({ file, ...meta });
  return path;
}

async function openFestivalHubFromHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .getByRole('button', { name: /바로가기 메뉴 펼치기|Expand quick links/i })
    .click({ timeout: 180_000 });
  await page
    .getByRole('link', { name: /한국의 축제로 이동|Go to Korea festivals/i })
    .click();
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function selectSidoChip(page, namePattern) {
  const chip = page.getByRole('button', { name: namePattern }).first();
  await expect(chip).toBeVisible({ timeout: 60_000 });
  await chip.click();
}

async function readCardDate(card) {
  const row = card.locator('p.text-amber-700').first();
  if (await row.count()) return (await row.textContent())?.trim() || '';
  return '';
}

async function readDetailDate(dialog) {
  const dateRow = dialog
    .locator('dt')
    .filter({ hasText: /^일정$|^Dates$/i })
    .locator('xpath=following-sibling::dd[1]');
  if (await dateRow.count()) return (await dateRow.textContent())?.trim() || '';
  const fallback = dialog.locator('dd').filter({ hasText: /\d+\.\d+/ }).first();
  return (await fallback.textContent())?.trim() || '';
}

async function closeDetail(page) {
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) {
    await page.getByRole('button', { name: /^닫기$|^Close$/i }).last().click();
    await expect(dialog).toHaveCount(0, { timeout: 30_000 });
  }
}

test.describe('PR492 QA screenshots — WebKit 390 user flow', () => {
  test.setTimeout(300_000);

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.afterAll(async () => {
    await writeFile(join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  });

  test('home → 축제 → region → cards → detail · 명승 인근 축제', async ({ page }) => {
    await openFestivalHubFromHome(page);

    const promoRow = page.locator('[data-social-promo-festival-row]');
    if (await promoRow.isVisible().catch(() => false)) {
      const promoDate = await promoRow
        .locator('[data-social-promo-card] p.text-amber-800')
        .first()
        .textContent()
        .catch(() => '');
      await shot(page, '01-social-promo-strip.png', {
        surface: 'recommended strip',
        dateShown: String(promoDate || '').trim(),
      });
    }

    const cards = page.getByRole('main').locator('[data-festival-id]');
    await expect(cards.first()).toBeVisible({ timeout: 120_000 });

    let spanCard = null;
    let spanDate = '';
    const count = await cards.count();
    for (let i = 0; i < Math.min(count, 40); i += 1) {
      const card = cards.nth(i);
      const date = await readCardDate(card);
      if (/10\.\d+\s*[–-]\s*11\./.test(date)) {
        spanCard = card;
        spanDate = date;
        break;
      }
    }

    if (spanCard) {
      await spanCard.scrollIntoViewIfNeeded();
      await shot(page, '02-list-card-oct-nov-span.png', {
        surface: 'list card',
        dateShown: spanDate,
      });
      await spanCard.click();
      const spanDialog = page.getByRole('dialog');
      await expect(spanDialog).toBeVisible({ timeout: 60_000 });
      const spanDetailDate = await readDetailDate(spanDialog);
      await shot(page, '03-detail-oct-nov-dates.png', {
        surface: 'festival detail',
        dateShown: spanDetailDate,
      });
      await closeDetail(page);
    }

    await selectSidoChip(page, /강원/);
    await page.waitForTimeout(1500);
    const gangneungCard = cards.filter({ hasText: /강릉.*국수|국수.*축제/i }).first();
    await expect(gangneungCard).toBeVisible({ timeout: 120_000 });
    const gangListDate = await readCardDate(gangneungCard);
    await gangneungCard.scrollIntoViewIfNeeded();
    await shot(page, '04-gangneung-list-card.png', {
      surface: 'list card (강릉)',
      dateShown: gangListDate,
    });
    await gangneungCard.click();
    const gangDialog = page.getByRole('dialog');
    await expect(gangDialog).toBeVisible({ timeout: 60_000 });
    const gangDetailDate = await readDetailDate(gangDialog);
    await shot(page, '05-gangneung-close-x.png', {
      surface: 'detail close (X)',
      dateShown: gangDetailDate,
    });

    const near = gangDialog.locator('[data-festival-section="nearAttractions"]');
    await near.scrollIntoViewIfNeeded();
    await expect(near).toBeVisible({ timeout: 120_000 });
    await expect(gangDialog.getByText(/주변 볼거리 불러오는 중|Loading nearby/i)).toHaveCount(0, {
      timeout: 120_000,
    });
    await near.screenshot({ path: join(OUT, '06-gangneung-nearby-sights.png') });
    manifest.push({
      file: '06-gangneung-nearby-sights.png',
      surface: 'nearby sights (강릉)',
      dateShown: gangDetailDate,
    });

    await closeDetail(page);

    let futureCard = null;
    let futureDate = '';
    for (let i = 0; i < Math.min(await cards.count(), 50); i += 1) {
      const card = cards.nth(i);
      const date = await readCardDate(card);
      if (/^202[6-9]\.(1[0-2]|[2-9])\./.test(date) || /^202[7-9]\./.test(date)) {
        futureCard = card;
        futureDate = date;
        break;
      }
      if (/^1\.\d+/.test(date) && !/10\./.test(date.split('–')[0] || date)) {
        futureCard = card;
        futureDate = date;
        break;
      }
    }
    if (futureCard) {
      await futureCard.scrollIntoViewIfNeeded();
      await futureCard.click();
      const futureDialog = page.getByRole('dialog');
      await expect(futureDialog).toBeVisible({ timeout: 60_000 });
      const futureDetailDate = await readDetailDate(futureDialog);
      await shot(page, '07-different-month-festival.png', {
        surface: 'detail (off-month year)',
        listDate: futureDate,
        dateShown: futureDetailDate,
      });
      await closeDetail(page);
    }

    await page.goto('/korea/theme/scenic?hub=hongcheon', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /한국의 명승|Korea scenic/i }),
    ).toBeVisible({ timeout: 90_000 });
    const scenicCard = page.getByRole('button').filter({ hasText: /가리산|홍천/i }).first();
    await scenicCard.click();
    const scenicDialog = page.getByRole('dialog');
    await expect(scenicDialog).toBeVisible({ timeout: 60_000 });
    await scenicDialog.getByRole('heading', { name: /인근 축제/i }).scrollIntoViewIfNeeded();
    await expect(scenicDialog.getByText(/인근 축제 불러오는 중/i)).toHaveCount(0, {
      timeout: 120_000,
    });
    const nearFestDate = await scenicDialog
      .locator('li button')
      .first()
      .locator('p.text-stone-500, span.text-stone-500')
      .first()
      .textContent()
      .catch(() => '');
    await shot(page, '08-scenic-near-festivals.png', {
      surface: '명승 인근 축제',
      dateShown: String(nearFestDate || '').trim(),
    });
  });
});
