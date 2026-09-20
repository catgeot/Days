#!/usr/bin/env node
/**
 * 세계행사 — P0–P2 통합 smoke (generate · audit · domain smokes).
 *
 *   npm run smoke:world-events
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const steps = [
  'generate:world-events',
  'audit:world-events',
  'smoke:world-events-hub',
  'smoke:world-events-detail',
  'smoke:trip-window-from-festival',
  'smoke:trip-window-edinburgh',
  'smoke:korea-festival-stay-url',
  'smoke:korea-festival-planner-link',
];

for (const step of steps) {
  console.log(`\n▶ npm run ${step}`);
  execSync(`npm run ${step}`, { cwd: root, stdio: 'inherit' });
}

console.log('\nsmoke:world-events PASS');
