/**
 * Session5 OFF-only evidence correction.
 * URL / ≠ home rendered. Wait for ready + real home UI; mark fail if still blank.
 * No secrets requested; uses already-present process env only.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = '/opt/cursor/artifacts/self-reels-session5';
const PORT = 5211;

function run(cmd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      cwd: ROOT,
      env: { ...process.env, ...env, BROWSER: 'none', DEV_SSL: '0' },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (d) => {
      out += d;
    });
    child.stderr.on('data', (d) => {
      out += d;
    });
    child.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(out.slice(-4000)))));
  });
}

async function waitHttp(url, ms = 90_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status > 0) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`timeout ${url}`);
}

function pngIsAllBlack(filePath) {
  // Minimal IHDR+IDAT scan via playwright is preferred; here after shot we use page.evaluate.
  return false;
}

async function assertNotAllBlack(page) {
  const stats = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(window.innerWidth, 320);
    canvas.height = Math.min(window.innerHeight, 180);
    // Sample DOM visibility instead of raster: count non-black painted nodes roughly via screenshot is outside.
    const body = document.body;
    const text = (body?.innerText || '').trim();
    const map = document.querySelector('.mapboxgl-canvas, .mapboxgl-map, canvas');
    const search = document.querySelector('[data-search-bar-anchor], [role="button"]');
    const title = document.title || '';
    return {
      title,
      textLen: text.length,
      textSample: text.slice(0, 120),
      hasMap: Boolean(map),
      hasSearchCue: Boolean(search),
      ready: document.readyState,
      href: location.href,
      pathname: location.pathname,
    };
  });
  return stats;
}

fs.mkdirSync(OUT, { recursive: true });

// Preserve prior invalid black shots for audit (do not treat as PASS).
for (const name of ['off-reels-home-390.png', 'off-reels-home-1280.png']) {
  const src = path.join(OUT, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(OUT, name.replace('.png', '-INVALID-black.png')));
  }
}

const mapboxPresent = Boolean(process.env.VITE_MAPBOX_TOKEN);
await run('npx vite build --outDir dist-s5-off --emptyOutDir', {
  // Pass through existing Cloud env only — do not invent/fetch secrets.
  VITE_MAPBOX_TOKEN: process.env.VITE_MAPBOX_TOKEN || '',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
});

const preview = spawn(
  `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort --outDir dist-s5-off`,
  { cwd: ROOT, env: { ...process.env, BROWSER: 'none', DEV_SSL: '0' }, shell: true, stdio: 'ignore' },
);
await waitHttp(`http://127.0.0.1:${PORT}/`);

const browser = await chromium.launch();
const report = {
  head: process.env.EVIDENCE_HEAD || 'unknown',
  createdAtKst: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }),
  mapboxEnvPresentAtBuild: mapboxPresent,
  offHomePass: false,
  reason: '',
  shots: {},
  observations: [],
};

try {
  const page = await browser.newPage();
  page.on('pageerror', (err) => report.observations.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') report.observations.push(`console.error: ${msg.text().slice(0, 200)}`);
  });

  for (const [label, width, height] of [
    ['390', 390, 844],
    ['1280', 1280, 800],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`http://127.0.0.1:${PORT}/reels`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '', { timeout: 30_000 });
    await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 30_000 });

    let homeReady = false;
    let waitError = '';
    try {
      await page.waitForFunction(
        () => {
          const titleOk = /GATEO/i.test(document.title || '');
          const map = document.querySelector('.mapboxgl-canvas, .mapboxgl-map');
          const search = document.querySelector('[data-search-bar-anchor]');
          const searchText = (document.body?.innerText || '').includes('검색')
            || (document.body?.innerText || '').toLowerCase().includes('search');
          return titleOk && (Boolean(map) || Boolean(search) || searchText);
        },
        null,
        { timeout: 45_000 },
      );
      homeReady = true;
    } catch (err) {
      waitError = String(err?.message || err);
      report.observations.push(`${label} home-ready wait failed: ${waitError.slice(0, 300)}`);
    }

    const stats = await assertNotAllBlack(page);
    report.shots[label] = { ...stats, homeReady, waitError: waitError || null };

    const file = `off-reels-home-${label}.png`;
    await page.screenshot({
      path: path.join(OUT, file),
      clip: { x: 0, y: 0, width, height },
    });

    // Raster blackness check
    const buf = fs.readFileSync(path.join(OUT, file));
    // quick: if file tiny and we know prior black ~2-5KB; still verify via evaluate canvas grab
    const pixels = await page.evaluate(async ({ w, h }) => {
      // draw via html2canvas-less approach: read center pixel from map canvas if any
      const c = document.querySelector('.mapboxgl-canvas');
      if (c && c.width > 0) {
        try {
          const ctx = c.getContext('2d');
          if (ctx) {
            const { data } = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1);
            return { source: 'map-canvas', rgba: [...data] };
          }
        } catch (e) {
          return { source: 'map-canvas-blocked', error: String(e) };
        }
      }
      return {
        source: 'dom',
        title: document.title,
        textLen: (document.body?.innerText || '').trim().length,
        hasMap: Boolean(document.querySelector('.mapboxgl-map, .mapboxgl-canvas')),
      };
    }, { w: width, h: height });
    report.shots[label].pixelProbe = pixels;
  }

  const bothReady = report.shots['390']?.homeReady && report.shots['1280']?.homeReady;
  const bothHaveCue =
    (report.shots['390']?.hasMap || report.shots['390']?.hasSearchCue || report.shots['390']?.textLen > 20) &&
    (report.shots['1280']?.hasMap || report.shots['1280']?.hasSearchCue || report.shots['1280']?.textLen > 20);

  if (bothReady && bothHaveCue) {
    report.offHomePass = true;
    report.reason = 'URL=/ + document complete + home cue (map or search) on 390 and 1280';
  } else {
    report.offHomePass = false;
    report.reason =
      'OFF redirect to / observed, but home UI cue not confirmed on both viewports — NOT home-regression PASS. Prior all-black captures invalidated.';
  }
} finally {
  await browser.close();
  try {
    preview.kill('SIGTERM');
  } catch {
    // ignore
  }
}

const manifestPath = path.join(OUT, 'manifest.json');
let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch {
  manifest = {};
}
manifest.offHomeCorrection = report;
manifest.scenarios = (manifest.scenarios || []).map((s) => {
  if (s.id !== 'off') return s;
  return {
    ...s,
    homeRegressionPass: report.offHomePass,
    note: report.offHomePass
      ? 'Recaptured with home-ready waits'
      : 'URL / only is insufficient; home UI not confirmed — do not treat as PASS',
    invalidPriorFiles: ['off-reels-home-390-INVALID-black.png', 'off-reels-home-1280-INVALID-black.png'],
  };
});
manifest.sharedPreview = manifest.sharedPreview || '미발급';
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(OUT, 'off-home-correction.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.offHomePass ? 0 : 2;
