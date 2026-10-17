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

test('flag-on list meta keeps the picked-dates weight in every state', () => {
  const metaPos = index.indexOf('data-festival-list-meta=""');
  assert.ok(metaPos > 0);
  const block = index.slice(metaPos - 350, metaPos);
  assert.match(
    block,
    /dateChipEnabled\s*\n\s*\?\s*'text-xs font-medium text-stone-700'/,
  );
  assert.match(block, /:\s*'text-\[11px\] text-stone-500'/);
  assert.doesNotMatch(block, /timeTab === 'date'/);
});
