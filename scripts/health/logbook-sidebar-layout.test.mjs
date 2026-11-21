import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

test('DailyLayout — desktop sidebar+main live in inner row (outer stays column)', () => {
  const layout = read('src/pages/DailyReport/layout/DailyLayout.jsx');
  assert.match(layout, /flex h-screen w-full flex-col overflow-hidden bg-gray-50/);
  assert.doesNotMatch(
    layout,
    /flex h-screen w-full flex-col overflow-hidden bg-gray-50[\s\S]{0,120}md:flex-row/,
    'outer md:flex-row squeezes the inner sidebar row',
  );
  assert.match(layout, /flex-1 flex-col md:flex-row/);
});

test('Sidebar — fixed 16rem column does not shrink', () => {
  const sidebar = read('src/pages/DailyReport/layout/Sidebar.jsx');
  assert.match(sidebar, /data-testid="logbook-desktop-sidebar"/);
  assert.match(sidebar, /min-w-\[16rem\]/);
  assert.match(sidebar, /max-w-\[16rem\]/);
  assert.match(sidebar, /shrink-0/);
});

test('UserProfile — sidebar gallery keeps 4:3 frame and object-cover', () => {
  const profile = read('src/pages/DailyReport/layout/UserProfile.jsx');
  assert.match(profile, /data-testid="logbook-sidebar-profile-photo"/);
  assert.match(profile, /aspect-\[4\/3\]/);
  assert.match(profile, /object-cover/);
  assert.match(profile, /shrink-0/);
});

test('Review hub card width follows main column (no viewport sidebar double subtraction)', () => {
  const hub = read('src/pages/DailyReport/components/LogbookOfficialReviewHubCard.jsx');
  assert.doesNotMatch(hub, /100vw-16rem/);
  assert.match(hub, /max-w-full/);
});