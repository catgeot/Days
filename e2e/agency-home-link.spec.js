import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const VISITS_KEY = 'gateo:travel-agencies:v1:visits';
const STAY_HREF =
  'https://www.myrealtrip.com/accommodations?q=%EC%B9%B4%EC%98%A4%EB%9D%BD&mylink_id=2640202&utm_source=mktpartner';
const ARTIFACT_DIR = '/opt/cursor/artifacts';

const PARTNER_HOST =
  /myrealtrip\.com|myrealt\.rip|klook\.com|trip\.com|getyourguide\.com|12go\.asia|airalo\.|holafly\.|tiqets\.|bounce\.com|bikesbooking\.|directferries\./i;

test('planner keeps a visited agency in the catalog and the home link preserves the last URL', async ({
  page,
}, testInfo) => {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const viewport = testInfo.project.use.viewport;
  const width = viewport?.width ?? 1280;

  await page.route('**/*', (route) => {
    const url = route.request().url();
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      return route.continue();
    }
    if (PARTNER_HOST.test(host) || /gemini-proxy|generativelanguage\.googleapis/i.test(url)) {
      return route.abort();
    }
    return route.continue();
  });

  await page.addInitScript(
    ({ key, visits }) => {
      localStorage.setItem(key, JSON.stringify(visits));
      document.addEventListener(
        'click',
        (event) => {
          const node = event.target;
          if (!(node instanceof Element)) return;
          const anchor = node.closest('a[href]');
          if (!anchor) return;
          let host = '';
          try {
            host = new URL(anchor.href, window.location.href).hostname;
          } catch {
            return;
          }
          if (!/gateo\.kr|localhost|127\.0\.0\.1/i.test(host)) event.preventDefault();
        },
        true,
      );
    },
    {
      key: VISITS_KEY,
      visits: [
        {
          agencyId: 'mrt',
          href: STAY_HREF,
          kind: 'stay',
          placeLabel: '카오락',
          visitedAt: 1763300000000,
        },
      ],
    },
  );

  const popups = [];
  page.on('popup', (popup) => {
    popups.push(popup);
  });

  await page.goto('/place/khao-lak/planner?lang=ko', { waitUntil: 'domcontentloaded' });
  const catalog = page.locator('#planner-connected-agencies');
  await expect(catalog).toBeVisible();
  await catalog.locator('summary').click();

  const ua = await page.evaluate(() => navigator.userAgent);
  const mobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const catalogMrt = catalog.getByRole('link', { name: /마이리얼트립/ }).first();
  await expect(catalogMrt).toBeVisible();
  const catalogHref = await catalogMrt.getAttribute('href');
  expect(catalogHref).toBeTruthy();
  expect(catalogHref).not.toContain('/accommodations');

  const plannerDirectory = page.locator('section', {
    has: page.locator('#planner-connected-agencies'),
  });
  const home = plannerDirectory.locator('[data-gateo-agency-home="mrt"]');
  await expect(home).toBeVisible();
  await expect(home).toHaveText('홈');
  await expect(home).toHaveAttribute('aria-label', '마이리얼트립 홈 열기');
  await expect(home).toHaveAttribute('href', catalogHref);
  await expect(home).toHaveAttribute('target', mobile ? '_self' : '_blank');
  if (!mobile) await expect(home).toHaveAttribute('rel', 'noopener');

  const box = await home.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  const row = home.locator('xpath=..');
  const body = row.locator('a[href]').first();
  await expect(body).toHaveAttribute('href', STAY_HREF);
  const nameBox = await row.locator('span').first().boundingBox();
  const kindBox = await row.locator('span').nth(1).boundingBox();
  expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(box.x + 1);
  expect(kindBox.x + kindBox.width).toBeLessThanOrEqual(box.x + 1);

  const section = plannerDirectory;
  await section.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  const homeBox = await home.boundingBox();
  const catalogBox = await catalogMrt.boundingBox();
  const view = page.viewportSize();
  const top = Math.max(0, Math.floor(Math.min(homeBox.y, catalogBox.y) - 12));
  const bottom = Math.ceil(Math.max(homeBox.y + homeBox.height, catalogBox.y + catalogBox.height) + 24);
  const clipY = Math.min(top, Math.max(0, view.height - 1));
  const clipHeight = Math.max(1, Math.min(view.height - clipY, bottom - top));
  const shotName = width <= 400 ? 'agency-home-planner-390.png' : 'agency-home-planner-1280.png';
  await page.screenshot({
    path: `${ARTIFACT_DIR}/${shotName}`,
    clip: { x: 0, y: clipY, width, height: clipHeight },
  });

  await home.click();
  await expect(page).toHaveURL(/\/place\/khao-lak\/planner/);
  expect(popups).toEqual([]);
  const stored = await page.evaluate((key) => localStorage.getItem(key), VISITS_KEY);
  const mrt = JSON.parse(stored).find((item) => item.agencyId === 'mrt');
  expect(mrt.href).toBe(STAY_HREF);
  expect(mrt.placeLabel).toBe('카오락');
  expect(mrt.kind).toBe('stay');
  await expect(body).toHaveAttribute('href', STAY_HREF);
});
