import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  NEW_MODEL,
  WRITE_FALLBACK_MODEL,
  afterModelError,
  beforeSnapshotError,
  pairSamples,
  parsePhase,
  qualityFlags,
  renderCompareMarkdown,
  sampleCatalog,
  shapeResult,
  writeFallbackModelError,
} from '../staging/compareGeminiModelsLib.mjs';

test('phase flag is before or after', () => {
  assert.equal(parsePhase(['node', 'script', '--phase', 'before']), 'before');
  assert.equal(parsePhase(['node', 'script', '--phase', 'after']), 'after');
  assert.equal(parsePhase(['node', 'script']), null);
  assert.equal(parsePhase(['node', 'script', '--phase', 'alias']), null);
});

test('sample catalog is stable for both phases', () => {
  const ids = sampleCatalog().map((sample) => sample.id);
  assert.deepEqual(ids, [
    'place_intro:파리',
    'place_intro:미야코지마',
    'place_intro:교토',
    'review_draft:파리',
    'curation',
    'mooni_chat:미야코지마-3박4일',
    'wiki:파리',
    'magazine:교토',
  ]);
});

test('before snapshot refuses gemini-3.8-flash', () => {
  const old = shapeResult({
    id: 'place_intro:파리',
    status: 200,
    modelUsed: 'gemini-3.5-flash',
    finishReason: 'STOP',
    text: '옛 소개',
    latencyMs: 10,
    expectJson: false,
  });
  assert.equal(beforeSnapshotError([old]), '');
  const alreadyNew = { ...old, modelUsed: NEW_MODEL };
  assert.match(beforeSnapshotError([alreadyNew]), /before deploying #413/);
});

test('after requires gemini-3.8-flash and flags bad new text', () => {
  const good = shapeResult({
    id: 'place_intro:파리',
    status: 200,
    modelUsed: NEW_MODEL,
    finishReason: 'STOP',
    text: '새 소개',
    latencyMs: 12,
    expectJson: false,
  });
  assert.equal(afterModelError([good]), '');
  assert.deepEqual(qualityFlags(good), []);
  assert.match(afterModelError([{ ...good, modelUsed: 'gemini-3.5-flash' }]), /expected gemini-3\.8-flash/);

  const truncated = shapeResult({
    id: 'mooni_chat:미야코지마-3박4일',
    status: 200,
    modelUsed: NEW_MODEL,
    finishReason: 'MAX_TOKENS',
    truncated: true,
    text: '1일차',
    latencyMs: 20,
    expectJson: false,
  });
  assert.deepEqual(qualityFlags(truncated), ['truncated']);
  assert.deepEqual(qualityFlags({ ...good, text: '   ', textLength: 3 }), ['empty']);

  const curation = shapeResult({
    id: 'curation',
    status: 200,
    modelUsed: NEW_MODEL,
    finishReason: 'STOP',
    text: 'not json',
    latencyMs: 8,
    expectJson: true,
  });
  assert.equal(curation.jsonParseOk, false);
  assert.deepEqual(qualityFlags(curation), ['json_parse_failed']);
  const parsed = shapeResult({
    id: 'curation',
    status: 200,
    modelUsed: NEW_MODEL,
    finishReason: 'STOP',
    text: '{"picks":[{"name":"파리","reason":"바다"}]}',
    latencyMs: 8,
    expectJson: true,
  });
  assert.equal(parsed.jsonParseOk, true);
  assert.deepEqual(qualityFlags(parsed), []);
});

test('WRITE fallback check expects gemini-3.7-flash', () => {
  assert.equal(writeFallbackModelError({ modelUsed: WRITE_FALLBACK_MODEL }), '');
  assert.match(writeFallbackModelError({ modelUsed: NEW_MODEL }), /gemini-3\.7-flash/);
  assert.match(writeFallbackModelError(null), /gemini-3\.7-flash/);
});

test('markdown places old text beside new text and lists flags', () => {
  const before = shapeResult({
    id: 'curation',
    status: 200,
    modelUsed: 'gemini-3.5-flash',
    finishReason: 'STOP',
    text: '{"picks":[{"name":"옛"}]}',
    latencyMs: 40,
    expectJson: true,
  });
  const after = shapeResult({
    id: 'curation',
    status: 200,
    modelUsed: NEW_MODEL,
    finishReason: 'MAX_TOKENS',
    truncated: true,
    text: '',
    latencyMs: 55,
    expectJson: true,
  });
  const pairs = pairSamples([before], [after]);
  assert.deepEqual(pairs[0].flags, ['empty', 'truncated', 'json_parse_failed']);
  const markdown = renderCompareMarkdown({
    endpoint: 'https://qeqszwxjvhnbzhkchera.supabase.co/functions/v1/gemini-proxy',
    beforeCapturedAt: '2026-10-08T00:00:00.000Z',
    afterCapturedAt: '2026-10-08T01:00:00.000Z',
    pairs,
    fallback: { modelUsed: WRITE_FALLBACK_MODEL, status: 200, latencyMs: 9 },
  });
  assert.match(markdown, /옛/);
  assert.match(markdown, /gemini-3\.5-flash/);
  assert.match(markdown, /gemini-3\.8-flash/);
  assert.match(markdown, /gemini-3\.7-flash/);
  assert.match(markdown, /empty, truncated, json_parse_failed/);
  assert.match(markdown, /40/);
  assert.match(markdown, /55/);
  assert.match(markdown, /before deploying #413|Deploy #413 to staging only after/);
});
