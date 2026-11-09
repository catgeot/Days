import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false });
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
  'smoke-mooni-chat-markdown.mjs',
];

for (const rel of healthScripts) {
  run(process.execPath, [path.join(root, rel)]);
}

run(process.execPath, [path.join(root, 'capture-mooni-markdown-composer-qa.mjs')]);
