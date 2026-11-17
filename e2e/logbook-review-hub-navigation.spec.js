import { test, expect } from '@playwright/test';

const HUB_PATH =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=overseas';
const HUB_PATH_EN =
  '/blog?tab=public&lang=en&logbook_review_hub=1&logbook_filter=1&region=overseas';
const HUB_PATH_DOMESTIC =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=domestic';
const HWASEONG_REVIEW_ID = 'a9e7d546-7b70-47ce-bea1-362f36d12156';

function removeChildCount(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e?.message || e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errs.push(msg.text());
  });
  return () => errs.filter((t) => /removeChild/i.test(t)).length;
}

async function openHub(page, path = HUB_PATH) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 90_000 });
  const toggle = page.getByTestId('logbook-official-review-hub-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 30_000 });
}

async function loadMoreIfPresent(page) {
  const more = page.getByTestId('logbook-official-review-hub-more');
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.waitForTimeout(300);
  }
}

async function scrollHub(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    if (el) el.scrollTop = 280;
  });
}

async function waitForHubScrollRestored(page, scrollBefore) {
  await page.waitForFunction(
    (before) => {
      const el = document.querySelector('[data-logbook-main-scroll]');
      if (!el) return false;
      const scrolled =
        Math.abs(el.scrollTop - before) < 80 ||
        (el.dataset.logbookHubScrollRestored === '1' &&
          Math.abs(Number(el.dataset.logbookHubScrollTarget || NaN) - before) < 80);
      return scrolled && Math.abs(el.scrollTop - before) < 80;
    },
    scrollBefore,
    { timeout: 30_000 },
  );
}

async function assertBlogHubVisible(page) {
  await expect(page.getByTestId('logbook-official-review-hub')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe('/blog');
  await expect.poll(async () => (await page.title()).length, { timeout: 5_000 }).toBeGreaterThan(3);
}

async function tapPlaceChromeBack(page) {
  const chrome = page.locator('[data-place-chrome-hit]');
  await expect(chrome).toBeVisible();
  const backBtn = chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i });
  const isWebkit = test.info().project.name.includes('webkit');
  if (isWebkit) await backBtn.tap();
  else await backBtn.click();
}

async function openHwaseongReviewFromHub(page) {
  await openHub(page, HUB_PATH_DOMESTIC);
  await page.getByTestId('logbook-review-filter-major-domestic').click();
  await scrollHub(page);
  const card = page.locator(
    `[data-testid="logbook-official-review-hub-item"][data-review-id="${HWASEONG_REVIEW_ID}"]`,
  );
  await expect(card).toBeVisible({ timeout: 30_000 });
  const scrollBefore = await page.evaluate(() => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    return el?.scrollTop ?? 0;
  });
  const isWebkit = test.info().project.name.includes('webkit');
  if (isWebkit) await card.tap();
  else await card.click();
  await page.waitForURL(
    new RegExp(
      `/place/hwaseong-fortress/reviews\\?.*review=${HWASEONG_REVIEW_ID.replace(/-/g, '\\-')}`,
    ),
    { timeout: 60_000 },
  );
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  await expect
    .poll(() => page.url(), { timeout: 60_000 })
    .toMatch(/\/place\/hwaseong-fortress\/reviews/);
  return { card, scrollBefore };
}

async function readHubScroll(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    return el?.scrollTop ?? 0;
  });
}

function isHubNavMatrix() {
  return test.info().project.name.includes('logbook-hub-nav');
}

