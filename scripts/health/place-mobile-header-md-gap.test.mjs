import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

test('mobile header spacer stays until lg (PlaceCard column layout)', () => {
  const inset = read('src/components/PlaceCard/common/mobilePlaceHeaderInset.js');
  assert.match(inset, /mobilePlaceHeaderSpacerClass[\s\S]*lg:hidden/);
  assert.doesNotMatch(
    inset,
    /mobilePlaceHeaderSpacerClass[\s\S]*md:hidden/,
    'md:hidden on spacer leaves 768px gap vs max-md fixed header',
  );
});

test('PlaceChatPanel fixed header matches spacer lg breakpoint', () => {
  const chat = read('src/components/PlaceCard/panels/PlaceChatPanel.jsx');
  assert.match(chat, /max-lg:fixed max-lg:inset-x-0 max-lg:top-0/);
  assert.doesNotMatch(chat, /max-md:fixed max-md:inset-x-0 max-md:top-0/);
});
