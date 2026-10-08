/**
 * Pure helpers for the two-phase staging Gemini compare.
 * The CLI (compare-gemini-models.mjs) performs the network calls.
 */

export const NEW_MODEL = 'gemini-3.8-flash';
export const WRITE_FALLBACK_MODEL = 'gemini-3.7-flash';
export const OLD_QUALITY = 'gemini-3.5-flash';
export const OLD_WRITE = 'gemini-3.1-pro-preview';
export const BEFORE_SCHEMA = 1;

export function parsePhase(argv) {
  const index = argv.indexOf('--phase');
  const value = index >= 0 ? argv[index + 1] : '';
  if (value === 'before' || value === 'after') return value;
  return null;
}

export function curationJsonOk(text) {
  try {
    const match = String(text || '').match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return false;
    JSON.parse(match[0]);
    return true;
  } catch {
    return false;
  }
}

export function sampleCatalog() {
  const places = ['파리', '미야코지마', '교토'];
  const samples = places.map((placeName) => ({
    id: `place_intro:${placeName}`,
    kind: 'task',
    task: 'place_intro',
    params: { locale: 'ko', placeName },
    expectJson: false,
  }));
  samples.push({
    id: 'review_draft:파리',
    kind: 'task',
    task: 'review_draft',
    auth: true,
    params: { placeName: '파리', rating: 5, draft: '센 강 산책이 좋았다' },
    expectJson: false,
  });
  samples.push({
    id: 'curation',
    kind: 'task',
    task: 'curation',
    expectJson: true,
    params: {
      locale: 'ko',
      reports: ['파리'],
      saved: ['교토'],
      exclude: [],
      rejected: [],
      recentSearches: ['바다'],
      recentVisited: ['미야코지마'],
      tasteTags: ['sea', 'slow'],
    },
  });
  samples.push({
    id: 'mooni_chat:미야코지마-3박4일',
    kind: 'task',
    task: 'mooni_chat',
    expectJson: false,
    params: {
      persona: 'PLANNER',
      tier: 'quality',
      locale: 'ko',
      isMooni: true,
      locationName: '미야코지마',
      boundPlaceName: '미야코지마',
      userText: '미야코지마 3박 4일 일정 짜줘',
      history: [],
      showPlannerHeader: true,
    },
  });
  samples.push({
    id: 'wiki:파리',
    kind: 'legacy',
    modelId: OLD_WRITE,
    expectJson: false,
    prompt: '파리 실용 정보 두 문장만. 없는 URL은 만들지 마. JSON: {"markdown":"..."}',
  });
  samples.push({
    id: 'magazine:교토',
    kind: 'legacy',
    modelId: OLD_WRITE,
    expectJson: false,
    prompt: '교토 매거진 요약 JSON 배열 1개만. [{"title":"...","content":"..."}]. URL은 만들지 마.',
  });
  return samples;
}

export function shapeResult(raw) {
  const text = String(raw.text || '');
  const finishReason = raw.finishReason || '';
  const truncated = raw.truncated === true || finishReason === 'MAX_TOKENS';
  const jsonParseOk = raw.expectJson ? curationJsonOk(text) : null;
  return {
    id: raw.id,
    status: raw.status,
    modelUsed: raw.modelUsed || '',
    finishReason,
    truncated,
    error: raw.error || '',
    text,
    textLength: text.length,
    latencyMs: Number.isFinite(raw.latencyMs) ? raw.latencyMs : null,
    jsonParseOk,
  };
}

export function skipResult(id, error) {
  return shapeResult({
    id,
    status: 'skip',
    modelUsed: '',
    finishReason: '',
    truncated: false,
    error,
    text: '',
    latencyMs: null,
    expectJson: false,
  });
}

/** Non-empty when this snapshot cannot be the pre-#413 baseline. */
export function beforeSnapshotError(results) {
  for (const row of results) {
    if (row.status === 'skip') continue;
    if (row.modelUsed === NEW_MODEL) {
      return `${row.id} returned ${NEW_MODEL}. Run --phase before before deploying #413 to staging.`;
    }
    if (row.status !== 200) {
      return `${row.id} status=${row.status} error=${row.error || '(none)'}. Before snapshot was not saved.`;
    }
  }
  return '';
}

/**
 * After deploy, task and legacy QUALITY/WRITE samples must report 3.8-flash.
 * Returns the first mismatch, or ''.
 */
export function afterModelError(results) {
  for (const row of results) {
    if (row.status === 'skip') continue;
    if (row.modelUsed !== NEW_MODEL) {
      return `${row.id} modelUsed=${row.modelUsed || '(empty)'} expected ${NEW_MODEL}`;
    }
  }
  return '';
}

