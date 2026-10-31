import { test, expect } from '@playwright/test';
import { installFestivalNearbyCardsFixtures } from './festival-nearby-cards-fixture.js';

const SCREENSHOT_DIR = '/opt/cursor/artifacts/screenshots/nearby-cards';
const nearbyCardsLocal = process.env.NEARBY_CARDS_E2E === '1';

function skipUnlessNearbyCardsLocal() {
  test.skip(!nearbyCardsLocal, 'Set NEARBY_CARDS_E2E=1 to run against local Vite (flag ON/OFF ports)');
}

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

async function openFestival(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog;
}

async function waitNearbyCardImages(dialog, sectionId = 'nearAttractions') {
  const section = dialog.locator(`[data-festival-section="${sectionId}"]`);
  await expect(section).toBeVisible({ timeout: 120_000 });
  await expect(section.locator('[data-nearby-photo-card]').first()).toBeVisible({
    timeout: 120_000,
  });
  await expect
    .poll(
      async () => section.locator('img[data-festival-photo]').count(),
      { timeout: 120_000 },
    )
    .toBeGreaterThan(0);
  const count = await section.locator('img[data-festival-photo]').count();
  for (let i = 0; i < count; i++) {
    const img = section.locator('img[data-festival-photo]').nth(i);
    await img.scrollIntoViewIfNeeded().catch(() => {});
    await expect
      .poll(
        async () =>
          img.evaluate((el) => el.complete && el.naturalWidth > 0),
        { timeout: 45_000 },
      )
      .toBe(true);
  }
  await expect(section.locator('[data-festival-photo-pending]')).toHaveCount(0, {
    timeout: 5_000,
  });
}

async function clearNearbyBandFilter(section) {
  const pressed = section.locator('[data-nearby-summary-cell][aria-pressed="true"]');
  if ((await pressed.count()) > 0) {
    await pressed.first().evaluate((node) => node.click());
  }
}

async function readSheetScrollTop(page) {
  return page.evaluate(() => {
    const content = document.querySelector('[data-festival-sheet-content]');
    const dialog = document.querySelector('[role="dialog"].overflow-y-auto');
    const md = window.matchMedia('(min-width: 768px)').matches;
    let scroller = dialog;
    if (md && content) {
      const oy = getComputedStyle(content).overflowY;
      if (oy === 'auto' || oy === 'scroll') scroller = content;
    }
    return scroller?.scrollTop ?? 0;
  });
}

async function measureNearbyBandHeaderVisibility(page, band) {
  return page.evaluate((bandKey) => {
    const scroller = (() => {
      const content = document.querySelector('[data-festival-sheet-content]');
      const dialog = document.querySelector('[role="dialog"].overflow-y-auto');
      const md = window.matchMedia('(min-width: 768px)').matches;
      if (md && content) {
        const oy = getComputedStyle(content).overflowY;
        if (oy === 'auto' || oy === 'scroll') return content;
      }
      return dialog || content;
    })();
    if (!scroller) return { ok: false, reason: 'no-scroller' };
    const title = document.querySelector(
      `[data-nearby-group][data-band="${bandKey}"] [data-nearby-group-title]`,
    );
    if (!title) return { ok: false, reason: 'no-title', band: bandKey };
    const port = scroller.getBoundingClientRect();
    const t = title.getBoundingClientRect();
    let topInset = port.top + 12;
    const closeBtn = [...document.querySelectorAll('body > button.fixed')].find((node) =>
      /닫기|Close/i.test(node.getAttribute('aria-label') || ''),
    );
    if (closeBtn) {
      const c = closeBtn.getBoundingClientRect();
      if (c.bottom > port.top) topInset = Math.max(topInset, c.bottom + 4);
    }
    const sheet = scroller.closest('[role="dialog"]') || scroller;
    for (const node of sheet.querySelectorAll('*')) {
      const st = getComputedStyle(node);
      if (st.position !== 'sticky' || st.top === 'auto') continue;
      const r = node.getBoundingClientRect();
      if (r.top <= port.top + 2 && r.bottom > port.top) {
        topInset = Math.max(topInset, r.bottom + 4);
      }
    }
    const ok = t.top >= topInset - 2 && t.bottom <= port.bottom + 2;
    return {
      ok,
      band: bandKey,
      topInset,
      titleTop: t.top,
      titleBottom: t.bottom,
      portTop: port.top,
      portBottom: port.bottom,
    };
  }, band);
}

