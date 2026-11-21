import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  gateoGaMeasurementId,
  withGateoQaQuery,
} from '../../src/shared/analytics/gateoGaQa.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('withGateoQaQuery appends qa=1 once', () => {
  assert.equal(withGateoQaQuery('https://www.gateo.kr/korea'), 'https://www.gateo.kr/korea?qa=1');
  assert.equal(
    withGateoQaQuery('https://www.gateo.kr/?qa=1'),
    'https://www.gateo.kr/?qa=1',
  );
});

test('gateoGaMeasurementId is stable', () => {
  assert.match(gateoGaMeasurementId(), /^G-/);
});

test('index.html — QA/webdriver guard before gtag network load', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(html, /navigator\.webdriver/);
  assert.match(html, /gateo_qa/);
  assert.match(html, /__GATEO_GA_DISABLED__/);
  assert.match(html, /__GATEO_GA_EVENTS__/);
  const guardIdx = html.indexOf('__GATEO_GA_DISABLED__');
  const gtagNetIdx = html.indexOf('googletagmanager.com/gtag/js');
  assert.ok(guardIdx > -1 && gtagNetIdx > -1);
  assert.ok(guardIdx < gtagNetIdx, 'guard runs before gtag.js fetch');
});

test('e2e fixtures persist gateo_qa init script', () => {
  const fixtures = readFileSync(join(root, 'e2e/fixtures.js'), 'utf8');
  assert.match(fixtures, /gateo_qa/);
});

test('e2e-health workflow uses qa-marked site URL', () => {
  const wf = readFileSync(join(root, '.github/workflows/e2e-health.yml'), 'utf8');
  assert.match(wf, /qa=1/);
});