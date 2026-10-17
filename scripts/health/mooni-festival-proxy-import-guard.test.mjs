import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const entry = join(root, 'supabase/functions/_shared/gemini/festivalMooniProxyPolish.mjs');

const FORBIDDEN = [
  /src\/shared\/api\//,
  /invokeSupabaseFunctionDeduped/,
  /import\.meta\.env/,
];

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
    const spec = match[1];
    const next = resolveImport(abs, spec);
    if (next) walkEsImports(next, seen);
  }
  for (const match of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const spec = match[1];
    const next = resolveImport(abs, spec);
    if (next) walkEsImports(next, seen);
  }
  return seen;
}

const FORBIDDEN_DYNAMIC_SPECS = [
  /festivalTransportCardFetch/,
  /invokeSupabaseFunctionDeduped/,
  /src\/shared\/api\//,
];

test('festivalMooniProxyPolish import graph avoids browser Supabase client', () => {
  const files = walkEsImports(entry);
  const rel = [...files].map((f) => f.replace(`${root}/`, ''));
  for (const path of rel) {
    const text = readFileSync(join(root, path), 'utf8');
    for (const re of FORBIDDEN) {
      assert.ok(!re.test(text), `forbidden ${re} in ${path}`);
    }
  }
  assert.ok(
    rel.some((p) => p.includes('mooniKoreaFestivalReplyPolish.js')),
    'expected polish SSOT in graph',
  );
  assert.ok(
    !rel.some((p) => p.includes('festivalTransportCardFetch.js')),
    'fetch module must not be pulled into gemini-proxy polish',
  );
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      for (const re of FORBIDDEN_DYNAMIC_SPECS) {
        assert.ok(!re.test(match[1]), `forbidden dynamic import ${match[1]} in ${file.replace(`${root}/`, '')}`);
      }
    }
  }
});
