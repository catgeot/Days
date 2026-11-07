import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const OUT = '/opt/cursor/artifacts';
const PORT = Number(process.env.PLACE_INTRO_QA_PORT || 5201);
const BASE = `http://127.0.0.1:${PORT}`;
mkdirSync(OUT, { recursive: true });

const bag = {
  introSelect: [],
  introSave: [],
  gemini: [],
};

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'content-type': 'application/json',
  };
}

async function startPreview() {
  try {
    const existing = await fetch(`${BASE}/`);
    if (existing.ok) return null;
  } catch {
    // start below
  }
  const child = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT)],
    { stdio: 'pipe', env: { ...process.env, BROWSER: 'none', DEV_SSL: '0' } },
  );
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return child;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  child.kill();
  throw new Error('preview server failed to start');
}

async function installMocks(page, { cachedIntro }) {
  const supa = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  if (!supa) throw new Error('VITE_SUPABASE_URL missing — 격리 mock 불가');

  await page.route('**/functions/v1/gemini-proxy**', async (route) => {
    let task = '';
    try {
      task = String(route.request().postDataJSON()?.task || '');
    } catch {
      task = '';
    }
    if (task !== 'place_intro') {
      return route.continue();
    }
    bag.gemini.push({ url: route.request().url(), at: Date.now() });
    return route.fulfill({
      status: 200,
      headers: cors(),
      body: JSON.stringify({
        text: '야프는 미크로네시아 연방에 속한 섬으로, 전통 석전 화폐와 라이 선가이가 유명합니다. 맑은 바다에서 스노클링과 다이빙을 즐기기 좋으며, 현지 마을에서는 독특한 문화와 음식을 체험할 수 있습니다.',
      }),
    });
  });

  await page.route(`${supa}/**`, async (route) => {
    const url = route.request().url();
    if (!url.includes('place_chat_intro') && !url.includes('save_place_chat_intro')) {
      return route.continue();
    }
    if (url.includes('/rpc/') && route.request().method() === 'POST') {
      const body = route.request().postData();
      bag.introSave.push({ body, status: 200, at: Date.now(), url });
      return route.fulfill({ status: 200, headers: cors(), body: 'true' });
    }
    if (!url.includes('/rest/v1/place_chat_intro')) {
      return route.continue();
    }
    bag.introSelect.push({ url: route.request().url(), method: route.request().method() });
    const rows = cachedIntro
      ? [
          {
            destination_key: '야프',
            summary:
              '야프는 미크로네시아의 석전 화폐 문화와 다이빙으로 유명한 섬입니다. 라이 선가이 체험이 대표적입니다.',
          },
        ]
      : [];
    return route.fulfill({ status: 200, headers: cors(), body: JSON.stringify(rows) });
  });

}

async function shot(page, slug, pass, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(1200);
  const file = join(OUT, `place-intro-${slug}-r${pass}-${width}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height } });
  return file;
}

async function visit(page, slug, cachedIntro, pass) {
  bag.introSelect = [];
  bag.introSave = [];
  bag.gemini = [];
  await installMocks(page, { cachedIntro });
  await page.goto(`${BASE}/place/${slug}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForTimeout(15_000);
  await shot(page, slug, pass, 390);
  await shot(page, slug, pass, 1280);
  return {
    introSelect: bag.introSelect.length,
    introSave: bag.introSave.length,
    gemini: bag.gemini.length,
    introSaveBodies: bag.introSave.map((x) => x.body),
  };
}

const preview = await startPreview();
const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'ko-KR' });
await context.clearCookies();
const page = await context.newPage();
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // ignore
  }
});

const yapR1 = await visit(page, 'yap', false, 1);
await context.clearCookies();
await page.evaluate(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // ignore
  }
});
const yapR2 = await visit(page, 'yap', true, 2);

const miyakoR1 = await visit(page, 'miyakojima', false, 1);

const evidence = {
  note: '격리 mock — 운영 DB·RPC 미검증. VITE_SUPABASE URL만 라우트 가로채기.',
  yap: { r1: yapR1, r2: yapR2 },
  miyakojima: { r1: miyakoR1 },
};
writeFileSync(join(OUT, 'place-intro-ensure-net.json'), JSON.stringify(evidence, null, 2));

await browser.close();
preview?.kill?.('SIGTERM');

console.log(JSON.stringify(evidence, null, 2));
