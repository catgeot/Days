#!/usr/bin/env node
/**
 * Gemini 모델 SSOT · 2.5 잔존 · MOONi 라우팅 회귀.
 * 네트워크 없음. Usage: node scripts/smoke-gemini-models.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const LIVE_2_5 = /\bgemini-2\.5-(?:flash|pro)\b/;
const LIVE_FILES = [
  'src/utils/mooniChatModel.js',
  'src/pages/Home/lib/apiClient.js',
  'src/pages/Home/hooks/useHomeHandlers.js',
  'src/components/PlaceCard/modals/ReviewEditorModal.jsx',
  'src/pages/DailyReport/hooks/useLogbookAI.js',
  'src/pages/Home/lib/placeChatIntro.js',
  'supabase/functions/gemini-proxy/index.ts',
  'supabase/functions/update-place-wiki/index.ts',
  'supabase/functions/update-place-toolkit/index.ts',
  'supabase/functions/generate-place-magazine/index.ts',
  'supabase/functions/update-event-travel-guide/index.ts',
  'supabase/functions/explain-event-term/index.ts',
  'scripts/smoke-health.mjs',
];

async function main() {
  const {
    GEMINI_MODELS,
    GEMINI_ALLOWED_MODELS,
    resolveGeminiModelId,
  } = await load('src/utils/geminiModels.js');

  let fail = 0;
  const check = (cond, msg) => {
    try {
      assert(cond, msg);
    } catch (err) {
      fail += 1;
      console.error(`FAIL  ${err.message}`);
    }
  };

  check(GEMINI_MODELS.FAST === 'gemini-3.1-flash-lite', 'FAST is 3.1-flash-lite');
  check(GEMINI_MODELS.QUALITY === 'gemini-3.5-flash', 'QUALITY is 3.5-flash');
  check(GEMINI_MODELS.WRITE === 'gemini-3.1-pro-preview', 'WRITE is 3.1-pro-preview');

  const mooniSrc = read('src/utils/mooniChatModel.js');
  check(mooniSrc.includes('CHAT: GEMINI_MODELS.FAST'), 'MOONi CHAT uses FAST');
  check(mooniSrc.includes('CHAT_QUALITY: GEMINI_MODELS.QUALITY'), 'MOONi quality uses QUALITY');
  check(mooniSrc.includes('INTRO: GEMINI_MODELS.QUALITY'), 'MOONi intro uses QUALITY');

  check(
    resolveGeminiModelId('gemini-2.5-flash') === GEMINI_MODELS.QUALITY,
    '2.5-flash aliases to QUALITY',
  );
  check(
    resolveGeminiModelId('gemini-2.5-pro') === GEMINI_MODELS.WRITE,
    '2.5-pro aliases to WRITE',
  );
  check(
    resolveGeminiModelId('gemini-3.1-pro') === GEMINI_MODELS.WRITE,
    '3.1-pro aliases to WRITE',
  );
  check(
    resolveGeminiModelId(undefined) === GEMINI_MODELS.QUALITY,
    'default model is QUALITY',
  );
  check(
    GEMINI_ALLOWED_MODELS.includes(GEMINI_MODELS.QUALITY),
    'allowlist includes QUALITY',
  );

  const reviewSrc = read('src/components/PlaceCard/modals/ReviewEditorModal.jsx');
  check(reviewSrc.includes('GEMINI_MODELS.QUALITY'), 'review AI uses QUALITY');
  const logbookSrc = read('src/pages/DailyReport/hooks/useLogbookAI.js');
  check(logbookSrc.includes('GEMINI_MODELS.WRITE'), 'logbook AI uses WRITE');
  const healthSrc = read('scripts/smoke-health.mjs');
  check(healthSrc.includes('GEMINI_MODELS.FAST'), 'site health probes FAST');
  check(healthSrc.includes('GEMINI_MODELS.QUALITY'), 'site health probes QUALITY');
  check(
    !/modelId:\s*'gemini-3\.1-flash-lite'/.test(healthSrc),
    'site health does not hardcode FAST id',
  );

  const edge = read('supabase/functions/_shared/geminiModels.ts');
  check(edge.includes(`"${GEMINI_MODELS.FAST}"`), 'Edge FAST matches client');
  check(edge.includes(`"${GEMINI_MODELS.QUALITY}"`), 'Edge QUALITY matches client');
  check(edge.includes(`"${GEMINI_MODELS.WRITE}"`), 'Edge WRITE matches client');

  for (const rel of LIVE_FILES) {
    const text = read(rel);
    if (LIVE_2_5.test(text)) {
      fail += 1;
      console.error(`FAIL  leftover gemini-2.5 in ${rel}`);
    }
  }

  if (fail) {
    console.error(`\nsmoke-gemini-models: ${fail} FAIL`);
    process.exit(1);
  }
  console.log('PASS  smoke-gemini-models');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
