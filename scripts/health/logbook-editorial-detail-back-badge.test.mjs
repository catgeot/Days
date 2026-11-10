import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const publicViewer = readFileSync(join(root, 'src/pages/DailyReport/PublicViewer.jsx'), 'utf8');
const badge = readFileSync(
  join(root, 'src/pages/DailyReport/components/EditorialLogbookBadge.jsx'),
  'utf8',
);

test('PublicViewer editorial header clears fixed back on narrow viewports', () => {
  assert.match(publicViewer, /logbookDetailBack/);
  assert.match(publicViewer, /data-editorial-logbook-badge-header/);
  assert.match(publicViewer, /max-md:pt-\[max\(3rem,env\(safe-area-inset-top/);
  assert.match(
    publicViewer,
    /max-md:pr-\[calc\(2\.75rem\+max\(1\.25rem,env\(safe-area-inset-right/,
  );
});

test('Editorial detail badge exposes data-editorial-logbook-badge', () => {
  assert.match(badge, /data-editorial-logbook-badge/);
  assert.match(badge, /variant === 'detail'/);
});
