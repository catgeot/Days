import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sheet = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);

function sliceAround(marker, before, after) {
  const index = sheet.indexOf(marker);
  assert.ok(index > 0, `missing ${marker}`);
  return sheet.slice(Math.max(0, index - before), index + after);
}

test('festival detail top-right close still dismisses the sheet', () => {
  const header = sliceAround('icon="close"', 80, 280);
  assert.match(header, /onClick=\{onClose\}/);
  assert.doesNotMatch(header, /setActiveTab\(TAB_INFO\)/);
});

test('festival detail bottom close returns sub-tabs to the overview', () => {
  const button = sliceAround(
    'className="w-full py-3 rounded-2xl text-sm font-bold border border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"',
    900,
    80,
  );
  assert.match(button, /if \(activeTab === TAB_INFO\) \{\s*onClose\(\);/);
  assert.match(button, /setActiveTab\(TAB_INFO\)/);
  assert.match(button, /sheet\.scrollTop = 0/);
  assert.doesNotMatch(button, /onClick=\{onClose\}/);
});
