import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function lin(channel) {
  const x = channel / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function ratio(fg, bg) {
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const l1 = lum(fg);
  const l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function hex(value) {
  const n = value.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
}

/** Light MOONi pairs. Text needs 4.5. Icons and 18px+ text need 3. */
const PAIRS = [
  ['place locate icon', '#2e1065', '#f5f3ff', 3],
  ['place search icon', '#334155', '#f8fafc', 3],
  ['collapse search', '#0f172a', '#ffffff', 4.5],
  ['festival placeholder', '#475569', '#ffffff', 4.5],
  ['chat placeholder', '#475569', '#ffffff', 4.5],
  ['MOONi label', '#155e75', '#ffffff', 4.5],
  ['Me label', '#075985', '#ffffff', 4.5],
  ['user bubble', '#ffffff', '#155e75', 4.5],
  ['origin chip', '#0f172a', '#f1f5f9', 4.5],
  ['topic chip', '#0e7490', '#ffffff', 4.5],
  ['error text', '#7f1d1d', '#fef2f2', 4.5],
];

test('light MOONi contrast tokens meet WCAG AA', () => {
  for (const [name, fg, bg, min] of PAIRS) {
    const value = ratio(hex(fg), hex(bg));
    assert.ok(value >= min, `${name} ${value.toFixed(2)} < ${min}`);
  }
});

test('light MOONi sources no longer use the low-contrast locate and placeholder colors', () => {
  const selector = readFileSync(join(root, 'src/pages/Home/components/FlightOriginSelector.jsx'), 'utf8');
  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  const dock = readFileSync(join(root, 'src/pages/Home/components/FestivalAccessOriginDock.jsx'), 'utf8');
  assert.match(selector, /border border-violet-800 bg-violet-50/);
  assert.match(selector, /text-violet-950/);
  assert.match(selector, /absolute right-1 top-1\/2 inline-flex h-10[\s\S]{0,180}text-violet-950/);
  assert.match(chat, /placeholder:text-slate-600/);
  assert.doesNotMatch(chat, /placeholder:text-slate-400/);
  assert.match(chat, /text-cyan-800/);
  assert.match(dock, /placeholder:text-slate-600/);
  assert.doesNotMatch(dock, /placeholder:text-slate-400/);
});