function installHubScrollFrameSampler() {
  if (window.__gateoHubScrollSampler) return;
  window.__gateoHubScrollSampler = true;
  window.__gateoHubScrollFrames = [];
  window.__gateoHubScrollAdds = 0;
  const watch = (el) => {
    if (!(el instanceof HTMLElement)) return;
    if (!el.matches('[data-logbook-main-scroll]')) return;
    window.__gateoHubScrollAdds += 1;
    requestAnimationFrame(() => {
      window.__gateoHubScrollFrames.push(el.scrollTop);
    });
  };
  const scan = (node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches('[data-logbook-main-scroll]')) watch(node);
    node.querySelectorAll('[data-logbook-main-scroll]').forEach(watch);
  };
  const obs = new MutationObserver((records) => {
    for (const record of records) record.addedNodes.forEach(scan);
  });
  obs.observe(document, { childList: true, subtree: true });
  const noteExisting = () => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    if (!(el instanceof HTMLElement)) return;
    requestAnimationFrame(() => {
      window.__gateoHubScrollFrames.push(el.scrollTop);
    });
  };
  window.addEventListener('pageshow', noteExisting);
  window.addEventListener('popstate', () => {
    requestAnimationFrame(noteExisting);
  });
  window.__gateoHubScrollObs = obs;
}

async function armHubScrollFrames(page) {
  await page.addInitScript(installHubScrollFrameSampler);
  await page.evaluate(installHubScrollFrameSampler);
  await page.evaluate(() => {
    window.__gateoHubScrollFrames = [];
  });
}

async function readFirstHubScrollFrame(page) {
  try {
    await page.waitForFunction(
      () => Array.isArray(window.__gateoHubScrollFrames) && window.__gateoHubScrollFrames.length > 0,
      null,
      { timeout: 15_000 },
    );
  } catch (error) {
    const diag = await page.evaluate(() => {
      const el = document.querySelector('[data-logbook-main-scroll]');
      return {
        href: location.href,
        frames: window.__gateoHubScrollFrames ?? null,
        adds: window.__gateoHubScrollAdds ?? null,
        hasObs: Boolean(window.__gateoHubScrollObs),
        scrollTop: el?.scrollTop ?? null,
        items: document.querySelectorAll('[data-review-id]').length,
        session: sessionStorage.getItem('gateo:logbook-review-hub-ui'),
      };
    });
    throw new Error(`${error.message} ${JSON.stringify(diag)}`);
  }
  return page.evaluate(() => window.__gateoHubScrollFrames[0]);
}

async function readViewportAnchor(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-logbook-main-scroll]');
    if (!(root instanceof HTMLElement)) return null;
    const rootTop = root.getBoundingClientRect().top;
    const cards = root.querySelectorAll('[data-review-id]');
    for (const card of cards) {
      if (!(card instanceof HTMLElement)) continue;
      const rect = card.getBoundingClientRect();
      const offset = rect.top - rootTop;
      if (offset + rect.height <= 8) continue;
      return { id: card.getAttribute('data-review-id') || '', offset };
    }
    return null;
  });
}

async function expectScrollHeldNear(page, target, ms = 10_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const top = await readHubScroll(page);
    expect(Math.abs(top - target), `scroll ${top} drifted from ${target}`).toBeLessThan(80);
    expect(top).toBeGreaterThan(target - 80);
    await page.waitForTimeout(400);
  }
}

function pageErrorCount(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    const text = String(err?.message || err);
    // WebKit reports blocked calls to the CI placeholder Supabase host as pageerrors.
    if (/due to access control checks/i.test(text)) return;
    errors.push(text);
  });
  return () => errors;
}

async function hubScrollRoom(page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    if (!el) return 0;
    return el.scrollHeight - el.clientHeight;
  });
}

async function ensureHubCanScrollTo(page, target, attempts = 6) {
  for (let i = 0; i < attempts; i += 1) {
    const more = page.getByTestId('logbook-official-review-hub-more');
    if (!(await more.isVisible().catch(() => false))) break;
    const beforeCount = await page.getByTestId('logbook-official-review-hub-item').count();
    await more.scrollIntoViewIfNeeded();
    await more.click();
    await expect
      .poll(() => page.getByTestId('logbook-official-review-hub-item').count(), { timeout: 8_000 })
      .toBeGreaterThan(beforeCount);
  }
  const room = await hubScrollRoom(page);
  expect(room, `hub scroll room ${room}`).toBeGreaterThanOrEqual(target);
  return room;
}

