import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  claimLogbookViewSession,
  readLogbookViewCount,
  releaseLogbookViewSession,
} from '../src/utils/logbookViewCount.js';

assert.equal(readLogbookViewCount({ view_count: 0 }), 0);
assert.equal(readLogbookViewCount({ view_count: 12 }), 12);
assert.equal(readLogbookViewCount({ view_count: '4' }), 4);
assert.equal(readLogbookViewCount({ view_count: 3.8 }), 3);
assert.equal(readLogbookViewCount({}), null);
assert.equal(readLogbookViewCount({ view_count: -1 }), null);
assert.equal(readLogbookViewCount({ view_count: 'nope' }), null);

const mem = {
  store: new Map(),
  getItem(k) {
    return this.store.has(k) ? this.store.get(k) : null;
  },
  setItem(k, v) {
    this.store.set(k, v);
  },
  removeItem(k) {
    this.store.delete(k);
  },
};

assert.equal(claimLogbookViewSession('abc', mem), true);
assert.equal(claimLogbookViewSession('abc', mem), false);
releaseLogbookViewSession('abc', mem);
assert.equal(claimLogbookViewSession('abc', mem), true);
assert.equal(claimLogbookViewSession('', mem), false);

const root = join(import.meta.dirname, '..');
const migration = readFileSync(
  join(root, 'supabase/migrations/20260927120000_reports_view_count.sql'),
  'utf8',
);
assert.match(migration, /increment_report_view/);
assert.match(migration, /view_count/);
assert.match(migration, /GRANT EXECUTE ON FUNCTION public.increment_report_view\(text\) TO anon, authenticated/);

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(vercel, /\/qa\/logbook-reads/);
assert.match(qa, /slug:\s*'logbook-reads'/);
assert.match(qa, /cursor\/logbook-reads-af3f/);

console.log('smoke:logbook-view-count PASS');