async function measureNearbyGridHorizontalBalance(page) {
  return page.evaluate(() => {
    const section = document.querySelector('[data-nearby-cards-section]');
    if (!section) return { ok: false, reason: 'missing-section' };
    const sectionRect = section.getBoundingClientRect();
    let cards = [];
    for (const grid of section.querySelectorAll('[data-nearby-cards-grid]')) {
      const nodes = [...grid.querySelectorAll('[data-nearby-photo-card]')];
      if (nodes.length >= 2) {
        cards = nodes;
        break;
      }
    }
    if (cards.length < 2) {
      cards = [...section.querySelectorAll('[data-nearby-photo-card]')];
    }
    if (cards.length < 2) return { ok: false, reason: 'few-cards', count: cards.length };
    const rects = cards.map((node) => node.getBoundingClientRect());
    const minLeft = Math.min(...rects.map((r) => r.left));
    const maxRight = Math.max(...rects.map((r) => r.right));
    const leftMargin = Math.round(minLeft - sectionRect.left);
    const rightMargin = Math.round(sectionRect.right - maxRight);
    return {
      ok: Math.abs(leftMargin - rightMargin) <= 2,
      leftMargin,
      rightMargin,
      sectionWidth: Math.round(sectionRect.width),
      cardSpan: Math.round(maxRight - minLeft),
    };
  });
}

async function scrollSheetToShowNearbyGrid(page) {
  await page.evaluate(() => {
    const section = document.querySelector('[data-nearby-cards-section]');
    const content = document.querySelector('[data-festival-sheet-content]');
    const dialog = document.querySelector('[role="dialog"].overflow-y-auto');
    const md = window.matchMedia('(min-width: 768px)').matches;
    let scroller = dialog;
    if (md && content) {
      const oy = getComputedStyle(content).overflowY;
      if (oy === 'auto' || oy === 'scroll') scroller = content;
    }
    const grid = section?.querySelector('[data-nearby-cards-grid]');
    if (!section || !grid || !scroller) return;
    const gRect = grid.getBoundingClientRect();
    const tRect = scroller.getBoundingClientRect();
    scroller.scrollTop += gRect.top - tRect.top - 120;
  });
  await page.waitForTimeout(400);
}

async function forceShowScrollTopButton(page) {
  await page.evaluate(() => {
    const sheet = document.querySelector('[role="dialog"].overflow-y-auto');
    if (sheet) sheet.scrollTop = Math.max(sheet.scrollTop, 240);
  });
  await page.waitForTimeout(350);
}

async function clickNearbyBandChip(section, band) {
  const cell = section.locator(`[data-nearby-summary-cell][data-band="${band}"]`);
  await expect(cell).toBeVisible();
  if ((await cell.getAttribute('disabled')) != null) return false;
  await cell.click();
  await section.page().waitForTimeout(600);
  return true;
}

async function waitSheetReadyForCapture(page) {
  await page.evaluate(() => {
    const sheet = document.querySelector('[role="dialog"].overflow-y-auto');
    if (sheet) sheet.scrollTop = 0;
  });
  await page.waitForTimeout(350);
}

