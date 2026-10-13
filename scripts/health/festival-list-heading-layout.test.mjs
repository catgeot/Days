import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const index = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/pages/Korea/index.jsx'),
  'utf8',
);

test('festival list heading reserves space beside Large/Map controls', () => {
  assert.match(index, /data-festival-list-heading=""/);
  assert.match(index, /data-festival-list-meta=""/);
  const headingPos = index.indexOf('data-festival-list-heading');
  const block = index.slice(headingPos, headingPos + 2200);
  assert.match(block, /items-start justify-between/);
  assert.match(block, /min-w-0 flex-1/);
  assert.doesNotMatch(block, /whitespace-nowrap/);
});

test('list meta count uses promo-excluded panel rows', () => {
  assert.match(index, /count: panelItemsForList\.length/);
});
