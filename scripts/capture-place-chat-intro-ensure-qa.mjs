/**
 * place_chat_intro ensure E2E (격리 mock only · assert 필수 · exit 1 on fail).
 * 운영 DB·실 AI·실 save RPC 미사용.
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync, spawn } from 'node:child_process';

const OUT = '/opt/cursor/artifacts';
const PORT = Number(process.env.PLACE_INTRO_QA_PORT || 5201);
const BASE = `http://127.0.0.1:${PORT}`;
mkdirSync(OUT, { recursive: true });

const SCENES = {
  yap: {
    slug: 'yap',
    lookupKeys: ['미크로네시아 연방 야프', '야프'],
    expectedSaveKey: '미크로네시아 연방 야프',
    mockSummary:
      '야프는 미크로네시아 연방에 속한 섬으로, 전통 석전 화폐와 라이 선가이가 유명합니다. 맑은 바다에서 스노클링과 다이빙을 즐기기 좋으며, 현지 마을에서는 독특한 문화와 음식을 체험할 수 있습니다.',
    ssotSnippets: ['돌화폐', '라이'],
    mockOnlySnippets: ['맑은 바다에서 스노클링'],
    readonlyGallery: false,
  },
  miyakojima: {
    slug: 'miyakojima',
    lookupKeys: ['일본 미야코지마', '미야코지마'],
    expectedSaveKey: '일본 미야코지마',
    mockSummary:
      '미야코지마는 오키나와 부속 섬으로 미야코 블루로 불리는 에메랄드빛 바다가 유명합니다. 요나하 마에하마 해변과 산호초 다이빙이 매력적인 리조트 섬입니다.',
    ssotSnippets: ['미야코 블루', '요나하'],
    mockOnlySnippets: ['에메랄드빛'],
    readonlyGallery: false,
  },
  'gyeongbokgung-palace': {
    slug: 'gyeongbokgung-palace',
    lookupKeys: ['서울 경복궁', '대한민국 경복궁', '경복궁', '경복궁@en'],
    expectedSaveKey: '서울 경복궁',
    mockSummary:
      '경복궁은 조선 태조 이성계가 1395년에 창건한 조선 왕조의 법궁입니다. 광화문과 근정전, 경회루가 대표적인 볼거리이며 서울의 역사·문화를 대표합니다.',
    galleryNeedle: /조선 태조|근정전/,
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
    const mockSummary = sceneMeta?.mockSummary || '';
    return route.fulfill({
      status: 200,
      headers: cors(),
      body: JSON.stringify({ success: true, text: mockSummary }),
    });
  });
}

function assertSavePair(scene, bodies) {
  assert.equal(bodies.length, 1, `${scene.slug} save count`);
  const { p_destination_key: key, p_summary: summary } = bodies[0];
  assert.equal(key, scene.expectedSaveKey, `${scene.slug} destination_key`);
  assert.equal(summary, scene.mockSummary, `${scene.slug} summary (mock 장면별 — 제품 교차아님)`);
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
  if (openGallery && scene.galleryNeedle) {
    for (let i = 0; i < 25; i += 1) {
      galleryHasIntro = await page
        .getByText(scene.galleryNeedle)
        .first()
        .isVisible()
        .catch(() => false);
      if (galleryHasIntro) break;
      await page.waitForTimeout(1000);
    }
  }

  let ssotPreserved = null;
  if (scene.ssotSnippets?.length) {
    const text = await page.locator('body').innerText();
    const hasSsot = scene.ssotSnippets.every((s) => text.includes(s));
    const mockLeaked = scene.mockOnlySnippets?.some((s) => text.includes(s)) ?? false;
    ssotPreserved = { hasSsot, mockLeaked };
    assert.ok(hasSsot, `${scene.slug} SSOT desc fragment visible`);
    assert.ok(!mockLeaked, `${scene.slug} mock summary must not replace displayed desc`);
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
    ssotPreserved,
    dbKeysAfter: Object.keys(dbIntroRows),
  };
}

const preview = await startPreview();
const browser = await chromium.launch();
const results = {
  note: '격리 mock — 운영 DB·실 RPC·실 AI 금지. p_summary 교차는 mock 재사용 버그였음(장면별 mockSummary로 분리).',
  gitHead: null,
  scenes: {},
};
try {
  results.gitHead = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
} catch {
  // optional
}

for (const key of ['yap', 'miyakojima']) {
  const r1 = await runVisit(browser, key, { cachedDb: {}, round: 1, openGallery: false });
  assert.equal(r1.gemini, 1, `${key} r1 gemini`);
  assert.equal(r1.introSave, 1, `${key} r1 save RPC`);
  assert.ok(r1.localStorageIntro.has, `${key} r1 localStorage intro`);
  assert.ok(r1.dbKeysAfter.length >= 1, `${key} r1 mock db row`);
  assertSavePair(SCENES[key], r1.introSaveBodies);

  const scene = SCENES[key];
  const saveKey = r1.introSaveBodies[0]?.p_destination_key;
  const cached = { ...dbIntroRows };
  if (saveKey) {
    seedMockIntroRows(scene.mockSummary, [saveKey, ...(scene.lookupKeys || [])]);
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
assertSavePair(SCENES['gyeongbokgung-palace'], synR1.introSaveBodies);
assert.ok(synR1.galleryHasIntro, 'gyeongbok same-visit gallery intro (yap/miyako 미검증)');

const synScene = SCENES['gyeongbokgung-palace'];
const synCached = { ...dbIntroRows };
const synSaveKey = synR1.introSaveBodies[0]?.p_destination_key;
if (synSaveKey) {
  seedMockIntroRows(synScene.mockSummary, [synSaveKey, ...(synScene.lookupKeys || [])]);
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