async function scrollNearbyAttractionsToComparisonView(page) {
  await page.evaluate(() => {
    const section = document.querySelector('[data-festival-section="nearAttractions"]');
    if (!section) return;
    const content = document.querySelector('[data-festival-sheet-content]');
    const dialog = document.querySelector('[role="dialog"].overflow-y-auto');
    let scroller = dialog;
    if (content) {
      const oy = getComputedStyle(content).overflowY;
      if (oy === 'auto' || oy === 'scroll') scroller = content;
    }
    if (!scroller) return;
    const sRect = section.getBoundingClientRect();
    const tRect = scroller.getBoundingClientRect();
    scroller.scrollTop += sRect.top - tRect.top - 8;
  });
  await page.waitForTimeout(250);
}

async function waitLegacyNearbyAttractionsReady(dialog) {
  const section = dialog.locator('[data-festival-section="nearAttractions"]');
  await expect(section).toBeVisible({ timeout: 120_000 });
  await expect(section.locator('.animate-spin')).toHaveCount(0, { timeout: 120_000 });
  await expect(section.locator('ul li').first()).toBeVisible({ timeout: 120_000 });
  await expect
    .poll(
      async () => {
        const pending = await section.locator('[data-nearby-thumb-pending]').count();
        const rows = await section.locator('ul li').count();
        return rows > 0 && pending === 0;
      },
      { timeout: 120_000 },
    )
    .toBe(true);
  const thumbs = section.locator('[data-nearby-thumb="photo"]');
  const photoCount = await thumbs.count();
  for (let i = 0; i < photoCount; i++) {
    const img = thumbs.nth(i).locator('img[data-festival-photo]');
    if ((await img.count()) === 0) continue;
    await expect
      .poll(async () => img.evaluate((el) => el.complete && el.naturalWidth > 0), {
        timeout: 45_000,
      })
      .toBe(true);
  }
}

async function screenshotNearbyAttractionsComparison(page, dialog, fileName) {
  await waitLegacyNearbyAttractionsReady(dialog);
  await scrollNearbyAttractionsToComparisonView(page);
  const section = dialog.locator('[data-festival-section="nearAttractions"]');
  await section.screenshot({ path: `${SCREENSHOT_DIR}/${fileName}` });
}

async function scrollTo4106717BottomEvidence(page) {
  await page.evaluate(() => {
    const content = document.querySelector('[data-festival-sheet-content]');
    const dialog = document.querySelector('[role="dialog"].overflow-y-auto');
    let scroller = dialog;
    if (content) {
      const oy = getComputedStyle(content).overflowY;
      if (oy === 'auto' || oy === 'scroll') scroller = content;
    }
    const museum = [...document.querySelectorAll('[data-nearby-photo-card]')].find((node) =>
      (node.textContent || '').includes('예천박물관'),
    );
    const lodging = document.querySelector('[data-festival-section="lodging"]');
    if (!scroller) return;
    if (museum) {
      const mRect = museum.getBoundingClientRect();
      const tRect = scroller.getBoundingClientRect();
      scroller.scrollTop += mRect.top - tRect.top - 48;
    }
    if (lodging) {
      const lRect = lodging.getBoundingClientRect();
      const tRect = scroller.getBoundingClientRect();
      if (lRect.top > tRect.bottom - 80) {
        scroller.scrollTop += lRect.top - tRect.top - 200;
      }
    }
  });
  await page.waitForTimeout(350);
}

async function scrollNearbyCardsSectionToEnd(page) {
  await scrollNearbyCardsClearFabStack(page);
}

