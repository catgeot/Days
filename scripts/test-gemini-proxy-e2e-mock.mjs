#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  buildGeminiProxyMockBody,
  parseGeminiProxyInvokeText,
} from '../e2e/gemini-proxy-mock-response.js';

const sample = 'E2E contract probe';
const body = buildGeminiProxyMockBody(sample, { modelUsed: 'mock-unit' });
assert.equal(body.success, true);
assert.equal(body.text, sample);
assert.equal(body.finishReason, 'STOP');
assert.equal(body.truncated, false);
assert.equal(parseGeminiProxyInvokeText(body), sample);

assert.equal(parseGeminiProxyInvokeText({ success: true, text: '  ' }), '죄송합니다.');
assert.equal(parseGeminiProxyInvokeText({ success: true }), '죄송합니다.');
assert.equal(
  parseGeminiProxyInvokeText({
    success: true,
    data: { candidates: [{ content: { parts: [{ text: 'legacy-only' }] } }] },
  }),
  '죄송합니다.',
  'old candidates-only mock shape must not satisfy the client',
);

console.log('PASS  test-gemini-proxy-e2e-mock');
