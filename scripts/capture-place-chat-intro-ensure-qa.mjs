/**
 * place_chat_intro ensure E2E (격리 mock only · assert 필수 · exit 1 on fail).
 * 운영 DB·실 AI·실 save RPC 미사용.
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const OUT = '/opt/cursor/artifacts';
const PORT = Number(process.env.PLACE_INTRO_QA_PORT || 5201);
const BASE = `http://127.0.0.1:${PORT}`;
mkdirSync(OUT, { recursive: true });

const ACCEPTED_INTRO =
  '야프는 미크로네시아 연방에 속한 섬으로, 전통 석전 화폐와 라이 선가이가 유명합니다. 맑은 바다에서 스노클링과 다이빙을 즐기기 좋으며, 현지 마을에서는 독특한 문화와 음식을 체험할 수 있습니다.';

const SCENES = {
  yap: {
    slug: 'yap',
    lookupKeys: ['미크로네시아 연방 야프', '야프'],
    readonlyGallery: false,
  },
  miyakojima: {
    slug: 'miyakojima',
    lookupKeys: ['일본 미야코지마', '미야코지마'],
    readonlyGallery: false,
  },
  'gyeongbokgung-palace': {
    slug: 'gyeongbokgung-palace',
    lookupKeys: ['서울 경복궁', '대한민국 경복궁', '경복궁', '경복궁@en'],
    readonlyGallery: true,
  },
};

function seedMockIntroRows(summary, keys) {
  for (const k of keys) {
    if (!k) continue;
    dbIntroRows[k] = [{ destination_key: k, summary }];
  }
}

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'content-type': 'application/json',
  };
}

function decodeDestinationFromUrl(url) {
  try {
    const eq = String(url).match(/destination_key=eq\.([^&]+)/);
    return eq ? decodeURIComponent(eq[1]) : '';
  } catch {
    return '';
  }
}

async function startPreview() {
  try {
    if ((await fetch(`${BASE}/`)).ok) return null;
  } catch {
    // spawn
  }
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
    stdio: 'pipe',
    env: { ...process.env, BROWSER: 'none', DEV_SSL: '0' },
  });
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return child;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  child.kill();
  throw new Error('preview server failed to start');
}

/** @type {Record<string, { destination_key: string, summary: string }[]>} */
let dbIntroRows = {};

function createBag() {
  return { introSelect: [], introSave: [], gemini: [], allSupa: [] };
}

async function installMocks(page, sceneMeta, bag) {
  const supa = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  if (!supa) throw new Error('VITE_SUPABASE_URL missing');

  await page.addInitScript(() => {
    try {
      localStorage.setItem('i18nextLng', 'ko');
    } catch {
      // ignore
    }
  });

  await page.route(`${supa}/**`, async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors() });
    }

    if (url.includes('/rpc/save_place_chat_intro')) {
      let body = {};
      try {
        body = req.postDataJSON() || JSON.parse(req.postData() || '{}');
      } catch {
        body = {};
      }
      bag.introSave.push({ body, url, at: Date.now() });
      const key = body?.p_destination_key;
      const summary = body?.p_summary;
      if (key && summary) {
        seedMockIntroRows(summary, [key, ...(sceneMeta?.lookupKeys || [])]);
      }
      return route.fulfill({ status: 200, headers: cors(), body: 'true' });
    }

    if (!url.includes('/rest/v1/place_chat_intro')) {
      return route.continue();
    }

    bag.introSelect.push({ url, method });
    bag.allSupa.push({ type: 'intro', url, method });

    const accept = req.headers()['accept'] || '';
    const inIdx = url.indexOf('destination_key=in.');
    if (inIdx >= 0) {
      const raw = decodeURIComponent(url.slice(inIdx + 'destination_key=in.'.length));
      const keys = raw
        .replace(/^\(|\)$/g, '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      const rows = keys.flatMap((k) => dbIntroRows[k] || []);
      bag.introSelect.push({ url, method, inKeys: keys, hit: rows.length });
      return route.fulfill({ status: 200, headers: cors(), body: JSON.stringify(rows) });
    }

    const dest = decodeDestinationFromUrl(url);
    const row = dest ? dbIntroRows[dest]?.[0] : null;

    if (accept.includes('application/vnd.pgrst.object+json')) {
      if (!row) {
        return route.fulfill({
          status: 200,
          headers: { ...cors(), 'content-profile': 'public' },
          body: 'null',
        });
      }
      return route.fulfill({ status: 200, headers: cors(), body: JSON.stringify(row) });
    }

    const rows = row ? [row] : [];
    return route.fulfill({ status: 200, headers: cors(), body: JSON.stringify(rows) });
  });

  // Playwright: 마지막 등록 route가 우선 — gemini는 supa 넓은 패턴 뒤에 등록
  await page.route(`${supa}/functions/v1/gemini-proxy`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors() });
    }
    let task = '';
    let body = {};
    try {
      body = req.postDataJSON() || {};
      task = String(body?.task || '');
    } catch {
      task = '';
      body = {};
    }
    bag.allSupa.push({ type: 'gemini', task, url: req.url() });
    if (task !== 'place_intro') {
      return route.fulfill({
        status: 200,
        headers: cors(),
        body: JSON.stringify({ success: true, text: 'noop' }),
      });
    }
    bag.gemini.push({ url: req.url(), at: Date.now(), task, params: body?.params });
    return route.fulfill({
      status: 200,
      headers: cors(),
      body: JSON.stringify({ success: true, text: ACCEPTED_INTRO }),
    });
  });
}

