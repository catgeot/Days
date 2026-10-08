#!/usr/bin/env node
/**
 * Staging-only Gemini sample compare. Do not point this at production.
 *
 * Usage:
 *   STAGING_SUPABASE_URL=https://qeqszwxjvhnbzhkchera.supabase.co \
 *   STAGING_SUPABASE_ANON_KEY=... \
 *   STAGING_USER_JWT=... \
 *   node scripts/staging/compare-gemini-models.mjs
 *
 * STAGING_USER_JWT is an authenticated user access token. review_draft
 * returns 403 with the anon key alone.
 * Optional: STAGING_COMPARE_OUT=scripts/staging/out/gemini-model-compare.md
 *
 * The script calls staging gemini-proxy only. It does not deploy functions
 * and does not call the Supabase management or log APIs.
 * After this branch is deployed, old model ids alias to gemini-3.8-flash,
 * so the old-id column is an alias check (modelUsed), not a 3.5/3.1-pro run.
 * Wiki and magazine rows are short legacy prompts. They do not call
 * update-place-wiki or generate-place-magazine (those upsert the database).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const STAGING_REF = 'qeqszwxjvhnbzhkchera';
const PROD_REF = 'phdjnbfitvmrguqzverm';
const NEW_MODEL = 'gemini-3.8-flash';
const OLD_QUALITY = 'gemini-3.5-flash';
const OLD_WRITE = 'gemini-3.1-pro-preview';

const url = (process.env.STAGING_SUPABASE_URL || '').trim().replace(/\/$/, '');
const anon = (process.env.STAGING_SUPABASE_ANON_KEY || '').trim();
const userJwt = (process.env.STAGING_USER_JWT || '').trim();
const outPath = process.env.STAGING_COMPARE_OUT
  || 'scripts/staging/out/gemini-model-compare.md';

function refuse(message) {
  console.error(message);
  process.exit(1);
}

if (!url || !anon) {
  refuse('Set STAGING_SUPABASE_URL and STAGING_SUPABASE_ANON_KEY. This script is not run in CI.');
}
if (url.includes(PROD_REF) || !url.includes(STAGING_REF)) {
  refuse(`Refusing non-staging URL. Expected project ref ${STAGING_REF}.`);
}

const endpoint = `${url}/functions/v1/gemini-proxy`;

async function postProxy(body, token) {
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
  return { status: response.status, data };
}

function excerpt(value, max = 500) {
  return String(value ?? '').replace(/\s+/g, ' ').slice(0, max);
}

function cell(value) {
  return excerpt(value, 280).replace(/\|/g, '\\|');
}

const rows = [];

function addRow(name, left, right) {
  rows.push({ name, left, right });
}

async function taskCall(task, params, token = anon) {
  const result = await postProxy({ task, params }, token);
  const data = result.data || {};
  return {
    status: result.status,
    modelUsed: data.modelUsed || '',
    finishReason: data.finishReason || '',
    truncated: data.truncated === true,
    error: data.error || '',
    text: data.text || data.raw || '',
  };
}

async function legacyCall(modelId, prompt, token = anon) {
  const result = await postProxy({
    modelId,
    parts: [{ text: prompt }],
  }, token);
  const data = result.data || {};
  const legacyText = data?.data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('') || data.text || '';
  return {
    status: result.status,
    modelUsed: data.modelUsed || '',
    finishReason: data.finishReason || '',
    truncated: data.truncated === true,
    error: data.error || '',
    text: legacyText || data.raw || '',
  };
}

const places = ['파리', '미야코지마', '교토'];
const first = await taskCall('place_intro', { locale: 'ko', placeName: places[0] });
if (first.status !== 200 || first.modelUsed !== NEW_MODEL || !first.text) {
  refuse(
    `First call did not confirm ${NEW_MODEL}. status=${first.status} modelUsed=${first.modelUsed || '(empty)'} error=${first.error || '(none)'}`,
  );
}
console.log(`confirmed ${NEW_MODEL} via place_intro (${places[0]})`);

for (const placeName of places) {
  const fresh = placeName === places[0]
    ? first
    : await taskCall('place_intro', { locale: 'ko', placeName });
  const oldId = await legacyCall(
    OLD_QUALITY,
    `여행지 이름: ${placeName}\n이 장소를 2문장으로 소개해줘. URL은 만들지 마.`,
  );
  addRow(
    `place_intro ${placeName}`,
    oldId,
    fresh,
  );
}

if (!userJwt) {
  addRow('review_draft', {
    status: 'skip',
    error: 'Set STAGING_USER_JWT (authenticated access token). Anon is 403.',
    text: '',
    modelUsed: '',
    finishReason: '',
    truncated: false,
  }, {
    status: 'skip',
    error: 'same',
    text: '',
    modelUsed: '',
    finishReason: '',
    truncated: false,
  });
} else {
  const review = await taskCall('review_draft', {
    placeName: '파리',
    rating: 5,
    draft: '센 강 산책이 좋았다',
  }, userJwt);
  const reviewOld = await legacyCall(
    OLD_QUALITY,
    '파리 별점 5점. 메모: 센 강 산책이 좋았다. 리뷰 초안 4문장. URL은 만들지 마.',
    userJwt,
  );
  addRow('review_draft 파리', reviewOld, review);
}

const curation = await taskCall('curation', {
  locale: 'ko',
  reports: ['파리'],
  saved: ['교토'],
  exclude: [],
  rejected: [],
  recentSearches: ['바다'],
  recentVisited: ['미야코지마'],
  tasteTags: ['sea', 'slow'],
});
let curationParsed = false;
try {
  const match = String(curation.text).match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) {
    JSON.parse(match[0]);
    curationParsed = true;
  }
} catch {
  curationParsed = false;
}
curation.error = curation.error || (curationParsed ? '' : 'json_parse_failed');
const curationOld = await legacyCall(
  OLD_QUALITY,
  '취향: 바다, 느긋. 방문: 파리, 교토. 제외 없음. JSON만 출력: {"picks":[{"name":"...","reason":"..."}]}',
);
addRow('curation', curationOld, { ...curation, text: `${curationParsed ? 'JSON_OK ' : 'JSON_FAIL '}${curation.text}` });

const mooni = await taskCall('mooni_chat', {
  persona: 'PLANNER',
  tier: 'quality',
  locale: 'ko',
  isMooni: true,
  locationName: '미야코지마',
  boundPlaceName: '미야코지마',
  userText: '미야코지마 3박 4일 일정 짜줘',
  history: [],
  showPlannerHeader: true,
});
const mooniOld = await legacyCall(
  OLD_QUALITY,
  '미야코지마 3박 4일 일정만 작성. URL은 맥락에 없으므로 만들지 마.',
);
addRow(
  `mooni_chat 미야코지마 3박4일 finish=${mooni.finishReason || '-'} truncated=${mooni.truncated}`,
  mooniOld,
  mooni,
);

const wikiPrompt = '파리 실용 정보 두 문장만. 없는 URL은 만들지 마. JSON: {"markdown":"..."}';
addRow(
  'wiki sample (legacy, no DB upsert)',
  await legacyCall(OLD_WRITE, wikiPrompt),
  await legacyCall(NEW_MODEL, wikiPrompt),
);

const magazinePrompt = '교토 매거진 요약 JSON 배열 1개만. [{"title":"...","content":"..."}]. URL은 만들지 마.';
addRow(
  'magazine sample (legacy, no DB upsert)',
  await legacyCall(OLD_WRITE, magazinePrompt),
  await legacyCall(NEW_MODEL, magazinePrompt),
);

const lines = [
  '# Staging Gemini model compare',
  '',
  `Endpoint: \`${endpoint}\``,
  `First confirmed model: \`${NEW_MODEL}\``,
  '',
  'Old-id calls are aliased by the Edge deployed from this branch. `modelUsed` should be `gemini-3.8-flash` (or `gemini-3.7-flash` only if that id was requested).',
  'Task calls are the live path (place_intro, review_draft, curation, mooni_chat).',
  '',
  '| Sample | Old id status | Old modelUsed | Old finish / error | Old excerpt | New status | New modelUsed | New finish / truncated | New excerpt |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
];

for (const row of rows) {
  lines.push([
    cell(row.name),
    cell(row.left.status),
    cell(row.left.modelUsed),
    cell(row.left.finishReason || row.left.error),
    cell(row.left.text),
    cell(row.right.status),
    cell(row.right.modelUsed),
    cell(`${row.right.finishReason || row.right.error} truncated=${row.right.truncated}`),
    cell(row.right.text),
  ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
}

lines.push('');
const markdown = `${lines.join('\n')}\n`;
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, markdown, 'utf8');
console.log(`wrote ${outPath}`);

const failed = rows.some((row) => {
  const codes = [row.left.status, row.right.status];
  return codes.some((code) => code !== 200 && code !== 'skip');
});
if (!curationParsed && curation.status === 200) {
  console.error('curation JSON did not parse');
  process.exit(1);
}
if (failed) process.exit(1);
