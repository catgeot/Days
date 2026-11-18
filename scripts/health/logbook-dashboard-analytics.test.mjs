import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dashboardPath = join(root, 'src/pages/DailyReport/Dashboard.jsx');

function readDashboard() {
  return readFileSync(dashboardPath, 'utf8');
}

test('write CTA uses secondary outline styling and 44px touch target', () => {
  const source = readDashboard();
  assert.match(source, /data-testid="logbook-write-cta"/);
  assert.match(source, /min-h-11/);
  assert.match(source, /border border-gray-200 bg-white text-gray-700/);
  assert.doesNotMatch(source, /from-blue-600 via-blue-500 to-indigo-600/);
  assert.doesNotMatch(source, /shadow-lg hover:shadow-blue-500/);
});

test('tab and write analytics fire only from click handlers', () => {
  const source = readDashboard();
  assert.match(source, /import \{ trackEvent \} from '\.\.\/\.\.\/shared\/analytics\/trackEvent\.js'/);
  assert.match(source, /trackEvent\('logbook_tab_select'/);
  assert.match(source, /logged_in: Boolean\(user\)/);
  assert.match(source, /trackEvent\('logbook_write_click'/);
  assert.match(source, /tab: isPublicMode \? 'public' : 'mine'/);
  assert.doesNotMatch(source, /useEffect[\s\S]*trackEvent\('logbook_tab_select'/);
  assert.doesNotMatch(source, /useEffect[\s\S]*trackEvent\('logbook_write_click'/);
});