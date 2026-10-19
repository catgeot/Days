import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const logicUrl = pathToFileURL(join(root, 'supabase/functions/_shared/placeVideoRefresh.mjs')).href;

const {
  STALE_DAYS,
  classifyYoutubeListItem,
  exceedsRemovalGuard,
  refreshVideosForPlace,
  summarizeRefreshRunForCap,
  stripVideosYoutubeMetadata,
  parseCutoffDaysParam,
  parseLimitParam,
  DEFAULT_MAX_REMOVE_PCT,
  maxRemoveRatioFromPct,
  parseMaxRemovePct,
  chunkVideoIds,
  videoIdFromCached,
} = await import(logicUrl);

function ytItem(id, { privacy = 'public', embeddable = true, title = 'T', channel = 'C' } = {}) {
  return {
    id,
    status: { privacyStatus: privacy, embeddable },
    snippet: { title, channelTitle: channel },
  };
}

test('classifyYoutubeListItem keeps public embeddable videos', () => {
  const ok = classifyYoutubeListItem(ytItem('abc'));
  assert.equal(ok.keep, true);
  assert.equal(ok.title, 'T');
  assert.equal(ok.channelTitle, 'C');
});

test('classifyYoutubeListItem drops non-public and not embeddable', () => {
  assert.equal(classifyYoutubeListItem(ytItem('a', { privacy: 'private' })).keep, false);
  assert.equal(classifyYoutubeListItem(ytItem('a', { embeddable: false })).keep, false);
  assert.equal(classifyYoutubeListItem(null).keep, false);
});

test('refreshVideosForPlace drops missing API rows and refreshes titles', () => {
  const cached = [
    { id: 'keep', title: 'old', channelTitle: 'ch1', ai_context: { x: 1 } },
    { id: 'gone', title: 'x' },
    { id: 'private', title: 'y' },
  ];
  const map = new Map([
    ['keep', ytItem('keep', { title: 'New &amp; Title', channel: 'Ch2' })],
    ['private', ytItem('private', { privacy: 'unlisted' })],
  ]);
  const out = refreshVideosForPlace(cached, map);
  assert.equal(out.examined, 3);
  assert.equal(out.removed, 2);
  assert.equal(out.videos.length, 1);
  assert.equal(out.videos[0].title, 'New & Title');
  assert.equal(out.videos[0].channelTitle, 'Ch2');
  assert.equal(out.videos[0].ai_context.x, 1);
});

test('exceedsRemovalGuard uses strict max-remove pct threshold (default 5%)', () => {
  const cap = maxRemoveRatioFromPct(DEFAULT_MAX_REMOVE_PCT);
  assert.equal(exceedsRemovalGuard(20, 1, cap), false);
  assert.equal(exceedsRemovalGuard(20, 2, cap), true);
  assert.equal(exceedsRemovalGuard(0, 5, cap), false);
  assert.equal(DEFAULT_MAX_REMOVE_PCT, 5);
  assert.equal(parseMaxRemovePct(undefined), 5);
  assert.equal(parseMaxRemovePct('10'), 10);
});

test('refreshVideosForPlace records removal candidates with reasons', () => {
  const cached = [{ id: 'gone' }, { id: 'priv', title: 'y' }];
  const map = new Map([['priv', ytItem('priv', { privacy: 'private' })]]);
  const out = refreshVideosForPlace(cached, map);
  assert.equal(out.removals.length, 2);
  assert.equal(out.removals[0].reason, 'missing');
  assert.equal(out.removals[1].reason, 'privacy:private');
});

test('chunkVideoIds batches by 50', () => {
  const ids = Array.from({ length: 120 }, (_, i) => `v${i}`);
  const chunks = chunkVideoIds(ids);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 50);
  assert.equal(chunks[2].length, 20);
});

test('videoIdFromCached reads id field', () => {
  assert.equal(videoIdFromCached({ id: ' abc ' }), 'abc');
  assert.equal(videoIdFromCached({ videoId: 'x' }), 'x');
});

test('STALE_DAYS default is 20', () => {
  assert.equal(STALE_DAYS, 20);
});

test('parseCutoffDaysParam clamps 0..30', () => {
  assert.equal(parseCutoffDaysParam('99'), 30);
  assert.equal(parseCutoffDaysParam('-3'), 0);
  assert.equal(parseCutoffDaysParam('7'), 7);
});

test('parseLimitParam clamps 1..1000', () => {
  assert.equal(parseLimitParam('0'), 1);
  assert.equal(parseLimitParam('5000'), 1000);
});

test('stripVideosYoutubeMetadata keeps id and GATEO fields', () => {
  const out = stripVideosYoutubeMetadata([
    { id: 'a', title: 't', channelTitle: 'c', publishedAt: 'x', ai_context: { z: 1 } },
  ]);
  assert.equal(out.strippedCount, 1);
  assert.deepEqual(out.videos[0], { id: 'a', ai_context: { z: 1 } });
});

test('summarizeRefreshRunForCap ignores checkOk=false parts', () => {
  const cap = summarizeRefreshRunForCap([
    { examined: 100, removed: 2, emptyPlace: false, checkOk: true },
    { examined: 100, removed: 90, emptyPlace: false, checkOk: false },
  ]);
  assert.equal(cap.examined, 100);
  assert.equal(cap.removed, 2);
  assert.equal(cap.guardTriggered, false);
});

const edgeEntry = join(root, 'supabase/functions/refresh-place-videos/index.ts');
const FORBIDDEN = [/src\/shared\/api\/supabase/];

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null;
  const base = dirname(fromFile);
  let target = resolve(base, spec);
  if (existsSync(target)) return target;
  for (const ext of ['.js', '.mjs', '.ts']) {
    if (existsSync(`${target}${ext}`)) return `${target}${ext}`;
  }
  return target;
}

function walkEsImports(file, seen = new Set()) {
  const abs = resolve(file);
  if (seen.has(abs)) return seen;
  seen.add(abs);
  if (!existsSync(abs)) return seen;
  const text = readFileSync(abs, 'utf8');
  for (const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const next = resolveImport(abs, match[1]);
    if (next) walkEsImports(next, seen);
  }
  return seen;
}

test('refresh-place-videos edge import graph avoids src/shared/api/supabase', () => {
  const files = walkEsImports(edgeEntry);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const re of FORBIDDEN) {
      assert.ok(!re.test(text), `forbidden ${re} in ${file.replace(`${root}/`, '')}`);
    }
  }
  const edgeSrc = readFileSync(edgeEntry, 'utf8');
  assert.ok(!edgeSrc.includes('search?'), 'must not call search.list');
  assert.ok(edgeSrc.includes('/videos?'), 'uses videos.list');
});
