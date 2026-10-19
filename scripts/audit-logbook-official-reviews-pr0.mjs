#!/usr/bin/env node
/**
 * PR-0 read-only checks against production anon REST (no writes).
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in env.
 *
 *   node scripts/audit-logbook-official-reviews-pr0.mjs
 *   node scripts/audit-logbook-official-reviews-pr0.mjs --write reviews/audit/2026-10-19-logbook-review-hub-pr0.json
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EDITORIAL_REVIEW_INDEX_SELECT,
  countPersonaLabels,
  fetchEditorialReviewIndex,
} from '../src/logbookOfficialReviews/editorialReviewIndex.js';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function supabaseRestHeaders(anon) {
  return { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' };
}

async function probeTitleColumn(url, anon) {
  const path =
    '/rest/v1/place_reviews?select=id,title&is_editorial=eq.true&limit=1';
  const res = await fetch(`${url}${path}`, { headers: supabaseRestHeaders(anon) });
  const body = await res.json().catch(() => null);
  return {
    httpStatus: res.status,
    ok: res.ok,
    postgresCode: body?.code ?? null,
    message: body?.message ?? null,
  };
}

async function probeVisitStoriesSelect(url, anon, placeSlug = 'cairo') {
  const path =
    `/rest/v1/place_reviews?select=id,title,is_editorial,created_at&place_slug=eq.${encodeURIComponent(placeSlug)}&limit=5`;
  const res = await fetch(`${url}${path}`, { headers: supabaseRestHeaders(anon) });
  const body = await res.json().catch(() => null);
  return {
    httpStatus: res.status,
    ok: res.ok,
    postgresCode: body?.code ?? null,
    message: body?.message ?? null,
    placeSlug,
  };
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error('audit-logbook-official-reviews-pr0: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const client = createClient(url, anon);
  let rows = [];
  let indexError = null;
  try {
    rows = await fetchEditorialReviewIndex(client);
  } catch (error) {
    indexError = {
      message: error?.message ?? String(error),
      code: error?.code ?? null,
    };
  }

  const personaLabelCounts = countPersonaLabels(rows);
  const editorialWithIsPublicFalse = rows.filter((row) => row.is_public === false).length;

  const titleProbe = await probeTitleColumn(url, anon);
  const visitStoriesProbe = await probeVisitStoriesSelect(url, anon);

  const findings = {
    generatedAt: new Date().toISOString(),
    selectList: EDITORIAL_REVIEW_INDEX_SELECT,
    anonymousEditorialIndexWithoutPlaceFilter: {
      ok: !indexError && Array.isArray(rows),
      rowCount: rows.length,
      error: indexError,
    },
    titleColumn: {
      exists: titleProbe.ok,
      ...titleProbe,
      breaksVisitStoriesQuery: !visitStoriesProbe.ok,
      visitStoriesProbe,
    },
    editorialCounts: {
      total: rows.length,
      personaLabelCounts,
      editorialWithIsPublicFalse,
    },
  };

  const writeArg = process.argv.indexOf('--write');
  if (writeArg !== -1 && process.argv[writeArg + 1]) {
    const outPath = join(root, process.argv[writeArg + 1]);
    writeFileSync(outPath, `${JSON.stringify(findings, null, 2)}\n`, 'utf8');
    console.error(`Wrote ${process.argv[writeArg + 1]}`);
  }

  console.log(JSON.stringify(findings, null, 2));

  const pass =
    findings.anonymousEditorialIndexWithoutPlaceFilter.ok &&
    findings.anonymousEditorialIndexWithoutPlaceFilter.rowCount > 0;
  if (!pass) {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
