#!/usr/bin/env node
/**
 * WebKit gallery photo-credit evidence (flag ON/OFF × ko/en × 390/1280 × Cairo/Venice/Yanggu).
 *   npm run build && npm run preview &
 *   SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/capture-gallery-photo-credit-evidence.mjs
 *
 * Pixel parity (flag OFF vs PROD main): cairo-390-ko-flag-off vs prod snapshot.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { webkit } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const PROD = 'https://www.gateo.kr/';
const LOCAL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT =
  process.env.GALLERY_PHOTO_CREDIT_OUT || '/opt/cursor/artifacts/gallery-photo-credit';

const PLACES = [
  {
    slug: 'cairo',
    ko: { query: '카이로', result: '카이로여행지' },
    en: { query: 'Cairo', result: 'Cairo' },
  },
  {
    slug: 'venice',
    ko: { query: '베니스', result: '베니스' },
    en: { query: 'Venice', result: 'Venice' },
  },
  {
    slug: 'yanggu',
    ko: { query: '양구', result: '양구' },
    en: { query: 'Yanggu', result: 'Yanggu' },
  },
];

async function openPlaceGallery(page, base, lang, slug) {
  const langQuery = lang === 'en' ? '?lang=en' : '';
  await page.goto(`${base}place/${slug}/gallery${langQuery}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.locator('img[alt^="place-img-"]').first().waitFor({ state: 'visible', timeout: 120_000 });
}

async function viewportShot(page, fileName) {
  const width = page.viewportSize()?.width || 390;
  const height = page.viewportSize()?.height || 844;
  const path = join(OUT, fileName);
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width, height },
  });
  return path;
}

function diffPng(pathA, pathB) {
  const a = PNG.sync.read(readFileSync(pathA));
  const b = PNG.sync.read(readFileSync(pathB));
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`dimension mismatch ${pathA} vs ${pathB}`);
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const mismatched = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.1,
  });
  return { mismatched, diffBytes: PNG.sync.write(diff) };
}

async function captureSet({ base, flagLabel, locales, widths }) {
  const artifacts = [];
  for (const width of widths) {
    const height = width === 390 ? 844 : 800;
    const browser = await webkit.launch({ headless: true });
    for (const lang of locales) {
      const context = await browser.newContext({
        viewport: { width, height },
        locale: lang === 'en' ? 'en-US' : 'ko-KR',
        ignoreHTTPSErrors: true,
      });
      const page = await context.newPage();
      for (const place of PLACES) {
        await openPlaceGallery(page, base, lang, place.slug);
        const file = `${place.slug}-${width}-${lang}-flag-${flagLabel}.png`;
        const path = await viewportShot(page, file);
        artifacts.push(file);
        console.log(`OK ${file} (${base})`);
      }
      await context.close();
    }
    await browser.close();
  }
  return artifacts;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const flagLabel = process.env.GALLERY_PHOTO_CREDIT_FLAG === 'on' ? 'on' : 'off';
  const localArtifacts = await captureSet({
    base: LOCAL,
    flagLabel,
    locales: ['ko', 'en'],
    widths: [390, 1280],
  });

  let prodCairo = null;
  if (flagLabel === 'off') {
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: 'ko-KR',
    });
    const page = await context.newPage();
    const place = PLACES[0];
    await openPlaceGallery(page, PROD, 'ko', place.slug);
    prodCairo = await viewportShot(page, 'cairo-390-ko-prod-main.png');
    await browser.close();

    const localOff = join(OUT, 'cairo-390-ko-flag-off.png');
    const { mismatched, diffBytes } = diffPng(prodCairo, localOff);
    await writeFile(join(OUT, 'cairo-390-ko-flag-off-vs-prod-diff.png'), diffBytes);
    const manifest = {
      prod: prodCairo,
      localFlagOff: localOff,
      mismatchedPixels: mismatched,
      totalPixels: 390 * 844,
    };
    await writeFile(join(OUT, 'cairo-390-ko-flag-off-vs-prod.json'), JSON.stringify(manifest, null, 2));
    console.log(`pixel diff cairo OFF vs prod: ${mismatched} mismatched`);
    if (mismatched > 50) {
      console.warn('WARN: OFF build diverges from prod — review diff PNG');
    }
  }

  await writeFile(
    join(OUT, 'artifact-manifest.json'),
    JSON.stringify({ localArtifacts, flagBuild: flagLabel, out: OUT }, null, 2),
  );
  console.log(`artifacts: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
