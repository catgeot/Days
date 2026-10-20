#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = '/opt/cursor/artifacts/stale-bundle-recovery/r2';
const distDir = join(root, '.cache/stale-bundle-r2/_dist-B');

function serve(distDir) {
  return createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const filePath = join(distDir, path);
    if (existsSync(filePath) && !path.endsWith('/')) {
      const ext = path.split('.').pop();
      const types = { html: 'text/html; charset=utf-8', js: 'application/javascript; charset=utf-8' };
      res.writeHead(200, {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Cache-Control': path.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'no-cache, must-revalidate',
      });
      res.end(readFileSync(filePath));
      return;
    }
    if (path.startsWith('/assets/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, must-revalidate',
    });
    res.end(readFileSync(join(distDir, 'index.html')));
  });
}

async function probeLines(base) {
  const lines = [];
  async function head(path) {
    const res = await fetch(`${base}${path}`, { method: 'HEAD' });
    const cc = res.headers.get('cache-control') ?? '(none)';
    lines.push(`${path}: HTTP/${res.status} | Cache-Control: ${cc}`);
  }
  for (const p of ['/', '/index.html', '/place/cairo', '/korea']) await head(p);
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const asset = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
  if (asset) await head(asset);
  await head('/assets/x.js');
  return lines;
}

const port = 45123;
const server = serve(distDir);
server.listen(port, '127.0.0.1', async () => {
  await new Promise((r) => setTimeout(r, 200));
  const base = `http://127.0.0.1:${port}`;
  const local = await probeLines(base);
  server.close();
  mkdirSync(OUT, { recursive: true });
  const vercel = [
    '### Vercel Preview (git alias)',
    'URL: https://days-git-cursor-stale-bundle-recovery-544f-catgeots-projects.vercel.app',
    'Probe from Cloud agent: HTTP 302 → Vercel SSO (run curl -I locally while authenticated).',
    'Expected on Preview (from vercel.json): HTML routes `no-cache, must-revalidate`; `/assets/*` `public, max-age=31536000, immutable`; missing asset 404.',
    '',
    '### Local dist mirror (same Cache-Control rules as QA server)',
    `Base: ${base}`,
    ...local,
  ].join('\n');
  writeFileSync(join(OUT, 'curl-headers.txt'), `${vercel}\n`);
  console.log(vercel);
});
