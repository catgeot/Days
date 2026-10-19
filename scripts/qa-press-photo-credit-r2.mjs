#!/usr/bin/env node
/**
 * PR #523 press QA — WebKit, flag-ON preview at SMOKE_SITE_URL.
 * Output: /opt/cursor/artifacts/photo-credit-r2/
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { webkit } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const OUT = process.env.PHOTO_CREDIT_R2_OUT || '/opt/cursor/artifacts/photo-credit-r2';
const BASE = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const PROD = 'https://www.gateo.kr/';
const R = {};
const log = (k, v) => {
  R[k] = v;
  console.log(k, JSON.stringify(v));
};
let n = 0;
const shot = async (p, name, clip) => {
  const f = `${String(++n).padStart(2, '0')}-${name}.png`;
  await p
    .screenshot({ path: join(OUT, f), ...(clip ? { clip } : {}) })
    .catch((e) => console.log('shotfail', e.message));
  return f;
};

mkdirSync(OUT, { recursive: true });

async function openGallery(page, base, slug, lang = 'ko') {
  const q = lang === 'en' ? '?lang=en' : '';
  await page.goto(`${base}place/${slug}/gallery${q}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.locator('img[alt^="place-img-"]').first().waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForTimeout(2500);
}

const lbOpen = (p) =>
  p.evaluate(() => {
    if (document.querySelector('[aria-modal="true"]')) return 'aria-modal';
    const vw = innerWidth;
    const big = [...document.images].find(
      (i) =>
        !i.alt?.startsWith('place-img-') &&
        i.getBoundingClientRect().width > vw * 0.5 &&
        getComputedStyle(i).visibility !== 'hidden' &&
        i.getBoundingClientRect().top < innerHeight,
    );
    return big ? `bigimg:${(big.src || '').slice(0, 60)}` : false;
  });

async function firstCreditTile(page) {
  return page.evaluate(() => {
    const cs = [...document.querySelectorAll('[data-gallery-photo-credit]')];
    const c = cs.find(
      (node) =>
        node.querySelectorAll('a').length >= 1 &&
        node.getBoundingClientRect().top > 80 &&
        node.getBoundingClientRect().bottom < innerHeight - 10,
    );
    if (!c) return null;
    cs.forEach((x) => x.removeAttribute('data-qa'));
    c.setAttribute('data-qa', 't');
    return c.innerText;
  });
}

function diffPng(pathA, pathB) {
  const a = PNG.sync.read(readFileSync(pathA));
  const b = PNG.sync.read(readFileSync(pathB));
  const diff = new PNG({ width: a.width, height: a.height });
  const mismatched = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  return { mismatched, diffBytes: PNG.sync.write(diff) };
}

const browser = await webkit.launch({ headless: true });

// (a) Desktop 1280 — credit clicks open new tab only, no lightbox
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const p = await ctx.newPage();
  const pages = [];
  ctx.on('page', (pg) => pages.push(pg));

  await openGallery(p, BASE, 'cairo');
  log('A_url', p.url());
  await shot(p, 'A-desktop-cairo-grid');

  for (const [i, label] of [[0, 'author'], [1, 'provider']]) {
    await p.locator('[data-gallery-photo-credit]').first().scrollIntoViewIfNeeded();
    const txt = await firstCreditTile(p);
    if (!txt) {
      log('A_nocredit', true);
      break;
    }
    const a = p.locator('[data-qa="t"] a').nth(i);
    const href = await a.getAttribute('href');
    const tgt = await a.getAttribute('target');
    const before = pages.length;
    await a.click({ timeout: 8000 }).catch(async () => {
      await a.click({ force: true });
    });
    await p.waitForTimeout(2500);
    const np = pages.slice(before).map((x) => x.url());
    log(`A_${label}`, {
      credit: txt,
      href,
      target: tgt,
      newPageCount: np.length,
      newPages: np,
      lightbox: await lbOpen(p),
      gateoUrl: p.url(),
    });
    await shot(p, `A-desktop-after-${label}-click`);
    for (const pg of pages.slice(before)) {
      await pg.close().catch(() => {});
    }
    await p.keyboard.press('Escape');
    await p.waitForTimeout(800);
  }

  for (const slug of ['venice', 'yanggu']) {
    await openGallery(p, BASE, slug);
    await shot(p, `F-desktop-${slug}-1280`);
  }

  await ctx.close();
}

// Mobile 390
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const p = await ctx.newPage();

  await openGallery(p, BASE, 'cairo');
  await shot(p, 'B-mobile-cairo-grid');

  // (d) link hit-area height
  log(
    'D_linkHitArea',
    await p.evaluate(() => {
      const links = [...document.querySelectorAll('[data-gallery-photo-credit] a')].slice(0, 8);
      return links.map((a) => {
        const r = a.getBoundingClientRect();
        return { text: a.innerText.slice(0, 24), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      });
    }),
  );

  // (e) longest author tile crop
  const longestTile = await p.evaluateHandle(() => {
    const credits = [...document.querySelectorAll('[data-gallery-photo-credit]')];
    const scored = credits
      .map((c) => {
        const author = c.querySelector('a');
        const provider = c.querySelectorAll('a')[1];
        return {
          c,
          authorLen: author?.innerText?.length || 0,
          providerVisible: provider
            ? provider.getBoundingClientRect().width > 0 &&
              provider.innerText.includes('Unsplash') ||
              provider.innerText.includes('Pexels')
            : false,
        };
      })
      .sort((a, b) => b.authorLen - a.authorLen);
    return scored[0]?.c?.parentElement || null;
  });
  if (longestTile.asElement()) {
    await longestTile.asElement().scrollIntoViewIfNeeded();
    await p.waitForTimeout(600);
    await longestTile.asElement().screenshot({ path: join(OUT, 'E-mobile-longest-author-tile.png') });
  }

  // (b) tile tap opens lightbox
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);
  await p.locator('img[alt^="place-img-"]').nth(1).evaluate((img) => {
    img.closest('.break-inside-avoid')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await p.waitForTimeout(1500);
  log('B_tileTap_lightbox', await lbOpen(p));
  await shot(p, 'B-mobile-tile-tap-lightbox');
  await p.getByRole('button', { name: /닫기|Close/i }).first().click({ timeout: 5000 }).catch(() => {});
  await p.keyboard.press('Escape');
  await p.waitForTimeout(1200);
  if (await lbOpen(p)) {
    await p.locator('[aria-modal="true"] button').first().click({ timeout: 3000 }).catch(() => {});
    await p.waitForTimeout(800);
  }

  // (c) credit link same-tab + back restores scroll
  await p.evaluate(() => {
    const el = document.querySelector('[data-place-gallery-scroll]');
    if (el) el.scrollTop = 520;
    else scrollTo(0, 520);
  });
  await p.waitForTimeout(800);
  const txt = await firstCreditTile(p);
  const author = p.locator('[data-qa="t"] a').first();
  const href = await author.getAttribute('href');
  const before = {
    url: p.url(),
    scrollY: await p.evaluate(() => {
      const el = document.querySelector('[data-place-gallery-scroll]');
      return el ? el.scrollTop : window.scrollY;
    }),
  };
  await shot(p, 'C-mobile-before-credit-tap');
  const ab = await author.boundingBox();
  await p.touchscreen.tap(ab.x + ab.width / 2, ab.y + ab.height / 2);
  await p.waitForTimeout(5000);
  log('C_authorTap', {
    credit: txt,
    href,
    finalUrl: p.url(),
    utmOk:
      /utm_source=gateo/.test(href || '') && /utm_medium=referral/.test(href || ''),
    landedOnUnsplash: /unsplash\.com/.test(p.url()),
    lightboxOnExternal: /127\.0\.0\.1/.test(before.url) ? await lbOpen(p) : 'left-page',
  });
  await shot(p, 'C-mobile-on-external');
  await p.goBack({ timeout: 60_000 }).catch((e) => log('C_goBackErr', e.message.slice(0, 120)));
  await p.waitForTimeout(4000);
  const after = {
    url: p.url(),
    scrollY: await p.evaluate(() => {
      const el = document.querySelector('[data-place-gallery-scroll]');
      return el ? el.scrollTop : window.scrollY;
    }),
    lightbox: await lbOpen(p),
  };
  log('C_afterBack', { before, after, scrollDelta: Math.abs(after.scrollY - before.scrollY) });
  await shot(p, 'C-mobile-after-goBack');

  for (const slug of ['venice', 'yanggu']) {
    await openGallery(p, BASE, slug);
    await p.evaluate(() => scrollBy(0, 400));
    await p.waitForTimeout(1500);
    await shot(p, `F-mobile-${slug}-390`);
  }

  await ctx.close();
}

// Flag OFF vs prod (cairo 390 ko) — requires default build; log note if credits visible
{
  const creditCount = await (async () => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'ko-KR',
      ignoreHTTPSErrors: true,
    });
    const p = await ctx.newPage();
    await openGallery(p, BASE, 'cairo');
    const localFile = join(OUT, 'flag-off-local-cairo-390.png');
    await p.screenshot({ path: localFile, clip: { x: 0, y: 0, width: 390, height: 844 } });
    await openGallery(p, PROD, 'cairo');
    const prodFile = join(OUT, 'flag-off-prod-cairo-390.png');
    await p.screenshot({ path: prodFile, clip: { x: 0, y: 0, width: 390, height: 844 } });
    const { mismatched, diffBytes } = diffPng(prodFile, localFile);
    writeFileSync(join(OUT, 'flag-off-vs-prod-diff.png'), diffBytes);
    const credits = await p.evaluate(
      () => document.querySelectorAll('[data-gallery-photo-credit]').length,
    );
    await ctx.close();
    log('FLAG_OFF_vs_prod_pixels', { mismatched, note: 'local build should be flag-OFF for 0 diff' });
    return credits;
  })();
  log('FLAG_OFF_prod_credit_nodes', creditCount);
}

await browser.close();
writeFileSync(join(OUT, 'results.json'), JSON.stringify(R, null, 2));
writeFileSync(
  join(OUT, 'NOTES.md'),
  `# Photo credit R2 press QA\n\n- Preview: ${BASE}\n- Artifacts in this folder\n- See results.json for structured logs\n`,
);
console.log(`done: ${OUT}`);
