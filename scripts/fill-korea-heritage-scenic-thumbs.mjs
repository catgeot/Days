/**
 * 국가유산 명승 목록용 가벼운 썸네일(TourAPI firstimage) SSOT.
 * KHS 원본은 수 MB라 리스트에서 깨지거나 늦게 뜨는 경우가 많음.
 *
 *   npm run fill:korea-heritage-scenic-thumbs
 *   node scripts/fill-korea-heritage-scenic-thumbs.mjs --limit=20
 *   node scripts/fill-korea-heritage-scenic-thumbs.mjs --force
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HERITAGE_PATH = join(
  __dirname,
  '../src/pages/Home/data/koreaHeritageScenic.json',
);
const THUMBS_PATH = join(__dirname, 'data/korea-heritage-scenic-thumbs.json');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '')
  .trim()
  .replace(/\/$/, '');
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();

const args = process.argv.slice(2);
const force = args.includes('--force');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) || 0 : 0;
const concurrency = 4;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return null;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

function loadThumbs() {
  try {
    const raw = JSON.parse(readFileSync(THUMBS_PATH, 'utf8'));
    return raw?.byId && typeof raw.byId === 'object' ? { ...raw.byId } : {};
  } catch {
    return {};
  }
}

/** @param {string} name */
function keywordCandidates(name) {
  const raw = String(name || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return [];
  /** @type {string[]} */
  const out = [];
  const push = (v) => {
    const s = String(v || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (s.length >= 2 && !out.includes(s)) out.push(s);
  };
  push(raw);
  push(raw.replace(/\s*일원$/u, ''));
  push(raw.replace(/\s*산지$/u, ''));
  push(raw.replace(/\s*및\s+.+$/u, ''));
  push(raw.replace(/\s*일원$/u, '').replace(/\s*및\s+.+$/u, ''));
  // "강릉 경포대와 경포호" / "설악산 용아장성"
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    const rest = parts.slice(1).join(' ');
    push(rest.replace(/\s*일원$/u, ''));
    push(rest.replace(/\s*일원$/u, '').replace(/\s*및\s+.+$/u, ''));
    push(parts[parts.length - 1].replace(/\s*일원$/u, ''));
    push(`${parts[0]} ${parts[1].replace(/[와과·].*$/u, '')}`);
  }
  // "영월 한반도 지형" → "한반도지형"
  if (parts.length >= 3) {
    push(parts.slice(1).join(''));
    push(parts.slice(-2).join(''));
    push(parts.slice(-2).join(''));
  }
  // "조계산 송광사·선암사 일원" → "송광사", "선암사"
  for (const chunk of raw.split(/[·・]/u)) {
    push(chunk.replace(/\s*일원$/u, '').trim());
  }
  const m = raw.match(/^(\S+)\s+(\S+)/);
  if (m) push(`${m[1]} ${m[2].replace(/[와과].*$/u, '')}`);
  return out.slice(0, 8);
}

async function tourEdge(action, body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.ok ? data : null;
}

function normKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[·.,()/[\]【】]/g, '')
    .replace(/(일원|산지|계곡|원림)$/u, '');
}

/** 느슨한 키워드(원림·폭포·지형) 오탐 방지 — 명소명과 제목이 맞닿을 때만 채택 */
function titleMatchesHeritage(title, heritageName, keyword) {
  const t = normKey(title);
  const n = normKey(heritageName);
  const k = normKey(keyword);
  if (!t || t.length < 2) return false;
  if (k.length >= 2 && (t.includes(k) || k.includes(t))) {
    // 키워드가 너무 짧거나 일반명이면 명소명 토큰도 요구
    if (k.length <= 2 || /^(원림|폭포|지형|계곡|옛길|일원|바위)$/u.test(keyword)) {
      const tokens = String(heritageName)
        .split(/\s+|[·・]/u)
        .map(normKey)
        .filter((x) => x.length >= 2 && !/^(및|와|과)$/u.test(x));
      return tokens.some((tok) => t.includes(tok) || n.includes(t));
    }
    return true;
  }
  if (n.length >= 4 && (t.includes(n) || n.includes(t))) return true;
  const tokens = String(heritageName)
    .split(/\s+|[·・]/u)
    .map(normKey)
    .filter((x) => x.length >= 2);
  const hit = tokens.filter((tok) => t.includes(tok));
  return hit.length >= 2 || (hit.length === 1 && hit[0].length >= 3);
}

