import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const logicUrl = pathToFileURL(join(root, 'supabase/functions/_shared/placeVideoRefresh.mjs')).href;

const {
  classifyYoutubeListItem,
  exceedsRemovalGuard,
  refreshVideosForPlace,
  REMOVAL_GUARD_RATIO,
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

test('exceedsRemovalGuard uses strict 20% threshold', () => {
  assert.equal(exceedsRemovalGuard(10, 2), false);
  assert.equal(exceedsRemovalGuard(10, 3), true);
  assert.equal(exceedsRemovalGuard(0, 5), false);
  assert.equal(REMOVAL_GUARD_RATIO, 0.2);
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
