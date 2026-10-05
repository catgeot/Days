#!/usr/bin/env node
/**
 * src 에서 place_stats / place_chat_intro 직접 쓰기가 0건인지 본다.
 * select 는 허용. upsert|update|insert 만 금지.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

const WRITE_RE = [
  {
    label: "place_stats write",
    re: /\.from\(\s*['"]place_stats['"]\s*\)[\s\S]{0,240}?\.(upsert|update|insert)\b/g,
  },
  {
    label: "place_chat_intro write",
    re: /\.from\(\s*['"]place_chat_intro['"]\s*\)[\s\S]{0,240}?\.(update|insert)\b/g,
  },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(path, out);
    } else if (/\.(js|jsx|mjs|ts|tsx)$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

const hits = [];
for (const file of walk(srcDir)) {
  const text = readFileSync(file, 'utf8');
  for (const { label, re } of WRITE_RE) {
    re.lastIndex = 0;
    if (re.test(text)) {
      hits.push(`${relative(root, file)} ${label}`);
    }
  }
}

assert.deepEqual(hits, [], `direct writes must be 0, found:\n${hits.join('\n')}`);
console.log('smoke:place-stats-direct-write PASS');
