#!/usr/bin/env node
/**
 * eslint와 갤러리 스모크를 따로 돌린다.
 * eslint가 실패해도 스모크는 건너뛰지 않고, 하나라도 실패하면 종료 코드는 1이다.
 */
import { spawn } from 'node:child_process';

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('error', () => resolve(1));
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const eslintCode = await run('npx', ['eslint', '-c', 'eslint.ci.config.js', 'src/']);
const smokeScripts = [
  'scripts/smoke-place-stats-direct-write.mjs',
  'scripts/smoke-place-gallery-persist.mjs',
  'scripts/smoke-gallery-photo-manage.mjs',
];
let smokeCode = 0;
for (const script of smokeScripts) {
  const code = await run('node', [script]);
  if (code !== 0) smokeCode = code;
}

if (eslintCode !== 0 || smokeCode !== 0) {
  console.error(
    `lint:ci FAIL eslint=${eslintCode} smokes=${smokeCode}`,
  );
  process.exit(1);
}
console.log('lint:ci PASS');
