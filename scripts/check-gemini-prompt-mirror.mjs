#!/usr/bin/env node
/**
 * KO/EN 프롬프트 번들이 클라와 엣지 미러, 그리고 origin/main 원문과 같은지 검사한다.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

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

const oldSrc = execFileSync('git', ['show', 'origin/main:src/i18n/mooniPromptBundles.js'], {
  encoding: 'utf8',
});
const constants = new URL('../src/i18n/constants.js', import.meta.url).href;
const config = new URL('../src/i18n/config.js', import.meta.url).href;
const rewritten = `${oldSrc
  .replace("from './constants'", `from '${constants}'`)
  .replace("from './config'", `from '${config}'`)}
export { KO, EN };
`;
const oldPath = '/tmp/gateo-old-mooni-prompt-bundles.mjs';
writeFileSync(oldPath, rewritten);
const old = await import(pathToFileURL(oldPath).href);

if (JSON.stringify(client.KO) !== JSON.stringify(old.KO)) {
  fail('KO client != origin/main bundle');
}
if (JSON.stringify(client.EN) !== JSON.stringify(old.EN)) {
  fail('EN client != origin/main bundle');
}

const keys = Object.keys(client.KO);
if (keys.length < 10 || keys.some((key) => !(key in client.EN))) {
  fail('KO/EN keys diverged');
}

console.log(`PASS  check-gemini-prompt-mirror (${keys.length} keys)`);