async function shot(page, label, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(1000);
  const file = join(OUT, `${label}-${width}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height } });
  return file;
}

async function runVisit(browser, sceneKey, { cachedDb, round, openGallery }) {
  const scene = SCENES[sceneKey];
  dbIntroRows = { ...cachedDb };
  const bag = createBag();
  const context = await browser.newContext({ locale: 'ko-KR' });
  await context.clearCookies();
  const page = await context.newPage();
  await installMocks(page, scene, bag);
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
  });

  await page.goto(`${BASE}/place/${scene.slug}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(scene.readonlyGallery ? 14_000 : 16_000);
  if (openGallery) {
    await page.goto(`${BASE}/place/${scene.slug}/gallery`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForTimeout(12_000);
  }

  const lsKey = await page.evaluate((prefix) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) return { key: k, has: true };
    }
    return { key: null, has: false };
  }, 'days_place_chat_intro:');

  const label = `place-intro-${sceneKey}-r${round}`;
  await shot(page, label, 390);
  await shot(page, label, 1280);

  let galleryHasIntro = false;
  if (openGallery) {
    const needle = scene.slug === 'gyeongbokgung-palace' ? /석전 화폐|라이 선가이/ : /석전 화폐|라이 선가이/;
    for (let i = 0; i < 25; i += 1) {
      galleryHasIntro = await page
        .getByText(needle)
        .first()
        .isVisible()
        .catch(() => false);
      if (galleryHasIntro) break;
      await page.waitForTimeout(1000);
    }
  }

  await context.close();

  return {
    introSelect: bag.introSelect.length,
    introSave: bag.introSave.length,
    gemini: bag.gemini.length,
    saveStatus: bag.introSave[0]?.body ? 200 : null,
    introSaveBodies: bag.introSave.map((x) => x.body),
    localStorageIntro: lsKey,
    galleryHasIntro,
    dbKeysAfter: Object.keys(dbIntroRows),
  };
}

const preview = await startPreview();
const browser = await chromium.launch();
const results = { note: '격리 mock — 운영 DB·실 RPC·실 AI 금지', scenes: {} };

for (const key of ['yap', 'miyakojima']) {
  const r1 = await runVisit(browser, key, { cachedDb: {}, round: 1, openGallery: false });
  assert.equal(r1.gemini, 1, `${key} r1 gemini`);
  assert.equal(r1.introSave, 1, `${key} r1 save RPC`);
  assert.ok(r1.localStorageIntro.has, `${key} r1 localStorage intro`);
  assert.ok(r1.dbKeysAfter.length >= 1, `${key} r1 mock db row`);

  const saveKey = r1.introSaveBodies[0]?.p_destination_key;
  const cached = { ...dbIntroRows };
  if (saveKey) {
    seedMockIntroRows(ACCEPTED_INTRO, [saveKey, ...(SCENES[key]?.lookupKeys || [])]);
    Object.assign(cached, dbIntroRows);
  }
  const r2 = await runVisit(browser, key, { cachedDb: cached, round: 2, openGallery: false });
  assert.equal(r2.gemini, 0, `${key} r2 gemini`);
  assert.equal(r2.introSave, 0, `${key} r2 save`);

  results.scenes[key] = { r1, r2 };
}

const synR1 = await runVisit(browser, 'gyeongbokgung-palace', {
  cachedDb: {},
  round: 1,
  openGallery: true,
});
assert.equal(synR1.gemini, 1, 'synthetic r1 gemini');
assert.equal(synR1.introSave, 1, 'synthetic r1 save');
assert.ok(synR1.galleryHasIntro, 'synthetic same-visit gallery intro visible');

const synCached = { ...dbIntroRows };
const synSaveKey = synR1.introSaveBodies[0]?.p_destination_key;
if (synSaveKey) {
  seedMockIntroRows(ACCEPTED_INTRO, [synSaveKey, ...(SCENES['gyeongbokgung-palace'].lookupKeys || [])]);
  Object.assign(synCached, dbIntroRows);
}
const synR2 = await runVisit(browser, 'gyeongbokgung-palace', {
  cachedDb: synCached,
  round: 2,
  openGallery: true,
});
assert.equal(synR2.gemini, 0, 'synthetic r2 gemini');

results.scenes['gyeongbokgung-palace'] = { r1: synR1, r2: synR2 };

writeFileSync(join(OUT, 'place-intro-ensure-net.json'), JSON.stringify(results, null, 2));

await browser.close();
preview?.kill?.('SIGTERM');

console.log(JSON.stringify(results, null, 2));
console.log('place-intro-ensure-qa: ALL ASSERT PASS');
