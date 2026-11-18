import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('tour and stay modals close on Escape through the close callback', () => {
  const hook = readFileSync(
    join(root, 'src/shared/serviceRegion/useServiceModalEscapeClose.js'),
    'utf8',
  );
  assert.match(hook, /event\.key !== 'Escape'/);
  assert.match(hook, /event\.defaultPrevented/);
  assert.match(hook, /close\(\)/);

  const tour = readFileSync(join(root, 'src/pages/Home/components/GlobeTourStrip.jsx'), 'utf8');
  assert.match(tour, /useServiceModalEscapeClose\(Boolean\(eligible && \(expanded \|\| listFullscreen\)\), close\)/);
  assert.match(tour, /onClose=\{close\}/);

  const stay = readFileSync(join(root, 'src/pages/Home/components/GlobeStayStrip.jsx'), 'utf8');
  assert.match(stay, /useServiceModalEscapeClose\(Boolean\(eligible && \(expanded \|\| listFullscreen\)\), closeStayModal\)/);
  assert.match(stay, /onClose=\{closeStayModal\}/);
  assert.match(stay, /addEventListener\('keydown', onKey, true\)/);
  assert.match(stay, /stopImmediatePropagation\(\)/);
});