async function scrollNearbyCardsClearFabStack(page) {
  await page.evaluate(() => {
    const section = document.querySelector('[data-nearby-cards-section]');
    const content = document.querySelector('[data-festival-sheet-content]');
    const dialog = document.querySelector('[role="dialog"].overflow-y-auto');
    const md = window.matchMedia('(min-width: 768px)').matches;
    let scroller = dialog;
    if (md && content) {
      const oy = getComputedStyle(content).overflowY;
      if (oy === 'auto' || oy === 'scroll') scroller = content;
    }
    if (!section || !scroller) return;

    const sectionBottom = section.offsetTop + section.offsetHeight;
    scroller.scrollTop = Math.max(0, sectionBottom - scroller.clientHeight);

    const cards = [...document.querySelectorAll('[data-nearby-photo-card]')];
    if (!cards.length) return;
    const lefts = cards.map((c) => c.getBoundingClientRect().left);
    const mid = (Math.min(...lefts) + Math.max(...lefts)) / 2;
    const rightCol = cards.filter((c) => c.getBoundingClientRect().left >= mid - 2);
    const last = rightCol[rightCol.length - 1] || cards[cards.length - 1];

    const floaters = [...document.querySelectorAll('button.fixed')].filter((btn) => {
      const label = `${btn.getAttribute('aria-label') || ''} ${btn.textContent || ''}`;
      return /무니|mooni|맨 위로|scroll/i.test(label);
    });
    const visibleFabTops = floaters
      .map((btn) => btn.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0)
      .map((r) => r.top);
    const clearanceTop =
      visibleFabTops.length > 0 ? Math.min(...visibleFabTops) - 12 : scroller.getBoundingClientRect().bottom - 12;

    let cardRect = last.getBoundingClientRect();
    if (cardRect.bottom > clearanceTop) {
      scroller.scrollTop += cardRect.bottom - clearanceTop;
    }

    cardRect = last.getBoundingClientRect();
    const portTop = scroller.getBoundingClientRect().top + 48;
    if (cardRect.top < portTop) {
      scroller.scrollTop -= portTop - cardRect.top;
    }
  });
  await page.waitForTimeout(400);
}

async function assertFloatingButtonsClearLastRightColumnCard(page) {
  const report = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-nearby-photo-card]')];
    if (!cards.length) return { ok: false, reason: 'no-cards' };
    const lefts = cards.map((c) => c.getBoundingClientRect().left);
    const mid = (Math.min(...lefts) + Math.max(...lefts)) / 2;
    const rightCol = cards.filter((c) => c.getBoundingClientRect().left >= mid - 2);
    const last = rightCol[rightCol.length - 1] || cards[cards.length - 1];
    const card = last.getBoundingClientRect();
    const vh = window.innerHeight || 844;
    if (card.bottom <= 0 || card.top >= vh) {
      return { ok: false, reason: 'card-not-visible', card: { bottom: card.bottom, top: card.top } };
    }
    const floaters = [...document.querySelectorAll('button.fixed')].filter((btn) => {
      const label = `${btn.getAttribute('aria-label') || ''} ${btn.textContent || ''}`;
      return /무니|mooni|맨 위로|scroll/i.test(label);
    });
    const gaps = floaters.map((btn) => {
      const r = btn.getBoundingClientRect();
      const horizontal = card.right > r.left + 4 && card.left < r.right - 4;
      const verticalOverlap = horizontal && card.bottom > r.top + 4;
      return {
        label: btn.getAttribute('aria-label') || btn.textContent?.trim()?.slice(0, 12),
        top: Math.round(r.top),
        cardBottom: Math.round(card.bottom),
        verticalOverlap,
        clearance: Math.round(r.top - card.bottom),
      };
    });
    const bad = gaps.filter((g) => g.verticalOverlap);
    return { ok: bad.length === 0, gaps, bad };
  });
  expect(report.ok, JSON.stringify(report)).toBe(true);
  return report;
}

async function assertScrollTopButtonOrangeVisible(page) {
  const scrollBtn = page.getByRole('button', { name: /맨 위로|^Top$/i }).last();
  await expect(scrollBtn).toBeVisible();
  const styles = await scrollBtn.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      backgroundColor: cs.backgroundColor,
      color: cs.color,
      opacity: cs.opacity,
    };
  });
  expect(styles.backgroundColor).toMatch(/245,\s*158,\s*11/);
  expect(Number(styles.opacity)).toBeGreaterThan(0.9);
  return { scrollBtn, styles };
}

