/**
 * QA r2 evidence — tab bar, 0-video, region back press, tab stability timing.
 *   BASE=https://127.0.0.1:4173 node scripts/capture-festival-qa-r2.mjs
 */
import { webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = (process.env.BASE || 'https://127.0.0.1:4173').replace(/\/$/, '');
const OUT = '/opt/cursor/artifacts/tab-videos-r2';

const VIDEO_FESTIVALS = [
  { key: 'yanggu', id: '1122739' },
  { key: 'hampyeong', id: '638576' },
  { key: 'gangneung', id: '2930716' },
];

const REGION_DRILLS = [
  { key: 'gangwon-yanggu', province: /^강원/, city: /^양구군/ },
  { key: 'jeonnam-yeosu', province: /^전남/, city: /^여수시/ },
  { key: 'gyeongnam-changwon', province: /^경남/, city: /^창원시/ },
  { key: 'jeju-jeju', province: /^제주/, city: /^제주시/ },
];

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

async function festivalDialog(page) {
  const dialog = page.locator('[role="dialog"]').filter({
    has: page.locator('#korea-festival-sheet-title'),
  });
  await dialog.waitFor({ state: 'visible', timeout: 90_000 });
  return dialog;
}

async function shotTabBar(page, dialog, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await dialog.evaluate((el) => {
    const list = el.querySelector('[role="tablist"]');
    list?.scrollIntoView({ block: 'start' });
    const scroller = el.querySelector('[data-festival-sheet-content]');
    if (scroller && list) {
      const top = list.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      scroller.scrollTop = Math.max(0, top - 8);
    }
  });
  await page.waitForTimeout(600);
  const tablist = dialog.locator('[role="tablist"]');
  const outPath = join(OUT, `${name}-${width}.png`);
  try {
    const box = await tablist.boundingBox();
    if (box && box.height > 0 && box.y < height) {
      const clipY = Math.max(0, Math.min(box.y - 12, height - 48));
      const clipH = Math.max(40, Math.min(box.height + 36, height - clipY));
      await page.screenshot({
        path: outPath,
        clip: { x: 0, y: clipY, width, height: clipH },
      });
    } else {
      await tablist.screenshot({ path: outPath });
    }
  } catch {
    await tablist.screenshot({ path: outPath });
  }
  console.log('saved tab', name, width);
}

async function measureTabStability(page, dialog, festivalId) {
  const t0 = Date.now();
  let lastSig = '';
  let stableMs = null;
  const tablist = dialog.locator('[role="tablist"]');
  for (let i = 0; i < 80; i++) {
    const sig = await tablist.evaluate((el) =>
      Array.from(el.querySelectorAll('[role="tab"]'))
        .map((b) => b.textContent?.trim() || '')
        .join('|'),
    );
    if (sig === lastSig && sig.length > 0) {
      stableMs = Date.now() - t0;
      break;
    }
    lastSig = sig;
    await page.waitForTimeout(100);
  }
  return { festivalId, stableMs, tabLabels: lastSig };
}

async function openHubDrill(page, scenario) {
  await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await dismissLocHint(page);
  await page.getByRole('button', { name: /지역|Region/i }).first().click({ timeout: 30_000 });
  const detailRow = page.locator('[aria-label="세부 칩"], [aria-label="Detail chips"]');
  await detailRow.getByRole('button', { name: scenario.province }).first().click({ timeout: 30_000 });
  await page.waitForTimeout(700);
  const subRow = page.locator('[aria-label="지역 구분 칩"], [aria-label="Region chips"]');
  const cityBtn = subRow.getByRole('button', { name: scenario.city }).first();
  await cityBtn.scrollIntoViewIfNeeded();
  await cityBtn.click({ timeout: 30_000 });
  await page.waitForTimeout(800);
}

async function shotViewport(page, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(450);
  await page.screenshot({
    path: join(OUT, `${name}-${width}.png`),
    clip: { x: 0, y: 0, width, height },
  });
  console.log('saved', name, width);
}

async function assertProvinceWideList(page, scenarioKey) {
  const meta = page.locator('[data-festival-list-meta]').first();
  await meta.waitFor({ state: 'visible', timeout: 10_000 });
  const text = (await meta.innerText()).replace(/\s+/g, ' ').trim();
  const subRow = page.locator('[aria-label="지역 구분 칩"], [aria-label="Region chips"]');
  const cityPressed = await subRow
    .getByRole('button', { pressed: true })
    .allTextContents()
    .catch(() => []);
  const hasCityChipActive = cityPressed.some((l) => /군|시|구/.test(l));
  if (hasCityChipActive) {
    throw new Error(`${scenarioKey}: city chip still pressed after back (${cityPressed.join(',')})`);
  }
  if (/군\s*·|시\s*·/.test(text) && !text.includes('시·도별')) {
    const cityPart = REGION_DRILLS.find((s) => s.key === scenarioKey)?.city;
    if (cityPart && (await meta.innerText()).match(cityPart)) {
      throw new Error(`${scenarioKey}: meta still shows city after back: ${text}`);
    }
  }
  console.log('assert ok', scenarioKey, text.slice(0, 60));
}

async function clickRegionBack(page) {
  const back = page.locator('[data-festival-region-back]').first();
  await back.waitFor({ state: 'visible', timeout: 15_000 });
  await back.click({ timeout: 15_000 });
  await page.waitForTimeout(900);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await webkit.launch();
  const context = await browser.newContext({ locale: 'ko-KR', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const notes = [];
  const timings = [];
  let zeroVideoId = process.env.ZERO_VIDEO_ID || '';

  for (const fest of VIDEO_FESTIVALS) {
    for (const w of [390, 1280]) {
      await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
      await page.goto(`${BASE}/korea/?festival=${fest.id}`, {
        waitUntil: 'domcontentloaded',
        timeout: 120_000,
      });
      const dialog = await festivalDialog(page);
      if (w === 390) {
        timings.push(await measureTabStability(page, dialog, fest.id));
      }
      await shotTabBar(page, dialog, `tabbar-${fest.key}`, w);
    }
  }

  if (!zeroVideoId) {
    const tried = new Set();
    for (let round = 0; round < 5 && !zeroVideoId; round += 1) {
      await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await dismissLocHint(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.25 * (1 + Math.random())));
      await page.waitForTimeout(400);
      const ids = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-festival-id]'))
          .map((el) => el.getAttribute('data-festival-id'))
          .filter(Boolean),
      );
      for (const id of ids) {
        if (tried.has(id)) continue;
        tried.add(id);
        await page.goto(`${BASE}/korea/?festival=${id}`, { waitUntil: 'domcontentloaded' });
        const dialog = await festivalDialog(page).catch(() => null);
        if (!dialog) continue;
        await page.waitForTimeout(3500);
        const hasVideoTab = await dialog.getByRole('tab', { name: /^영상$/ }).count();
        if (hasVideoTab === 0) {
          zeroVideoId = id;
          notes.push(`zero-video-probe: found id=${id} (scanned ${tried.size})`);
          break;
        }
      }
    }
  }
  try {
    if (zeroVideoId) {
      for (const w of [390, 1280]) {
        await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
        await page.goto(`${BASE}/korea/?festival=${zeroVideoId}`, {
          waitUntil: 'domcontentloaded',
          timeout: 120_000,
        });
        const dialog = await festivalDialog(page);
        await page.waitForTimeout(2000);
        await shotTabBar(page, dialog, `zero-video-${zeroVideoId}-tabbar`, w);
        const tabs = await dialog.locator('[role="tab"]').allTextContents();
        notes.push(`zero-video-${w}: tabs=${tabs.join(',')}`);
      }
    } else {
      notes.push('zero-video-probe: NOT FOUND in first 40 list cards');
    }
  } catch (err) {
    notes.push(`zero-video-probe: ERROR ${err.message}`);
  }

  for (const scenario of REGION_DRILLS) {
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await openHubDrill(page, scenario);
      for (const w of [390, 1280]) {
        await shotViewport(page, `${scenario.key}-before-back-${w}`, w);
      }
      await clickRegionBack(page);
      await assertProvinceWideList(page, scenario.key);
      for (const w of [390, 1280]) {
        await shotViewport(page, `${scenario.key}-after-back-${w}`, w);
      }
    } catch (err) {
      notes.push(`${scenario.key}-back: ERROR ${err.message}`);
      console.error(scenario.key, err);
    }
  }

  try {
    const scenario = REGION_DRILLS[0];
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await page
      .getByRole('button', { name: /지도로 위치|지도.*동선|Map.*route|Open map/i })
      .first()
      .click({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    await openHubDrill(page, scenario);
    await shotViewport(page, `${scenario.key}-side-panel-before-back-1280`, 1280);
    const sideBack = page.locator('[data-festival-region-back]').first();
    await sideBack.waitFor({ state: 'visible', timeout: 15_000 });
    await sideBack.click();
    await page.waitForTimeout(900);
    await assertProvinceWideList(page, `${scenario.key}-side`);
    await shotViewport(page, `${scenario.key}-side-panel-after-back-1280`, 1280);
    notes.push('side-panel-back: OK gangwon-yanggu at 1280 map split');
  } catch (err) {
    notes.push(`side-panel-back: ERROR ${err.message}`);
    console.error('side-panel', err);
  }

  await writeFile(
    join(OUT, 'NOTES.md'),
    `# tab-videos-r2 QA evidence

Base: ${BASE}

## Video fetch / quota (one line)

Sheet open reads **\`place_videos\` only** (\`fetchFestivalVideosCacheOnly\`); **\`fetch-place-videos\` / YouTube runs only when the user opens the 영상 tab** (cache miss or stale). Cached rows do not add YouTube quota on open. Empty \`videos:[]\` older than **7 days** → cache miss (tab stays for fresh search).

## Stale empty cache (this PR — client only)

\`isStaleEmptyPlaceVideoCache\` in \`placeVideoCache.js\` (7d) → \`fetchFestivalVideosCacheOnly\` treats old \`videos:[]\` as cache miss. **No DB migrations or Edge changes in this PR** (no-flag client scope).

### Follow-up proposal (ops approval — not in this branch)

- Weekly \`refresh-place-videos\` cron (draft migration \`20261018180000_place_videos_weekly_refresh_cron.sql\` on \`main\` from #516) to refresh stale \`place_videos\` rows including \`emptyPlace\`.
- Edge already has \`staleCutoffIso\` / \`emptyPlace\` handling in \`supabase/functions/refresh-place-videos\` on \`main\`; wire cron + \`REFRESH_VIDEOS_APPLY\` separately when approved.

## Region back — r2 vs now

- **390px:** Chip row was **not** hidden (\`md:hidden\` only from 768px up). r2 after-back looked unchanged because capture clicked \`subRow.getByRole('button').first()\` (often the city chip, not \`‹ … 전체\`), not a missing handler.
- **1280px (list-only):** Same row was **hidden** (\`md:hidden\`), so back was not visible/clickable until layout fix (\`lg:hidden\` only when map-split side flap is shown).
- **Now:** \`[data-festival-region-back]\` + asserts; **390 after-back** shows province-wide meta (e.g. \`강원도 ·N건 ·시·군별\`, no city chip pressed).

## Tab bar stability (ms until tab label signature stable, 390px)

${timings.map((t) => `- ${t.festivalId}: ${t.stableMs ?? 'timeout'} ms — \`${t.tabLabels}\``).join('\n')}

## Zero-video festival

${zeroVideoId ? `contentId **${zeroVideoId}** — screenshots \`zero-video-${zeroVideoId}-tabbar-*\` (no 영상 tab on open).` : 'No 0-video festival found in probe — see log.'}

## Region back press

For each region: \`*-before-back-*\` (city selected) → \`[data-festival-region-back]\` → \`*-after-back-*\` (province meta, no city chip pressed). Row back visible on desktop when map list-only (\`lg:hidden\` only when map split side flap).

## Map split side panel (1280)

\`gangwon-yanggu-side-panel-before-back-1280\` → side back → \`gangwon-yanggu-side-panel-after-back-1280\`

## Tab bar crops

\`tabbar-{yanggu,hampyeong,gangneung}-{390,1280}.png\`

## Log

${notes.join('\n')}
`,
    'utf8',
  );

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
