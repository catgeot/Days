import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('Explore Enter does not auto-open a suggestion before requireChoice onSearch', () => {
  const modal = readFileSync(
    join(root, 'src/pages/Home/components/SearchDiscoveryModal.jsx'),
    'utf8',
  );
  assert.doesNotMatch(modal, /preferEnterSuggestion\s*\(/);
  assert.doesNotMatch(modal, /awaitPreferEnterSuggestion\s*\(/);
  assert.doesNotMatch(modal, /awaitSiteSearchEnterSinglePoi\s*\(/);
});

test('handleSmartSearch requireChoice skips site-search Enter single POI short-circuit', () => {
  const handlers = readFileSync(join(root, 'src/pages/Home/hooks/useHomeHandlers.js'), 'utf8');
  const block = handlers.slice(
    handlers.indexOf('if (requireChoice && !skipEnterDirectForQa)'),
    handlers.indexOf('const curated = await buildCuratedEnterDisambiguation'),
  );
  assert.doesNotMatch(block, /awaitSiteSearchEnterSinglePoi\s*\(/);
});
