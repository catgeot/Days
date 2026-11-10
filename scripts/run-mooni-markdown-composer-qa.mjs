import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(root, '..');
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...opts,
    cwd: opts.cwd ?? root,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const healthScripts = [
  'health/mooni-chat-markdown-composer-regression.test.mjs',
  'health/mooni-chat-markdown-table.test.mjs',
  'health/mooni-markdown-bold-spacing.test.mjs',
  'health/mooni-markdown-preprocess.test.mjs',
  'health/mooni-chat-markdown-render.test.mjs',
  'health/mooni-chat-markdown-boundary.test.mjs',
  'health/mooni-placeholder-urls.test.mjs',
  'health/mooni-saved-chat-render.test.mjs',
  'smoke-mooni-chat-markdown.mjs',
];

for (const rel of healthScripts) {
  run(process.execPath, [path.join(root, rel)]);
}

if (!process.env.PREVIEW_URL) {
  run('npx', ['vite', 'build'], {
    cwd: repoRoot,
    env: { ...process.env, VERCEL_ENV: 'preview' },
  });
  spawnSync('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], {
    cwd: repoRoot,
    env: process.env,
    stdio: 'ignore',
    detached: true,
  });
  process.env.PREVIEW_URL = 'https://127.0.0.1:4174';
}

run(process.execPath, [path.join(root, 'capture-mooni-markdown-composer-qa.mjs')]);
run(process.execPath, [path.join(root, 'capture-mooni-saved-chat-markdown.mjs')]);
