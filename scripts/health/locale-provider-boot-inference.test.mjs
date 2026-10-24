import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('browser-inferred en stays in memory — no storage or URL rewrite on boot', () => {
  const src = readFileSync(join(root, 'src/i18n/LocaleProvider.jsx'), 'utf8');
  const bootEffect = src.slice(
    src.indexOf('bootSyncDone.current = true'),
    src.indexOf('}, [searchParams'),
  );
  assert.match(bootEffect, /setLocaleState\('en'\)/);
  assert.doesNotMatch(bootEffect, /persistLocale\('en'\)/);
  assert.doesNotMatch(bootEffect, /setSearchParams/);
  assert.match(src, /const setLocale = useCallback/);
  assert.match(src, /persistLocale\(normalized\)/);
  assert.match(src, /setSearchParams\(/);
});
