#!/usr/bin/env node
/**
 * KO/EN 프롬프트 번들이 클라와 엣지 미러에서 같고, 키 집합이 맞는지 검사한다.
 */

const clientUrl = new URL('../src/i18n/mooniPromptBundleData.js', import.meta.url).href;
const serverUrl = new URL('../supabase/functions/_shared/gemini/mooniPromptBundleData.js', import.meta.url).href;

const client = await import(clientUrl);
const server = await import(serverUrl);

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
}

if (JSON.stringify(client.KO) !== JSON.stringify(server.KO)) {
  fail('KO client != server mirror');
}
if (JSON.stringify(client.EN) !== JSON.stringify(server.EN)) {
  fail('EN client != server mirror');
}

const keys = Object.keys(client.KO);
if (keys.length < 10 || keys.some((key) => !(key in client.EN))) {
  fail('KO/EN keys diverged');
}

console.log(`PASS  check-gemini-prompt-mirror (${keys.length} keys)`);
