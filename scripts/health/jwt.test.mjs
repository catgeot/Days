import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSmokeJson } from './summarize.mjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { sanitizeText, publicReason } = require('./report-issues.cjs');

test('JWT in detail → public reason and body never contain eyJ', () => {
  const jwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InF3ZXJ0eSJ9.c2lnbmF0dXJlLXNpZ25hdHVyZS1zaWduYXR1cmU';
  const [r] = parseSmokeJson(
    { checks: [{ id: 'P0-3', status: 'fail', detail: 'HTTP 401 Bearer ' + jwt }] },
    'smoke',
  );
  const body = sanitizeText(`${r.feature} — ${publicReason(r.reasonCode)}`);
  assert.doesNotMatch(r.reason, /eyJ/);
  assert.doesNotMatch(body, /eyJ/);
});
