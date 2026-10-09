#!/usr/bin/env node
/**
 * Two-phase staging Gemini compare. Do not point this at production.
 *
 * `--phase before` MUST run before #413 is deployed to staging. It calls the
 * Edge that is live at that moment (QUALITY is gemini-3.5-flash) and saves JSON.
 * `--phase after` runs the same samples after that deploy and writes
 * side-by-side markdown. After deploy, old model ids alias to gemini-3.8-flash,
 * so a single later run cannot recover the old answers.
 *
 * Usage:
 *   STAGING_SUPABASE_URL=https://qeqszwxjvhnbzhkchera.supabase.co \
 *   STAGING_SUPABASE_ANON_KEY=... \
 *   STAGING_USER_JWT=... \
 *   node scripts/staging/compare-gemini-models.mjs --phase before
 *
 *   # deploy #413 Edge functions to staging, then:
 *   node scripts/staging/compare-gemini-models.mjs --phase after
 *
 * STAGING_USER_JWT is an authenticated user access token. review_draft
 * returns 403 with the anon key alone and is stored as skip.
 * Optional:
 *   STAGING_COMPARE_BEFORE=scripts/staging/out/gemini-model-compare-before.json
 *   STAGING_COMPARE_OUT=scripts/staging/out/gemini-model-compare.md
 *
 * The script calls staging gemini-proxy only. It does not deploy functions
 * and does not call the Supabase management or log APIs.
 * Wiki and magazine rows are short legacy prompts. They do not call
 * update-place-wiki or generate-place-magazine (those upsert the database).
 * On the pre-#413 Edge, legacy WRITE ids are remapped to QUALITY, so those
 * rows compare gemini-3.5-flash text with the post-deploy gemini-3.8-flash text.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  BEFORE_SCHEMA,
  NEW_MODEL,
  WRITE_FALLBACK_MODEL,
  afterModelError,
  beforeSnapshotError,
  pairSamples,
  parsePhase,
  renderCompareMarkdown,
  sampleCatalog,
  shapeResult,
  skipResult,
  writeFallbackModelError,
} from './compareGeminiModelsLib.mjs';

const STAGING_REF = 'qeqszwxjvhnbzhkchera';
const PROD_REF = 'phdjnbfitvmrguqzverm';

const phase = parsePhase(process.argv);
const url = (process.env.STAGING_SUPABASE_URL || '').trim().replace(/\/$/, '');
const anon = (process.env.STAGING_SUPABASE_ANON_KEY || '').trim();
const userJwt = (process.env.STAGING_USER_JWT || '').trim();
const beforePath = process.env.STAGING_COMPARE_BEFORE
  || 'scripts/staging/out/gemini-model-compare-before.json';
const outPath = process.env.STAGING_COMPARE_OUT
  || 'scripts/staging/out/gemini-model-compare.md';

function refuse(message) {
  console.error(message);
  process.exit(1);
}

if (!phase) {
  refuse('Pass --phase before (before the #413 staging deploy) or --phase after (after that deploy).');
}
if (!url || !anon) {
  refuse('Set STAGING_SUPABASE_URL and STAGING_SUPABASE_ANON_KEY. This script is not run in CI.');
}
if (url.includes(PROD_REF) || !url.includes(STAGING_REF)) {
  refuse(`Refusing non-staging URL. Expected project ref ${STAGING_REF}.`);
}

const endpoint = `${url}/functions/v1/gemini-proxy`;

async function postProxy(body, token) {
  const started = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
      'Content-Type': 'application/json',
      Origin: 'https://www.gateo.kr',
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { status: response.status, data, latencyMs: Date.now() - started };
}

function fromProxy(id, result, expectJson, legacyText) {
  const data = result.data || {};
  return shapeResult({
    id,
    status: result.status,
    modelUsed: data.modelUsed || '',
    finishReason: data.finishReason || '',
    truncated: data.truncated === true,
    error: data.error || '',
    text: legacyText || data.text || data.raw || '',
    latencyMs: result.latencyMs,
    expectJson,
  });
}

async function runSample(sample) {
  if (sample.auth && !userJwt) {
    return skipResult(sample.id, 'Set STAGING_USER_JWT (authenticated access token). Anon is 403.');
  }
  const token = sample.auth ? userJwt : anon;
  if (sample.kind === 'legacy') {
    const result = await postProxy({
      modelId: sample.modelId,
      parts: [{ text: sample.prompt }],
    }, token);
    const data = result.data || {};
    const legacyText = data?.data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('') || '';
    return fromProxy(sample.id, result, sample.expectJson, legacyText);
  }
  const result = await postProxy({ task: sample.task, params: sample.params }, token);
  return fromProxy(sample.id, result, sample.expectJson, '');
}

async function runCatalog() {
  const rows = [];
  for (const sample of sampleCatalog()) {
    const row = await runSample(sample);
    console.log(`${phase} ${row.id} status=${row.status} modelUsed=${row.modelUsed || '-'} chars=${row.textLength} ms=${row.latencyMs ?? '-'}`);
    rows.push(row);
  }
  return rows;
}

function writeJson(filePath, payload) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

if (phase === 'before') {
  const samples = await runCatalog();
  const blocked = beforeSnapshotError(samples);
  if (blocked) refuse(blocked);
  writeJson(beforePath, {
    schema: BEFORE_SCHEMA,
    phase: 'before',
    capturedAt: new Date().toISOString(),
    endpoint,
    note: 'Captured before the #413 staging deploy. Do not deploy #413 until this file exists.',
    samples,
  });
  console.log(`wrote ${beforePath}`);
} else {
  let beforeDoc;
  try {
    beforeDoc = JSON.parse(readFileSync(beforePath, 'utf8'));
  } catch {
    refuse(`Missing before snapshot ${beforePath}. Run --phase before before deploying #413 to staging.`);
  }
  if (beforeDoc?.schema !== BEFORE_SCHEMA || !Array.isArray(beforeDoc.samples)) {
    refuse(`Before snapshot ${beforePath} is not schema ${BEFORE_SCHEMA}.`);
  }
  if (beforeDoc.endpoint !== endpoint) {
    refuse(`Before snapshot endpoint ${beforeDoc.endpoint} does not match ${endpoint}.`);
  }
  const samples = await runCatalog();
  const fallbackRaw = await postProxy({
    modelId: WRITE_FALLBACK_MODEL,
    parts: [{ text: 'Reply with the single word ok.' }],
  }, anon);
  const fallback = fromProxy('write_fallback', fallbackRaw, false, '');
  console.log(`after write_fallback status=${fallback.status} modelUsed=${fallback.modelUsed || '-'}`);

  const pairs = pairSamples(beforeDoc.samples, samples);
  const markdown = renderCompareMarkdown({
    endpoint,
    beforeCapturedAt: beforeDoc.capturedAt,
    afterCapturedAt: new Date().toISOString(),
    pairs,
    fallback,
  });
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown, 'utf8');
  console.log(`wrote ${outPath}`);

  const modelError = afterModelError(samples);
  if (modelError) console.error(modelError);
  const fallbackError = writeFallbackModelError(fallback);
  if (fallbackError) console.error(fallbackError);
  const flagged = pairs.filter((pair) => pair.flags.length > 0);
  if (flagged.length > 0) {
    console.error(`New output flagged: ${flagged.map((pair) => `${pair.id} (${pair.flags.join(', ')})`).join('; ')}`);
  }
  if (modelError || fallbackError || flagged.length > 0) process.exit(1);
  console.log(`after modelUsed ${NEW_MODEL} on ${samples.filter((row) => row.status !== 'skip').length} samples; WRITE fallback ${WRITE_FALLBACK_MODEL}`);
}