/** Legacy allowlist call. Wiki/magazine fallback itself writes the database. */
export function writeFallbackModelError(result) {
  if (!result || result.modelUsed !== WRITE_FALLBACK_MODEL) {
    return `WRITE fallback modelUsed=${result?.modelUsed || '(empty)'} expected ${WRITE_FALLBACK_MODEL}`;
  }
  return '';
}

export function qualityFlags(after) {
  if (!after || after.status === 'skip') return [];
  const flags = [];
  if (after.status !== 200) flags.push(`status_${after.status}`);
  if (!String(after.text || '').trim()) flags.push('empty');
  if (after.truncated) flags.push('truncated');
  if (after.jsonParseOk === false) flags.push('json_parse_failed');
  return flags;
}

function cell(value, max = 360) {
  return String(value ?? '').replace(/\s+/g, ' ').slice(0, max).replace(/\|/g, '\\|');
}

function jsonCell(value) {
  if (value === true) return 'ok';
  if (value === false) return 'fail';
  return 'n/a';
}

export function renderCompareMarkdown({
  endpoint,
  beforeCapturedAt,
  afterCapturedAt,
  pairs,
  fallback,
}) {
  const flagged = pairs.filter((pair) => pair.flags.length > 0);
  const lines = [
    '# Staging Gemini QUALITY compare',
    '',
    `Endpoint: \`${endpoint}\``,
    `Before captured: ${beforeCapturedAt || '(missing)'}`,
    `After captured: ${afterCapturedAt}`,
    '',
    '`before` calls the Edge that is deployed at that moment and stores the raw answers.',
    'Deploy #413 to staging only after that JSON exists. `after` repeats the same requests and writes this file.',
    'A single run after deploy cannot recover the old answers: old ids then alias to `gemini-3.8-flash`.',
    '',
    `Flagged new outputs: ${flagged.length === 0 ? 'none' : flagged.map((pair) => `${pair.id} (${pair.flags.join(', ')})`).join('; ')}`,
    '',
    '| Sample | Old text | New text | Old length | New length | Old finish/truncated | New finish/truncated | JSON parse (old / new) | Old latency ms | New latency ms | Old modelUsed | New modelUsed | Flags |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const pair of pairs) {
    const old = pair.before;
    const next = pair.after;
    lines.push([
      cell(pair.id, 80),
      cell(old?.text || old?.error || ''),
      cell(next?.text || next?.error || ''),
      cell(old?.textLength ?? ''),
      cell(next?.textLength ?? ''),
      cell(`${old?.finishReason || old?.error || '-'} / ${old?.truncated === true}`),
      cell(`${next?.finishReason || next?.error || '-'} / ${next?.truncated === true}`),
      cell(`${jsonCell(old?.jsonParseOk)} / ${jsonCell(next?.jsonParseOk)}`),
      cell(old?.latencyMs ?? ''),
      cell(next?.latencyMs ?? ''),
      cell(old?.modelUsed || ''),
      cell(next?.modelUsed || ''),
      cell(pair.flags.join(', ') || '-'),
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }

  lines.push('', '## Full text', '');
  for (const pair of pairs) {
    lines.push(`### ${pair.id}`, '', '**Old**', '', pair.before?.text || pair.before?.error || '(empty)', '', '**New**', '', pair.after?.text || pair.after?.error || '(empty)', '');
  }

  const fallbackLine = fallback
    ? `modelUsed=\`${fallback.modelUsed || '(empty)'}\` status=${fallback.status} latencyMs=${fallback.latencyMs ?? '-'}`
    : 'not run';
  lines.push(
    '## WRITE fallback probe',
    '',
    `Legacy \`modelId\` \`${WRITE_FALLBACK_MODEL}\` (after only): ${fallbackLine}.`,
    'Expected `modelUsed` is `gemini-3.7-flash`.',
    'Wiki, toolkit, magazine, and event-guide retry 3.7-flash only when the 3.8-flash call fails, and magazine also retries when JSON does not parse. Those functions upsert the database, so this script does not call them.',
    '',
  );
  return `${lines.join('\n')}\n`;
}

export function pairSamples(beforeSamples, afterSamples) {
  const beforeById = new Map((beforeSamples || []).map((row) => [row.id, row]));
  return afterSamples.map((after) => {
    const before = beforeById.get(after.id) || null;
    const flags = qualityFlags(after);
    if (!before) flags.push('missing_before');
    return { id: after.id, before, after, flags };
  });
}
