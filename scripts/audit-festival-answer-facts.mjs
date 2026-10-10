/**
 * Compare festival first-answer program/performance/number mentions with overview and program facts.
 *
 *   node scripts/audit-festival-answer-facts.mjs
 *
 * Uses saved fixtures. With VITE_SUPABASE_URL and an anon key, also reads up to 10 festivals
 * from prod tourapi-proxy (anonymous). Does not call Gemini.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFestivalFirstAnswerFacts,
  buildFestivalMooniContext,
  unsupportedFestivalFactMentions,
} from '../src/pages/Korea/lib/festivalMooniContext.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureDir = join(root, 'scripts/staging/fixtures/festival-opening');
const REQUIRED = ['2930716', '1998564', '2855626'];

function loadFixtures() {
  const files = readdirSync(fixtureDir).filter((name) => name.endsWith('.json'));
  return files.map((name) => JSON.parse(readFileSync(join(fixtureDir, name), 'utf8')));
}

function corpusOf(fixture) {
  const facts = buildFestivalFirstAnswerFacts(buildFestivalMooniContext(fixture), {
    now: new Date('2026-10-09T03:00:00Z'),
  });
  return {
    facts,
    corpus: [
      facts?.overviewFacts,
      facts?.programs,
      fixture.overview,
      fixture.program,
      facts?.dateLine,
      facts?.title,
    ].flat().filter(Boolean).join('\n'),
  };
}

async function invoke(action, payload) {
  const url = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anon = String(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) return null;
  const res = await fetch(`${url}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
    signal: AbortSignal.timeout(20000),
  });
  return res.json().catch(() => null);
}

function regionKey(text) {
  const src = String(text || '');
  const hit = src.match(/서울|부산|대구|인천|광주|대전|울산|세종|제주|경기|강원|충북|충남|전북|전남|경북|경남/);
  return hit ? hit[0] : '';
}

async function liveFestivals() {
  const picked = new Map();
  for (const id of REQUIRED) picked.set(id, { contentId: id, region: '' });
  const window = await invoke('festivalWindow', {});
  const items = Array.isArray(window?.items) ? window.items : [];
  for (const item of items) {
    if (picked.size >= 10) break;
    const contentId = String(item?.contentId || '').trim();
    const region = regionKey(`${item?.addr1 || ''} ${item?.title || ''}`);
    if (!contentId || !region || [...picked.values()].some((row) => row.region === region)) continue;
    picked.set(contentId, { contentId, region, title: String(item?.title || '').trim() });
  }
  const rows = [];
  for (const entry of picked.values()) {
    const detail = await invoke('festivalDetail', { contentId: entry.contentId, contentTypeId: '15' });
    if (!detail?.ok) continue;
    const intro = detail.intro || {};
    const common = detail.common || {};
    rows.push({
      contentId: entry.contentId,
      region: entry.region,
      title: String(common.title || entry.title || '').trim(),
      overview: String(common.overview || intro.overview || '').replace(/<[^>]+>/g, ' '),
      program: String(intro.program || '').replace(/<[^>]+>/g, ' '),
    });
  }
  return rows;
}

function reportRow(row) {
  const programHasTrot = /트로트/.test(row.program || '');
  const overviewHasTrot = /트로트/.test(row.overview || '');
  const planted = unsupportedFestivalFactMentions('재즈 공연과 99999명이 있어요.', `${row.overview}\n${row.program}`);
  return {
    contentId: row.contentId || row.item?.contentId,
    title: row.title || row.item?.title,
    trotInProgram: programHasTrot,
    trotInOverview: overviewHasTrot,
    plantedFlags: planted,
  };
}

const saved = loadFixtures().map(reportRow);
let live = [];
try {
  live = (await liveFestivals()).map(reportRow);
} catch (err) {
  console.error('live tourapi read skipped:', err?.message || err);
}

const report = {
  savedFixtures: saved,
  liveCount: live.length,
  live,
  note: 'Gemini was not called. Staging quota and the unreleased edge prompt are not probed here.',
};
console.log(JSON.stringify(report, null, 2));
if (saved.find((row) => row.contentId === '2855626' && row.trotInProgram && !row.trotInOverview)) {
  console.log('2855626: 트로트 is in the program field and not in the overview.');
}