async function findTourThumb(name) {
  for (const keyword of keywordCandidates(name)) {
    // 일반명만으로는 검색하지 않음
    if (/^(원림|폭포|지형|계곡|옛길|일원|바위|별서)$/u.test(keyword)) continue;
    for (const contentTypeId of ['12', undefined]) {
      const body = {
        keyword,
        numOfRows: 10,
        pageNo: 1,
      };
      if (contentTypeId) body.contentTypeId = contentTypeId;
      const data = await tourEdge('searchKeyword', body);
      await sleep(80);
      const items = Array.isArray(data?.items) ? data.items : [];
      for (const it of items) {
        const title = String(it?.title || '');
        if (!titleMatchesHeritage(title, name, keyword)) continue;
        const url = toHttps(it?.firstimage || it?.imageUrl || it?.firstImage);
        if (url) {
          return {
            url,
            keyword,
            title,
            contentId: String(it.contentid || it.contentId || ''),
          };
        }
      }
    }
  }
  return null;
}

async function mapPool(items, worker, size) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor;
      cursor += 1;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, () => run()),
  );
  return results;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('Need VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }

  const heritage = JSON.parse(readFileSync(HERITAGE_PATH, 'utf8'));
  const spots = Array.isArray(heritage?.spots) ? heritage.spots : [];
  let byId = loadThumbs();
  if (force) byId = {};

  /** @type {{ id: string, name: string }[]} */
  const need = [];
  for (const spot of spots) {
    const id = String(spot?.id || '').trim();
    if (!id) continue;
    if (!force && toHttps(byId[id] || spot.thumbUrl)) continue;
    need.push({ id, name: String(spot.name || id) });
  }
  const targets = limit > 0 ? need.slice(0, limit) : need;
  console.log(
    `[fill-heritage-thumbs] spots=${spots.length} need=${need.length} run=${targets.length}`,
  );

  let ok = 0;
  let miss = 0;
  await mapPool(
    targets,
    async (t) => {
      const hit = await findTourThumb(t.name);
      if (hit?.url) {
        byId[t.id] = hit.url;
        ok += 1;
        console.log(
          `OK  ${t.name} ← ${hit.title || hit.keyword} (${hit.contentId || '-'})`,
        );
      } else {
        miss += 1;
        console.warn(`MISS ${t.name}`);
      }
    },
    concurrency,
  );

  const withUrl = Object.keys(byId).filter((k) => toHttps(byId[k])).length;
  writeFileSync(
    THUMBS_PATH,
    `${JSON.stringify(
      {
        meta: {
          version: 1,
          updatedAt: new Date().toISOString(),
          count: withUrl,
          source: 'tourapi-proxy searchKeyword firstimage',
        },
        byId,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  let patched = 0;
  for (const spot of spots) {
    const id = String(spot.id || '').trim();
    const thumbUrl = toHttps(byId[id]);
    if (thumbUrl) {
      spot.thumbUrl = thumbUrl;
      patched += 1;
    } else if (spot.thumbUrl != null) {
      spot.thumbUrl = toHttps(spot.thumbUrl);
    } else {
      spot.thumbUrl = null;
    }
  }
  heritage.meta = {
    ...heritage.meta,
    thumbCount: patched,
    thumbsSource: 'scripts/data/korea-heritage-scenic-thumbs.json',
    thumbsUpdatedAt: new Date().toISOString(),
  };
  writeFileSync(HERITAGE_PATH, `${JSON.stringify(heritage, null, 2)}\n`, 'utf8');
  console.log(
    `[fill-heritage-thumbs] thumbs=${withUrl} patched=${patched} ok=${ok} miss=${miss}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
