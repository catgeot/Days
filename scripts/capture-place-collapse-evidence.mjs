#!/usr/bin/env node
/**
 * Place gallery section collapse QA — WebKit + Chromium @390 and @1280.
 *   npm run build && npm run preview &
 *   SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/capture-place-collapse-evidence.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = process.env.PLACE_COLLAPSE_OUT || '/opt/cursor/artifacts/place-collapse';

const PLACES = [
  { slug: 'cairo', hasFacts: true, hasStories: true },
  { slug: 'venice', hasFacts: false, hasStories: false },
  { slug: 'dubai', hasFacts: false, hasStories: false },
  { slug: 'paris', hasFacts: false, hasStories: false },
];

const VIEWPORTS = [
  { width: 390, height: 844, tag: '390' },
  { width: 1280, height: 800, tag: '1280' },
];

async function waitGallery(page, slug) {
  await page.goto(`${baseURL}place/${slug}?lang=ko`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  const marker = page
    .locator('[data-local-info="gallery"], [data-visit-stories], [data-place-gallery-scroll]')
    .first();
  await marker.waitFor({ state: 'attached', timeout: 120_000 });
  await page.waitForTimeout(800);
}

async function clipShot(page, fileName) {
  const { width = 390, height = 844 } = page.viewportSize() || {};
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width, height },
  });
}

async function ariaForSection(page, nameRe) {
  const header = page.getByRole('button', { name: nameRe }).first();
  if (!(await header.isVisible().catch(() => false))) return null;
  return header.getAttribute('aria-expanded');
}

async function captureEngine(browserType, engineName) {
  const notes = [];
  for (const vp of VIEWPORTS) {
    const browser = await browserType.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'ko-KR',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    for (const place of PLACES) {
      await waitGallery(page, place.slug);
      const factsHeader = page.getByRole('button', { name: /현지 정보/ }).first();
      const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
      const factsVisible = await factsHeader.isVisible().catch(() => false);
      const storiesVisible = await storiesHeader.isVisible().catch(() => false);

      if (factsVisible) {
        const collapsedAria = await factsHeader.getAttribute('aria-expanded');
        notes.push({
          file: `${place.slug}-${engineName}-collapsed-${vp.tag}.png`,
          assertion: 'facts default collapsed',
          ariaExpanded: collapsedAria,
        });
        await clipShot(page, `${place.slug}-${engineName}-collapsed-${vp.tag}.png`);

        await factsHeader.click();
        notes.push({
          file: `${place.slug}-${engineName}-facts-expanded-${vp.tag}.png`,
          assertion: 'facts expanded after click',
          ariaExpanded: await factsHeader.getAttribute('aria-expanded'),
        });
        await clipShot(page, `${place.slug}-${engineName}-facts-expanded-${vp.tag}.png`);

        await page.goto(`${baseURL}place/${place.slug}?lang=ko#facts`, {
          waitUntil: 'domcontentloaded',
          timeout: 120_000,
        });
        await page.waitForTimeout(900);
        const hashAria = await factsHeader.getAttribute('aria-expanded');
        notes.push({
          file: `${place.slug}-${engineName}-hash-facts-${vp.tag}.png`,
          assertion: '#facts auto-expand',
          ariaExpanded: hashAria,
        });
        await clipShot(page, `${place.slug}-${engineName}-hash-facts-${vp.tag}.png`);

        await factsHeader.focus();
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);
        notes.push({
          assertion: 'keyboard Space toggles facts',
          ariaExpanded: await factsHeader.getAttribute('aria-expanded'),
        });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        notes.push({
          assertion: 'keyboard Enter toggles facts',
          ariaExpanded: await factsHeader.getAttribute('aria-expanded'),
        });
      }

      if (storiesVisible) {
        await page.goto(`${baseURL}place/${place.slug}?lang=ko&section=stories`, {
          waitUntil: 'domcontentloaded',
          timeout: 120_000,
        });
        await page.waitForTimeout(900);
        const storiesAria = await storiesHeader.getAttribute('aria-expanded');
        notes.push({
          file: `${place.slug}-${engineName}-query-stories-${vp.tag}.png`,
          assertion: '?section=stories auto-expand',
          ariaExpanded: storiesAria,
        });
        await clipShot(page, `${place.slug}-${engineName}-query-stories-${vp.tag}.png`);
      }

      if (!factsVisible && !storiesVisible) {
        notes.push({
          file: `${place.slug}-${engineName}-no-sections-${vp.tag}.png`,
          assertion: 'no local-info/stories blocks (0 items)',
        });
        await clipShot(page, `${place.slug}-${engineName}-no-sections-${vp.tag}.png`);
      }
    }

    await browser.close();
  }
  return notes;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const allNotes = [];
  for (const [browserType, name] of [[chromium, 'chromium'], [webkit, 'webkit']]) {
    const notes = await captureEngine(browserType, name);
    allNotes.push(...notes.map((n) => ({ engine: name, ...n })));
  }

  const lines = [
    '# Place gallery section collapse — evidence',
    '',
    `Base URL: ${baseURL}`,
    '',
    '## Assertions',
    '',
    ...allNotes.map((n) => {
      const parts = [`- **${n.engine}** ${n.assertion}`];
      if (n.file) parts.push(`(\`${n.file}\`)`);
      if (n.ariaExpanded != null) parts.push(`— \`aria-expanded="${n.ariaExpanded}"\``);
      return parts.join(' ');
    }),
    '',
    '## Files',
    '',
    ...[...new Set(allNotes.filter((n) => n.file).map((n) => n.file))].sort().map((f) => `- ${f}`),
    '',
  ];
  await writeFile(join(OUT, 'NOTES.md'), lines.join('\n'), 'utf8');
  console.log(`Wrote ${OUT}/NOTES.md (${allNotes.length} assertions)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