async function screenshotScrollTopButton(page, fileName) {
  const { scrollBtn } = await assertScrollTopButtonOrangeVisible(page);
  const box = await scrollBtn.boundingBox();
  if (!box) throw new Error('scroll top button has no box');
  const pad = 8;
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${fileName}`,
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(390, box.width + pad * 2),
      height: box.height + pad * 2,
    },
  });
}

async function assertMooniFabDoesNotCoverLastNearbyCard(page) {
  const overlap = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-nearby-photo-card]')];
    const last = cards[cards.length - 1];
    const fab = [...document.querySelectorAll('button')].find((btn) =>
      /무니에게 묻기|ask mooni/i.test(
        `${btn.getAttribute('aria-label') || ''} ${btn.textContent || ''}`,
      ),
    );
    if (!last || !fab) return { ok: true, reason: 'missing' };
    const card = last.getBoundingClientRect();
    const btn = fab.getBoundingClientRect();
    const vh = window.innerHeight;
    const cardVisible = card.bottom > 0 && card.top < vh;
    const intersects =
      cardVisible &&
      card.left < btn.right &&
      card.right > btn.left &&
      card.top < btn.bottom &&
      card.bottom > btn.top;
    return { ok: !intersects, intersects, card, btn };
  });
  expect(overlap.ok, JSON.stringify(overlap)).toBe(true);
}

async function collectCardImageStats(section) {
  const cards = section.locator('[data-nearby-photo-card]');
  const count = await cards.count();
  let hasUrl = 0;
  let loaded = 0;
  let failed = 0;
  for (let i = 0; i < count; i++) {
    const row = await cards.nth(i).evaluate((node) => {
      const img = node.querySelector('img[data-festival-photo]');
      const url = img?.getAttribute('src') || '';
      const ok = Boolean(img && img.complete && img.naturalWidth > 0);
      const bad = Boolean(img && img.complete && img.naturalWidth === 0 && url);
      return { hasUrl: Boolean(url), loaded: ok, failed: bad };
    });
    if (row.hasUrl) hasUrl += 1;
    if (row.loaded) loaded += 1;
    if (row.failed) failed += 1;
  }
  return { total: count, hasUrl, loaded, failed };
}

async function assertTwoColumnGrid(section) {
  await expect(section.locator('[data-nearby-banner]')).toBeVisible({ timeout: 120_000 });
  await expect(section.locator('[data-nearby-group-title]').first()).toBeVisible();
  const cards = section.locator('[data-nearby-photo-card]');
  await expect(cards.first()).toBeVisible({ timeout: 120_000 });
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(2);
  const xs = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 6).map((n) => Math.round(n.getBoundingClientRect().left)),
  );
  const unique = new Set(xs);
  expect(unique.size, `expected 2+ distinct card x positions, got ${JSON.stringify(xs)}`).toBeGreaterThanOrEqual(2);
}

async function measureCloseVsRightColumnCards(page, section) {
  const close = page.getByRole('button', { name: /^닫기$|^Close$/i }).last();
  await expect(close).toBeVisible();
  await section.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const sheet = document.querySelector('[role="dialog"].overflow-y-auto');
    if (sheet) sheet.scrollTop = sheet.scrollHeight;
  });
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const buttons = [...document.querySelectorAll('body > button.fixed')];
    const closeBtn = buttons.find((b) => /닫기|Close/i.test(b.getAttribute('aria-label') || ''));
    if (!closeBtn) return { close: null, rightColumnCards: [], overlaps: [] };
    const btn = closeBtn.getBoundingClientRect();
    const cards = [...document.querySelectorAll('[data-nearby-photo-card]')];
    const lefts = cards.map((c) => c.getBoundingClientRect().left);
    const mid =
      lefts.length > 1
        ? (Math.min(...lefts) + Math.max(...lefts)) / 2
        : Number.POSITIVE_INFINITY;
    const rightColumnCards = cards
      .map((card) => {
        const r = card.getBoundingClientRect();
        return { title: card.querySelector('[data-nearby-compact-card]')?.textContent?.trim()?.slice(0, 24) || '', rect: r };
      })
      .filter((row) => row.rect.left >= mid - 2);
    const vh = window.innerHeight || 844;
    const overlaps = rightColumnCards
      .map((row) => {
        const r = row.rect;
        const visible = r.bottom > 0 && r.top < vh;
        const intersects =
          visible &&
          r.left < btn.right &&
          r.right > btn.left &&
          r.top < btn.bottom &&
          r.bottom > btn.top;
        return { title: row.title, intersects, visible };
      })
      .filter((row) => row.intersects);
    const toJson = (rect) => ({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
    });
    return {
      close: toJson(btn),
      rightColumnCards: rightColumnCards.map((row) => ({
        title: row.title,
        rect: toJson(row.rect),
      })),
      overlaps,
    };
  });
}

async function assertCloseButtonDoesNotOverlapCards(page, section) {
  const report = await measureCloseVsRightColumnCards(page, section);
  test.info().attach('close-x-bbox-390', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  expect(report.overlaps?.length || 0, JSON.stringify(report)).toBe(0);
}

test.describe('Festival nearby cards — flag ON', () => {
  test.beforeEach(async ({ context }) => {
    skipUnlessNearbyCardsLocal();
    await installFestivalNearbyCardsFixtures(context);
  });

  test('825295 attractions + food banner, grid, band chip scroll', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/korea/');
    await dismissLocHint(page);

    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    await waitNearbyCardImages(dialog);

    await scrollSheetToShowNearbyGrid(page);
    const scrollBefore = await readSheetScrollTop(page);
    const walkCell = attractions.locator('[data-nearby-summary-cell][data-band="walk"]');
    if ((await walkCell.getAttribute('disabled')) == null) {
      await walkCell.click();
      await page.waitForTimeout(600);
    }
    const scrollAfter = await readSheetScrollTop(page);
    const walkVis = await measureNearbyBandHeaderVisibility(page, 'walk');
    expect(walkVis.ok, JSON.stringify(walkVis)).toBe(true);
    expect(scrollAfter).not.toBe(scrollBefore);
    await clearNearbyBandFilter(attractions);

    const food = dialog.locator('[data-festival-section="nearFood"]');
    await expect(food).toBeVisible({ timeout: 120_000 });
    await assertTwoColumnGrid(food);
    await waitNearbyCardImages(dialog, 'nearFood');
    await assertCloseButtonDoesNotOverlapCards(page, attractions);
    await waitSheetReadyForCapture(page);
    await clearNearbyBandFilter(attractions);

    const attrStats = await collectCardImageStats(attractions);
    const foodStats = await collectCardImageStats(food);
    test.info().attach('825295-image-stats', {
      body: JSON.stringify({ attractions: attrStats, food: foodStats }, null, 2),
      contentType: 'application/json',
    });

    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/825295-nearAttractions-390-flag-on.png`,
    });
    await food.screenshot({
      path: `${SCREENSHOT_DIR}/825295-nearFood-390-flag-on.png`,
    });
  });

  test('4128786 attractions grid', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '4128786');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    await waitNearbyCardImages(dialog);
    await waitSheetReadyForCapture(page);
    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/4128786-nearAttractions-390-flag-on.png`,
    });
    const food = dialog.locator('[data-festival-section="nearFood"]');
    if ((await food.count()) > 0) {
      await assertTwoColumnGrid(food);
      await waitNearbyCardImages(dialog, 'nearFood');
      await food.screenshot({
        path: `${SCREENSHOT_DIR}/4128786-nearFood-390-flag-on.png`,
      });
    }
  });

  test('4106717 attractions only — no empty food banner', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '4106717');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    await waitNearbyCardImages(dialog);
    await waitSheetReadyForCapture(page);
    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/4106717-nearAttractions-390-flag-on.png`,
    });
    const food = dialog.locator('[data-festival-section="nearFood"]');
    await expect(food).toHaveCount(0);
    await expect(dialog.locator('[data-nearby-banner]').filter({ hasText: '맛집' })).toHaveCount(0);
  });

  test('image failure shows compact card', async ({ page }) => {
    test.setTimeout(180_000);
    await page.route('**/*tong.visitkorea.or.kr/**', (route) => route.abort());
    await page.route('**/*cdn.visitkorea.or.kr/**', (route) => route.abort());
    await dismissLocHint(page);
    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await expect(attractions.locator('[data-nearby-compact-card]').first()).toBeVisible({
      timeout: 120_000,
    });
    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/825295-image-failure-compact-390-flag-on.png`,
    });
  });

  test('825295 mobile grid balance with FAB overlay @evidence', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    await waitNearbyCardImages(dialog);
    await scrollSheetToShowNearbyGrid(page);
    await forceShowScrollTopButton(page);
    const balance = await measureNearbyGridHorizontalBalance(page);
    test.info().attach('nearby-grid-margin-390', {
      body: JSON.stringify(balance, null, 2),
      contentType: 'application/json',
    });
    expect(balance.ok, JSON.stringify(balance)).toBe(true);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/825295-nearby-grid-balance-390-flag-on.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('825295 distance band chips scroll to section headers @390', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    await waitNearbyCardImages(dialog);
    await scrollSheetToShowNearbyGrid(page);

    for (const band of ['walk', 'drive', 'far']) {
      await clearNearbyBandFilter(attractions);
      const clicked = await clickNearbyBandChip(attractions, band);
      if (!clicked) continue;
      const vis = await measureNearbyBandHeaderVisibility(page, band);
      expect(vis.ok, JSON.stringify(vis)).toBe(true);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/825295-band-chip-${band}-390-flag-on.png`,
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
    }
  });

  test('distance band selected ring state @evidence', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    const walkCell = attractions.locator('[data-nearby-summary-cell][data-band="walk"]');
    if ((await walkCell.getAttribute('disabled')) == null) {
      await walkCell.click();
    }
    await expect(attractions.locator('[data-nearby-group-highlighted="true"]').first()).toBeVisible();
    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/825295-band-walk-selected-390-flag-on.png`,
    });
  });

  test('825295 scroll top button orange visible @siteqa @evidence', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '825295');
    await waitNearbyCardImages(dialog);
    await scrollSheetToShowNearbyGrid(page);
    await forceShowScrollTopButton(page);
    await screenshotScrollTopButton(page, '825295-scroll-top-button-390-flag-on.png');
  });

  test('4106717 nearby grid bottom clears FAB stack @siteqa @evidence', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '4106717');
    await waitNearbyCardImages(dialog);
    await scrollNearbyCardsSectionToEnd(page);
    await forceShowScrollTopButton(page);
    const balance = await measureNearbyGridHorizontalBalance(page);
    expect(balance.ok, JSON.stringify(balance)).toBe(true);
    await assertFloatingButtonsClearLastRightColumnCard(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/4106717-nearby-grid-bottom-390-flag-on.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    const moreBtn = dialog.locator('[data-festival-near-scenic-more]');
    await expect(moreBtn).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => {
      const more = document.querySelector('[data-festival-near-scenic-more]');
      const cards = document.querySelector('[data-nearby-cards-section]');
      if (!more || !cards) return;
      const gap = more.getBoundingClientRect().top - cards.getBoundingClientRect().bottom;
      if (gap > 16) {
        more.scrollIntoView({ block: 'end' });
      } else {
        more.scrollIntoView({ block: 'center' });
      }
    });
    await page.waitForTimeout(350);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/4106717-grid-end-more-button-390-flag-on.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"].overflow-y-auto');
      if (dialog) dialog.scrollTop = dialog.scrollHeight;
    });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/4106717-sheet-bottom-390-flag-on.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('4128786 nearby grid bottom clears FAB stack @siteqa @evidence', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '4128786');
    await waitNearbyCardImages(dialog);
    await scrollNearbyCardsSectionToEnd(page);
    await forceShowScrollTopButton(page);
    const balance = await measureNearbyGridHorizontalBalance(page);
    expect(balance.ok, JSON.stringify(balance)).toBe(true);
    await assertFloatingButtonsClearLastRightColumnCard(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/4128786-nearby-grid-bottom-390-flag-on.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('4106717 food section hidden @evidence', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '4106717');
    await expect(dialog.locator('[data-festival-section="nearFood"]')).toHaveCount(0);
    await expect(dialog.locator('[data-nearby-banner]').filter({ hasText: '맛집' })).toHaveCount(0);
    await waitNearbyCardImages(dialog, 'nearAttractions');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await expect(attractions.locator('[data-nearby-photo-card]').filter({ hasText: '예천박물관' })).toBeVisible();
    await scrollTo4106717BottomEvidence(page);
    const lodging = dialog.locator('[data-festival-section="lodging"]');
    const packages = dialog.locator('[data-festival-section="packages"]');
    await expect(lodging.or(packages).first()).toBeVisible({ timeout: 60_000 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/4106717-page-bottom-no-food-390-flag-on.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/4106717-page-bottom-no-food-390-flag-on-full.png`,
      fullPage: true,
    });
  });
});

