import { spawnSync } from 'node:child_process';

const baseURL = process.env.SMOKE_SITE_URL || 'https://127.0.0.1:5199';
const result = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    'e2e/place-visit-story-review-focus-qa-artifacts.spec.js',
    '--project=webkit-place-visit-story-review-focus',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, SMOKE_SITE_URL: baseURL },
  },
);
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
console.log('QA screenshots saved under /opt/cursor/artifacts/place-review-focus-*.png');
