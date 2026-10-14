import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { previewDebugChromeAllowed } from '../../src/shared/cloudPreview/isCloudPreviewSurface.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const preview = 'days-git-cursor-festival-access-promo-5b7f-catgeots-projects.vercel.app';

test('work log and mobile widget log stay off production hosts', () => {
  assert.equal(previewDebugChromeAllowed('www.gateo.kr'), false);
  assert.equal(previewDebugChromeAllowed('gateo.kr', { dev: true }), false);
  assert.equal(previewDebugChromeAllowed('www.gateo.kr', { dev: true }), false);
  assert.equal(previewDebugChromeAllowed('days-catgeots-projects.vercel.app'), false);
  assert.equal(previewDebugChromeAllowed('days.vercel.app'), false);
  assert.equal(previewDebugChromeAllowed(preview), true);
  assert.equal(previewDebugChromeAllowed('localhost'), true);
  assert.equal(previewDebugChromeAllowed('127.0.0.1', { dev: false }), true);
  assert.equal(previewDebugChromeAllowed('example.com', { dev: true }), true);
  assert.equal(previewDebugChromeAllowed('example.com'), false);

  const flight = readFileSync(join(root, 'src/shared/cloudPreview/flightDebug.js'), 'utf8');
  const work = readFileSync(join(root, 'src/shared/cloudPreview/CloudPreviewWorkLog.jsx'), 'utf8');
  const panel = readFileSync(join(root, 'src/shared/cloudPreview/FlightDebugPanel.jsx'), 'utf8');
  const gate = flight.slice(flight.indexOf('export function isFlightDebugEnabled'));
  assert.match(gate, /previewDebugChromeAllowed\(/);
  assert.ok(
    gate.indexOf('previewDebugChromeAllowed(') < gate.indexOf("params.get('debug')"),
    'production hosts return before a debug query can enable the widget log',
  );
  assert.match(work, /previewDebugChromeAllowed\(/);
  assert.match(panel, /if \(!enabled\) return null/);
  assert.match(work, /if \(!visible\) return null/);
});
