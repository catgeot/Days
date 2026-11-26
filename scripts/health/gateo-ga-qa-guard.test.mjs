import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  GATEO_GA_PRODUCTION_HOST,
  gateoGaMeasurementId,
  isGateoGaProductionHost,
  shouldSkipGateoGaLoad,
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

test('isGateoGaProductionHost — exact www host only', () => {
  assert.equal(isGateoGaProductionHost('www.gateo.kr'), true);
  assert.equal(isGateoGaProductionHost('gateo.kr'), false);
  assert.equal(isGateoGaProductionHost('localhost'), false);
  assert.equal(isGateoGaProductionHost('127.0.0.1'), false);
  assert.equal(isGateoGaProductionHost('days-abc.vercel.app'), false);
  assert.equal(isGateoGaProductionHost(''), false);
});

test('shouldSkipGateoGaLoad — non-production host skips even without QA signals', () => {
  assert.equal(shouldSkipGateoGaLoad({ hostname: '127.0.0.1', webdriver: false }), true);
  assert.equal(shouldSkipGateoGaLoad({ hostname: 'www.gateo.kr', webdriver: false }), false);
  assert.equal(shouldSkipGateoGaLoad({ hostname: 'www.gateo.kr', webdriver: true }), true);
});

function domWithIndexHtml(url) {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  return new JSDOM(html, {
    url,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });
}

function gtmScriptCount(window) {
  return [...window.document.querySelectorAll('script')].filter((el) =>
    String(el.src || '').includes('googletagmanager.com'),
  ).length;
}

test('index.html — localhost: no googletagmanager script, GA stub no-ops', () => {
  const dom = domWithIndexHtml('http://127.0.0.1:5173/');
  const { window } = dom;
  assert.equal(gtmScriptCount(window), 0);
  assert.equal(window.__GATEO_GA_DISABLED__, true);
  assert.equal(typeof window.gtag, 'function');
  assert.doesNotThrow(() => {
    window.gtag('event', 'gateo_test', { ping: 1 });
  });
});

test('index.html — www.gateo.kr: gtag.js injected when not QA/webdriver', () => {
  const dom = domWithIndexHtml('https://www.gateo.kr/');
  const { window } = dom;
  assert.notEqual(window.__GATEO_GA_DISABLED__, true);
  assert.equal(gtmScriptCount(window), 1);
  assert.equal(typeof window.gtag, 'function');
});

test('index.html — QA/webdriver guard before gtag network load', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.match(html, /navigator\.webdriver/);
  assert.match(html, /gateo_qa/);
  assert.match(html, /__GATEO_GA_DISABLED__/);
  assert.match(html, /__GATEO_GA_EVENTS__/);
  assert.match(html, /location\.hostname\s*!==\s*'www\.gateo\.kr'/);
  assert.ok(html.includes(GATEO_GA_PRODUCTION_HOST));
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