async function setHubScroll(page, target) {
  const actual = await page.evaluate((top) => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    if (!el) return 0;
    el.scrollTop = top;
    return el.scrollTop;
  }, target);
  expect(Math.abs(actual - target)).toBeLessThan(30);
  return actual;
}

const KNOWN_HUB_PLACE_SLUGS = [
  'paris',
  'prague',
  'bangkok',
  'kyoto',
  'rome',
  'london',
  'vienna',
  'amsterdam',
  'barcelona',
  'osaka',
  'madrid',
  'bora-bora',
  'cairo',
  'sapa',
  'khao-lak',
];

async function openKnownPlaceHubCard(page) {
  const reviewId = await page.evaluate((slugs) => {
    const cards = [...document.querySelectorAll('[data-testid="logbook-official-review-hub-item"]')];
    const card = cards.find((item) => slugs.includes(item.getAttribute('data-hub-place-slug') || ''));
    if (!card) return '';
    card.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerId: 1 }),
    );
    card.click();
    return card.getAttribute('data-review-id') || '';
  }, KNOWN_HUB_PLACE_SLUGS);
  expect(reviewId).not.toBe('');
  await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 60_000 });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  await expect(page.locator('[data-place-chrome-hit]')).toBeVisible({ timeout: 20_000 });
}

async function openVisibleHubCard(page) {
  const reviewId = await page.evaluate(() => {
    const root = document.querySelector('[data-logbook-main-scroll]');
    const cards = [...document.querySelectorAll('[data-testid="logbook-official-review-hub-item"]')];
    const box = root?.getBoundingClientRect();
    const card =
      (box &&
        cards.find((item) => {
          const rect = item.getBoundingClientRect();
          return rect.bottom > box.top + 8 && rect.top < box.bottom - 8;
        })) ||
      cards[0];
    if (!card) return '';
    card.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerId: 1 }),
    );
    card.click();
    return card.getAttribute('data-review-id') || '';
  });
  expect(reviewId).not.toBe('');
  await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 60_000 });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
}

async function wheelHubBy(page, delta, minMove = 400) {
  const trace = await page.evaluate((distance) => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    if (!el) return null;
    const roomBelow = el.scrollHeight - el.clientHeight - el.scrollTop;
    const applied = Math.min(distance, Math.max(0, Math.floor(roomBelow - 4)));
    el.dispatchEvent(
      new WheelEvent('wheel', { deltaY: applied, bubbles: true, cancelable: true }),
    );
    const before = el.scrollTop;
    if (applied > 0) el.scrollBy(0, applied);
    return { before, immediate: el.scrollTop, applied, roomBelow };
  }, delta);
  expect(trace, JSON.stringify(trace)).toBeTruthy();
  expect(trace.immediate - trace.before, JSON.stringify(trace)).toBeGreaterThan(minMove);
  return trace;
}

async function expectWheelHeld(page, movedTo) {
  await page.waitForTimeout(120);
  const at120 = await readHubScroll(page);
  expect(Math.abs(at120 - movedTo)).toBeLessThan(80);
  await page.waitForTimeout(1880);
  const at2s = await readHubScroll(page);
  expect(Math.abs(at2s - movedTo)).toBeLessThan(80);
  await page.waitForTimeout(8000);
  const at10 = await readHubScroll(page);
  expect(Math.abs(at10 - movedTo)).toBeLessThan(80);
}

async function expectWheelNotRepinned(page, restored, movedTo) {
  await page.waitForTimeout(500);
  const at500 = await readHubScroll(page);
  expect(Math.abs(at500 - restored)).toBeGreaterThan(400);
  expect(Math.abs(at500 - movedTo)).toBeLessThan(80);
  await page.waitForTimeout(1500);
  const at2s = await readHubScroll(page);
  expect(Math.abs(at2s - restored)).toBeGreaterThan(400);
  expect(Math.abs(at2s - movedTo)).toBeLessThan(80);
}