test.describe('Festival nearby cards — flag OFF', () => {
  test.beforeEach(() => {
    skipUnlessNearbyCardsLocal();
  });

  test('825295 sheet padding matches main (no nearby cards DOM) @flagOff', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/korea/');
    await dismissLocHint(page);
    const dialog = await openFestival(page, '825295');
    await expect(dialog.locator('[data-nearby-cards-section]')).toHaveCount(0);
    const paddingRight = await page.evaluate(() => {
      const el = document.querySelector('[data-festival-sheet-content]');
      return el ? getComputedStyle(el).paddingRight : null;
    });
    expect(paddingRight).toBe('20px');
    await screenshotNearbyAttractionsComparison(
      page,
      dialog,
      '825295-nearAttractions-390-flag-off.png',
    );
  });
});

test('825295 attractions desktop 1280 flag ON @desktop1280', async ({ page }) => {
  skipUnlessNearbyCardsLocal();
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await dismissLocHint(page);
  const dialog = await openFestival(page, '825295');
  const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
  await assertTwoColumnGrid(attractions);
  await waitNearbyCardImages(dialog);
  await scrollNearbyAttractionsToComparisonView(page);
  await clearNearbyBandFilter(attractions);
  if (await clickNearbyBandChip(attractions, 'drive')) {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/825295-band-chip-drive-1280-flag-on.png`,
    });
  }
  await assertCloseButtonDoesNotOverlapCards(page, attractions);
  await attractions.screenshot({
    path: `${SCREENSHOT_DIR}/825295-nearAttractions-1280-flag-on.png`,
  });
  await waitNearbyCardImages(dialog);
  await scrollNearbyCardsSectionToEnd(page);
  await assertMooniFabDoesNotCoverLastNearbyCard(page);
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/825295-nearAttractions-1280-end-flag-on.png`,
    clip: { x: 0, y: 0, width: 1280, height: 720 },
  });
});

test('825295 festival sheet on production main @mainBaseline', async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(Boolean(process.env.NEARBY_CARDS_E2E), 'prod baseline without local nearby-cards server');
  await page.goto('https://www.gateo.kr/korea/', { waitUntil: 'domcontentloaded' });
  await dismissLocHint(page);
  await page.goto('https://www.gateo.kr/korea/?festival=825295', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  await screenshotNearbyAttractionsComparison(
    page,
    dialog,
    '825295-nearAttractions-390-main-prod.png',
  );
});
