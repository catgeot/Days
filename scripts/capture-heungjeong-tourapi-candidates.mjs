/**
 * TourAPI 흥정계곡 KTO image candidates → /opt/cursor/artifacts/heungjeong-tourapi-candidates/
 * 390px viewport screenshots per candidate.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadEnvFile } from './lib/load-env-file.mjs';

loadEnvFile();

const OUT = '/opt/cursor/artifacts/heungjeong-tourapi-candidates';
const WIDTH = 390;
const HEIGHT = 520;
const PLACE = '흥정계곡';

async function invokeEdge(action, payload) {
  const url = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  const res = await fetch(`${url}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json().catch(() => ({}));
}

function pickContentId(items, name) {
  const want = name.replace(/\s+/g, '');
  let best = '';
  let bestScore = 0;
  for (const item of items || []) {
    const title = String(item?.title || '').replace(/\s+/g, '');
    const id = String(item?.contentId || item?.contentid || '').trim();
    if (!title || !id) continue;
    let score = 0;
    if (title === want) score = 1000;
    else if (title.startsWith(want)) score = 500;
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

function normalizeUrl(u) {
  return String(u || '')
    .trim()
    .replace(/^http:\/\//i, 'https://');
}

async function downloadBinary(url, dest) {
  const res = await fetch(normalizeUrl(url), {
    headers: { 'User-Agent': 'gateo-tourapi-candidate-fetch/1' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const kw = await invokeEdge('searchKeyword', { keyword: PLACE, numOfRows: 12, pageNo: 1 });
  if (!kw?.ok) throw new Error(`searchKeyword failed: ${JSON.stringify(kw)}`);

  const contentId = pickContentId(kw.items, PLACE) || '126657';
  const searchHit = (kw.items || []).find((it) => String(it.contentId) === contentId);

  const common = await invokeEdge('detailCommon', { contentId });
  const detail = await invokeEdge('detailImage', { contentId, numOfRows: 30, pageNo: 1 });

  const firstimage = normalizeUrl(
    searchHit?.firstimage ||
      common?.items?.[0]?.firstimage ||
      common?.items?.[0]?.imageUrl ||
      '',
  );

  const detailUrls = (detail?.items || [])
    .map((it) => normalizeUrl(it?.originimgurl || it?.smallimageurl || it?.imageUrl))
    .filter(Boolean);

  const seen = new Set();
  const candidates = [];

  if (firstimage && !seen.has(firstimage)) {
    seen.add(firstimage);
    candidates.push({
      contentId,
      source: 'searchKeyword.firstimage / detailCommon',
      label: 'firstimage (representative)',
      url: firstimage,
    });
  }

  detailUrls.forEach((url, i) => {
    if (seen.has(url)) return;
    seen.add(url);
    candidates.push({
      contentId,
      source: 'detailImage',
      label: `detailImage #${i + 1}`,
      url,
    });
  });

  const manifest = {
    place: PLACE,
    contentId,
    fetchedAt: new Date().toISOString(),
    searchKeywordHits: (kw.items || []).map((it) => ({
      contentId: String(it.contentId || ''),
      title: it.title,
      firstimage: normalizeUrl(it.firstimage || ''),
    })),
    candidates: [],
  };

  for (let i = 0; i < candidates.length; i += 1) {
    const c = candidates[i];
    const ext = /\.jpe?g$/i.test(c.url) ? 'jpg' : 'jpg';
    const base = `heungjeong-${contentId}-${String(i + 1).padStart(2, '0')}`;
    const imageFile = `${base}.${ext}`;
    const shotFile = `${base}-390.png`;
    const imagePath = join(OUT, imageFile);
    try {
      const bytes = await downloadBinary(c.url, imagePath);
      manifest.candidates.push({
        ...c,
        imageFile,
        shotFile,
        bytes,
      });
    } catch (err) {
      manifest.candidates.push({
        ...c,
        imageFile: null,
        error: String(err?.message || err),
      });
    }
  }

  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const html = `<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=${WIDTH}"/>
<title>${PLACE} TourAPI candidates</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font: 13px/1.4 system-ui, sans-serif; background: #0f172a; color: #e2e8f0; width: ${WIDTH}px; }
  h1 { font-size: 15px; margin: 12px; }
  .card { margin: 12px; border: 1px solid #334155; border-radius: 8px; overflow: hidden; background: #1e293b; }
  .meta { padding: 8px 10px; font-size: 11px; color: #94a3b8; word-break: break-all; }
  .meta strong { color: #f8fafc; }
  img { display: block; width: 100%; height: auto; background: #000; }
</style></head><body>
<h1>${PLACE} · contentId ${contentId}</h1>
${manifest.candidates
  .filter((c) => c.imageFile)
  .map(
    (c) => `<section class="card" id="${c.imageFile}">
  <div class="meta"><strong>${c.label}</strong><br/>${c.source}<br/>${c.url}</div>
  <img src="${c.imageFile}" alt="${c.label}"/>
</section>`,
  )
  .join('\n')}
</body></html>`;

  await writeFile(join(OUT, 'index.html'), html);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

  for (const c of manifest.candidates.filter((x) => x.imageFile)) {
    const cardHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      body{margin:0;width:${WIDTH}px;background:#0f172a;color:#e2e8f0;font:12px system-ui}
      .m{padding:10px;word-break:break-all}.m b{display:block;margin-bottom:6px}
      img{width:100%;display:block}
    </style></head><body>
    <div class="m"><b>${c.label} · ${contentId}</b>${c.url}</div>
    <img src="file://${join(OUT, c.imageFile)}" />
    </body></html>`;
    const tmp = join(OUT, `_shot-${c.imageFile}.html`);
    await writeFile(tmp, cardHtml);
    await page.goto(`file://${tmp}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: join(OUT, c.shotFile),
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
  }

  await page.goto(`file://${join(OUT, 'index.html')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(OUT, 'heungjeong-all-candidates-390.png'),
    fullPage: true,
  });

  await browser.close();
  await writeFile(join(OUT, 'README.md'), `# 흥정계곡 TourAPI candidates

- **contentId:** \`${contentId}\`
- **image_url:** NULL in prod (pick hero after visual QA)

| # | Label | File | 390 screenshot |
|---|--------|------|----------------|
${manifest.candidates
  .map(
    (c, i) =>
      `| ${i + 1} | ${c.label} | ${c.imageFile || '—'} | ${c.shotFile || '—'} |`,
  )
  .join('\n')}

Suggested valley hero (pending your eyes): often **detailImage #2** (\`…/3376830…\`), not firstimage.
`);

  console.log(`Wrote ${manifest.candidates.length} candidates to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
