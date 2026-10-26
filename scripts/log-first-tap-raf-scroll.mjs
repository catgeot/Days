import { webkit, devices } from 'playwright';
import { writeFile } from 'node:fs/promises';
import {
  ensureFestivalNearbyMoreButtonVisible,
  tapFestivalNearbyLoadMore,
  waitFestivalNearbyAttractionsReady,
  waitFestivalNearbyMoreButtonEnabled,
} from '/workspace/scripts/lib/festival-nearby-load-more-qa.mjs';

const OUT = '/opt/cursor/artifacts/571-first-tap-raf-scroll-log.json';
const GIT_HEAD = process.env.CAPTURE_GIT_HEAD || '';
const CI_RUN_ID = process.env.CAPTURE_CI_RUN_ID || '';
const BASE = (process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173').replace(/\/$/, '');

const browser = await webkit.launch({ headless: true });
const page = await (
  await browser.newContext({
    ...devices['iPhone 12'],
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  })
).newPage();

await page.goto(`${BASE}/korea/?festival=4133567`, {
  waitUntil: 'domcontentloaded',
  timeout: 120_000,
});
await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
await waitFestivalNearbyAttractionsReady(page);
await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  const band = document.querySelector('[data-nearby-distance-band]');
  if (dialog && band) {
    dialog.scrollTop += band.getBoundingClientRect().top - dialog.getBoundingClientRect().top - 100;
  }
});
await waitFestivalNearbyMoreButtonEnabled(page);
await ensureFestivalNearbyMoreButtonVisible(page);

const baseline = await page.evaluate(() => document.querySelector('[role="dialog"]')?.scrollTop ?? 0);

await page.evaluate(() => {
  window.__rafScrollLog = [];
  window.__rafLogActive = true;
  const dialog = document.querySelector('[role="dialog"]');
  const t0 = performance.now();
  const push = (kind) => {
    window.__rafScrollLog.push({
      kind,
      tMs: Math.round((performance.now() - t0) * 100) / 100,
      scrollTop: dialog?.scrollTop ?? null,
    });
  };
  const loop = () => {
    if (!window.__rafLogActive) return;
    push('raf');
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__rafInterval = setInterval(() => push('interval16'), 16);
  window.__rafLogT0 = t0;
});

await page.waitForTimeout(1000);
const tapAtMs = await page.evaluate(() => {
  window.__rafTapMark = performance.now() - window.__rafLogT0;
  return window.__rafTapMark;
});

await tapFestivalNearbyLoadMore(page);

const playwrightAfter40 = await page.evaluate(async () => {
  await new Promise((r) => setTimeout(r, 40));
  return document.querySelector('[role="dialog"]')?.scrollTop ?? null;
});

await page.waitForTimeout(1000);
const afterSettle = await page.evaluate(() => document.querySelector('[role="dialog"]')?.scrollTop ?? 0);

await page.evaluate(() => {
  window.__rafLogActive = false;
  clearInterval(window.__rafInterval);
});

const samples = await page.evaluate(() => window.__rafScrollLog || []);
const rafOnly = samples.filter((s) => s.kind === 'raf');
const intervalOnly = samples.filter((s) => s.kind === 'interval16');
const tapT = tapAtMs;

function phaseSummary(name, from, to) {
  const slice = samples.filter((s) => s.tMs >= from && s.tMs < to);
  const tops = slice.map((s) => s.scrollTop).filter((n) => typeof n === 'number');
  const outliers = slice.filter(
    (s) => typeof s.scrollTop === 'number' && Math.abs(s.scrollTop - baseline) > 20,
  );
  return {
    name,
    fromMs: from,
    toMs: to,
    sampleCount: slice.length,
    min: tops.length ? Math.min(...tops) : null,
    max: tops.length ? Math.max(...tops) : null,
    outlierCount: outliers.length,
    outliers: outliers.slice(0, 20),
  };
}

const log = {
  gitHead: GIT_HEAD,
  ciRunId: CI_RUN_ID || null,
  captureBaseUrl: BASE,
  baselineScrollTop: baseline,
  tapAtMs: tapT,
  playwrightAfterImmediate40ms: playwrightAfter40,
  playwrightAfterImmediate40msDelta: playwrightAfter40 - baseline,
  afterSettleScrollTop: afterSettle,
  notePlaywright40ms:
    'Node-side setTimeout(40) after tap can read scrollTop between rAF/layout frames; headless WebKit often delivers only ~1–2 rAF/s so sub-frame dips may appear in interval16 but not in raf.',
  noteHeadlessRafThrottle:
    'requestAnimationFrame sample count is low in Playwright headless WebKit; interval16 mirrors sub-frame scrollTop for dip detection.',
  phases: {
    allSamples: [
      phaseSummary('beforeTap_1s', 0, tapT),
      phaseSummary('tap_to_+250ms', tapT, tapT + 250),
      phaseSummary('afterTap_1s', tapT, tapT + 1000),
      phaseSummary('full_window', 0, tapT + 1000),
    ],
    rafOnly: [
      phaseSummary('beforeTap_1s', 0, tapT),
      phaseSummary('tap_to_+250ms', tapT, tapT + 250),
      phaseSummary('afterTap_1s', tapT, tapT + 1000),
    ].map((p, i, arr) => {
      const slice = rafOnly.filter((s) => {
        const ranges = [
          [0, tapT],
          [tapT, tapT + 250],
          [tapT, tapT + 1000],
        ][i];
        return s.tMs >= ranges[0] && s.tMs < ranges[1];
      });
      const tops = slice.map((s) => s.scrollTop).filter((n) => typeof n === 'number');
      return {
        ...p,
        sampleCount: slice.length,
        min: tops.length ? Math.min(...tops) : null,
        max: tops.length ? Math.max(...tops) : null,
        outlierCount: slice.filter(
          (s) => typeof s.scrollTop === 'number' && Math.abs(s.scrollTop - baseline) > 20,
        ).length,
      };
    }),
    interval16Only: (() => {
      const slice = intervalOnly;
      const tops = slice.map((s) => s.scrollTop).filter((n) => typeof n === 'number');
      return {
        sampleCount: slice.length,
        min: tops.length ? Math.min(...tops) : null,
        max: tops.length ? Math.max(...tops) : null,
        outlierCount: slice.filter(
          (s) => typeof s.scrollTop === 'number' && Math.abs(s.scrollTop - baseline) > 20,
        ).length,
      };
    })(),
  },
  samples,
};

await writeFile(OUT, `${JSON.stringify(log, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      baseline,
      playwrightAfter40,
      afterSettle,
      phases: log.phases,
    },
    null,
    2,
  ),
);
await browser.close();
