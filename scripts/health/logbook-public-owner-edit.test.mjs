import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isLogbookReportOwner } from '../../src/pages/DailyReport/utils/logbookReportOwner.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ownerId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const otherId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const baseReport = {
  id: 'r1',
  user_id: ownerId,
  is_public: true,
  is_editorial: false,
  title: '메롱',
  location: '춘천',
  date: '2026-04-30',
};

test('isLogbookReportOwner: owner session', () => {
  assert.equal(isLogbookReportOwner(ownerId, baseReport), true);
});

test('isLogbookReportOwner: other user', () => {
  assert.equal(isLogbookReportOwner(otherId, baseReport), false);
});

test('isLogbookReportOwner: logged out', () => {
  assert.equal(isLogbookReportOwner(null, baseReport), false);
  assert.equal(isLogbookReportOwner(undefined, baseReport), false);
});

test('isLogbookReportOwner: editorial never owner-editable', () => {
  assert.equal(
    isLogbookReportOwner(ownerId, { ...baseReport, is_editorial: true, user_id: null }),
    false,
  );
});

test('PublicViewer renders owner edit entry when isLogbookReportOwner', () => {
  const src = readFileSync(join(root, 'src/pages/DailyReport/PublicViewer.jsx'), 'utf8');
  assert.match(src, /isLogbookReportOwner/);
  assert.match(src, /LogbookOwnerEditButton/);
  assert.match(src, /showOwnerEdit/);
});

test('LogbookOwnerEditButton navigates to existing write route', () => {
  const src = readFileSync(join(root, 'src/pages/DailyReport/components/LogbookOwnerEditButton.jsx'), 'utf8');
  assert.match(src, /data-logbook-owner-edit/);
  assert.match(src, /\/blog\/write\//);
});

test('Detail reuses LogbookOwnerEditButton', () => {
  const src = readFileSync(join(root, 'src/pages/DailyReport/Detail.jsx'), 'utf8');
  assert.match(src, /LogbookOwnerEditButton/);
});
