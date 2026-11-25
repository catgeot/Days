import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const publicViewer = readFileSync(join(root, 'src/pages/DailyReport/PublicViewer.jsx'), 'utf8');
const detail = readFileSync(join(root, 'src/pages/DailyReport/Detail.jsx'), 'utf8');
const clearance = readFileSync(
  join(root, 'src/pages/DailyReport/logbookArticleClearance.js'),
  'utf8',
);
const badge = readFileSync(
  join(root, 'src/pages/DailyReport/components/EditorialLogbookBadge.jsx'),
  'utf8',
);

test('PublicViewer editorial header clears fixed back on narrow viewports', () => {
  assert.match(publicViewer, /logbookDetailBack/);
  assert.match(publicViewer, /LOGBOOK_ARTICLE_PAGE_PAD/);
  assert.match(publicViewer, /LOGBOOK_ARTICLE_INLINE_CLEARANCE/);
  assert.match(detail, /LOGBOOK_ARTICLE_PAGE_PAD/);
  assert.match(detail, /LOGBOOK_ARTICLE_INLINE_CLEARANCE/);
  assert.match(clearance, /safe-area-inset-bottom/);
  assert.match(clearance, /safe-area-inset-right/);
  assert.match(clearance, /pb-\[calc\(max\(6\.5rem,env\(safe-area-inset-bottom,0px\)\+5\.5rem\)\)\]/);
  assert.match(publicViewer, /data-editorial-logbook-badge-header/);
  assert.match(
    publicViewer,
    /pt-\[calc\(max\(2rem,env\(safe-area-inset-top,0px\)\)\+3\.5rem\)\] md:pt-12/,
  );
  assert.match(
    publicViewer,
    /max-md:pr-\[calc\(2\.75rem\+max\(1\.25rem,env\(safe-area-inset-right/,
  );
});

test('Editorial detail badge exposes data-editorial-logbook-badge', () => {
  assert.match(badge, /data-editorial-logbook-badge/);
  assert.match(badge, /variant === 'detail'/);
});