test.describe('LogBook review hub navigation @mocked', () => {
  test('390 WebKit — hub→review→back restores list state, removeChild 0', async ({ page }) => {
    const isWebkit = test.info().project.name.includes('webkit');
    test.skip(!isWebkit, 'WebKit-only matrix row');

    await page.setViewportSize({ width: 390, height: 844 });
    const countRemoveChild = removeChildCount(page);
    await openHub(page, HUB_PATH);
    await page.getByTestId('logbook-review-filter-major-overseas').click();
    await loadMoreIfPresent(page);
    await scrollHub(page);

    const visibleBefore = await page.getByTestId('logbook-official-review-hub-item').count();
    const scrollBefore = await page.evaluate(() => {
      const el = document.querySelector('[data-logbook-main-scroll]');
      return el?.scrollTop ?? 0;
    });

    const first = page.getByTestId('logbook-official-review-hub-item').first();
    await first.tap();
    await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 60_000 });
    await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });

    await page.waitForTimeout(5_000);
    expect(countRemoveChild()).toBe(0);

    const chrome = page.locator('[data-place-chrome-hit]');
    await expect(chrome).toBeVisible();
    const backBtn = chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i });
    await backBtn.tap();
    await expect(page.getByTestId('logbook-official-review-hub')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
    expect(page.url()).toMatch(/\/blog/);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
    expect(title).toMatch(/GATEO|LogBook|logbook/i);

    await waitForHubScrollRestored(page, scrollBefore);
    const scrollAfter = await page.evaluate(() => {
      const el = document.querySelector('[data-logbook-main-scroll]');
      return el?.scrollTop ?? 0;
    });
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(80);
    const visibleAfter = await page.getByTestId('logbook-official-review-hub-item').count();
    expect(visibleAfter).toBeGreaterThanOrEqual(visibleBefore);

    await first.tap();
    await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 60_000 });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/\/blog/);
    await expect(page.getByTestId('logbook-official-review-hub')).toBeVisible();
    await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
    expect((await page.title()).length).toBeGreaterThan(3);

    await page.locator('[data-logbook-mobile-header]').getByRole('button', { name: 'GATEO' }).click();
    await page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 30_000 });
    expect(countRemoveChild()).toBe(0);
    await page.evaluate(() => {
      sessionStorage.removeItem('gateo:logbook-review-hub-ui');
    });
    await page.goto(HUB_PATH, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 90_000 });
    const homePanel = page.getByTestId('logbook-official-review-hub-panel');
    if (!(await homePanel.isVisible().catch(() => false))) {
      await page.getByTestId('logbook-official-review-hub-toggle').click();
    }
    await homePanel.waitFor({ timeout: 30_000 });
    const homeCard = page.getByTestId('logbook-official-review-hub-item').first();
    await homeCard.tap();
    await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 60_000 });
    await expect(page.getByRole('button', { name: '홈으로 이동' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: '홈으로 이동' }).click();
    await page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 30_000 });
    expect(countRemoveChild()).toBe(0);
  });

  test('hwaseong review deeplink — screen·browser back to /blog (prod path)', async ({
    page,
  }) => {
    test.skip(!isHubNavMatrix(), 'hub nav matrix only');
    const isWebkit = test.info().project.name.includes('webkit');

    const { card, scrollBefore: scrollTarget } = await openHwaseongReviewFromHub(page);

    await tapPlaceChromeBack(page);
    await assertBlogHubVisible(page);
    await waitForHubScrollRestored(page, scrollTarget);
    await expect(page.getByTestId('logbook-review-filter-major-domestic')).toBeVisible();

    if (isWebkit) await card.tap();
    else await card.click();
    await page.waitForURL(/\/place\/hwaseong-fortress\/reviews/, { timeout: 60_000 });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await assertBlogHubVisible(page);
    await waitForHubScrollRestored(page, scrollTarget);
  });

  test('scroll 1000 — screen and browser back stay put after wheel', async ({ page }) => {
    test.skip(!isHubNavMatrix(), 'hub nav matrix only');

    const pageErrors = pageErrorCount(page);
    const countRemoveChild = removeChildCount(page);
    await openHub(page, HUB_PATH);
    await ensureHubCanScrollTo(page, 1700);
    const visibleBefore = await page.getByTestId('logbook-official-review-hub-item').count();
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await setHubScroll(page, 1000);
    await armHubScrollFrames(page);
    await openVisibleHubCard(page);
    await tapPlaceChromeBack(page);
    await assertBlogHubVisible(page);
    expect(Math.abs((await readFirstHubScrollFrame(page)) - 1000)).toBeLessThan(80);
    await waitForHubScrollRestored(page, 1000);
    await expect.poll(() => hubScrollRoom(page), { timeout: 15_000 }).toBeGreaterThan(1600);
    const afterScreenBack = await readHubScroll(page);
    expect(Math.abs(afterScreenBack - 1000)).toBeLessThan(80);
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await page.getByTestId('logbook-official-review-hub-item').count()).toBeGreaterThanOrEqual(
      visibleBefore,
    );
    const screenWheel = await wheelHubBy(page, 600);
    await expectWheelNotRepinned(page, afterScreenBack, screenWheel.immediate);

    await setHubScroll(page, 1000);
    await armHubScrollFrames(page);
    await openVisibleHubCard(page);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await assertBlogHubVisible(page);
    expect(Math.abs((await readFirstHubScrollFrame(page)) - 1000)).toBeLessThan(80);
    await waitForHubScrollRestored(page, 1000);
    await expect.poll(() => hubScrollRoom(page), { timeout: 15_000 }).toBeGreaterThan(1600);
    const afterBrowserBack = await readHubScroll(page);
    expect(Math.abs(afterBrowserBack - 1000)).toBeLessThan(80);
    const browserWheel = await wheelHubBy(page, 600);
    await expectWheelNotRepinned(page, afterBrowserBack, browserWheel.immediate);

    expect(pageErrors()).toEqual([]);
    expect(countRemoveChild()).toBe(0);
  });

  test('opened from top — back does not pin scroll after wheel', async ({ page }) => {
    test.skip(!isHubNavMatrix(), 'hub nav matrix only');

    const pageErrors = pageErrorCount(page);
    const countRemoveChild = removeChildCount(page);
    await openHub(page, HUB_PATH);
    await setHubScroll(page, 0);
    await openVisibleHubCard(page);
    await tapPlaceChromeBack(page);
    await assertBlogHubVisible(page);
    await expect.poll(() => readHubScroll(page), { timeout: 8_000 }).toBeLessThan(40);
    const topWheel = await wheelHubBy(page, 600);
    await expectWheelNotRepinned(page, 0, topWheel.immediate);

    await setHubScroll(page, 0);
    await openVisibleHubCard(page);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await assertBlogHubVisible(page);
    await expect.poll(() => readHubScroll(page), { timeout: 8_000 }).toBeLessThan(40);
    const browserWheel = await wheelHubBy(page, 600);
    await expectWheelNotRepinned(page, 0, browserWheel.immediate);
    expect(pageErrors()).toEqual([]);
    expect(countRemoveChild()).toBe(0);
  });

  test('deep scroll — screen and browser back restore the saved offset', async ({ page }) => {
    test.skip(!isHubNavMatrix(), 'hub nav matrix only');

    const pageErrors = pageErrorCount(page);
    const countRemoveChild = removeChildCount(page);
    await openHub(page, HUB_PATH);
    await ensureHubCanScrollTo(page, 1700, 12);
    const room = await hubScrollRoom(page);
    const target = Math.min(2500, Math.floor(room - 40));
    expect(target).toBeGreaterThanOrEqual(1700);
    const visibleBefore = await page.getByTestId('logbook-official-review-hub-item').count();
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await setHubScroll(page, target);
    await openKnownPlaceHubCard(page);
    await tapPlaceChromeBack(page);
    await assertBlogHubVisible(page);
    await waitForHubScrollRestored(page, target);
    expect(Math.abs((await readHubScroll(page)) - target)).toBeLessThan(80);
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await page.getByTestId('logbook-official-review-hub-item').count()).toBeGreaterThanOrEqual(
      visibleBefore,
    );

    await setHubScroll(page, target);
    await openKnownPlaceHubCard(page);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await assertBlogHubVisible(page);
    await waitForHubScrollRestored(page, target);
    expect(Math.abs((await readHubScroll(page)) - target)).toBeLessThan(80);
    expect(pageErrors()).toEqual([]);
    expect(countRemoveChild()).toBe(0);
  });

  test('wheel 0.2s, 0.5s, and 1.5s after return continues from 1000', async ({ page }) => {
    test.skip(!isHubNavMatrix(), 'hub nav matrix only');
    test.setTimeout(300_000);

    const pageErrors = pageErrorCount(page);
    const countRemoveChild = removeChildCount(page);
    await openHub(page, HUB_PATH);
    await ensureHubCanScrollTo(page, 1700);
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    for (const delay of [200, 500, 1500]) {
      for (const mode of ['screen', 'browser']) {
        await setHubScroll(page, 1000);
        await armHubScrollFrames(page);
        await openVisibleHubCard(page);
        if (mode === 'screen') await tapPlaceChromeBack(page);
        else await page.goBack({ waitUntil: 'domcontentloaded' });
        await assertBlogHubVisible(page);
        const first = await readFirstHubScrollFrame(page);
        expect(Math.abs(first - 1000), `${mode} ${delay}ms first frame`).toBeLessThan(80);
        await page.waitForTimeout(delay);
        const wheel = await wheelHubBy(page, 600, 400);
        expect(Math.abs(wheel.before - 1000)).toBeLessThan(80);
        expect(Math.abs(wheel.immediate - 1600)).toBeLessThan(120);
        expect(wheel.immediate).toBeGreaterThan(1200);
        await expectWheelHeld(page, wheel.immediate);
      }
    }

    expect(pageErrors()).toEqual([]);
    expect(countRemoveChild()).toBe(0);
  });

  test('no input after return keeps scroll at 1000', async ({ page }) => {
    test.skip(!isHubNavMatrix(), 'hub nav matrix only');
    test.setTimeout(180_000);

    const pageErrors = pageErrorCount(page);
    const countRemoveChild = removeChildCount(page);
    await openHub(page, HUB_PATH);
    await ensureHubCanScrollTo(page, 1700);

    await setHubScroll(page, 1000);
    await armHubScrollFrames(page);
    await openVisibleHubCard(page);
    await tapPlaceChromeBack(page);
    await assertBlogHubVisible(page);
    expect(Math.abs((await readFirstHubScrollFrame(page)) - 1000)).toBeLessThan(80);
    await expectScrollHeldNear(page, 1000);

    await setHubScroll(page, 1000);
    await armHubScrollFrames(page);
    await openVisibleHubCard(page);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await assertBlogHubVisible(page);
    expect(Math.abs((await readFirstHubScrollFrame(page)) - 1000)).toBeLessThan(80);
    await expectScrollHeldNear(page, 1000);
    expect(pageErrors()).toEqual([]);
    expect(countRemoveChild()).toBe(0);
  });

  test('list delayed 2.5s keeps the card that was in view', async ({ page }) => {
    test.skip(!isHubNavMatrix(), 'hub nav matrix only');
    test.setTimeout(180_000);

    const pageErrors = pageErrorCount(page);
    const countRemoveChild = removeChildCount(page);
    await openHub(page, HUB_PATH);
    await ensureHubCanScrollTo(page, 1700);
    await page.evaluate(() => {
      sessionStorage.setItem('gateo:e2e-logbook-hub-list-delay-ms', '2500');
    });

    for (const mode of ['screen', 'browser']) {
      await setHubScroll(page, 1000);
      const anchor = await readViewportAnchor(page);
      expect(anchor?.id).toBeTruthy();
      await armHubScrollFrames(page);
      await openVisibleHubCard(page);
      if (mode === 'screen') await tapPlaceChromeBack(page);
      else await page.goBack({ waitUntil: 'domcontentloaded' });
      await assertBlogHubVisible(page);
      const first = await readFirstHubScrollFrame(page);
      expect(Math.abs(first - 1000), `${mode} delayed first frame`).toBeLessThan(80);
      await page.waitForTimeout(3200);
      const after = await readHubScroll(page);
      expect(Math.abs(after - 1000), `${mode} delayed scroll`).toBeLessThan(80);
      const still = await readViewportAnchor(page);
      expect(still?.id).toBe(anchor.id);
      expect(Math.abs(still.offset - anchor.offset)).toBeLessThan(80);
    }

    expect(pageErrors()).toEqual([]);
    expect(countRemoveChild()).toBe(0);
  });

  test('1280 — EN hub title + city chip label', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHub(page, HUB_PATH_EN);
    const hubToggle = page.getByTestId('logbook-official-review-hub-toggle');
    const hubText = await hubToggle.innerText();
    expect(hubText).toMatch(/GATEO reviewer reviews/i);
    const card = page.getByTestId('logbook-official-review-hub-item').first();
    const reviewer = card.getByTestId('logbook-official-review-hub-card-reviewer');
    await expect(reviewer).toBeVisible();
    const badge = await card.getAttribute('data-hub-persona-badge');
    expect(badge).toBeTruthy();
    await expect(reviewer).toHaveText(badge);
    const domestic = page.getByTestId('logbook-review-filter-major-domestic');
    await expect(domestic).toContainText('Korea');
    const cityChip = page.locator('[data-testid^="logbook-review-filter-city-"]').first();
    await expect(cityChip).toBeVisible();
    const chipText = await cityChip.innerText();
    expect(chipText).not.toMatch(/^[가-힣]/);
  });

  test('same-date hub cards keep id order after review back', async ({ page }) => {
    test.skip(!isHubNavMatrix(), 'hub nav matrix only');

    await page.addInitScript(() => {
      const key = 'gateo:e2e-logbook-hub-tie-shuffle';
      if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, 'forward');
    });
    await openHub(page, HUB_PATH);

    const tieIds = () =>
      page.locator('[data-testid="logbook-official-review-hub-item"]').evaluateAll((nodes) =>
        nodes
          .map((node) => node.getAttribute('data-review-id'))
          .filter((id) => id && id.startsWith('tie-')),
      );
    const expectedTies = ['tie-a', 'tie-b', 'tie-c'];

    await expect.poll(tieIds).toEqual(expectedTies);
    const visibleBefore = await page.getByTestId('logbook-official-review-hub-item').count();
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.evaluate(() => {
      sessionStorage.setItem('gateo:e2e-logbook-hub-tie-shuffle', 'reverse');
    });
    const card = page.locator(
      '[data-testid="logbook-official-review-hub-item"][data-review-id="tie-a"]',
    );
    await card.scrollIntoViewIfNeeded();
    const isWebkit = test.info().project.name.includes('webkit');
    if (isWebkit) await card.tap();
    else await card.click();
    await page.waitForURL(/\/place\/rome\/reviews/, { timeout: 60_000 });
    await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await assertBlogHubVisible(page);
    await expect(page.getByTestId('logbook-official-review-hub-panel')).toBeVisible();
    await expect.poll(tieIds).toEqual(expectedTies);
    expect(await page.getByTestId('logbook-official-review-hub-item').count()).toBe(visibleBefore);
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('gateo:e2e-logbook-hub-tie-shuffle')))
      .toBe('reverse');
    const panel = page.getByTestId('logbook-official-review-hub-panel');
    await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 90_000 });
    if (!(await panel.isVisible().catch(() => false))) {
      await page.getByTestId('logbook-official-review-hub-toggle').click();
    }
    await panel.waitFor({ timeout: 30_000 });
    await page.waitForFunction(() => (window.__gateoHubListApplies || 0) >= 1);
    await expect.poll(tieIds).toEqual(expectedTies);
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});