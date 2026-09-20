#!/usr/bin/env node
/**
 * 팔경 contentId fill S0 스모크 — 문경 DB-only 1리스트.
 */
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const listsPath = join(root, 'src/pages/Home/data/koreaLocalScenicLists.json');

const fill = spawnSync(
  'node',
  [
    'scripts/fill-korea-local-scenic-content-ids.mjs',
    '--db-only',
    '--lists=mungyeong-palgyeong',
  ],
  { cwd: root, encoding: 'utf8' },
);

if (fill.status !== 0) {
  console.error(fill.stdout);
  console.error(fill.stderr);
  throw new Error(`fill script failed exit=${fill.status}`);
}

const lists = JSON.parse(readFileSync(listsPath, 'utf8'));
const mungyeong = lists.find((l) => l.listId === 'mungyeong-palgyeong');
assert.ok(mungyeong, 'mungyeong-palgyeong exists');

const withId = (mungyeong.members || []).filter((m) =>
  /^\d{1,32}$/.test(String(m.contentId || '')),
);
assert.ok(withId.length >= 1, `expected >=1 DB hit for mungyeong-palgyeong, got ${withId.length}`);

for (const m of withId) {
  assert.match(String(m.contentId), /^\d{1,32}$/, `numeric contentId for ${m.attractionName}`);
}

console.log(
  `smoke-korea-local-scenic-content-ids: PASS (mungyeong ${withId.length}/${mungyeong.members.length} with contentId)`,
);
