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
  assert.match(work, /if \(!visible \|\| !workLogPack\) return null/);

  const app = readFileSync(join(root, 'src/App.jsx'), 'utf8');
  assert.match(app, /isPreviewDebugChromeBundled/);
  assert.match(app, /lazy\(\(\) => import\('\.\/shared\/cloudPreview\/PreviewDebugChrome\.jsx'\)/);
  assert.doesNotMatch(app, /from '\.\/shared\/cloudPreview\/CloudPreviewWorkLog\.jsx'/);

  const bundledGate = readFileSync(
    join(root, 'src/shared/cloudPreview/isPreviewDebugChromeBundled.js'),
    'utf8',
  );
  assert.match(
    bundledGate,
    /import\.meta\.env\.DEV \|\| import\.meta\.env\.VITE_GATEO_PREVIEW_DEBUG_CHROME_BUNDLED === '1'/,
    'operational PROD build must gate preview chrome on vite define only (VERCEL_ENV=preview)',
  );

  const viteConfig = readFileSync(join(root, 'vite.config.js'), 'utf8');
  assert.match(viteConfig, /VITE_GATEO_PREVIEW_DEBUG_CHROME_BUNDLED/);
  assert.match(viteConfig, /VERCEL_ENV === 'preview'/);
  assert.match(work, /import\('\.\/cloudPreviewWorkLog\.js'\)/);
  assert.doesNotMatch(work, /from '\.\/cloudPreviewWorkLog'/);

  const workLogSsot = readFileSync(join(root, 'src/shared/cloudPreview/cloudPreviewWorkLog.js'), 'utf8');
  for (const needle of ['모바일 위젯 로그', '작업 로그 닫기', 'cloud-preview-work-log-panel']) {
    assert.doesNotMatch(workLogSsot, new RegExp(needle), `preview work-log SSOT must not embed guard needle: ${needle}`);
  }
});
